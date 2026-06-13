from flask import Blueprint, request, jsonify
# pyrefly: ignore [missing-import]
from flask_login import current_user, login_required
from extensions.db import db
from models.user import User
from models.hadith import Hadith
from functools import wraps
import json

admin_api_bp = Blueprint('admin_api', __name__)

def admin_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if not current_user.is_authenticated or not current_user.is_admin:
            return jsonify({"success": False, "message": "Akses ditolak. Otoritas Admin diperlukan."}), 403
        return f(*args, **kwargs)
    return decorated_function

# =====================================================================
# HADITH CRUD ENDPOINTS
# =====================================================================

@admin_api_bp.route('/hadith', methods=['GET'])
@login_required
@admin_required
def hadith_list():
    page = request.args.get('page', 1, type=int)
    limit = request.args.get('limit', 10, type=int)
    search = request.args.get('q', '').strip()
    
    query = Hadith.query
    if search:
        query = query.filter(
            Hadith.terjemahan.ilike(f'%{search}%') | 
            Hadith.kitab.ilike(f'%{search}%') | 
            Hadith.nomor.ilike(f'%{search}%')
        )
        
    pagination = query.order_by(Hadith.id.desc()).paginate(page=page, per_page=limit, error_out=False)
    hadiths = [h.to_dict() for h in pagination.items]
    
    return jsonify({
        "success": True,
        "hadiths": hadiths,
        "page": page,
        "limit": limit,
        "total_results": pagination.total,
        "total_pages": pagination.pages
    })

@admin_api_bp.route('/hadith', methods=['POST'])
@login_required
@admin_required
def hadith_create():
    data = request.get_json() or {}
    kitab = data.get('kitab', '').strip()
    nomor = data.get('nomor', '').strip()
    bab = data.get('bab', '').strip()
    arab = data.get('arab', '').strip()
    terjemahan = data.get('terjemahan', '').strip()
    english = data.get('english', '').strip()
    
    sanad = data.get('sanad', [])
    sanad_edges = data.get('sanad_edges', [])
    
    if not kitab or not nomor:
        return jsonify({"success": False, "message": "Nama kitab dan nomor hadis wajib diisi."}), 400
        
    hadith = Hadith(
        kitab=kitab,
        nomor=nomor,
        bab=bab,
        arab=arab,
        terjemahan=terjemahan,
        english=english
    )
    hadith.sanad = sanad
    hadith.sanad_edges = sanad_edges
    
    try:
        db.session.add(hadith)
        db.session.commit()
        
        # Trigger reload of local in-memory Data Store so search picks it up instantly
        from extensions.data import data_store
        data_store.load_data()
        
        return jsonify({"success": True, "message": "Hadis baru berhasil ditambahkan!", "hadith": hadith.to_dict()}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"success": False, "message": f"Terjest kesalahan saat menyimpan: {str(e)}"}), 500

@admin_api_bp.route('/hadith/<int:hadith_id>', methods=['PUT'])
@login_required
@admin_required
def hadith_update(hadith_id):
    hadith = Hadith.query.get(hadith_id)
    if not hadith:
        return jsonify({"success": False, "message": "Hadis tidak ditemukan."}), 404
        
    data = request.get_json() or {}
    kitab = data.get('kitab', '').strip()
    nomor = data.get('nomor', '').strip()
    
    if not kitab or not nomor:
        return jsonify({"success": False, "message": "Nama kitab dan nomor hadis wajib diisi."}), 400
        
    hadith.kitab = kitab
    hadith.nomor = nomor
    hadith.bab = data.get('bab', '').strip()
    hadith.arab = data.get('arab', '').strip()
    hadith.terjemahan = data.get('terjemahan', '').strip()
    hadith.english = data.get('english', '').strip()
    
    if 'sanad' in data:
        hadith.sanad = data.get('sanad', [])
    if 'sanad_edges' in data:
        hadith.sanad_edges = data.get('sanad_edges', [])
        
    try:
        db.session.commit()
        
        from extensions.data import data_store
        data_store.load_data()
        
        return jsonify({"success": True, "message": "Hadis berhasil diperbarui!", "hadith": hadith.to_dict()})
    except Exception as e:
        db.session.rollback()
        return jsonify({"success": False, "message": f"Terjadi kesalahan saat memperbarui: {str(e)}"}), 500

@admin_api_bp.route('/hadith/<int:hadith_id>', methods=['DELETE'])
@login_required
@admin_required
def hadith_delete(hadith_id):
    hadith = Hadith.query.get(hadith_id)
    if not hadith:
        return jsonify({"success": False, "message": "Hadis tidak ditemukan."}), 404
        
    try:
        db.session.delete(hadith)
        db.session.commit()
        
        from extensions.data import data_store
        data_store.load_data()
        
        return jsonify({"success": True, "message": "Hadis berhasil dihapus."})
    except Exception as e:
        db.session.rollback()
        return jsonify({"success": False, "message": f"Terjadi kesalahan saat menghapus: {str(e)}"}), 500

# =====================================================================
# USER ACCOUNT MANAGEMENT ENDPOINTS
# =====================================================================

@admin_api_bp.route('/users', methods=['GET'])
@login_required
@admin_required
def user_list():
    users = User.query.all()
    user_data = [{
        "id": u.id,
        "username": u.username,
        "is_admin": u.is_admin
    } for u in users]
    
    return jsonify({
        "success": True,
        "users": user_data
    })

@admin_api_bp.route('/users/<int:user_id>/toggle-admin', methods=['PUT'])
@login_required
@admin_required
def user_toggle_admin(user_id):
    if current_user.id == user_id:
        return jsonify({"success": False, "message": "Anda tidak bisa memotong hak akses Admin Anda sendiri."}), 400
        
    user = User.query.get(user_id)
    if not user:
        return jsonify({"success": False, "message": "Pengguna tidak ditemukan."}), 404
        
    user.is_admin = not user.is_admin
    try:
        db.session.commit()
        role = "Admin" if user.is_admin else "Client"
        return jsonify({"success": True, "message": f"Status pengguna berhasil diubah menjadi {role}.", "is_admin": user.is_admin})
    except Exception as e:
        db.session.rollback()
        return jsonify({"success": False, "message": f"Gagal mengubah peran: {str(e)}"}), 500

@admin_api_bp.route('/users/<int:user_id>', methods=['DELETE'])
@login_required
@admin_required
def user_delete(user_id):
    if current_user.id == user_id:
        return jsonify({"success": False, "message": "Anda tidak bisa menghapus akun Anda sendiri saat sedang aktif."}), 400
        
    user = User.query.get(user_id)
    if not user:
        return jsonify({"success": False, "message": "Pengguna tidak ditemukan."}), 404
        
    try:
        db.session.delete(user)
        db.session.commit()
        return jsonify({"success": True, "message": "Akun pengguna berhasil dihapus."})
    except Exception as e:
        db.session.rollback()
        return jsonify({"success": False, "message": f"Gagal menghapus akun: {str(e)}"}), 500

# =====================================================================
# THEMATIC CRUD ENDPOINTS
# =====================================================================

from models.theme import Theme, SubTheme, ThematicHadith

# --- THEMES ---
@admin_api_bp.route('/themes', methods=['GET'])
@login_required
@admin_required
def admin_theme_list():
    themes = Theme.query.order_by(Theme.tema.asc()).all()
    return jsonify({
        "success": True,
        "themes": [t.to_dict() for t in themes]
    })

@admin_api_bp.route('/themes', methods=['POST'])
@login_required
@admin_required
def admin_theme_create():
    data = request.get_json() or {}
    tema = data.get('tema', '').strip()
    deskripsi = data.get('deskripsi', '').strip()
    
    if not tema:
        return jsonify({"success": False, "message": "Judul tema wajib diisi."}), 400
        
    theme = Theme(tema=tema, deskripsi=deskripsi)
    try:
        db.session.add(theme)
        db.session.commit()
        return jsonify({"success": True, "message": "Tema berhasil ditambahkan!", "theme": theme.to_dict()}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"success": False, "message": f"Terjadi kesalahan: {str(e)}"}), 500

@admin_api_bp.route('/themes/<int:theme_id>', methods=['PUT'])
@login_required
@admin_required
def admin_theme_update(theme_id):
    theme = Theme.query.get(theme_id)
    if not theme:
        return jsonify({"success": False, "message": "Tema tidak ditemukan."}), 404
        
    data = request.get_json() or {}
    tema = data.get('tema', '').strip()
    if not tema:
        return jsonify({"success": False, "message": "Judul tema wajib diisi."}), 400
        
    theme.tema = tema
    theme.deskripsi = data.get('deskripsi', '').strip()
    
    try:
        db.session.commit()
        return jsonify({"success": True, "message": "Tema berhasil diperbarui!", "theme": theme.to_dict()})
    except Exception as e:
        db.session.rollback()
        return jsonify({"success": False, "message": f"Terjadi kesalahan: {str(e)}"}), 500

@admin_api_bp.route('/themes/<int:theme_id>', methods=['DELETE'])
@login_required
@admin_required
def admin_theme_delete(theme_id):
    theme = Theme.query.get(theme_id)
    if not theme:
        return jsonify({"success": False, "message": "Tema tidak ditemukan."}), 404
        
    try:
        db.session.delete(theme)
        db.session.commit()
        return jsonify({"success": True, "message": "Tema berhasil dihapus."})
    except Exception as e:
        db.session.rollback()
        return jsonify({"success": False, "message": f"Terjadi kesalahan: {str(e)}"}), 500

# --- SUBTHEMES ---
@admin_api_bp.route('/themes/<int:theme_id>/subthemes', methods=['GET'])
@login_required
@admin_required
def admin_subtheme_list(theme_id):
    subthemes = SubTheme.query.filter_by(theme_id=theme_id).order_by(SubTheme.id.asc()).all()
    return jsonify({
        "success": True,
        "sub_themes": [st.to_dict() for st in subthemes]
    })

@admin_api_bp.route('/themes/<int:theme_id>/subthemes', methods=['POST'])
@login_required
@admin_required
def admin_subtheme_create(theme_id):
    theme = Theme.query.get(theme_id)
    if not theme:
        return jsonify({"success": False, "message": "Tema tidak ditemukan."}), 404

    data = request.get_json() or {}
    judul = data.get('judul', '').strip()
    deskripsi = data.get('deskripsi', '').strip()
    
    if not judul:
        return jsonify({"success": False, "message": "Judul Sub Tema wajib diisi."}), 400
        
    subtheme = SubTheme(theme_id=theme_id, judul=judul, deskripsi=deskripsi)
    try:
        db.session.add(subtheme)
        db.session.commit()
        return jsonify({"success": True, "message": "Sub Tema berhasil ditambahkan!", "sub_theme": subtheme.to_dict()}), 201
    except Exception as e:
        db.session.rollback()
        import traceback
        with open('app_error.log', 'a') as f:
            f.write(traceback.format_exc())
        return jsonify({"success": False, "message": f"Terjadi kesalahan: {str(e)}"}), 500

@admin_api_bp.route('/themes/<int:theme_id>/subthemes/<int:sub_theme_id>', methods=['PUT'])
@login_required
@admin_required
def admin_subtheme_update(theme_id, sub_theme_id):
    subtheme = SubTheme.query.filter_by(id=sub_theme_id, theme_id=theme_id).first()
    if not subtheme:
        return jsonify({"success": False, "message": "Sub Tema tidak ditemukan."}), 404
        
    data = request.get_json() or {}
    judul = data.get('judul', '').strip()
    if not judul:
        return jsonify({"success": False, "message": "Judul Sub Tema wajib diisi."}), 400
        
    subtheme.judul = judul
    subtheme.deskripsi = data.get('deskripsi', '').strip()
    
    try:
        db.session.commit()
        return jsonify({"success": True, "message": "Sub Tema berhasil diperbarui!", "sub_theme": subtheme.to_dict()})
    except Exception as e:
        db.session.rollback()
        return jsonify({"success": False, "message": f"Terjadi kesalahan: {str(e)}"}), 500

@admin_api_bp.route('/themes/<int:theme_id>/subthemes/<int:sub_theme_id>', methods=['DELETE'])
@login_required
@admin_required
def admin_subtheme_delete(theme_id, sub_theme_id):
    subtheme = SubTheme.query.filter_by(id=sub_theme_id, theme_id=theme_id).first()
    if not subtheme:
        return jsonify({"success": False, "message": "Sub Tema tidak ditemukan."}), 404
        
    try:
        db.session.delete(subtheme)
        db.session.commit()
        return jsonify({"success": True, "message": "Sub Tema berhasil dihapus."})
    except Exception as e:
        db.session.rollback()
        return jsonify({"success": False, "message": f"Terjadi kesalahan: {str(e)}"}), 500

# --- THEMATIC HADITHS ---
@admin_api_bp.route('/subthemes/<int:sub_theme_id>/hadiths', methods=['GET'])
@login_required
@admin_required
def admin_thematic_hadiths_list(sub_theme_id):
    hadiths = ThematicHadith.query.filter_by(sub_theme_id=sub_theme_id).order_by(ThematicHadith.id.desc()).all()
    return jsonify({
        "success": True,
        "hadiths": [h.to_dict() for h in hadiths]
    })

@admin_api_bp.route('/subthemes/<int:sub_theme_id>/hadiths', methods=['POST'])
@login_required
@admin_required
def admin_thematic_hadith_create(sub_theme_id):
    subtheme = SubTheme.query.get(sub_theme_id)
    if not subtheme:
        return jsonify({"success": False, "message": "Sub Tema tidak ditemukan."}), 404

    data = request.get_json() or {}
    hadith_id = data.get('hadith_id')
    
    if not hadith_id:
        return jsonify({"success": False, "message": "Pilihan hadis wajib disertakan."}), 400
        
    hadith_exists = Hadith.query.get(hadith_id)
    if not hadith_exists:
        return jsonify({"success": False, "message": "Data hadis tidak ditemukan di database utama."}), 404

    # Cek apakah sudah ada di sub_theme ini
    existing_thematic = ThematicHadith.query.filter_by(sub_theme_id=sub_theme_id, hadith_id=hadith_id).first()
    if existing_thematic:
        return jsonify({"success": False, "message": "Hadis ini sudah dimasukkan ke dalam Sub Tema ini."}), 400

    hadith_thematic = ThematicHadith(
        sub_theme_id=sub_theme_id,
        hadith_id=hadith_id,
        syarh_hadith=data.get('syarh_hadith', '').strip()
    )
    
    try:
        db.session.add(hadith_thematic)
        db.session.commit()
        return jsonify({"success": True, "message": "Hadis tematik berhasil ditambahkan!", "hadith": hadith_thematic.to_dict()}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"success": False, "message": f"Terjadi kesalahan: {str(e)}"}), 500

@admin_api_bp.route('/subthemes/<int:sub_theme_id>/hadiths/<int:hadith_id>', methods=['PUT'])
@login_required
@admin_required
def admin_thematic_hadith_update(sub_theme_id, hadith_id):
    hadith_thematic = ThematicHadith.query.filter_by(id=hadith_id, sub_theme_id=sub_theme_id).first()
    if not hadith_thematic:
        return jsonify({"success": False, "message": "Hadis tematik tidak ditemukan."}), 404
        
    data = request.get_json() or {}
    hadith_thematic.syarh_hadith = data.get('syarh_hadith', '').strip()
    
    try:
        db.session.commit()
        return jsonify({"success": True, "message": "Syarh hadis berhasil diperbarui!", "hadith": hadith_thematic.to_dict()})
    except Exception as e:
        db.session.rollback()
        return jsonify({"success": False, "message": f"Terjadi kesalahan: {str(e)}"}), 500

@admin_api_bp.route('/subthemes/<int:sub_theme_id>/hadiths/<int:hadith_id>', methods=['DELETE'])
@login_required
@admin_required
def admin_thematic_hadith_delete(sub_theme_id, hadith_id):
    hadith = ThematicHadith.query.filter_by(id=hadith_id, sub_theme_id=sub_theme_id).first()
    if not hadith:
        return jsonify({"success": False, "message": "Hadis tematik tidak ditemukan."}), 404
        
    try:
        db.session.delete(hadith)
        db.session.commit()
        return jsonify({"success": True, "message": "Hadis tematik berhasil dihapus."})
    except Exception as e:
        db.session.rollback()
        return jsonify({"success": False, "message": f"Terjadi kesalahan: {str(e)}"}), 500
