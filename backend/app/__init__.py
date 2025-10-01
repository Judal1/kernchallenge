from flask import Flask
from .config import Config
from .models import db

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)
    db.init_app(app)
    from .routes import api_bp
    app.register_blueprint(api_bp, url_prefix='/api')
    return app
