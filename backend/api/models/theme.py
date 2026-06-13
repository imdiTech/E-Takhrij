"""
Theme, SubTheme, and ThematicHadith models — migrated from Flask-SQLAlchemy to Django ORM.
All relationships, cascades, and to_dict() methods preserved.
"""
from django.db import models
from django.utils import timezone


class Theme(models.Model):
    tema = models.CharField(max_length=255)
    deskripsi = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(default=timezone.now)

    class Meta:
        db_table = 'themes'
        managed = True

    def save(self, *args, **kwargs):
        self.updated_at = timezone.now()
        super().save(*args, **kwargs)

    def to_dict(self):
        sub_themes = list(self.sub_themes.all()) if hasattr(self, 'sub_themes') else []
        return {
            "id": self.id,
            "tema": self.tema,
            "deskripsi": self.deskripsi,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
            "sub_themes_count": len(sub_themes),
            "sub_themes": [st.to_dict() for st in sub_themes]
        }

    def __repr__(self):
        return f'<Theme {self.tema}>'

    def __str__(self):
        return self.tema


class SubTheme(models.Model):
    theme = models.ForeignKey(Theme, on_delete=models.CASCADE, related_name='sub_themes', db_column='theme_id')
    judul = models.CharField(max_length=255)
    deskripsi = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(default=timezone.now)

    class Meta:
        db_table = 'sub_themes'
        managed = True

    def save(self, *args, **kwargs):
        self.updated_at = timezone.now()
        super().save(*args, **kwargs)

    def to_dict(self):
        hadiths = list(self.hadiths.all()) if hasattr(self, 'hadiths') else []
        return {
            "id": self.id,
            "theme_id": self.theme_id,
            "judul": self.judul,
            "deskripsi": self.deskripsi,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
            "hadith_count": len(hadiths)
        }

    def __repr__(self):
        return f'<SubTheme {self.judul}>'

    def __str__(self):
        return self.judul


class ThematicHadith(models.Model):
    sub_theme = models.ForeignKey(SubTheme, on_delete=models.CASCADE, related_name='hadiths', db_column='sub_theme_id')
    hadith = models.ForeignKey('api.Hadith', on_delete=models.CASCADE, related_name='thematic_entries', db_column='hadith_id')

    # Syarh Hadith (Penjelasan Tematik)
    syarh_hadith = models.TextField(blank=True, null=True)

    class Meta:
        db_table = 'tematik'
        managed = True

    def to_dict(self):
        base_dict = {
            "id": self.id,
            "sub_theme_id": self.sub_theme_id,
            "hadith_id": self.hadith_id,
            "syarh_hadith": self.syarh_hadith,
        }

        # Gabungkan data dari hadis utama agar frontend tetap bisa baca kitab, nomor, dll.
        if self.hadith:
            hadith_data = self.hadith.to_dict()
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

    def __str__(self):
        return f'ThematicHadith {self.id}'
