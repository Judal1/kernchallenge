from flask import Blueprint, jsonify, request
from .models import db, User, Project
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

@api_bp.route('/projects', methods=['GET'])
@jwt_required()
def list_projects():
    user = User.query.filter_by(username=get_jwt_identity()).first()
    projects = Project.query.filter_by(owner_id=user.id).all()
    return jsonify([{'id': p.id, 'name': p.name, 'description': p.description, 'created_at': p.created_at.isoformat()} for p in projects])

@api_bp.route('/projects', methods=['POST'])
@jwt_required()
def create_project():
    user = User.query.filter_by(username=get_jwt_identity()).first()
    data = request.get_json()
    name = data.get('name')
    description = data.get('description')
    if not name:
        return jsonify({'message': 'Project name is required'}), 400
    project = Project(name=name, description=description, owner_id=user.id)
    db.session.add(project)
    db.session.commit()
    return jsonify({'message': 'Project created', 'id': project.id})

@api_bp.route('/projects/<int:project_id>', methods=['PUT'])
@jwt_required()
def update_project(project_id):
    user = User.query.filter_by(username=get_jwt_identity()).first()
    project = Project.query.filter_by(id=project_id, owner_id=user.id).first()
    if not project:
        return jsonify({'message': 'Project not found'}), 404
    data = request.get_json()
    project.name = data.get('name', project.name)
    project.description = data.get('description', project.description)
    db.session.commit()
    return jsonify({'message': 'Project updated'})

@api_bp.route('/projects/<int:project_id>', methods=['DELETE'])
@jwt_required()
def delete_project(project_id):
    user = User.query.filter_by(username=get_jwt_identity()).first()
    project = Project.query.filter_by(id=project_id, owner_id=user.id).first()
    if not project:
        return jsonify({'message': 'Project not found'}), 404
    db.session.delete(project)
    db.session.commit()
    return jsonify({'message': 'Project deleted'})
