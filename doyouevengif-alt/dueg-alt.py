import os
import json
import smtplib
import ssl
import urllib.parse
from datetime import datetime
from email.message import EmailMessage

from dotenv import load_dotenv
from flask import Flask, jsonify, request
from flask_cors import CORS

load_dotenv()

app = Flask(__name__)
CORS(app, origins=['https://doyouevengif-alt.neocities.org/'], supports_credentials=True)

SMTP_HOST = os.environ.get('SMTP_HOST', 'smtp.protonmail.ch')
SMTP_PORT = int(os.environ.get('SMTP_PORT', 587))
SMTP_USER = os.environ.get('SMTP_USER')
SMTP_PASS = os.environ.get('SMTP_PASS')
CONTACT_RECIPIENT = os.environ.get('CONTACT_RECIPIENT', 'DoYouEvenGif-alt@proton.me')
NEWSLETTER_RECIPIENT = os.environ.get('NEWSLETTER_RECIPIENT', 'DoYouEvenGif-alt@proton.me')
SUBSCRIBERS_FILE = 'subscribers.json'
CONTACTS_FILE = 'contacts.json'


def load_json(filepath, default=None):
    if default is None:
        default = []
    if os.path.exists(filepath):
        try:
            with open(filepath, 'r', encoding='utf-8') as f:
                return json.load(f)
        except Exception:
            return default
    return default


def save_json(filepath, data):
    with open(filepath, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)


def send_email(recipient, subject, body_plain, body_html=None):
    if not SMTP_USER or not SMTP_PASS:
        print('SMTP credentials not set. Email not sent.')
        return False

    msg = EmailMessage()
    msg['Subject'] = subject
    msg['From'] = SMTP_USER
    msg['To'] = recipient
    msg.set_content(body_plain)
    if body_html:
        msg.add_alternative(body_html, subtype='html')

    try:
        with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
            server.starttls(context=ssl.create_default_context())
            server.login(SMTP_USER, SMTP_PASS)
            server.send_message(msg)
        return True
    except Exception as exc:
        print(f'Email error: {exc}')
        return False


def build_welcome_html(email):
    base_url = 'https://haymawonn.pythonanywhere.com'
    unsubscribe_url = f"{base_url}/api/unsubscribe?email={urllib.parse.quote(email)}"
    return f"""<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><title>Welcome</title></head>
<body style="margin:0;padding:0;background:#17121b;font-family:Georgia,serif;">
  <table width="100%" style="background:#17121b;padding:28px 12px;">
    <tr><td align="center">
      <table width="600" style="max-width:600px;background:#2a2030;border-radius:30px;border:2px solid #6d536f;overflow:hidden;">
        <tr><td align="center" style="padding:34px 28px 26px; background:#35263b; border-bottom:1px solid #725676;">
          <div style="font-size:46px;">🍐</div>
          <h1 style="color:#fff5f7; margin:0 0 7px;">DoYouEvenGif-alt</h1>
          <p style="color:#e9b9d3; letter-spacing:0.14em; margin:0;">♡ — Alternative — ♡</p>
        </td></tr>
        <tr><td align="center" style="padding:30px 34px 28px;">
          <div style="display:inline-block;background:#443047;border:1px solid #80617e;border-radius:999px;padding:8px 15px;color:#f7d7e6;">✦ YOU'RE IN ✦</div>
          <p style="color:#fff1f5;font-size:19px;line-height:1.7;">you clicked the button.</p>
          <p style="color:#fff1f5;font-size:19px;line-height:1.7;">it's too late now. ♡</p>
          <p style="color:#fff1f5;font-size:18px;line-height:1.7;">you're officially subscribed to <strong>DoYouEvenGif-alt</strong>.</p>
          <p style="color:#f2bdd5;font-size:30px;line-height:1.3;">welcome 🍐</p>
        </td></tr>
        <tr><td align="center" style="padding:22px 24px 28px; border-top:1px solid #443448; background:#251d2a;">
          <p style="color:#8f7b89;font-size:11px;letter-spacing:0.04em;margin:0;">DoYouEvenGif-alt · a weird little corner of the internet</p>
          <p style="margin:13px 0 0 0;">
            <a href="{unsubscribe_url}" style="display:inline-block;color:#f4c5d9;text-decoration:none;border:1px solid #75566d;background:#332536;border-radius:999px;padding:8px 14px;">🍐 unsubscribe anytime 🍐</a>
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>"""


def build_unsubscribe_html(email):
    return f"""<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><title>Unsubscribed</title></head>
<body style="margin:0;padding:0;background:#17121b;font-family:Georgia,serif;">
  <table width="100%" style="background:#17121b;padding:28px 12px;">
    <tr><td align="center">
      <table width="600" style="max-width:600px;background:#2a2030;border-radius:30px;border:2px solid #6d536f;overflow:hidden;">
        <tr><td align="center" style="padding:34px 28px 26px; background:#35263b; border-bottom:1px solid #725676;">
          <div style="font-size:48px;">🍐</div>
          <h1 style="color:#fff5f7; margin:0 0 7px;">DoYouEvenGif-alt</h1>
          <p style="color:#e9b9d3; letter-spacing:0.12em; margin:0;">— you're out —</p>
        </td></tr>
        <tr><td align="center" style="padding:31px 34px 34px;">
          <p style="color:#fff1f5;font-size:19px;line-height:1.7;">you've been unsubscribed from the DoYouEvenGif-alt newsletter.</p>
          <p style="color:#f2bdd5;font-size:25px;line-height:1.3;">✌️ ♡</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>"""


@app.route('/')
def index():
    return jsonify({
        'status': 'online',
        'message': 'DoYouEvenGif-alt API is running. Use /api/subscribe, /api/contact, /api/unsubscribe'
    })


@app.route('/api/subscribe', methods=['POST'])
def subscribe():
    data = request.get_json(silent=True) or {}
    email = (data.get('email') or '').strip().lower()
    if not email or '@' not in email:
        return jsonify({'success': False, 'message': 'Invalid email.'}), 400

    subscribers = load_json(SUBSCRIBERS_FILE)
    if email in subscribers:
        return jsonify({'success': False, 'message': 'Already subscribed.'}), 400

    subscribers.append(email)
    save_json(SUBSCRIBERS_FILE, subscribers)

    if SMTP_USER and SMTP_PASS:
        send_email(email, 'welcome to DoYouEvenGif-alt 🍐', 'you clicked the button.\n\nit\'s too late now.', build_welcome_html(email))
        send_email(NEWSLETTER_RECIPIENT, f'🍐 New subscriber: {email}', f'{email} just subscribed.', f'<p>{email} joined the newsletter.</p>')

    return jsonify({'success': True, 'message': 'Subscribed successfully!'})


@app.route('/api/unsubscribe', methods=['GET', 'POST'])
def unsubscribe():
    if request.method == 'GET':
        email = (request.args.get('email') or '').strip().lower()
    else:
        data = request.get_json(silent=True) or {}
        email = (data.get('email') or '').strip().lower()

    if not email:
        return jsonify({'success': False, 'message': 'Email required.'}), 400

    subscribers = load_json(SUBSCRIBERS_FILE)
    if email not in subscribers:
        return jsonify({'success': False, 'message': 'Email not found in subscribers.'}), 404

    subscribers.remove(email)
    save_json(SUBSCRIBERS_FILE, subscribers)

    if SMTP_USER and SMTP_PASS:
        send_email(email, "you're out of DoYouEvenGif-alt", 'you\'ve been unsubscribed.', build_unsubscribe_html(email))

    if request.method == 'GET':
        return """
        <html><body style="background:#0b0a0c;color:#f0ebe3;font-family:Georgia,serif;text-align:center;padding:60px 20px;">
          <div style="max-width:500px;margin:0 auto;background:rgba(255,255,255,0.03);border-radius:24px;padding:40px;border:1px solid rgba(255,215,150,0.1);">
            <div style="font-size:48px;">🍐</div>
            <h2 style="color:#f0d5a0;">you're out.</h2>
            <p style="color:#cbc4bc;font-size:18px;line-height:1.7;">you've been unsubscribed. no hard feelings.</p>
            <p style="margin-top:30px;"><a href="/" style="color:#f0d5a0;text-decoration:none;">← back to home</a></p>
          </div>
        </body></html>
        """

    return jsonify({'success': True, 'message': 'Unsubscribed successfully.'})


@app.route('/api/contact', methods=['POST'])
def contact():
    data = request.get_json(silent=True) or {}
    email = (data.get('email') or '').strip().lower()
    message = (data.get('message') or '').strip()
    if not email or '@' not in email:
        return jsonify({'success': False, 'message': 'Invalid email.'}), 400
    if not message:
        return jsonify({'success': False, 'message': 'Message cannot be empty.'}), 400

    contacts = load_json(CONTACTS_FILE)
    contacts.append({'email': email, 'message': message, 'timestamp': str(datetime.now())})
    save_json(CONTACTS_FILE, contacts)

    if SMTP_USER and SMTP_PASS:
        send_email(CONTACT_RECIPIENT, f'✉️ Contact from {email}', f'From: {email}\n\n{message}', f'<p>From: {email}</p><p>{message}</p>')

    return jsonify({'success': True, 'message': 'Message sent!'})


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=False)