from flask import Flask
from config import Config
from extensions.data import data_store
from extensions.ai_core import ai_core
from extensions.db import db, login_manager
from routes.hadith import hadith_bp
from routes.ai_chat import ai_chat_bp
from routes.admin import admin_bp
from routes.auth_api import auth_api_bp
from routes.admin_api import admin_api_bp

# Import models so they are registered with SQLAlchemy
import models.user
import models.hadith
import models.theme

import os

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    # Initialize DB and LoginManager
    db.init_app(app)
    login_manager.init_app(app)
    
    # Register built-in helper functions in Jinja environment globals
    app.jinja_env.globals.update(min=min, max=max)
    
    with app.app_context():
        db.create_all()

    # Initialize data structures (Legacy JSON load, might be deprecated later)
    print("Initializing Data Store...")
    data_store.load_data()
    
    # Initialize AI core components
    print("Initializing AI Core...")
    ai_core.initialize()

    from flask_cors import CORS
    CORS(app, supports_credentials=True, origins=["http://localhost:5173", "http://127.0.0.1:5173"])

    # Register blueprints with API prefixes
    app.register_blueprint(hadith_bp, url_prefix='/api/hadith')
    app.register_blueprint(ai_chat_bp, url_prefix='/api/ai')
    app.register_blueprint(admin_bp, url_prefix='/api/admin')
    app.register_blueprint(auth_api_bp, url_prefix='/api/auth')
    app.register_blueprint(admin_api_bp, url_prefix='/api/admin-api')
    
    from routes.thematic_api import thematic_api_bp
    app.register_blueprint(thematic_api_bp, url_prefix='/api/thematic')

    @app.route('/health')
    def health():
        return "OK"

    return app

if __name__ == '__main__':
    app = create_app()
    app.run(debug=True, port=Config.FLASK_RUN_PORT)
