"""
Django settings for Smart Takhrij project.
Migrated from Flask config.py — preserving all configuration values.
"""

import os
from pathlib import Path
from dotenv import load_dotenv

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent

# Load .env file from the backend folder
backend_env = BASE_DIR / '.env'
if backend_env.exists():
    load_dotenv(backend_env)
else:
    load_dotenv()

# If VITE_GOOGLE_CLIENT_ID is not set, load it from the frontend/.env
if not os.environ.get('VITE_GOOGLE_CLIENT_ID'):
    frontend_env = BASE_DIR.parent / 'frontend' / '.env'
    if frontend_env.exists():
        load_dotenv(frontend_env)

# =============================================================================
# CORE DJANGO SETTINGS
# =============================================================================

SECRET_KEY = os.environ.get('SECRET_KEY') or 'super-secret-takhrij-key'

DEBUG = True

ALLOWED_HOSTS = ['*']

# =============================================================================
# APPLICATION DEFINITION
# =============================================================================

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'corsheaders',
    'rest_framework',
    'api',
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
]

ROOT_URLCONF = 'config.urls'

WSGI_APPLICATION = 'config.wsgi.application'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [BASE_DIR / 'templates'],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

# =============================================================================
# DATABASE — Using existing SQLite database
# =============================================================================

DATA_DIR = str(BASE_DIR / 'data')

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': os.environ.get('DATABASE_URL') or str(BASE_DIR / 'data' / 'app.db'),
    }
}

# =============================================================================
# AUTH — Custom User Model
# =============================================================================

AUTH_USER_MODEL = 'api.User'

# =============================================================================
# SESSIONS — Cookie-based sessions to match Flask-Login behavior
# =============================================================================

SESSION_ENGINE = 'django.contrib.sessions.backends.db'
SESSION_COOKIE_AGE = 60 * 60 * 24 * 30  # 30 days (equivalent to Flask remember_me)
SESSION_COOKIE_HTTPONLY = True
SESSION_COOKIE_SAMESITE = 'Lax'

# =============================================================================
# CORS — Replacing flask_cors
# =============================================================================

CORS_ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]
CORS_ALLOW_CREDENTIALS = True

# =============================================================================
# CUSTOM SETTINGS — Migrated from Flask Config class
# =============================================================================

# Data Paths
HADITH_CSV_PATH = str(BASE_DIR / 'data' / 'hadith.csv')
RAWIS_JSON_PATH = str(BASE_DIR / 'data' / 'rawi.json')
VECTOR_STORE_PATH = str(BASE_DIR / 'data' / 'vector_store')

# AI Keys
GOOGLE_API_KEY = os.environ.get('GOOGLE_API_KEY')
GOOGLE_CLIENT_ID = os.environ.get('VITE_GOOGLE_CLIENT_ID')

# Server Port (for reference, used by runserver command)
SERVER_PORT = int(os.environ.get('FLASK_RUN_PORT', 5001))

# =============================================================================
# INTERNATIONALIZATION
# =============================================================================

LANGUAGE_CODE = 'id'
TIME_ZONE = 'Asia/Jakarta'
USE_I18N = True
USE_TZ = True

# =============================================================================
# DEFAULT PRIMARY KEY FIELD TYPE
# =============================================================================

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# =============================================================================
# DJANGO REST FRAMEWORK CONFIG
# =============================================================================

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework.authentication.SessionAuthentication',
    ],
}

# =============================================================================
# STATIC FILES
# =============================================================================

STATIC_URL = 'static/'
STATICFILES_DIRS = [
    BASE_DIR / 'static',
]
STATIC_ROOT = BASE_DIR / 'staticfiles'
