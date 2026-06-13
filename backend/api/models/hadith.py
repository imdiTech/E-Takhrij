"""
Hadith model — migrated from Flask-SQLAlchemy to Django ORM.
All properties, aliases, and to_dict() preserved exactly.
"""
from django.db import models
import json
import re


class Hadith(models.Model):
    kitab = models.CharField(max_length=100)
    nomor = models.CharField(max_length=50)
    bab = models.CharField(max_length=255, blank=True, null=True)

    arab = models.TextField(blank=True, null=True)
    terjemahan = models.TextField(blank=True, null=True)
    english = models.TextField(blank=True, null=True)

    # Store lists as JSON strings
    sanad_json = models.TextField(blank=True, null=True, default='[]')
    sanad_edges_json = models.TextField(blank=True, null=True, default='[]')
    narators_id_json = models.TextField(db_column='narators_id', blank=True, null=True, default='[]')

    class Meta:
        db_table = 'hadiths'
        managed = True

    # --- JSON property: sanad ---
    @property
    def sanad(self):
        try:
            return json.loads(self.sanad_json) if self.sanad_json else []
        except:
            return []

    @sanad.setter
    def sanad(self, value):
        self.sanad_json = json.dumps(value)

    # --- JSON property: sanad_edges ---
    @property
    def sanad_edges(self):
        try:
            return json.loads(self.sanad_edges_json) if self.sanad_edges_json else []
        except:
            return []

    @sanad_edges.setter
    def sanad_edges(self, value):
        self.sanad_edges_json = json.dumps(value)

    # --- JSON property: narators_id ---
    @property
    def narators_id(self):
        try:
            return json.loads(self.narators_id_json) if self.narators_id_json else []
        except:
            return []

    @narators_id.setter
    def narators_id(self, value):
        self.narators_id_json = json.dumps(value)

    # --- Matan Arab extraction (identical logic) ---
    @property
    def matan_arab(self):
        arab = self.arab or ''
        if not arab:
            return ''
        arab_pattern = r'(قَالَ رَسُولُ اللَّهِ|قَالَ قَالَ رَسُولُ اللَّهِ|أَنَّ رَسُولَ اللَّهِ|سَمِعْتُ رَسُولَ اللَّهِ|عَنِ النَّبِيِّ|يَقُولُ قَالَ رَسُولُ اللَّهِ|قَالَ سَمِعْتُ النَّبِيَّ|قَالَ النَّبِيُّ|سَمِعْتُ النَّبِيَّ)'
        match = re.search(arab_pattern, arab)
        if match:
            return arab[match.start():].strip()
        return arab.strip()

    # --- Aliases for legacy compatibility ---
    @property
    def source(self):
        return self.kitab

    @property
    def chapter_no(self):
        return self.bab

    @property
    def text_ar(self):
        return self.arab

    @property
    def text_en(self):
        return self.english

    def to_dict(self):
        return {
            "id": self.id,
            "kitab": self.kitab,
            "source": self.kitab,
            "nomor": self.nomor,
            "bab": self.bab,
            "chapter_no": self.bab,
            "arab": self.arab,
            "text_ar": self.arab,
            "terjemahan": self.terjemahan,
            "english": self.english,
            "text_en": self.english,
            "sanad": self.sanad,
            "sanad_edges": self.sanad_edges,
            "narators_id": self.narators_id,
            "matan_arab": self.matan_arab
        }

    def __repr__(self):
        return f'<Hadith {self.kitab} No. {self.nomor}>'

    def __str__(self):
        return f'{self.kitab} No. {self.nomor}'
