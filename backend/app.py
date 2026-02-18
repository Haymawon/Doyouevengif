import os
import threading
from datetime import timedelta, datetime
from pathlib import Path
from flask import Flask, request, jsonify
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
from flask_cors import CORS
from flask_mail import Mail, Message
from dotenv import load_dotenv
import bcrypt
import requests
import logging
from models import db, User, SearchHistory, ResetToken

# Load environment
env_path = Path(__file__).parent / '.env'
load_dotenv(dotenv_path=env_path)

app = Flask(__name__)

# Database
BASE_DIR = Path(__file__).parent
app.config['SQLALCHEMY_DATABASE_URI'] = f"sqlite:///{BASE_DIR / 'users.db'}"
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Secrets
app.config['SECRET_KEY'] = os.getenv('FLASK_SECRET', 'dev-secret-key')
JWT_SECRET = os.getenv('JWT_SECRET')
if not JWT_SECRET:
    raise RuntimeError("JWT_SECRET missing")
app.config['JWT_SECRET_KEY'] = JWT_SECRET
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(days=1)

# CORS
CORS(app, supports_credentials=True, origins=[
    "http://localhost:5173",
])

# Mail config
app.config['MAIL_SERVER'] = os.getenv('MAIL_SERVER', 'smtp.gmail.com')
app.config['MAIL_PORT'] = int(os.getenv('MAIL_PORT', 587))
app.config['MAIL_USE_TLS'] = os.getenv('MAIL_USE_TLS', 'true').lower() == 'true'
app.config['MAIL_USERNAME'] = os.getenv('MAIL_USERNAME')
app.config['MAIL_PASSWORD'] = os.getenv('MAIL_PASSWORD')
app.config['MAIL_DEFAULT_SENDER'] = os.getenv('MAIL_DEFAULT_SENDER')

mail = Mail(app)

# Init extensions
db.init_app(app)
jwt = JWTManager(app)
logging.basicConfig(level=logging.DEBUG)

with app.app_context():
    db.create_all()

# ========== HELPER FUNCTIONS ==========
JIKAN_BASE = 'https://api.jikan.moe/v4'
ANILIST_ENDPOINT = 'https://graphql.anilist.co'

def search_anime_jikan(query):
    try:
        resp = requests.get(f"{JIKAN_BASE}/anime?q={query}&sfw", timeout=5)
        return resp.json().get('data', []) if resp.ok else None
    except:
        return None

def search_manga_anilist(query):
    gql = """
    query ($search: String) {
        Page(perPage: 20) {
            media(search: $search, type: MANGA, isAdult: false) {
                id, title { romaji english }, coverImage { large medium },
                description, chapters, volumes, averageScore, status, startDate { year }
            }
        }
    }"""
    try:
        resp = requests.post(ANILIST_ENDPOINT, json={'query': gql, 'variables': {'search': query}}, timeout=5)
        return resp.json().get('data', {}).get('Page', {}).get('media', []) if resp.ok else None
    except:
        return None

def get_anime_by_id(id):
    try:
        resp = requests.get(f"{JIKAN_BASE}/anime/{id}", timeout=5)
        return resp.json().get('data') if resp.ok else None
    except:
        return None

def get_manga_by_id(id):
    gql = """
    query ($id: Int) {
        Media(id: $id, type: MANGA) {
            id, title { romaji english }, coverImage { large medium },
            description, chapters, volumes, averageScore, status, startDate { year }
        }
    }"""
    try:
        resp = requests.post(ANILIST_ENDPOINT, json={'query': gql, 'variables': {'id': id}}, timeout=5)
        return resp.json().get('data', {}).get('Media') if resp.ok else None
    except:
        return None

def send_async_email(app_instance, msg):
    with app_instance.app_context():
        try:
            mail.send(msg)
            app.logger.info(f"Email sent to {msg.recipients}")
        except Exception as e:
            app.logger.error(f"Email failed: {e}")

# ========== ROUTES ==========
@app.route('/api/register', methods=['POST'])
def register():
    data = request.json
    name, username, email, password, terms = data.get('name'), data.get('username','').lower(), data.get('email'), data.get('password'), data.get('terms')
    if not all([name, username, email, password, terms]):
        return jsonify({'error': 'Missing fields'}), 400
    if not terms:
        return jsonify({'error': 'Must accept terms'}), 400
    if User.query.filter_by(username=username).first():
        return jsonify({'error': 'Username taken'}), 400
    if User.query.filter_by(email=email).first():
        return jsonify({'error': 'Email registered'}), 400

    hashed = bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()
    user = User(name=name, username=username, email=email, password_hash=hashed)
    db.session.add(user)
    db.session.commit()
    token = create_access_token(identity=str(user.id))
    return jsonify({'token': token, 'user': user.to_dict()}), 201

@app.route('/api/login', methods=['POST'])
def login():
    data = request.json
    username, password = data.get('username','').lower(), data.get('password')
    user = User.query.filter_by(username=username).first()
    if not user or not bcrypt.checkpw(password.encode(), user.password_hash.encode()):
        return jsonify({'error': 'Invalid credentials'}), 401
    token = create_access_token(identity=str(user.id))
    return jsonify({'token': token, 'user': user.to_dict()}), 200

@app.route('/api/profile', methods=['GET'])
@jwt_required()
def get_profile():
    user = User.query.get(get_jwt_identity())
    if not user:
        return jsonify({'error': 'Not found'}), 404
    return jsonify(user.to_dict())

@app.route('/api/profile', methods=['PUT'])
@jwt_required()
def update_profile():
    user = User.query.get(get_jwt_identity())
    data = request.json
    now = datetime.utcnow()
    if 'name' in data and data['name'] != user.name:
        if user.name_last_changed and (now - user.name_last_changed).days < 7:
            return jsonify({'error': 'Name change cooldown'}), 400
        user.name = data['name']
        user.name_last_changed = now
    if 'username' in data and data['username'].lower() != user.username:
        if user.username_last_changed and (now - user.username_last_changed).days < 30:
            return jsonify({'error': 'Username change cooldown'}), 400
        if User.query.filter_by(username=data['username'].lower()).first():
            return jsonify({'error': 'Username taken'}), 400
        user.username = data['username'].lower()
        user.username_last_changed = now
    db.session.commit()
    return jsonify(user.to_dict())

@app.route('/api/search/anime', methods=['GET'])
@jwt_required()
def search_anime():
    query = request.args.get('q', '')
    if not query:
        return jsonify([])
    db.session.add(SearchHistory(user_id=get_jwt_identity(), query=query, type='anime'))
    db.session.commit()
    results = search_anime_jikan(query)
    return jsonify(results if results is not None else [])

@app.route('/api/search/manga', methods=['GET'])
@jwt_required()
def search_manga():
    query = request.args.get('q', '')
    if not query:
        return jsonify([])
    db.session.add(SearchHistory(user_id=get_jwt_identity(), query=query, type='manga'))
    db.session.commit()
    results = search_manga_anilist(query)
    return jsonify(results if results is not None else [])

@app.route('/api/anime/<int:id>', methods=['GET'])
@jwt_required()
def anime_detail(id):
    data = get_anime_by_id(id)
    return jsonify(data) if data else (jsonify({'error': 'Not found'}), 404)

@app.route('/api/manga/<int:id>', methods=['GET'])
@jwt_required()
def manga_detail(id):
    data = get_manga_by_id(id)
    return jsonify(data) if data else (jsonify({'error': 'Not found'}), 404)

@app.route('/api/home', methods=['GET'])
@jwt_required()
def home():
    user_id = get_jwt_identity()
    session = db.session
    recent = session.query(SearchHistory).filter_by(user_id=user_id).order_by(SearchHistory.timestamp.desc()).limit(5).all()
    recs = []
    seen_ids = set()
    for r in recent:
        if r.type == 'anime':
            res = search_anime_jikan(r.query)
        else:
            res = search_manga_anilist(r.query)
        if res:
            for item in res:
                mal_id = item.get('mal_id') or item.get('id')
                if mal_id and mal_id not in seen_ids:
                    recs.append(item)
                    seen_ids.add(mal_id)
                if len(recs) >= 20:
                    break
        if len(recs) >= 20:
            break
    if not recs:
        trending = requests.get(f"{JIKAN_BASE}/top/anime", timeout=5).json().get('data', [])[:20]
        recs = trending
    return jsonify({'recommendations': recs[:20]})

@app.route('/api/recommendations/anime/<int:id>', methods=['GET'])
@jwt_required()
def rec_anime(id):
    try:
        resp = requests.get(f"{JIKAN_BASE}/anime/{id}/recommendations", timeout=5)
        data = resp.json().get('data', [])
        return jsonify([item['entry'] for item in data[:6]])
    except:
        return jsonify([])

@app.route('/api/recommendations/manga/<int:id>', methods=['GET'])
@jwt_required()
def rec_manga(id):
        # Use AniList API to get manga recommendations
        gql = '''
        query ($id: Int) {
            Media(id: $id, type: MANGA) {
                recommendations(sort: RATING_DESC, page: 1, perPage: 10) {
                    nodes {
                        mediaRecommendation {
                            id
                            title { romaji english native }
                            coverImage { large medium }
                            description
                            chapters
                            volumes
                            averageScore
                            status
                            startDate { year }
                        }
                    }
                }
            }
        }
        '''
        try:
                resp = requests.post(ANILIST_ENDPOINT, json={'query': gql, 'variables': {'id': id}}, timeout=5)
                data = resp.json().get('data', {}).get('Media', {})
                recs = []
                for node in data.get('recommendations', {}).get('nodes', []):
                        m = node.get('mediaRecommendation')
                        if m:
                                recs.append(m)
                return jsonify(recs[:6])
        except Exception as e:
                return jsonify([])

@app.route('/api/forgot-password', methods=['POST'])
def forgot_password():
    data = request.json
    email = data.get('email')
    user = User.query.filter_by(email=email).first()
    if not user:
        return jsonify({'message': 'If that email exists, a reset link has been sent.'}), 200

    # Clean old tokens
    ResetToken.query.filter_by(user_id=user.id, used=False).delete()
    db.session.commit()

    token_obj = ResetToken.generate_token(user.id)
    db.session.add(token_obj)
    db.session.commit()

    frontend_url = os.getenv('FRONTEND_URL', 'http://localhost:5173')
    reset_link = f"{frontend_url}/reset-password?token={token_obj.token}"

    # email content
    html_body = f"""
    <p>Hi {user.name},</p>
    <p>We received a request to reset your password for your doyouevengif account.</p>
    <p>Click the button below to set a new password:</p>
    <p>
        <a href="{reset_link}" style="display: inline-block; padding: 12px 24px; background-color: #8a42ff; color: white; text-decoration: none; border-radius: 6px; font-weight: bold;">
            Reset Password
        </a>
    </p>
    <p>Or copy and paste this link into your browser:<br>
    <a href="{reset_link}">{reset_link}</a></p>
    <p>This link will expire in <strong>1 hour</strong> for your security.</p>
    <p>If you didn't request this password reset, you can safely ignore this email – your password will remain unchanged.</p>
    <p>For your protection, never share this link with anyone.</p>
    <p>– The doyouevengif team</p>
    """

    msg = Message(
        subject="Reset your doyouevengif password",
        recipients=[user.email],
        body=f"Hi {user.name},\n\nWe received a request to reset your password for your doyouevengif account.\n\nClick the link below to set a new password:\n{reset_link}\n\nThis link will expire in 1 hour for your security.\n\nIf you didn't request this password reset, you can safely ignore this email.\n\n– The doyouevengif team",
        html=html_body
    )

    threading.Thread(target=send_async_email, args=(app, msg)).start()

    return jsonify({'message': 'If that email exists, a reset link has been sent.'}), 200

@app.route('/api/reset-password', methods=['POST'])
def reset_password():
    data = request.json
    token = data.get('token')
    new_password = data.get('password')
    if not token or not new_password:
        return jsonify({'error': 'Token and password required'}), 400

    reset = ResetToken.query.filter_by(token=token, used=False).first()
    if not reset or reset.expires_at < datetime.utcnow():
        return jsonify({'error': 'Invalid or expired token'}), 400

    user = User.query.get(reset.user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404

    user.password_hash = bcrypt.hashpw(new_password.encode(), bcrypt.gensalt()).decode()
    reset.used = True
    db.session.commit()
    return jsonify({'message': 'Password updated'}), 200

@app.route('/api/test-email', methods=['GET'])
def test_email():
    msg = Message(
        subject="Test email",
        recipients=["arrmay009@gmail.com"],  # your email
        body="This is a test."
    )
    try:
        mail.send(msg)
        return "Email sent"
    except Exception as e:
        return f"Error: {str(e)}"

if __name__ == '__main__':
    app.run(debug=True, port=5000)
