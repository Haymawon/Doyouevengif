import os
from datetime import timedelta, datetime
from pathlib import Path
from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
from flask_cors import CORS
from dotenv import load_dotenv
import bcrypt
import requests
import logging
from models import db, User, SearchHistory

# Load .env file from the same directory as this file
env_path = Path(__file__).parent / '.env'
load_dotenv(dotenv_path=env_path)

# Optional: print to verify (remove in production)
print("JWT_SECRET from env:", os.getenv('JWT_SECRET'))

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///users.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Flask secret key (used for sessions, fallback for JWT)
app.config['SECRET_KEY'] = os.getenv('FLASK_SECRET', 'dev-secret-key-change-in-production')

# JWT secret key – use JWT_SECRET from env, fallback to Flask SECRET_KEY
app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET', app.config['SECRET_KEY'])
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(days=1)

# Verify it's set (partial print for security)
print("JWT_SECRET_KEY set to:", app.config['JWT_SECRET_KEY'][:5] + '...')

db.init_app(app)
jwt = JWTManager(app)
CORS(app, supports_credentials=True)

# Set up logging
logging.basicConfig(level=logging.DEBUG)

# Create tables
with app.app_context():
    db.create_all()

# Helper: call external APIs
JIKAN_BASE = 'https://api.jikan.moe/v4'
ANILIST_ENDPOINT = 'https://graphql.anilist.co'

def search_anime_jikan(query):
    url = f"{JIKAN_BASE}/anime?q={query}&sfw"
    resp = requests.get(url)
    if resp.status_code != 200:
        return None
    return resp.json().get('data', [])

def search_manga_anilist(query):
    gql = """
    query ($search: String) {
        Page(perPage: 20) {
            media(search: $search, type: MANGA, isAdult: false) {
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
    """
    resp = requests.post(ANILIST_ENDPOINT, json={'query': gql, 'variables': {'search': query}})
    if resp.status_code != 200:
        return None
    return resp.json().get('data', {}).get('Page', {}).get('media', [])

def get_anime_by_id(id):
    url = f"{JIKAN_BASE}/anime/{id}"
    resp = requests.get(url)
    if resp.status_code != 200:
        return None
    return resp.json().get('data')

def get_manga_by_id(id):
    gql = """
    query ($id: Int) {
        Media(id: $id, type: MANGA) {
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
    """
    resp = requests.post(ANILIST_ENDPOINT, json={'query': gql, 'variables': {'id': id}})
    if resp.status_code != 200:
        return None
    return resp.json().get('data', {}).get('Media')

# ========== AUTH ROUTES ==========
@app.route('/api/register', methods=['POST'])
def register():
    data = request.json
    name = data.get('name')
    username = data.get('username', '').lower()
    email = data.get('email')
    password = data.get('password')
    terms = data.get('terms')

    if not all([name, username, email, password, terms]):
        return jsonify({'error': 'Missing fields'}), 400
    if not terms:
        return jsonify({'error': 'Must accept terms'}), 400

    if User.query.filter_by(username=username).first():
        return jsonify({'error': 'Username already taken'}), 400
    if User.query.filter_by(email=email).first():
        return jsonify({'error': 'Email already registered'}), 400

    hashed = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    user = User(name=name, username=username, email=email, password_hash=hashed)
    db.session.add(user)
    db.session.commit()

    token = create_access_token(identity=str(user.id))
    return jsonify({'token': token, 'user': user.to_dict()}), 201

@app.route('/api/login', methods=['POST'])
def login():
    data = request.json
    username = data.get('username', '').lower()
    password = data.get('password')

    user = User.query.filter_by(username=username).first()
    if not user or not bcrypt.checkpw(password.encode('utf-8'), user.password_hash.encode('utf-8')):
        return jsonify({'error': 'Invalid credentials'}), 401

    token = create_access_token(identity=str(user.id))
    return jsonify({'token': token, 'user': user.to_dict()}), 200

@app.route('/api/profile', methods=['GET'])
@jwt_required()
def get_profile():
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404
    return jsonify(user.to_dict())

@app.route('/api/profile', methods=['PUT'])
@jwt_required()
def update_profile():
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    data = request.json
    new_name = data.get('name')
    new_username = data.get('username', '').lower()

    now = datetime.utcnow()
    if new_name and new_name != user.name:
        if user.name_last_changed and (now - user.name_last_changed).days < 7:
            return jsonify({'error': 'Name can only be changed once per week'}), 400
        user.name = new_name
        user.name_last_changed = now

    if new_username and new_username != user.username:
        if user.username_last_changed and (now - user.username_last_changed).days < 30:
            return jsonify({'error': 'Username can only be changed once per month'}), 400
        if User.query.filter_by(username=new_username).first():
            return jsonify({'error': 'Username already taken'}), 400
        user.username = new_username
        user.username_last_changed = now

    db.session.commit()
    return jsonify(user.to_dict())

# ========== SEARCH ROUTES ==========
@app.route('/api/search/anime', methods=['GET'])
@jwt_required()
def search_anime():
    user_id = get_jwt_identity()
    query = request.args.get('q', '')
    if not query:
        return jsonify([])

    history = SearchHistory(user_id=user_id, query=query, type='anime')
    db.session.add(history)
    db.session.commit()

    results = search_anime_jikan(query)
    if results is None:
        return jsonify({'error': 'External API error'}), 502
    return jsonify(results)

@app.route('/api/search/manga', methods=['GET'])
@jwt_required()
def search_manga():
    user_id = get_jwt_identity()
    query = request.args.get('q', '')
    if not query:
        return jsonify([])

    history = SearchHistory(user_id=user_id, query=query, type='manga')
    db.session.add(history)
    db.session.commit()

    results = search_manga_anilist(query)
    if results is None:
        return jsonify({'error': 'External API error'}), 502
    return jsonify(results)

@app.route('/api/anime/<int:id>', methods=['GET'])
@jwt_required()
def get_anime_detail(id):
    data = get_anime_by_id(id)
    if not data:
        return jsonify({'error': 'Not found'}), 404
    return jsonify(data)

@app.route('/api/manga/<int:id>', methods=['GET'])
@jwt_required()
def get_manga_detail(id):
    data = get_manga_by_id(id)
    if not data:
        return jsonify({'error': 'Not found'}), 404
    return jsonify(data)

# ========== HOME ==========
@app.route('/api/home', methods=['GET'])
@jwt_required()
def home():
    user_id = get_jwt_identity()
    recent = SearchHistory.query.filter_by(user_id=user_id).order_by(SearchHistory.timestamp.desc()).limit(5).all()
    recommendations = []
    for r in recent:
        if r.type == 'anime':
            results = search_anime_jikan(r.query)
        else:
            results = search_manga_anilist(r.query)
        if results:
            recommendations.extend(results[:3])

    if not recommendations:
        trending = requests.get(f"{JIKAN_BASE}/top/anime").json().get('data', [])[:10]
        recommendations = trending

    return jsonify({'recommendations': recommendations[:20]})

# ========== RECOMMENDATIONS ==========
@app.route('/api/recommendations/anime/<int:id>', methods=['GET'])
@jwt_required()
def rec_anime(id):
    url = f"{JIKAN_BASE}/anime/{id}/recommendations"
    resp = requests.get(url)
    if resp.status_code != 200:
        return jsonify([])
    data = resp.json().get('data', [])
    recs = [item['entry'] for item in data[:6]]
    return jsonify(recs)

@app.route('/api/recommendations/manga/<int:id>', methods=['GET'])
@jwt_required()
def rec_manga(id):
    return jsonify([])

if __name__ == '__main__':
    app.run(debug=True, port=5000)