from transformers import pipeline
import re
import os

# Set environment variables to avoid unnecessary HF Hub requests and warnings
os.environ["HF_HUB_DISABLE_TELEMETRY"] = "1"

# Global variable for lazy loading
ner_pipeline = None

def get_ner_pipeline():
    global ner_pipeline
    if ner_pipeline is None:
        # Inisialisasi NER pipeline (Bisa memakan waktu pada load pertama)
        # Menggunakan CAMeL-Lab NER untuk deteksi B-PERS / I-PERS pada teks bahasa Arab
        try:
            print("Memuat model NER CAMeL-Lab...")
            ner_pipeline = pipeline("ner", model="CAMeL-Lab/bert-base-arabic-camelbert-mix-ner", aggregation_strategy="simple")
        except Exception as e:
            print("Warning: Gagal memuat NER model:", e)
    return ner_pipeline

def clean_narrator_name(name):
    """Membersihkan nama perawi dari sisa kata sambung yang mungkin terbawa."""
    name = name.strip()
    # Hapus awalan kata sambung jika masih ada
    stopwords = ["عن", "عنِ", "حدثنا", "حدثني", "أخبرنا", "أخبرني", "قال", "سمعت", "أن", "يقول"]
    for sw in stopwords:
        if name.startswith(sw + " "):
            name = name[len(sw)+1:].strip()
    return name

def extract_narrators(sanad_text):
    """
    Mengekstrak perawi dari teks sanad dan mengembalikan list of nodes and edges 
    untuk visualisasi graf.
    """
    pipeline = get_ner_pipeline()
    if not sanad_text or not pipeline:
        return {"nodes": [], "edges": []}
        
    try:
        results = pipeline(sanad_text)
    except Exception as e:
        print("Error saat menjalankan NER:", e)
        return {"nodes": [], "edges": []}

    narrators = []
    
    for entity in results:
        # CAMeL-Lab NER menggunakan tag 'PERS', 'LOC', 'ORG', dll.
        # Atau mungkin B-PERS, I-PERS yang sudah digabung menjadi 'PERS' oleh aggregation_strategy
        entity_group = entity.get('entity_group', '')
        word = entity.get('word', '')
        
        if entity_group == 'PERS':
            cleaned_word = clean_narrator_name(word)
            if cleaned_word and len(cleaned_word) > 2:
                # Menghindari duplikasi langsung (misal "حدثنا أبو بكر ، حدثنا أبو بكر")
                if not narrators or narrators[-1] != cleaned_word:
                    narrators.append(cleaned_word)

    # Membentuk Graph Data (Nodes dan Edges)
    nodes = []
    edges = []
    
    for i, name in enumerate(narrators):
        nodes.append({
            "id": i + 1,
            "label": name,
            "title": f"Perawi Tingkat {len(narrators) - i}" # Terbalik: Nabi biasanya di akhir
        })
        
        if i > 0:
            edges.append({
                "from": i,
                "to": i + 1,
                "label": "meriwayatkan dari"
            })
            
    return {"nodes": nodes, "edges": edges}

if __name__ == "__main__":
    text = "حَدَّثَنَا أَبُو بَكْرِ بْنُ أَبِي شَيْبَةَ ، حَدَّثَنَا وَكِيعٌ ، عَنْ شُعْبَةَ ، عَنِ الْحَكَمِ"
    print(extract_narrators(text))
