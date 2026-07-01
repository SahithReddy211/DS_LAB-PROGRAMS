from flask import Blueprint, request, jsonify
from extensions import db
from utils.models import User
import bcrypt
from flask_jwt_extended import create_access_token

auth_bp = Blueprint('auth', __name__)


@auth_bp.route('/register', methods=['POST'])
def register():
    try:
        data = request.get_json(force=True, silent=True) or {}
        username = str(data.get('username', '')).strip()
        password = str(data.get('password', '')).strip()
        role = data.get('role', 'User')

        if not username or not password:
            return jsonify({"error": "Username and password are required"}), 400

        if len(password) < 4:
            return jsonify({"error": "Password must be at least 4 characters"}), 400

        if User.query.filter_by(username=username).first():
            return jsonify({"error": "Username already exists. Please choose another."}), 400

        hashed = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        user = User(username=username, password_hash=hashed, role=role)
        db.session.add(user)
        db.session.commit()

        return jsonify({"message": "Account created successfully! Please login."}), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({"error": f"Registration failed: {str(e)}"}), 500


@auth_bp.route('/login', methods=['POST'])
def login():
    try:
        data = request.get_json(force=True, silent=True) or {}
        username = str(data.get('username', '')).strip()
        password = str(data.get('password', '')).strip()

        if not username or not password:
            return jsonify({"error": "Username and password are required"}), 400

        user = User.query.filter_by(username=username).first()

        if not user:
            return jsonify({"error": "Invalid username or password"}), 401

        if not bcrypt.checkpw(password.encode('utf-8'), user.password_hash.encode('utf-8')):
            return jsonify({"error": "Invalid username or password"}), 401

        token = create_access_token(
            identity=str(user.id)
        )

        return jsonify({
            "message": "Login successful",
            "token": token,
            "user": {"id": user.id, "username": user.username, "role": user.role}
        }), 200

    except Exception as e:
        return jsonify({"error": f"Login failed: {str(e)}"}), 500
