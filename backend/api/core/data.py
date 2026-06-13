"""
Data Store extension — migrated from Flask Config to Django settings.
Logic is 100% identical, only config import changed.
"""
import os
import json
import pandas as pd
from django.conf import settings


class DataStore:
    def __init__(self):
        self.hadith_data = []
        self.hadiths_df = None
        self.rawis_df = None

    def load_data(self):
        # Load Hadiths from SQLite Database
        try:
            db_path = os.path.join(settings.DATA_DIR, 'app.db')
            print(f"Loading hadiths from SQLite database at {db_path}...")

            if os.path.exists(db_path):
                import sqlite3

                conn = sqlite3.connect(db_path)
                cursor = conn.cursor()
                cursor.execute("SELECT id, kitab, nomor, bab, arab, terjemahan, english, sanad_json, sanad_edges_json, narators_id FROM hadiths")
                rows = cursor.fetchall()
                conn.close()

                self.hadith_data = []
                for row in rows:
                    h_id, kitab, nomor, bab, arab, terjemahan, english, sanad_json, sanad_edges_json, narators_id_json = row

                    try:
                        sanad = json.loads(sanad_json) if sanad_json else []
                    except:
                        sanad = []

                    try:
                        sanad_edges = json.loads(sanad_edges_json) if sanad_edges_json else []
                        # Convert to list of tuples for SNA graph compatibility
                        sanad_edges = [tuple(edge) for edge in sanad_edges if len(edge) == 2]
                    except:
                        sanad_edges = []

                    try:
                        narators_id = json.loads(narators_id_json) if narators_id_json else []
                    except:
                        narators_id = []

                    import string
                    translator = str.maketrans(string.punctuation, ' '*len(string.punctuation))
                    
                    terj_eng = (terjemahan or "").lower() + " " + (english or "").lower()
                    word_set = set(terj_eng.translate(translator).split())
                    
                    from api.services.hadith_service import normalize_arabic
                    arab_norm = normalize_arabic(arab or "")
                    arab_word_set = set(arab_norm.translate(translator).split())

                    self.hadith_data.append({
                        "id": h_id,
                        "kitab": (kitab or "").strip(),
                        "source": (kitab or "").strip(),       # Column alias for legacy service
                        "nomor": str(nomor) if nomor is not None else "",
                        "bab": (bab or "").strip(),
                        "chapter_no": (bab or "").strip(),     # Column alias for legacy service
                        "arab": arab or "",
                        "text_ar": arab or "",                  # Alias for NLP processing
                        "terjemahan": terjemahan or "",
                        "english": english or "",
                        "text_en": english or "",
                        "sanad": sanad,
                        "sanad_edges": sanad_edges,
                        "narators_id": narators_id,
                        "word_set": word_set,
                        "arab_word_set": arab_word_set,
                        "arab_norm": arab_norm
                    })


                self.hadiths_df = pd.DataFrame(self.hadith_data)
                print(f"Loaded and mapped {len(self.hadith_data)} hadiths from SQLite database into DataFrame.")
            else:
                print(f"Database not found at {db_path}.")
                self.hadith_data = []
                self.hadiths_df = pd.DataFrame()
        except Exception as e:
            print(f"Error loading hadith data from SQLite: {e}")
            self.hadith_data = []
            self.hadiths_df = pd.DataFrame()

        # Load Rawi profiles from rawi_cleaned.json
        try:
            rawi_file = os.path.join(settings.DATA_DIR, 'rawi_cleaned.json')
            if not os.path.exists(rawi_file):
                rawi_file = os.path.join(settings.DATA_DIR, 'rawi.json')

            if os.path.exists(rawi_file):
                print(f"Loading rawi profiles from {rawi_file}...")
                self.rawis_df = pd.read_json(rawi_file)
                print(f"Loaded {len(self.rawis_df)} rawi profiles into DataFrame.")
            else:
                print("Rawi profiles file not found.")
                self.rawis_df = pd.DataFrame()
        except Exception as e:
            print(f"Error loading rawi profiles: {e}")
            self.rawis_df = pd.DataFrame()


# Global instance
data_store = DataStore()

# =====================================================================
# FUNGSI GETTER TINGKAT MODUL (Menyelesaikan ImportError)
# =====================================================================

def get_hadith_df():
    """
    Fungsi antarmuka yang mengembalikan Pandas DataFrame dari data_store.
    Memastikan kompatibilitas penuh dengan services/hadith_service.py.
    """
    if data_store.hadiths_df is None:
        # Fallback aman jika DataFrame belum terbentuk
        return pd.DataFrame(data_store.hadith_data)
    return data_store.hadiths_df

def get_rawi_df():
    """
    Fungsi antarmuka yang mengembalikan DataFrame perawi.
    """
    return data_store.rawis_df