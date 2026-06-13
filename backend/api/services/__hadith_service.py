from api.core.data import data_store

def get_all_hadiths():
    """Return all loaded hadiths."""
    return data_store.hadith_data

def get_hadith_by_id(hadith_id):
    """Find a hadith by its integer ID."""
    for h in data_store.hadith_data:
        if h.get('id') == hadith_id:
            return h
    return None
def get_chapters_by_kitab(kitab):
    """Return unique chapters for a given kitab sorted numerically."""
    chapters = set()
    k = kitab.lower().strip() if kitab else None
    if not k:
        return []
        
    for h in data_store.hadith_data:
        if h.get('kitab', '').lower().strip() == k:
            bab_val = h.get('bab', '')
            if bab_val: # Pastikan bab tidak kosong
                chapters.add(bab_val)
    
    # Mengurutkan berdasarkan konversi ke integer agar urutan 1, 2, 10 benar
    # Menggunakan int(x) sebagai kunci pengurutan
    # return sorted(list(chapters))
    return sorted(list(chapters), key=lambda x: int(x) if x.isdigit() else 0)


def search_hadith(query=None, kitab=None, bab=None, search_type='phrase'):
    """Keyword search in hadith text/translation and optionally filter by kitab and bab."""
    import re
    results = []
    q = query.lower() if query else None
    
    # If kitab is "all", treat it as None
    k = kitab.lower().strip() if kitab and kitab.lower() != 'all' else None
    b = bab.lower().strip() if bab else None

    for h in data_store.hadith_data:
        match_query = True
        match_kitab = True
        match_bab = True

        if q:
            text_to_search = (h.get('terjemahan', '') + ' ' + h.get('arab', '') + ' ' + h.get('english', '')).lower()
            
            if search_type == 'single':
                # Exact word boundary match
                # Escape the query to prevent regex errors
                pattern = r'\b' + re.escape(q) + r'\b'
                match_query = bool(re.search(pattern, text_to_search))
            elif search_type == 'random':
                # All words must be present, regardless of order
                words = q.split()
                match_query = all(word in text_to_search for word in words)
            else:
                # 'phrase' - exact substring match (default)
                match_query = q in text_to_search
        
        if k:
            match_kitab = k == h.get('kitab', '').lower().strip()
            
        if b:
            match_bab = b == h.get('bab', '').lower().strip()

        if match_query and match_kitab and match_bab:
            results.append(h)
    return results

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
    import re
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
                    # Catatan: beberapa distance metric di ChromaDB menghasilkan nilai kebalikan.
                    # Kita asumsikan score relevansi tinggi = makin mirip
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
        
        for h in data_store.hadith_data:
            if h.get('id') == hadith_id:
                continue
                
            h_sahabat = get_sahabat(h.get('sanad', []))
            h_matan = extract_matan(h.get('terjemahan', ''))
            
            sim = compute_similarity(main_matan, h_matan)
            
            if sim > SIM_THRESHOLD:
                if main_sahabat and h_sahabat and (main_sahabat in h_sahabat or h_sahabat in main_sahabat):
                    muttabi.append(h)
                else:
                    syawahid.append(h)
                    
    return syawahid, muttabi
