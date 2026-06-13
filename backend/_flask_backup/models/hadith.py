from extensions.db import db
import json

class Hadith(db.Model):
    __tablename__ = 'hadiths'
    
    id = db.Column(db.Integer, primary_key=True)
    kitab = db.Column(db.String(100), nullable=False)
    nomor = db.Column(db.String(50), nullable=False)
    bab = db.Column(db.String(255), nullable=True)
    
    arab = db.Column(db.Text, nullable=True)
    terjemahan = db.Column(db.Text, nullable=True)
    english = db.Column(db.Text, nullable=True)
    
    # Store lists as JSON strings
    sanad_json = db.Column(db.Text, nullable=True, default='[]')
    sanad_edges_json = db.Column(db.Text, nullable=True, default='[]')
    narators_id_json = db.Column('narators_id', db.Text, nullable=True, default='[]')

    
    @property
    def sanad(self):
        try:
            return json.loads(self.sanad_json) if self.sanad_json else []
        except:
            return []
            
    @sanad.setter
    def sanad(self, value):
        self.sanad_json = json.dumps(value)
        
    @property
    def sanad_edges(self):
        try:
            return json.loads(self.sanad_edges_json) if self.sanad_edges_json else []
        except:
            return []
            
    @sanad_edges.setter
    def sanad_edges(self, value):
        self.sanad_edges_json = json.dumps(value)

    @property
    def narators_id(self):
        try:
            return json.loads(self.narators_id_json) if self.narators_id_json else []
        except:
            return []
            
    @narators_id.setter
    def narators_id(self, value):
        self.narators_id_json = json.dumps(value)


    @property
    def matan_arab(self):
        import re
        arab = self.arab or ''
        if not arab:
            return ''
        arab_pattern = r'(قَالَ رَسُولُ اللَّهِ|قَالَ قَالَ رَسُولُ اللَّهِ|أَنَّ رَسُولَ اللَّهِ|سَمِعْتُ رَسُولَ اللَّهِ|عَنِ النَّبِيِّ|يَقُولُ قَالَ رَسُولُ اللَّهِ|قَالَ سَمِعْتُ النَّبِيَّ|قَالَ النَّبِيُّ|سَمِعْتُ النَّبِيَّ)'
        match = re.search(arab_pattern, arab)
        if match:
            return arab[match.start():].strip()
        return arab.strip()

    # Aliases to match old dataframe dictionary structures if needed
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
