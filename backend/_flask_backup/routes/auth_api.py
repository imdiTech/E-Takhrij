from flask import Blueprint, request, jsonify
# pyrefly: ignore [missing-import]
from flask_login import login_user, logout_user, current_user, login_required
from extensions.db import db
from models.user import User

auth_api_bp = Blueprint('auth_api', __name__)

@auth_api_bp.route('/register', methods=['POST'])
def register():
    data = request.get_json() or {}
    username = data.get('username', '').strip()
    password = data.get('password', '').strip()
    
    if not username or not password:
        return jsonify({"success": False, "message": "Username dan password wajib diisi."}), 400
        
    if User.query.filter_by(username=username).first():
        return jsonify({"success": False, "message": "Username sudah digunakan."}), 400
        
    user = User(username=username, is_admin=False)
    user.set_password(password)
    
    try:
        db.session.add(user)
        db.session.commit()
        return jsonify({"success": True, "message": "Pendaftaran berhasil! Silakan login."}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"success": False, "message": f"Terjadi kesalahan: {str(e)}"}), 500

@auth_api_bp.route('/login', methods=['POST'])
def login():
    if current_user.is_authenticated:
        return jsonify({
            "success": True,
            "message": "Anda sudah login.",
            "user": {
                "id": current_user.id,
                "username": current_user.username,
                "is_admin": current_user.is_admin
            }
        })
        
    data = request.get_json() or {}
    username = data.get('username', '').strip()
    password = data.get('password', '').strip()
    remember = bool(data.get('remember', True))
    
    if not username or not password:
        return jsonify({"success": False, "message": "Username dan password wajib diisi."}), 400
        
    user = User.query.filter_by(username=username).first()
    if user is None or not user.check_password(password):
        return jsonify({"success": False, "message": "Username atau password salah."}), 401
        
    login_user(user, remember=remember)
    return jsonify({
        "success": True,
        "message": "Login berhasil!",
        "user": {
            "id": user.id,
            "username": user.username,
            "is_admin": user.is_admin
        }
    })

@auth_api_bp.route('/logout', methods=['POST'])
@login_required
def logout():
    logout_user()
    return jsonify({"success": True, "message": "Logout berhasil!"})

@auth_api_bp.route('/me', methods=['GET'])
def me():
    if not current_user.is_authenticated:
        return jsonify({"success": False, "message": "Belum terautentikasi."}), 401
        
    return jsonify({
        "success": True,
        "user": {
            "id": current_user.id,
            "username": current_user.username,
            "is_admin": current_user.is_admin
        }
    })

@auth_api_bp.route('/google', methods=['POST'])
def google_login():
    from google.oauth2 import id_token
    from google.auth.transport import requests as google_requests
    from flask import current_app
    import uuid

    data = request.get_json() or {}
    token = data.get('credential')
    
    if not token:
        return jsonify({"success": False, "message": "Token Google tidak ditemukan."}), 400

    try:
        client_id = current_app.config.get('GOOGLE_CLIENT_ID')
        idinfo = id_token.verify_oauth2_token(token, google_requests.Request(), client_id)

        # Token is valid. Get email
        email = idinfo.get('email')
        if not email:
            return jsonify({"success": False, "message": "Gagal mengambil email dari akun Google."}), 400

        user = User.query.filter_by(username=email).first()
        if not user:
            # Create user if not exists
            user_name = email
            if len(user_name) > 50:
                user_name = user_name[:50]
            
            # Ensure unique username
            base_name = user_name
            counter = 1
            while User.query.filter_by(username=user_name).first():
                suffix = f"_{counter}"
                user_name = base_name[:50 - len(suffix)] + suffix
                counter += 1

            user = User(username=user_name, is_admin=False)
            user.set_password(str(uuid.uuid4()))
            db.session.add(user)
            db.session.commit()

        login_user(user, remember=True)
        return jsonify({
            "success": True,
            "message": "Login Google berhasil!",
            "user": {
                "id": user.id,
                "username": user.username,
                "is_admin": user.is_admin
            }
        })
    except ValueError as e:
        return jsonify({"success": False, "message": f"Token Google tidak valid: {str(e)}"}), 400
    except Exception as e:
        return jsonify({"success": False, "message": f"Terjadi kesalahan: {str(e)}"}), 500
