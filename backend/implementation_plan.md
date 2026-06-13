# Migrasi Backend Flask → Django

Migrasi seluruh backend Smart Takhrij dari Flask ke Django, mempertahankan **semua logika bisnis** yang sudah ada di `services/`, `extensions/data.py`, dan `extensions/ai_core.py`.

## Ringkasan Perubahan

| Aspek | Flask (Sekarang) | Django (Target) |
|---|---|---|
| Entry Point | `app.py` → `create_app()` | `manage.py` + `config/wsgi.py` |
| Routing | Flask Blueprints (`routes/*.py`) | Django URL patterns + Views (`api/urls.py`, `api/views/`) |
| ORM | Flask-SQLAlchemy (`models/*.py`) | Django ORM (`api/models/`) |
| Auth | Flask-Login + session cookies | Django `contrib.auth` + session cookies |
| Forms | Flask-WTF (`forms/admin_forms.py`) | Django Forms (tidak dipakai di API mode, bisa dihapus) |
| Config | `config.py` + `.env` | `config/settings.py` + `.env` |
| CORS | `flask_cors` | `django-cors-headers` |
| Database | SQLite via SQLAlchemy | SQLite via Django ORM |

## User Review Required

> [!IMPORTANT]
> **Database yang sudah ada (`data/app.db`)** — Migrasi ini akan membuat file database baru oleh Django. Data lama di `app.db` perlu di-migrate menggunakan script `migrate_to_db.py` yang akan diadaptasi ke format Django management command. Apakah ini bisa diterima?

> [!IMPORTANT]
> **Flask-WTF Forms** — Karena aplikasi sudah berjalan sebagai API (frontend React di Vite), Flask-WTF forms (`admin_forms.py`) hanya digunakan oleh route `routes/admin.py` yang render template HTML. Apakah route admin HTML ini masih diperlukan, atau cukup `admin_api.py` saja yang sudah berbasis JSON API?

> [!WARNING]
> **Folder `templates_old/` dan `static/`** — Ini adalah aset template HTML lama dari Flask. Di arsitektur baru (API-only Django + React frontend), file ini tidak diperlukan. Saya akan memindahkannya ke backup, bukan menghapus.

## Open Questions

1. **Port Django**: Flask menggunakan port `5001`. Apakah tetap menggunakan port `5001` untuk Django agar frontend tidak perlu diubah?
2. **Admin HTML routes**: Route `routes/admin.py` me-render template HTML. Apakah ini masih dipakai atau seluruh admin sudah lewat API (`admin_api.py`)?

## Proposed Changes

### Struktur Folder Django Baru

```
backend/
├── config/                     # [NEW] Django project config
│   ├── __init__.py
│   ├── settings.py             # Pengganti config.py
│   ├── urls.py                 # Root URL config
│   ├── wsgi.py
│   └── asgi.py
├── api/                        # [NEW] Django app utama
│   ├── __init__.py
│   ├── models/                 # Django ORM models
│   │   ├── __init__.py
│   │   ├── user.py
│   │   ├── hadith.py
│   │   └── theme.py
│   ├── views/                  # Pengganti routes/
│   │   ├── __init__.py
│   │   ├── hadith_views.py
│   │   ├── ai_chat_views.py
│   │   ├── auth_views.py
│   │   ├── admin_api_views.py
│   │   └── thematic_views.py
│   ├── urls.py                 # URL routing
│   ├── admin.py                # Django admin (opsional)
│   ├── apps.py                 # App configuration + startup init
│   └── decorators.py           # admin_required dll
├── services/                   # [TETAP] Tidak berubah secara logika
│   ├── __init__.py
│   ├── hadith_service.py       # Hapus import flask, ganti query ORM
│   ├── rag_service.py          # Tetap
│   ├── rawi_service.py         # Tetap
│   ├── sanad_service.py        # Hapus import flask
│   ├── sanad_analyzer.py       # Tetap
│   ├── matan_analyzer.py       # Tetap
│   └── takhrij_analyzer.py     # Tetap
├── extensions/                 # [MODIFIKASI] Hapus Flask deps
│   ├── __init__.py
│   ├── ai_core.py              # Hapus import Config Flask, baca django.conf
│   └── data.py                 # Hapus import Config Flask, baca django.conf
├── data/                       # [TETAP] Data files
├── scripts/                    # [MODIFIKASI] Adapt ke Django management commands
├── utils/                      # [TETAP]
├── manage.py                   # [NEW] Django management entry
├── requirements.txt            # [MODIFIKASI] Flask → Django deps
└── .env                        # [TETAP]
```

---

### Component 1: Django Project Setup

#### [NEW] [manage.py](file:///Users/imdie85/dev/hadith-dev/projects/smart-takhrij/backend/manage.py)
- Standard Django `manage.py` entry point

#### [NEW] [config/\_\_init\_\_.py](file:///Users/imdie85/dev/hadith-dev/projects/smart-takhrij/backend/config/__init__.py)
- Empty init

#### [NEW] [config/settings.py](file:///Users/imdie85/dev/hadith-dev/projects/smart-takhrij/backend/config/settings.py)
Konversi dari `config.py`:
- `SECRET_KEY` → `settings.SECRET_KEY`
- `SQLALCHEMY_DATABASE_URI` → `settings.DATABASES` (Django format)
- `DATA_DIR`, path-path data → custom settings variables
- `GOOGLE_API_KEY`, `GOOGLE_CLIENT_ID` → custom settings
- CORS config via `django-cors-headers`
- `INSTALLED_APPS` = `['django.contrib.auth', 'django.contrib.sessions', 'corsheaders', 'api']`
- Middleware: `SessionMiddleware`, `CorsMiddleware`, `AuthenticationMiddleware`

#### [NEW] [config/urls.py](file:///Users/imdie85/dev/hadith-dev/projects/smart-takhrij/backend/config/urls.py)
Root URL config:
```python
urlpatterns = [
    path('api/hadith/', include('api.urls_hadith')),
    path('api/ai/', include('api.urls_ai')),
    path('api/auth/', include('api.urls_auth')),
    path('api/admin-api/', include('api.urls_admin_api')),
    path('api/thematic/', include('api.urls_thematic')),
    path('health', health_view),
]
```

#### [NEW] [config/wsgi.py](file:///Users/imdie85/dev/hadith-dev/projects/smart-takhrij/backend/config/wsgi.py)
- Standard Django WSGI

---

### Component 2: Django API App

#### [NEW] [api/apps.py](file:///Users/imdie85/dev/hadith-dev/projects/smart-takhrij/backend/api/apps.py)
Startup initialization (pengganti `create_app()`):
```python
class ApiConfig(AppConfig):
    name = 'api'
    def ready(self):
        from extensions.data import data_store
        from extensions.ai_core import ai_core
        data_store.load_data()
        ai_core.initialize()
```

#### [NEW] [api/models/hadith.py](file:///Users/imdie85/dev/hadith-dev/projects/smart-takhrij/backend/api/models/hadith.py)
Konversi dari Flask-SQLAlchemy ke Django ORM:
- `db.Column(db.Integer, primary_key=True)` → `models.AutoField(primary_key=True)`
- `db.Column(db.String(100))` → `models.CharField(max_length=100)`
- `db.Column(db.Text)` → `models.TextField()`
- Property `sanad`, `sanad_edges`, `narators_id` → tetap sebagai `@property` di atas `TextField`
- Method `to_dict()` → tetap sama
- `class Meta: db_table = 'hadiths'` — menjaga kompatibilitas nama tabel

#### [NEW] [api/models/user.py](file:///Users/imdie85/dev/hadith-dev/projects/smart-takhrij/backend/api/models/user.py)
Konversi dari Flask-Login `UserMixin` ke Django `AbstractUser` atau custom model:
- Menggunakan `AbstractBaseUser` + `PermissionsMixin` supaya tetap kompatibel dengan tabel `users` yang sudah ada
- Field: `username`, `password_hash` (mapped ke Django `password`), `is_admin`
- Method `set_password()` / `check_password()` → menggunakan Django `make_password` / `check_password`
- `class Meta: db_table = 'users'`

#### [NEW] [api/models/theme.py](file:///Users/imdie85/dev/hadith-dev/projects/smart-takhrij/backend/api/models/theme.py)
Konversi `Theme`, `SubTheme`, `ThematicHadith`:
- `db.relationship()` → Django `ForeignKey` + reverse relations
- `cascade='all, delete-orphan'` → `on_delete=models.CASCADE`
- `to_dict()` method tetap sama

#### [NEW] [api/decorators.py](file:///Users/imdie85/dev/hadith-dev/projects/smart-takhrij/backend/api/decorators.py)
```python
def login_required_api(view_func):
    """Pengganti @login_required dari Flask-Login"""

def admin_required(view_func):
    """Pengganti admin_required decorator"""
```

#### [NEW] [api/views/hadith_views.py](file:///Users/imdie85/dev/hadith-dev/projects/smart-takhrij/backend/api/views/hadith_views.py)
Konversi dari `routes/hadith.py`:
- `@hadith_bp.route('/search')` → `def search(request):`
- `request.args.get()` → `request.GET.get()`
- `jsonify({...})` → `JsonResponse({...})`
- Semua logika bisnis (panggilan ke `services/`) **tetap identik**

#### [NEW] [api/views/ai_chat_views.py](file:///Users/imdie85/dev/hadith-dev/projects/smart-takhrij/backend/api/views/ai_chat_views.py)
Konversi dari `routes/ai_chat.py`:
- `request.json` → `json.loads(request.body)`
- `jsonify()` → `JsonResponse()`

#### [NEW] [api/views/auth_views.py](file:///Users/imdie85/dev/hadith-dev/projects/smart-takhrij/backend/api/views/auth_views.py)
Konversi dari `routes/auth_api.py`:
- `flask_login.login_user()` → `django.contrib.auth.login()`
- `flask_login.logout_user()` → `django.contrib.auth.logout()`
- `flask_login.current_user` → `request.user`
- Google OAuth logic tetap sama

#### [NEW] [api/views/admin_api_views.py](file:///Users/imdie85/dev/hadith-dev/projects/smart-takhrij/backend/api/views/admin_api_views.py)
Konversi dari `routes/admin_api.py`:
- Semua CRUD operations (Hadith, User, Theme, SubTheme, ThematicHadith)
- `Hadith.query.get()` → `Hadith.objects.get()`
- `db.session.add()` → `obj.save()`
- `db.session.delete()` → `obj.delete()`
- `query.paginate()` → Django `Paginator`
- Error handling `db.session.rollback()` → Django transaction handling

#### [NEW] [api/views/thematic_views.py](file:///Users/imdie85/dev/hadith-dev/projects/smart-takhrij/backend/api/views/thematic_views.py)
Konversi dari `routes/thematic_api.py`

#### [NEW] URL files (per group)
- `api/urls_hadith.py`
- `api/urls_ai.py`
- `api/urls_auth.py`
- `api/urls_admin_api.py`
- `api/urls_thematic.py`

---

### Component 3: Extensions (Modifikasi Minor)

#### [MODIFY] [data.py](file:///Users/imdie85/dev/hadith-dev/projects/smart-takhrij/backend/extensions/data.py)
- Hapus `from config import Config`
- Ganti dengan `from django.conf import settings`
- `Config.DATA_DIR` → `settings.DATA_DIR`
- **Logika `load_data()` 100% sama**

#### [MODIFY] [ai_core.py](file:///Users/imdie85/dev/hadith-dev/projects/smart-takhrij/backend/extensions/ai_core.py)
- Hapus `from config import Config`
- Ganti dengan `from django.conf import settings`
- `Config.GOOGLE_API_KEY` → `settings.GOOGLE_API_KEY`
- `Config.VECTOR_STORE_PATH` → `settings.VECTOR_STORE_PATH`
- **Logika `initialize()` 100% sama**

#### [DELETE] [db.py](file:///Users/imdie85/dev/hadith-dev/projects/smart-takhrij/backend/extensions/db.py)
- Tidak diperlukan lagi (Django ORM built-in, tidak perlu SQLAlchemy instance)

---

### Component 4: Services (Modifikasi Minor)

#### [MODIFY] [hadith_service.py](file:///Users/imdie85/dev/hadith-dev/projects/smart-takhrij/backend/services/hadith_service.py)
- Hapus `from flask import abort`
- `from models.hadith import Hadith` → `from api.models.hadith import Hadith`
- `Hadith.query.get(id)` → `Hadith.objects.filter(pk=id).first()`
- `Hadith.query.all()` → `Hadith.objects.all()`
- `Hadith.query.filter(...)` → `Hadith.objects.filter(...)`
- `Hadith.kitab.ilike(k)` → `kitab__iexact=k`
- **Semua logika pencarian, normalisasi, syawahid/muttabi tetap 100% sama**

#### [MODIFY] [sanad_service.py](file:///Users/imdie85/dev/hadith-dev/projects/smart-takhrij/backend/services/sanad_service.py)
- Hapus `from flask import abort`
- Model imports disesuaikan
- **Logika graf & NetworkX tetap sama**

#### [TETAP] Files tanpa perubahan:
- `services/rag_service.py` — hanya import dari `extensions/ai_core` dan `services/hadith_service`
- `services/rawi_service.py` — hanya import dari `extensions/data`
- `services/sanad_analyzer.py` — pure logic, tidak ada Flask deps
- `services/matan_analyzer.py` — pure logic, tidak ada Flask deps
- `services/takhrij_analyzer.py` — hanya import dari services lain

---

### Component 5: Dependencies

#### [MODIFY] [requirements.txt](file:///Users/imdie85/dev/hadith-dev/projects/smart-takhrij/backend/requirements.txt)

**Dihapus:**
```
Flask>=3.0.0
Flask-SQLAlchemy>=3.1.1
Flask-Login>=0.6.3
Flask-WTF>=1.2.1
flask-cors
```

**Ditambahkan:**
```
Django>=5.1
django-cors-headers>=4.3
```

**Tetap:**
```
pandas, python-dotenv, langchain, langchain-community, langchain-google-genai,
langchain-chroma, chromadb, sentence-transformers, networkx, matplotlib,
bcrypt, email-validator, transformers, torch, PyArabic
```

---

### Component 6: File Lama (Cleanup)

#### [DELETE] [app.py](file:///Users/imdie85/dev/hadith-dev/projects/smart-takhrij/backend/app.py)
- Digantikan oleh `config/` dan `api/apps.py`

#### [DELETE] [config.py](file:///Users/imdie85/dev/hadith-dev/projects/smart-takhrij/backend/config.py)
- Digantikan oleh `config/settings.py`

#### [DELETE] `routes/` directory
- Digantikan oleh `api/views/` dan `api/urls_*.py`

#### [DELETE] `models/` directory (root level)
- Digantikan oleh `api/models/`

#### [DELETE] `forms/` directory
- Tidak diperlukan di mode API-only

#### [DELETE] `extensions/db.py`
- Django ORM tidak memerlukan ini

---

## Verification Plan

### Automated Tests
```bash
# 1. Cek Django project berjalan
python manage.py check

# 2. Jalankan migrasi database
python manage.py makemigrations
python manage.py migrate

# 3. Jalankan server
python manage.py runserver 5001

# 4. Test semua endpoint API
curl http://localhost:5001/health
curl http://localhost:5001/api/hadith/
curl http://localhost:5001/api/hadith/search?q=sholat
curl http://localhost:5001/api/hadith/1
curl http://localhost:5001/api/thematic/themes
```

### Manual Verification
- Jalankan frontend React (`npm run dev`) dan pastikan semua fitur berfungsi:
  - Pencarian hadis
  - Detail hadis + graf sanad
  - AI Chat (RAG)
  - Login/Register
  - Admin CRUD hadis
  - Manajemen tema
