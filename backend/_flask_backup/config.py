import os
from dotenv import load_dotenv

# Load .env file from the backend folder (where this config.py is located)
backend_env = os.path.join(os.path.dirname(os.path.abspath(__file__)), '.env')
if os.path.exists(backend_env):
    load_dotenv(backend_env)
else:
    load_dotenv()

# If VITE_GOOGLE_CLIENT_ID is not set, load it from the frontend/.env
if not os.environ.get('VITE_GOOGLE_CLIENT_ID'):
    frontend_env = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'frontend', '.env')
    if os.path.exists(frontend_env):
        load_dotenv(frontend_env)

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'super-secret-takhrij-key'
    
    # Data Paths
    BASE_DIR = os.path.abspath(os.path.dirname(__file__))
    DATA_DIR = os.path.join(BASE_DIR, 'data')
    
    HADITH_CSV_PATH = os.path.join(DATA_DIR, 'hadith.csv')
    RAWIS_JSON_PATH = os.path.join(DATA_DIR, 'rawi.json')
    VECTOR_STORE_PATH = os.path.join(DATA_DIR, 'vector_store')
    
    # AI Keys (Default ke None jika tidak ada di .env)
    GOOGLE_API_KEY = os.environ.get('GOOGLE_API_KEY')
    
    # Database
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL') or 'sqlite:///' + os.path.join(DATA_DIR, 'app.db')
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    FLASK_RUN_PORT = int(os.environ.get('FLASK_RUN_PORT', 5001))
    GOOGLE_CLIENT_ID = os.environ.get('VITE_GOOGLE_CLIENT_ID')


