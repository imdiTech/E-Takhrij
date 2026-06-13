"""
Hadith Service — migrated from Flask-SQLAlchemy to Django ORM.
All business logic preserved exactly. Only ORM queries and imports changed.
"""
import json
import re
# Mengimpor modul pengelola memori dan rawi service yang sudah ada
from api.core.data import get_hadith_df, get_rawi_df
from api.services.rawi_service import get_rawi_by_indices
from api.core.data import data_store

def get_all_hadiths():
    """Return all loaded hadiths."""
    from api.models.hadith import Hadith
    return [h.to_dict() for h in Hadith.objects.all()]

def get_hadith_by_id(hadith_id):
    """Find a hadith by its integer ID."""
    from api.models.hadith import Hadith
    try:
        h = Hadith.objects.get(pk=hadith_id)
        return h.to_dict()
    except Hadith.DoesNotExist:
        return None

def get_chapters_by_kitab(kitab):
    """Return unique chapters for a given kitab sorted numerically."""
    chapters = set()
    k = kitab.lower().strip() if kitab else None
    if not k:
        return []
    from api.models.hadith import Hadith
    query = Hadith.objects.filter(kitab__iexact=k)
    for h in query:
        if h.bab: # Pastikan bab tidak kosong
            chapters.add(h.bab)

    # Mengurutkan berdasarkan konversi ke integer agar urutan 1, 2, 10 benar
    return sorted(list(chapters))


def has_arabic(text):
    if not text:
        return False
    return bool(re.search(r'[\u0600-\u06FF]', text))

def normalize_arabic(text):
    if not text:
        return ""
    # 1. Remove diacritics/tashkeel
    tashkeel_pattern = re.compile(r'[\u064B-\u065F\u0670]')
    text = tashkeel_pattern.sub('', text)
    # 2. Normalize Alifs (أ, إ, آ to ا)
    text = re.sub(r'[أإآ]', 'ا', text)
    # 3. Normalize Teh Marbuta (ة to ه)
    text = re.sub(r'ة', 'ه', text)
    # 4. Normalize Yeh/Alif Maksura (ى and ي to ي)
    text = re.sub(r'[ىي]', 'ي', text)
    # 5. Remove tatweel (ـ)
    text = re.sub(r'ـ', '', text)
    return text.strip().lower()

def search_hadith(query=None, kitab=None, bab=None, search_type='phrase'):
    """Keyword search in hadith text/translation and optionally filter by kitab and bab."""
    results = []

    from api.core.data import get_hadith_df
    df = get_hadith_df()
    
    if df is None or df.empty:
        return []

    # If no query, just filter by kitab/bab
    k = kitab.lower().strip() if kitab and kitab.lower() != 'all' else None
    b = bab.lower().strip() if bab else None

    if k:
        df = df[df['source'].str.lower() == k]
    if b:
        df = df[df['chapter_no'].str.lower() == b]

    if not query:
        # If no query, just filter by kitab/bab
        k = kitab.lower().strip() if kitab and kitab.lower() != 'all' else None
        b = bab.lower().strip() if bab else None
        
        all_filtered = []
        for h in data_store.hadith_data:
            if k and h.get('kitab', '').lower() != k:
                continue
            if b and h.get('bab', '').lower() != b:
                continue
            all_filtered.append(h)
        return all_filtered

    is_ar_query = has_arabic(query)
    
    if is_ar_query:
        q_norm = normalize_arabic(query)
        q_words = [w for w in re.findall(r'\w+', q_norm) if len(w) > 1]
    else:
        q_norm = query.lower().strip()
        q_words = [w for w in re.findall(r'\w+', q_norm) if len(w) > 2]

    k = kitab.lower().strip() if kitab and kitab.lower() != 'all' else None
    b = bab.lower().strip() if bab else None

    all_filtered = []
    for h in data_store.hadith_data:
        if k and h.get('kitab', '').lower() != k:
            continue
        if b and h.get('bab', '').lower() != b:
            continue
        all_filtered.append(h)

    scored_results = []
    
    import string
    translator = str.maketrans(string.punctuation, ' '*len(string.punctuation))
    
    is_long = len(q_words) >= 3
    q_words_set = set(q_words)
    q_len = len(q_words_set) if q_words_set else 1

    for h in all_filtered:
        match_score = 0.0

        if is_ar_query:
            raw_text_to_search = h.get('arab', '') or ''
            norm_text = h.get('arab_norm', '')
            target_words = h.get('arab_word_set', set())
        else:
            terj = h.get('terjemahan', '') or ''
            eng = h.get('english', '') or ''
            raw_text_to_search = terj.lower() + ' ' + eng.lower()
            norm_text = raw_text_to_search
            target_words = h.get('word_set', set())

        if search_type == 'phrase' or search_type == 'single' or search_type == 'random':
            if q_norm in norm_text:
                match_score = 1.0
            elif query.lower() in raw_text_to_search:
                match_score = 1.0
            elif is_long:
                # Fast token overlap check using pre-computed sets
                matched_words = q_words_set.intersection(target_words)
                overlap_ratio = len(matched_words) / q_len

                if overlap_ratio >= 0.4:
                    match_score = overlap_ratio

        if match_score > 0.0:
            h['match_score'] = match_score
            scored_results.append((h, match_score))

    # Sort results by match score (descending), then kitab and nomor
    scored_results.sort(key=lambda x: (-x[1], x[0].get('kitab', ''), x[0].get('nomor', '')))

    return [item[0] for item in scored_results]

def extract_matan(terjemahan):
    """Mengekstrak matan dengan membuang sanad (segala teks sebelum perawi terakhir dalam kurung siku)."""
    idx = terjemahan.rfind(']')
    if idx != -1:
        return terjemahan[idx+1:].strip()
    return terjemahan

def get_sahabat(sanad_nodes):
    """Mengambil sahabat (perawi pertama/terakhir di rantai, yang paling dekat dengan nabi).
    Biasanya elemen terakhir di array sanad_nodes."""
    if sanad_nodes and len(sanad_nodes) > 0:
        return sanad_nodes[-1]
    return None

def compute_similarity(matan1, matan2):
    """Menghitung Jaccard similarity sederhana berdasarkan kata."""
    w1 = set(re.findall(r'\w+', matan1.lower()))
    w2 = set(re.findall(r'\w+', matan2.lower()))
    if not w1 or not w2: return 0.0
    return len(w1.intersection(w2)) / len(w1.union(w2))

def find_syawahid_muttabi(hadith_id):
    """Mencari Syawahid dan Muttabi' untuk suatu hadis.
    Menggunakan ChromaDB (jika tersedia dan berisi data) untuk Semantic Search,
    fallback ke Jaccard Similarity manual jika DB kosong/error.
    """
    from api.core.ai_core import ai_core

    main_hadith = get_hadith_by_id(hadith_id)
    if not main_hadith:
        return [], []

    main_sahabat = get_sahabat(main_hadith.get('sanad', []))
    main_matan = extract_matan(main_hadith.get('terjemahan', ''))

    syawahid = []
    muttabi = []

    # Coba gunakan ChromaDB terlebih dahulu
    db_success = False

    if ai_core.vector_store:
        try:
            # Cek apakah ChromaDB punya data
            if ai_core.vector_store._collection.count() > 0:
                print(f"Melakukan semantic search untuk hadis {hadith_id} via ChromaDB...")
                # Ambil top 20 hasil
                results = ai_core.vector_store.similarity_search_with_relevance_scores(main_matan, k=20)

                for doc, score in results:
                    # Threshold ChromaDB (tergantung embedding model, misal 0.70 atau 0.75)
                    if score > 0.70:
                        h_id = int(doc.metadata.get('hadith_id'))
                        if h_id == hadith_id:
                            continue

                        h = get_hadith_by_id(h_id)
                        if not h:
                            continue

                        h_sahabat = get_sahabat(h.get('sanad', []))

                        if main_sahabat and h_sahabat and (main_sahabat in h_sahabat or h_sahabat in main_sahabat):
                            muttabi.append(h)
                        else:
                            syawahid.append(h)

                db_success = True
        except Exception as e:
            print(f"Error Vector Search (Fallback ke Manual): {e}")
            db_success = False

    # Fallback ke pencarian manual (Jaccard) jika ChromaDB kosong atau error
    if not db_success:
        print(f"Fallback: Melakukan pencarian Jaccard manual untuk hadis {hadith_id}...")
        SIM_THRESHOLD = 0.15
        from api.models.hadith import Hadith
        all_hadiths = Hadith.objects.all()
        for h_obj in all_hadiths:
            if h_obj.id == hadith_id:
                continue

            h = h_obj.to_dict()
            h_sahabat = get_sahabat(h.get('sanad', []))
            h_matan = extract_matan(h.get('terjemahan', ''))

            sim = compute_similarity(main_matan, h_matan)

            if sim > SIM_THRESHOLD:
                if main_sahabat and h_sahabat and (main_sahabat in h_sahabat or h_sahabat in main_sahabat):
                    muttabi.append(h)
                else:
                    syawahid.append(h)

    return syawahid, muttabi


def parse_sanad(hadith_id):
    """
    Membongkar rantai perawi (Sanad) dari satu hadis target.
    Mengambil urutan perawi (chain_indx) lalu memetakan profil lengkapnya.
    """
    hadith_df = get_hadith_df()
    if hadith_df is None or hadith_df.empty:
        return []

    # Filter data hadis berdasarkan ID
    hadith_data = hadith_df[hadith_df["id"] == int(hadith_id)]
    if hadith_data.empty:
        return []

    # Mengambil string urutan indeks sanad (asumsi kolom bernama 'chain_indx')
    chain_str = str(hadith_data.iloc[0].get("chain_indx", ""))
    if not chain_str or chain_str == "nan":
        return []

    # Mengubah string '1, 2, 3' menjadi list integer [1, 2, 3]
    try:
        rawi_indices = [int(idx.strip()) for idx in chain_str.split(",") if idx.strip().isdigit()]
    except Exception:
        return []

    # Memuat profil lengkap dari masing-masing perawi menggunakan service yang ada
    rawi_profiles = get_rawi_by_indices(rawi_indices)

    # Memastikan urutan list hasil sesuai dengan urutan silsilah pada sanad asli
    profile_map = {rawi.get("scholar_indx"): rawi for rawi in rawi_profiles}

    # Menyusun rantai terurut
    sanad_chain = []
    for idx in rawi_indices:
        if idx in profile_map:
            sanad_chain.append(profile_map[idx])

    return sanad_chain

def get_related_rawi(scholar_indx):
    """
    Mendapatkan data satu rawi spesifik beserta relasi mentahnya.
    """
    rawi_df = get_rawi_df()
    if rawi_df is None or rawi_df.empty:
        return None

    rawi_data = rawi_df[rawi_df["scholar_indx"] == int(scholar_indx)]
    if rawi_data.empty:
        return None

    return rawi_data.iloc[0].to_dict()

def build_sanad_graph(rawi_list):
    """
    Mengubah data silsilah perawi menjadi bentuk graf (jaringan) untuk visualisasi SNA.
    Menyuntikkan (Inject) daftar nama guru (teachers) dan murid (students).
    Hasil akhir diubah menjadi format JSON (json.dumps) agar bisa digambar di web.
    """
    if not rawi_list:
        return json.dumps({"nodes": [], "edges": []})

    nodes = []
    edges = []
    seen_nodes = set()

    # 1. Membangun Nodes (Titik Perawi)
    for rawi in rawi_list:
        scholar_id = rawi.get("scholar_indx")
        if scholar_id not in seen_nodes:
            # Memisahkan nama jika diperlukan, atau mengambil default name
            rawi_name = rawi.get("name_ar") if rawi.get("name_ar") else rawi.get("name", "Anonim")

            nodes.append({
                "id": scholar_id,
                "label": str(rawi_name),
                "grade": rawi.get("grade", "Tidak diketahui"),
                "death_place": rawi.get("death_place", "Tidak diketahui")
            })
            seen_nodes.add(scholar_id)

    # 2. Menyusun Relasi Transmisi / Edges (Guru ke Murid)
    for i in range(len(rawi_list) - 1):
        student = rawi_list[i]
        teacher = rawi_list[i + 1]

        edges.append({
            "from": teacher.get("scholar_indx"), # Alur transmisi dari Guru
            "to": student.get("scholar_indx"),   # Menuju ke Murid
            "type": "meriwayatkan"
        })

    # Membungkus dan mengembalikan string JSON graf sanad
    return json.dumps({"nodes": nodes, "edges": edges}, ensure_ascii=False)