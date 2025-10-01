from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    password_hash = db.Column(db.String(64), nullable=False)  # SHA-256 hash côté client

    @staticmethod
    def verify_password(stored_hash, provided_hash):
        return stored_hash == provided_hash
