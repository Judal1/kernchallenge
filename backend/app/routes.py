from flask import Blueprint, jsonify, request
from .models import db, User
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from flask_wtf.csrf import generate_csrf

api_bp = Blueprint('api', __name__)

@api_bp.route('/ping')
def ping():
    return jsonify({'message': 'pong'})

@api_bp.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    username = data.get('username')
    password_hash = data.get('password')
    if not username or not password_hash:
        return jsonify({'message': 'Missing username or password'}), 400
    if User.query.filter_by(username=username).first():
        return jsonify({'message': 'User already exists'}), 400
    user = User(username=username, password_hash=password_hash)
    db.session.add(user)
    db.session.commit()
    return jsonify({'message': 'User registered successfully'})

@api_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    username = data.get('username')
    password_hash = data.get('password')
    user = User.query.filter_by(username=username).first()
    if not user or not User.verify_password(user.password_hash, password_hash):
        return jsonify({'message': 'Invalid credentials'}), 401
    access_token = create_access_token(identity=username)
    return jsonify({'message': 'Login successful', 'token': access_token})

@api_bp.route('/logout', methods=['POST'])
@jwt_required()
def logout():
    # Pour JWT, le logout est géré côté client (suppression du token)
    return jsonify({'message': 'Logout successful'})

@api_bp.route('/csrf-token', methods=['GET'])
def get_csrf_token():
    token = generate_csrf()
    return jsonify({'csrf_token': token})
