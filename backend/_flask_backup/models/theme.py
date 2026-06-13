from extensions.db import db
from datetime import datetime
from models.hadith import Hadith

class Theme(db.Model):
    __tablename__ = 'themes'
    
    id = db.Column(db.Integer, primary_key=True)
    tema = db.Column(db.String(255), nullable=False)
    deskripsi = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationship to SubThemes
    sub_themes = db.relationship('SubTheme', backref='theme_rel', lazy=True, cascade='all, delete-orphan')

    def to_dict(self):
        return {
            "id": self.id,
            "tema": self.tema,
            "deskripsi": self.deskripsi,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
            "sub_themes_count": len(self.sub_themes) if hasattr(self, 'sub_themes') and self.sub_themes is not None else 0,
            "sub_themes": [st.to_dict() for st in self.sub_themes] if hasattr(self, 'sub_themes') and self.sub_themes is not None else []
        }

    def __repr__(self):
        return f'<Theme {self.tema}>'

class SubTheme(db.Model):
    __tablename__ = 'sub_themes'

    id = db.Column(db.Integer, primary_key=True)
    theme_id = db.Column(db.Integer, db.ForeignKey('themes.id'), nullable=False)
    judul = db.Column(db.String(255), nullable=False)
    deskripsi = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationship to ThematicHadith
    hadiths = db.relationship('ThematicHadith', backref='sub_theme_rel', lazy=True, cascade='all, delete-orphan')

    def to_dict(self):
        return {
            "id": self.id,
            "theme_id": self.theme_id,
            "judul": self.judul,
            "deskripsi": self.deskripsi,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
            "hadith_count": len(self.hadiths) if hasattr(self, 'hadiths') and self.hadiths is not None else 0
        }

    def __repr__(self):
        return f'<SubTheme {self.judul}>'

class ThematicHadith(db.Model):
    __tablename__ = 'tematik'
    
    id = db.Column(db.Integer, primary_key=True)
    sub_theme_id = db.Column(db.Integer, db.ForeignKey('sub_themes.id'), nullable=False)
    hadith_id = db.Column(db.Integer, db.ForeignKey('hadiths.id'), nullable=False)
    
    # Syarh Hadith (Penjelasan Tematik)
    syarh_hadith = db.Column(db.Text, nullable=True)

    # Relasi langsung ke tabel Hadiths utama
    hadith_rel = db.relationship('Hadith', backref='thematic_entries', lazy=True)

    def to_dict(self):
        base_dict = {
            "id": self.id, # ID tabel tematik
            "sub_theme_id": self.sub_theme_id,
            "hadith_id": self.hadith_id,
            "syarh_hadith": self.syarh_hadith,
        }
        
        # Gabungkan data dari hadis utama agar frontend tetap bisa baca kitab, nomor, dll.
        if self.hadith_rel:
            hadith_data = self.hadith_rel.to_dict()
            # Kita gabungkan data dari Hadith (matan, nomor, dll)
            # Karena to_dict() dari Hadith tidak memiliki "id" alias tertimpa atau menggunakan ID Hadith, 
            # kita harus memastikan 'id' yang dipakai frontend untuk list ThematicHadith adalah self.id
            # Tapi data_store.to_dict() dsb akan menimpa. Mari kita merge manual field utamanya:
            base_dict.update({
                "kitab": hadith_data.get("kitab"),
                "nomor": hadith_data.get("nomor"),
                "bab": hadith_data.get("bab"),
                "arab": hadith_data.get("arab"),
                "terjemahan": hadith_data.get("terjemahan"),
                "english": hadith_data.get("english"),
                "matan_arab": hadith_data.get("matan_arab"),
                "sanad": hadith_data.get("sanad", []),
                "sanad_edges": hadith_data.get("sanad_edges", []),
            })
            
        return base_dict

    def __repr__(self):
        return f'<ThematicHadith ID:{self.id} (SubTheme: {self.sub_theme_id}, HadithID: {self.hadith_id})>'
