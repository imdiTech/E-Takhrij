from flask import Blueprint, render_template, redirect, url_for, flash, request, current_app
from flask_login import login_user, logout_user, current_user, login_required
from extensions.db import db
from models.user import User
from models.hadith import Hadith
from forms.admin_forms import LoginForm, HadithForm
from functools import wraps

admin_bp = Blueprint('admin', __name__, url_prefix='/admin')

def admin_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if not current_user.is_authenticated or not current_user.is_admin:
            flash('Anda tidak memiliki akses ke halaman ini.', 'danger')
            return redirect(url_for('hadith.index'))
        return f(*args, **kwargs)
    return decorated_function

@admin_bp.route('/login', methods=['GET', 'POST'])
def login():
    if current_user.is_authenticated:
        return redirect(url_for('admin.dashboard'))
    
    form = LoginForm()
    if form.validate_on_submit():
        user = User.query.filter_by(username=form.username.data).first()
        if user is None or not user.check_password(form.password.data):
            flash('Username atau password salah', 'danger')
            return redirect(url_for('admin.login'))
        
        login_user(user, remember=form.remember_me.data)
        next_page = request.args.get('next')
        if not next_page or not next_page.startswith('/'):
            next_page = url_for('admin.dashboard')
        return redirect(next_page)
        
    return render_template('admin/login.html', form=form)

@admin_bp.route('/logout')
def logout():
    logout_user()
    return redirect(url_for('hadith.index'))

@admin_bp.route('/')
@login_required
@admin_required
def dashboard():
    hadith_count = Hadith.query.count()
    user_count = User.query.count()
    return render_template('admin/dashboard.html', hadith_count=hadith_count, user_count=user_count)

@admin_bp.route('/hadith')
@login_required
@admin_required
def hadith_list():
    page = request.args.get('page', 1, type=int)
    search = request.args.get('q', '')
    
    query = Hadith.query
    if search:
        query = query.filter(Hadith.terjemahan.ilike(f'%{search}%') | Hadith.kitab.ilike(f'%{search}%') | Hadith.nomor.ilike(f'%{search}%'))
        
    pagination = query.order_by(Hadith.id.desc()).paginate(page=page, per_page=20, error_out=False)
    hadiths = pagination.items
    
    return render_template('admin/hadith_list.html', hadiths=hadiths, pagination=pagination, search=search) 

@admin_bp.route('/hadith/new', methods=['GET', 'POST'])
@login_required
@admin_required
def hadith_new():
    form = HadithForm()
    if form.validate_on_submit():
        hadith = Hadith(
            kitab=form.kitab.data,
            nomor=form.nomor.data,
            bab=form.bab.data,
            arab=form.arab.data,
            terjemahan=form.terjemahan.data,
            english=form.english.data,
            sanad_json=form.sanad_json.data or '[]',
            sanad_edges_json=form.sanad_edges_json.data or '[]'
        )
        db.session.add(hadith)
        db.session.commit()
        flash('Hadis berhasil ditambahkan.', 'success')
        return redirect(url_for('admin.hadith_list'))
        
    return render_template('admin/hadith_form.html', form=form, title='Tambah Hadis Baru')

@admin_bp.route('/hadith/edit/<int:id>', methods=['GET', 'POST'])
@login_required
@admin_required
def hadith_edit(id):
    hadith = Hadith.query.get_or_404(id)
    form = HadithForm(obj=hadith)
    
    if form.validate_on_submit():
        hadith.kitab = form.kitab.data
        hadith.nomor = form.nomor.data
        hadith.bab = form.bab.data
        hadith.arab = form.arab.data
        hadith.terjemahan = form.terjemahan.data
        hadith.english = form.english.data
        hadith.sanad_json = form.sanad_json.data or '[]'
        hadith.sanad_edges_json = form.sanad_edges_json.data or '[]'
        
        db.session.commit()
        flash('Hadis berhasil diperbarui.', 'success')
        return redirect(url_for('admin.hadith_list'))
        
    return render_template('admin/hadith_form.html', form=form, title='Edit Hadis')

@admin_bp.route('/hadith/delete/<int:id>', methods=['POST'])
@login_required
@admin_required
def hadith_delete(id):
    hadith = Hadith.query.get_or_404(id)
    db.session.delete(hadith)
    db.session.commit()
    flash('Hadis berhasil dihapus.', 'success')
    return redirect(url_for('admin.hadith_list'))
