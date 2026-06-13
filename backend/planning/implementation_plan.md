# Rencana Implementasi: Resolusi Warning/Error Sanad & Terjemahan Kosong (Hadis 3512, 3515, 11299)

## Analisis Masalah
Ketika membuka halaman **Analisis Lintas Sanad** (`cross_analysis.html`), sistem memproses hadis-hadis semakna (kandidat) menggunakan LaBSE. Untuk setiap hadis kandidat, sistem memanggil fungsi `get_sahabat_id(hadith_id)` di [takhrij_analyzer.py](file:///Users/imdie85/dev/hadith-dev/projects/smart-takhrij/services/takhrij_analyzer.py) untuk mengidentifikasi perawi tingkat Sahabat.

Namun, untuk beberapa hadis valid (seperti Hadis 3512, 3515, dan 11299):
1. Kolom `terjemahan` (Bahasa Indonesia) di database ternyata kosong dari sumber aslinya.
2. Kolom `sanad_json` juga kosong (`[]`).
3. Akibatnya, `get_sahabat_id` gagal mengekstrak Sahabat, mencetak log warning:
   `DEBUG: Hadith 3512 found but sanad and terjemahan are empty or missing brackets.`
   dan melewatkan hadis kandidat tersebut (`continue`) sehingga tidak diikutkan dalam analisis.

## Solusi yang Diusulkan
Kami akan meningkatkan fungsi `get_sahabat_id` di [takhrij_analyzer.py](file:///Users/imdie85/dev/hadith-dev/projects/smart-takhrij/services/takhrij_analyzer.py) dengan menambahkan **robust fallback extraction** dan **name normalization**:

1. **Robust Fallback Extraction**:
   Jika `sanad` dan `terjemahan` kosong, kita akan mengekstrak Sahabat secara otomatis dari:
   - **Teks Arab (`arab`)**: Mengekstrak teks sanad sebelum matan (menggunakan pattern transisi matan seperti `قال رسول الله`) dan mengambil nama perawi setelah `عن` terakhir.
   - **Teks Inggris (`english`)**: Mengekstrak nama perawi yang berada sebelum kata kunci `reported` atau `narrated`.

2. **Name Normalization (`clean_sahabat_name`)**:
   Menyediakan fungsi unifikasi nama Sahabat untuk menyelaraskan ejaan bahasa Inggris, bahasa Arab, dan indeks rawi database agar perbandingan `candidate_sahabat_id == target_sahabat_id` berjalan 100% akurat. Contoh hasil unifikasi:
   - `‘Abd Allah b. ‘Umar` -> `Ibn Umar`
   - `عبد الله بن عمر` -> `Ibn Umar`
   - `Ibn Umar (scholar_indx 18)` -> `Ibn Umar`

## Rincian Perubahan Kode

### [MODIFY] [takhrij_analyzer.py](file:///Users/imdie85/dev/hadith-dev/projects/smart-takhrij/services/takhrij_analyzer.py)

Kita akan menyisipkan fungsi pembantu `normalize_arabic`, `clean_sahabat_name`, dan `extract_sahabat_fallback`, serta memperbarui `get_sahabat_id` di [takhrij_analyzer.py](file:///Users/imdie85/dev/hadith-dev/projects/smart-takhrij/services/takhrij_analyzer.py):

```python
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
            sahabat_text = re.sub(r'رضi الله عنه.*$', '', sahabat_text)
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
```

## Rencana Verifikasi

### Tes Otomatis
1. Kami akan membuat script test sementara `test_verifikasi.py` yang memuat Flask app context.
2. Memanggil `get_sahabat_id(3512)`, `get_sahabat_id(3515)`, dan `get_sahabat_id(11299)`.
3. Memastikan ketiganya mengembalikan `"Ibn Umar"` tanpa mencetak error/warning debug.
4. Menjalankan analisis lintas sanad untuk hadis target yang mirip (misalnya hadis tentang walimah/undangan pesta pernikahan) dan memverifikasi tidak ada lagi log warning.

### Verifikasi Manual
1. Membuka URL aplikasi `/analysis/cross-chain/3512` di browser untuk memastikan halaman cross analysis ter-render dengan sempurna tanpa kendala.
