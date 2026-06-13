import re
import pyarabic.araby as araby
import torch
import os

# Set environment variables to avoid unnecessary HF Hub requests and warnings
os.environ["HF_HUB_DISABLE_TELEMETRY"] = "1"

# Global variable for lazy loading
labse_model = None

def get_labse_model():
    global labse_model
    if labse_model is None:
        try:
            from sentence_transformers import SentenceTransformer
            print("Memuat model sentence-transformers/LaBSE...")
            labse_model = SentenceTransformer('sentence-transformers/LaBSE')
        except Exception as e:
            print("Warning: Gagal memuat model LaBSE:", e)
    return labse_model

# Kamus kata kunci Temporal-Lokal menurut konsep Syuhudi Ismail
# Kata-kata yang merujuk pada kondisi kultural, geografis, ekonomi spesifik Arab abad ke-7
TEMPORAL_KEYWORDS = [
    "بعير", "إبل", "ناقة", "جمل", # unta
    "سيف", "رمح", "درع", # pedang, tombak, baju besi perang
    "درهم", "دينار", # mata uang kuno
    "عبد", "أمة", "مملوك", "جارية", # budak/hamba sahaya
    "خيمة", "خمر", # tenda, khamr (walau diharamkan universal, teks sering spesifik konteksnya)
    "تمر", "نخل", # kurma, pohon palem (konteks geografis pertanian lokal)
    "غزوة", "سرية" # perang/ekspedisi militer spesifik
]

def preprocess_arabic(text):
    """
    Membersihkan matan bahasa Arab menggunakan PyArabic:
    - Menghapus harakat (tashkeel)
    - Menghapus tatweel
    - Menghapus tanda baca
    """
    if not text:
        return ""
    
    # Hapus harakat
    text = araby.strip_tashkeel(text)
    # Hapus tatweel
    text = araby.strip_tatweel(text)
    # Hapus tanda baca umum
    text = re.sub(r'[^\w\s]', '', text)
    # Normalkan spasi
    text = re.sub(r'\s+', ' ', text).strip()
    
    return text

def compute_labse_similarity(target_matan, candidate_matans):
    """
    Menerima satu matan target dan list matan kandidat.
    Mengembalikan list tuple (index, cosine_score).
    """
    model = get_labse_model()
    if not model or not target_matan or not candidate_matans:
        return []
        
    from sentence_transformers import util
        
    try:
        # Encode
        target_emb = model.encode(target_matan, convert_to_tensor=True)
        cand_embs = model.encode(candidate_matans, convert_to_tensor=True)
        
        # Compute Cosine Similarity
        cosine_scores = util.cos_sim(target_emb, cand_embs)[0]
        
        # Susun menjadi list of tuples (index, score)
        results = []
        for i, score in enumerate(cosine_scores):
            results.append((i, score.item()))
            
        # Urutkan dari skor tertinggi
        results.sort(key=lambda x: x[1], reverse=True)
        return results
    except Exception as e:
        print("Error saat menghitung LaBSE similarity:", e)
        return []

def classify_context(matan_text):
    """
    Mengklasifikasikan konteks matan ke dalam:
    - "Temporal-Lokal" jika mengandung kata kunci spesifik masa/lokasi tersebut.
    - "Universal" jika tidak.
    Berdasarkan pemikiran Kritik Matan Syuhudi Ismail.
    """
    cleaned = preprocess_arabic(matan_text)
    words = set(cleaned.split())
    
    # Cek irisan dengan kamus temporal
    for kw in TEMPORAL_KEYWORDS:
        if kw in words:
            return {
                "label": "Temporal-Lokal",
                "reason": f"Ditemukan indikasi kontekstual kultural/geografis spesifik: '{kw}'"
            }
            
    return {
        "label": "Universal",
        "reason": "Tidak ditemukan indikasi temporalitas spesifik lokal Arab, diasumsikan berlaku universal."
    }
