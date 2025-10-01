
from flask import Flask
from .config import Config
from .models import db
from flask_jwt_extended import JWTManager
from flask_wtf.csrf import CSRFProtect

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)
    db.init_app(app)
    jwt = JWTManager(app)
    csrf = CSRFProtect(app)
    from .routes import api_bp
    app.register_blueprint(api_bp, url_prefix='/api')
    return app
