from flask import Blueprint, jsonify, request
from .models import db, User, Project, TimeEntry
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from flask_wtf.csrf import generate_csrf
from datetime import datetime

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

@api_bp.route('/time-entries', methods=['GET'])
@jwt_required()
def list_time_entries():
    user = User.query.filter_by(username=get_jwt_identity()).first()
    entries = TimeEntry.query.filter_by(user_id=user.id).all()
    return jsonify([
        {
            'id': e.id,
            'project_id': e.project_id,
            'project_name': e.project.name if e.project else None,
            'description': e.description,
            'start_time': e.start_time.isoformat(),
            'end_time': e.end_time.isoformat(),
            'duration': e.duration,
            'created_at': e.created_at.isoformat()
        } for e in entries
    ])

@api_bp.route('/time-entries', methods=['POST'])
@jwt_required()
def create_time_entry():
    user = User.query.filter_by(username=get_jwt_identity()).first()
    data = request.get_json()
    project_id = data.get('project_id')
    description = data.get('description')
    start_time = data.get('start_time')
    end_time = data.get('end_time')
    if not (project_id and start_time and end_time):
        return jsonify({'message': 'Missing required fields'}), 400
    try:
        start_dt = datetime.fromisoformat(start_time)
        end_dt = datetime.fromisoformat(end_time)
    except Exception:
        return jsonify({'message': 'Invalid date format'}), 400
    duration = int((end_dt - start_dt).total_seconds() // 60)
    entry = TimeEntry(
        project_id=project_id,
        user_id=user.id,
        description=description,
        start_time=start_dt,
        end_time=end_dt,
        duration=duration
    )
    db.session.add(entry)
    db.session.commit()
    return jsonify({'message': 'Time entry created', 'id': entry.id})

@api_bp.route('/time-entries/<int:entry_id>', methods=['PUT'])
@jwt_required()
def update_time_entry(entry_id):
    user = User.query.filter_by(username=get_jwt_identity()).first()
    entry = TimeEntry.query.filter_by(id=entry_id, user_id=user.id).first()
    if not entry:
        return jsonify({'message': 'Time entry not found'}), 404
    data = request.get_json()
    entry.project_id = data.get('project_id', entry.project_id)
    entry.description = data.get('description', entry.description)
    if data.get('start_time') and data.get('end_time'):
        try:
            entry.start_time = datetime.fromisoformat(data['start_time'])
            entry.end_time = datetime.fromisoformat(data['end_time'])
            entry.duration = int((entry.end_time - entry.start_time).total_seconds() // 60)
        except Exception:
            return jsonify({'message': 'Invalid date format'}), 400
    db.session.commit()
    return jsonify({'message': 'Time entry updated'})

@api_bp.route('/time-entries/<int:entry_id>', methods=['DELETE'])
@jwt_required()
def delete_time_entry(entry_id):
    user = User.query.filter_by(username=get_jwt_identity()).first()
    entry = TimeEntry.query.filter_by(id=entry_id, user_id=user.id).first()
    if not entry:
        return jsonify({'message': 'Time entry not found'}), 404
    db.session.delete(entry)
    db.session.commit()
    return jsonify({'message': 'Time entry deleted'})
