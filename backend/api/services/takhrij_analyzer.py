from api.core.ai_core import ai_core # Akses ke instance ChromaDB Anda
from api.services.hadith_service import get_hadith_by_id
from api.services.sanad_service import parse_sanad
import re

def normalize_arabic(text):
    if not text:
        return ""
    import re
    tashkeel_pattern = re.compile(r'[\u064B-\u065F\u0670]')
    text = tashkeel_pattern.sub('', text)
    text = re.sub(r'[أإآ]', 'ا', text)
    text = re.sub(r'ة', 'ه', text)
    text = re.sub(r'[ىي]', 'ي', text)
    text = re.sub(r'ـ', '', text)
    return text.strip().lower()

def clean_sahabat_name(name):
    if not name:
        return ""
    name_lower = str(name).lower().strip()
    name_clean = re.sub(r"\(.*?\)", "", name_lower).strip()
    name_clean = name_clean.replace("‘", "").replace("’", "").replace("'", "").replace("`", "")
    
    # Deteksi kecocokan Bahasa Inggris (Word Boundaries)
    if re.search(r"\b(ibn umar|b(in)?\s+umar|b\.\s+umar|umar)\b", name_clean):
        if re.search(r"\b(ibn umar|b(in)?\s+umar|b\.\s+umar|abdullah\s+bin\s+umar|abdullah\s+b\.\s+umar)\b", name_clean):
            return "Ibn Umar"
        if re.search(r"\b(umar)\b", name_clean):
            return "Umar bin al-Khattab"
            
    if re.search(r"\b(abu\s+hurairah|abu\s+hurayrah|abi\s+hurairah|abi\s+hurayrah)\b", name_clean):
        return "Abu Hurairah"
    if re.search(r"\b(anas\s+bin\s+malik|anas\s+b\.\s+malik|anas\s+b\s+malik)\b", name_clean):
        return "Anas bin Malik"
    if re.search(r"\b(ibn\s+abbas|b(in)?\s+abbas|b\.\s+abbas)\b", name_clean):
        return "Ibn Abbas"
    if re.search(r"\b(abu\s+said|abu\s+sa\'id|abi\s+said|abi\s+sa\'id)\b", name_clean):
        return "Abu Sa'id al-Khudri"
    if re.search(r"\b(al-mughira|mughira|al-mughirah|mughirah)\b", name_clean):
        return "Al-Mughirah bin Syu'bah"
    if re.search(r"\b(samurah|samura)\b", name_clean):
        return "Samurah bin Jundab"
    if re.search(r"\b(ali)\b", name_clean):
        return "Ali bin Abi Talib"
    if re.search(r"\b(aisha|aisyah)\b", name_clean):
        return "Aisyah"
    if re.search(r"\b(anas)\b", name_clean):
        return "Anas bin Malik"
    if re.search(r"\b(jabir)\b", name_clean):
        return "Jabir bin Abdullah"
        
    # Deteksi kecocokan Bahasa Arab
    norm_ar = normalize_arabic(name_clean)
    if 'ابن عمر' in norm_ar or 'عبد الله bin عمر' in norm_ar or 'عبد الله بن عمر' in norm_ar or 'عبدالله بن عمر' in norm_ar:
        return 'Ibn Umar'
    if 'ابو هريره' in norm_ar or 'ابي هريره' in norm_ar or 'ابوهريره' in norm_ar or 'ابيهريره' in norm_ar:
        return 'Abu Hurairah'
    if 'انس بن مالك' in norm_ar:
        return 'Anas bin Malik'
    if 'ابن عباس' in norm_ar or 'عبد الله بن عباس' in norm_ar or 'عبدالله بن عباس' in norm_ar:
        return 'Ibn Abbas'
    if 'ابي سعيد الخدري' in norm_ar or 'ابو سعيد الخدري' in norm_ar:
        return "Abu Sa'id al-Khudri"
    if 'المغيره بن شعبه' in norm_ar or 'مغيره بن شعبه' in norm_ar:
        return "Al-Mughirah bin Syu'bah"
    if 'سمره بن جندب' in norm_ar:
        return 'Samurah bin Jundab'
    if 'عمر' in norm_ar:
        return 'Umar bin al-Khattab'
    if 'علي' in norm_ar:
        return 'Ali bin Abi Talib'
    if 'عائشه' in norm_ar:
        return 'Aisyah'
    if 'انس' in norm_ar:
        return 'Anas bin Malik'
    if 'جابر' in norm_ar:
        return 'Jabir bin Abdullah'
        
    try:
        if name_clean.isascii():
            return name_clean.title()
    except:
        pass
    return name

def extract_sahabat_fallback(hadith_dict):
    if not hadith_dict:
        return None
        
    # Ekstraksi dari teks Arab
    arab = hadith_dict.get("arab", "")
    if arab:
        norm = arab
        tashkeel_pattern = re.compile(r'[\u064B-\u065F\u0670]')
        norm = tashkeel_pattern.sub('', norm)
        norm = re.sub(r'[أإآ]', 'ا', norm)
        norm = re.sub(r'ة', 'ه', norm)
        norm = re.sub(r'[ىي]', 'ي', norm)
        norm = re.sub(r'ـ', '', norm)
        
        matan_starts = [
            "قال رسول الله",
            "قال قال رسول الله",
            "ان رسول الله",
            "سمعت رسول الله",
            "عن النبي",
            "يقول قال رسول الله",
            "قال سمعت Nabi",
            "قال سمعت النبي",
            "قال النبي",
            "سمعت النبي"
        ]
        
        earliest_idx = -1
        for pattern in matan_starts:
            idx = norm.find(pattern)
            if idx != -1:
                if earliest_idx == -1 or idx < earliest_idx:
                    earliest_idx = idx
                    
        if earliest_idx != -1:
            sanad_part = norm[:earliest_idx].strip()
        else:
            sanad_part = norm.strip()
            
        matches = list(re.finditer(r'\bعن\b', sanad_part))
        if matches:
            last_match = matches[-1]
            sahabat_text = sanad_part[last_match.end():].strip()
            
            sahabat_text = re.sub(r'[،,.\-\s]+$', '', sahabat_text)
            sahabat_text = re.sub(r'رضي الله عنه.*$', '', sahabat_text)
            sahabat_text = re.sub(r'رضي الله عن.*$', '', sahabat_text)
            sahabat_text = sahabat_text.strip()
            
            if sahabat_text and len(sahabat_text) > 1:
                return sahabat_text

    # Ekstraksi dari teks Inggris
    english = hadith_dict.get("english", "")
    if english:
        match = re.search(r'\b(reported|narrated)\b', english, re.IGNORECASE)
        if match:
            narrator_part = english[:match.start()].strip()
            narrator_part = re.sub(r'\(.*?\)', '', narrator_part)
            narrator_part = re.sub(r'^[^a-zA-Z‘\']+', '', narrator_part)
            narrator_part = re.sub(r'[^a-zA-Z‘\']+$', '', narrator_part)
            narrator_part = narrator_part.strip()
            
            if narrator_part and len(narrator_part) > 2:
                return narrator_part
                
    return None

def get_sahabat_id(hadith_id):
    """
    Mengekstrak ID atau Nama perawi tingkat Sahabat dari rantai sanad.
    Mendukung fallback ke nama jika scholar_indx tidak tersedia.
    """
    # 1. Mencoba via parse_sanad (indeks)
    try:
        sanad_chain = parse_sanad(hadith_id)
        if sanad_chain and len(sanad_chain) > 0:
            sahabat = sanad_chain[-1] 
            if isinstance(sahabat, dict):
                name_val = sahabat.get("name") or sahabat.get("name_ar")
                if name_val:
                    return clean_sahabat_name(name_val)
                if sahabat.get("scholar_indx"):
                    return clean_sahabat_name(sahabat.get("scholar_indx"))
    except Exception as e:
        print(f"DEBUG: Error parse_sanad for {hadith_id}: {e}")
    
    # 2. Fallback: Ambil dari data_store langsung (berbasis nama)
    hadith = get_hadith_by_id(hadith_id)
    if hadith:
        sanad = hadith.get("sanad", [])
        
        # Jika sanad kosong, coba ekstrak ulang dari terjemahan (kasus reload data gagal)
        if not sanad or len(sanad) == 0:
            terjemahan = hadith.get("terjemahan", "")
            if terjemahan:
                pattern = r'\[(.*?)\]'
                sanad = [m.group(1) for m in re.finditer(pattern, terjemahan)]
                sanad = list(dict.fromkeys(sanad)) # Dedup
        
        if sanad and len(sanad) > 0:
            return clean_sahabat_name(sanad[-1])
            
        # 3. Last fallback: try robust extraction from Arabic/English text
        extracted = extract_sahabat_fallback(hadith)
        if extracted:
            return clean_sahabat_name(extracted)
            
        # If all fail, print the warning and return None
        print(f"DEBUG: Hadith {hadith_id} found but sanad and terjemahan are empty or missing brackets.")
    else:
        print(f"DEBUG: Hadith {hadith_id} NOT found in data store.")
        
    return None


def analyze_cross_chain(target_hadith_id, similarity_threshold=0.60, top_k=20):
    """
    Mendeteksi Syawahid dan Muttabi' berdasarkan target hadis.
    Menggunakan NER untuk graf sanad dan LaBSE untuk analisis makna matan.
    """
    from api.services.hadith_service import get_all_hadiths
    from api.services.sanad_analyzer import extract_narrators
    from api.services.matan_analyzer import compute_labse_similarity, classify_context
    import re
    
    # 1. Tarik Data Target, bedakan Sanad dan Matan
    target_data = get_hadith_by_id(target_hadith_id)
    if not target_data:
        return {"error": f"Hadis dengan ID {target_hadith_id} tidak ditemukan di sistem."}
        
    terjemahan = target_data.get("terjemahan", "")
    arab = target_data.get("arab", "")
    
    # Memisahkan sanad dan matan dari terjemahan (Indonesian)
    idx = terjemahan.rfind(']')
    if idx != -1:
        target_sanad_id = terjemahan[:idx+1].strip()
        target_matan_id = terjemahan[idx+1:].strip()
    else:
        target_sanad_id = "Sanad tidak terdeteksi secara eksplisit"
        target_matan_id = terjemahan.strip()

    # Memisahkan sanad dan matan dari teks Arab
    # Pattern dengan harakat lengkap (teks berharakat penuh)
    arab_pattern_harakat = r'(قَالَ رَسُولُ اللَّهِ|قَالَ قَالَ رَسُولُ اللَّهِ|أَنَّ رَسُولَ اللَّهِ|سَمِعْتُ رَسُولَ اللَّهِ|عَنِ النَّبِيِّ|يَقُولُ قَالَ رَسُولُ اللَّهِ|قَالَ سَمِعْتُ النَّبِيَّ|قَالَ النَّبِيُّ|سَمِعْتُ النَّبِيَّ)'
    # Pattern tanpa harakat (teks tanpa tashkeel / harakat parsial)
    arab_pattern_plain = r'(قال رسول الله|قال قال رسول الله|أن رسول الله|ان رسول الله|سمعت رسول الله|عن النبي|يقول قال رسول الله|قال سمعت النبي|قال النبي|سمعت النبي)'
    
    match = re.search(arab_pattern_harakat, arab)
    if not match:
        # Coba cari di teks yang dinormalisasi (tanpa harakat)
        arab_normalized = normalize_arabic(arab)
        match_plain = re.search(arab_pattern_plain, arab_normalized)
        if match_plain:
            # Temukan posisi yang sama di teks asli menggunakan offset
            # Hitung posisi di teks asli dengan menormalisasi karakter per karakter
            norm_idx = match_plain.start()
            orig_idx = 0
            norm_count = 0
            tashkeel = re.compile(r'[\u064B-\u065F\u0670]')
            for i, ch in enumerate(arab):
                if norm_count >= norm_idx:
                    orig_idx = i
                    break
                if not tashkeel.match(ch):
                    norm_count += 1
            else:
                orig_idx = len(arab)
            match = type('Match', (), {'start': lambda self: orig_idx})()
    
    if match:
        arab_idx = match.start()
        target_sanad_ar = arab[:arab_idx].strip()
        target_matan_ar = arab[arab_idx:].strip()
        if target_sanad_ar.endswith('،') or target_sanad_ar.endswith(','):
            target_sanad_ar = target_sanad_ar[:-1].strip()
    else:
        # Fallback: gunakan teks Arab lengkap untuk NER (bukan string statis)
        target_sanad_ar = arab.strip()
        target_matan_ar = arab.strip()

    target_sahabat_id = get_sahabat_id(target_hadith_id)
    
    if not target_sahabat_id:
        return {"error": "Sanad target tidak memiliki data Sahabat yang valid (tidak ada perawi dalam kurung siku di terjemahan)."}

    # A. Analisis Sanad (NER AraBERT)
    print(f"Mengekstrak entitas perawi sanad untuk hadis {target_hadith_id}...")
    sanad_graph = extract_narrators(target_sanad_ar)

    # B. Analisis Matan (Klasifikasi Konteks)
    print(f"Menganalisis konteks matan untuk hadis {target_hadith_id}...")
    matan_context = classify_context(target_matan_ar)

    takhrij_report = {
        "target_id": target_hadith_id,
        "target_sahabat_id": target_sahabat_id,
        "target_sanad": target_sanad_id,
        "target_matan": target_matan_id,
        "target_sanad_ar": target_sanad_ar,
        "target_matan_ar": target_matan_ar,
        "target_arab": arab,
        "sanad_graph": sanad_graph,
        "matan_context": matan_context,
        "muttabi": [],
        "syawahid": []
    }

    print(f"Memfilter kandidat berdasarkan Matan Arab untuk hadis {target_hadith_id}...")
    all_hadiths = get_all_hadiths()
    
    # Kumpulkan kandidat potensial menggunakan pencarian Jaccard (Cepat)
    from api.services.hadith_service import normalize_arabic
    
    def compute_arabic_similarity(matan1, matan2):
        w1 = set(re.findall(r'\w+', normalize_arabic(matan1)))
        w2 = set(re.findall(r'\w+', normalize_arabic(matan2)))
        if not w1 or not w2: return 0.0
        return len(w1.intersection(w2)) / len(w1.union(w2))

    preliminary_candidates = []
    
    for h in all_hadiths:
        candidate_id = h.get("id")
        if candidate_id == target_hadith_id:
            continue
            
        candidate_arab = h.get("arab", "")
        # Pemisahan matan arab kandidat
        c_match = re.search(arab_pattern_harakat, candidate_arab)
        if not c_match:
            c_match = re.search(arab_pattern_plain, normalize_arabic(candidate_arab))
        if c_match:
            candidate_matan_ar = candidate_arab[c_match.start():].strip()
        else:
            candidate_matan_ar = candidate_arab
            
        sim = compute_arabic_similarity(target_matan_ar, candidate_matan_ar)
        if sim > 0.10: # Threshold kasar untuk pre-filter
            preliminary_candidates.append((h, candidate_matan_ar, sim))

    # Urutkan dan ambil top 150 kandidat terbaik dari Jaccard
    preliminary_candidates.sort(key=lambda x: x[2], reverse=True)
    top_candidates = preliminary_candidates[:150]
    
    print(f"Menjalankan LaBSE pada {len(top_candidates)} kandidat...")
    
    if top_candidates:
        candidate_matans_ar = [c[1] for c in top_candidates]
        candidate_objects = [c[0] for c in top_candidates]
        
        # Hitung kemiripan dengan LaBSE (Vector Similarity)
        similarity_results = compute_labse_similarity(target_matan_ar, candidate_matans_ar)
        
        # Memproses hasil (mengambil top K yang memenuhi threshold)
        count = 0
        for idx, sim_score in similarity_results:
            # Gunakan threshold cosine similarity
            if sim_score < similarity_threshold:
                continue
                
            h = candidate_objects[idx]
            candidate_id = h.get("id")
            candidate_sahabat_id = get_sahabat_id(candidate_id)
            
            if not candidate_sahabat_id:
                continue
                
            candidate_info = {
                "hadith_id": candidate_id,
                "source": h.get("kitab", "Unknown"),
                "chapter_no": h.get("nomor", "-"),
                "text_snippet": candidate_matans_ar[idx][:150] + "...",
                "similarity_score": round(sim_score, 3),
                "sahabat_id": candidate_sahabat_id
            }
            
            if str(candidate_sahabat_id).lower() == str(target_sahabat_id).lower():
                takhrij_report["muttabi"].append(candidate_info)
            else:
                takhrij_report["syawahid"].append(candidate_info)
                
            count += 1
            if count >= top_k:
                break

    # Sort results by similarity score descending
    takhrij_report["muttabi"] = sorted(takhrij_report["muttabi"], key=lambda x: x["similarity_score"], reverse=True)
    takhrij_report["syawahid"] = sorted(takhrij_report["syawahid"], key=lambda x: x["similarity_score"], reverse=True)

    return takhrij_report