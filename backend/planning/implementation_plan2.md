# Penambahan Analisis Sanad (NER) & Matan (LaBSE + Klasifikasi Kontekstual)

Pembaruan ini akan membawa fitur Takhrij Hadis ke tingkat lanjut dengan menerapkan teknik NLP modern untuk membedah struktur Sanad dan menelaah makna serta konteks Matan berdasarkan metodologi kritik matan Syuhudi Ismail.

## User Review Required

> [!WARNING]
> **Konsumsi Memori (RAM)**: Penggunaan model `transformers` (AraBERT untuk NER) dan `sentence-transformers` (LaBSE) secara lokal akan membutuhkan resource memori yang signifikan (diperkirakan sekitar 2GB - 4GB RAM). Pastikan server/mesin lokal Anda memiliki kapasitas yang memadai.

> [!IMPORTANT]
> **Library Tambahan**: Kami perlu menambahkan `transformers`, `torch`, dan `PyArabic` ke dalam `requirements.txt`. Proses instalasi awal (termasuk mengunduh model dari Hugging Face) mungkin akan memakan waktu dan bandwidth.

## Open Questions

> [!CAUTION]
> 1. **Model NER AraBERT**: Model `aubmindlab/bert-base-arabertv02` adalah model *base*. Untuk ekstraksi entitas (NER), disarankan menggunakan model yang sudah di-*fine-tune* untuk NER Arab (misalnya `hatmimoha/arabic-ner` atau `CAMeL-Lab/bert-base-arabic-camelbert-mix-ner`). Apakah Anda setuju jika saya menggunakan model NER yang sudah di-*fine-tune* agar akurasinya lebih baik?
> 2. **Kamus Kontekstual (Rule-Based)**: Untuk klasifikasi Temporal-Lokal vs Universal, saya akan menyiapkan kamus dasar berisikan kata kunci sejarah lokal Arab (seperti istilah perang, unta, dirham, dll). Apakah Anda memiliki daftar kata kunci spesifik yang wajib dimasukkan?
> 3. **Visualisasi Graph**: Saya berencana menggunakan **Vis.js** (library visualisasi jaringan yang interaktif) yang dipanggil via CDN di HTML, lalu membuat file `graph_sanad.js` untuk menggambar pohon sanad. Apakah ini dapat diterima?

## Proposed Changes

### Dependensi Sistem
#### [MODIFY] [requirements.txt](file:///Users/imdie85/dev/hadith-dev/projects/smart-takhrij/requirements.txt)
- Menambahkan `transformers`
- Menambahkan `torch` (diperlukan oleh transformers)
- Menambahkan `PyArabic`

---

### Backend Logic & AI Services

#### [NEW] [sanad_analyzer.py](file:///Users/imdie85/dev/hadith-dev/projects/smart-takhrij/services/sanad_analyzer.py)
- Membuat fungsi `extract_narrators(arab_text)`.
- Memuat pipeline NER HuggingFace untuk mendeteksi entitas `B-PERS` / `I-PERS`.
- Menyaring kata sambung (seperti *'an*, *haddatsana*, *akhbarana*) menggunakan regex dan aturan heuristik.
- Membentuk struktur hirarki Sanad (berupa JSON `nodes` dan `edges`) yang menandakan relasi Source -> Target dari rantai periwayatan.

#### [NEW] [matan_analyzer.py](file:///Users/imdie85/dev/hadith-dev/projects/smart-takhrij/services/matan_analyzer.py)
- Membuat fungsi `preprocess_arabic(text)` menggunakan `PyArabic` untuk menghapus harakat, tanda baca, dan kata hubung.
- Memuat model `sentence-transformers/LaBSE` untuk mengubah matan menjadi vektor numerik (Embedding).
- Membuat fungsi `find_similar_matan(target_vector, candidates)` menggunakan Cosine Similarity.
- Membuat fungsi `classify_context(text)` dengan pendekatan *rule-based* untuk mendeteksi apakah matan berdimensi Temporal-Lokal (berisi idiom kultural/sejarah spesifik) atau Universal.

#### [MODIFY] [takhrij_analyzer.py](file:///Users/imdie85/dev/hadith-dev/projects/smart-takhrij/services/takhrij_analyzer.py)
- Memodifikasi `analyze_cross_chain()` untuk mengintegrasikan output dari `sanad_analyzer` dan `matan_analyzer`.
- Menyertakan data JSON pohon sanad dan label klasifikasi konteks (Universal/Temporal-Lokal) ke dalam dictionary `takhrij_report`.

---

### Frontend & Visualisasi

#### [MODIFY] [cross_analysis.html](file:///Users/imdie85/dev/hadith-dev/projects/smart-takhrij/templates/hadith/cross_analysis.html)
- Menambahkan div container `<div id="sanad-network"></div>` untuk kanvas grafis pohon sanad.
- Menambahkan import script CDN untuk library visualisasi (Vis.js/D3.js).
- Menambahkan elemen UI berupa *Badge* atau kotak informasi untuk menampilkan status **Klasifikasi Konteks Matan (Syuhudi Ismail)**.
- Melampirkan data JSON koordinat sanad ke tag `<script>` untuk diproses oleh file eksternal.

#### [NEW] [graph_sanad.js](file:///Users/imdie85/dev/hadith-dev/projects/smart-takhrij/static/js/graph_sanad.js)
- Skrip JavaScript untuk menerima data `nodes` (nama perawi) dan `edges` (garis periwayatan) dari backend.
- Mengatur konfigurasi gaya, tata letak, dan interaktivitas visualisasi (pan, zoom, node klik) untuk graf pohon sanad.

## Verification Plan

### Automated/Unit Tests
- Menulis script uji coba mandiri `test_nlp_pipeline.py` untuk menguji fungsionalitas NER dan memastikan ekstraksi entitas berjalan dengan benar pada sampel sanad.
- Menguji akurasi model `LaBSE` pada dua matan yang semakna namun menggunakan kosa kata yang sedikit berbeda.

### Manual Verification
- Menjalankan server aplikasi dan membuka halaman Analisis Lintas Sanad di browser.
- Memeriksa secara visual apakah graf pohon Sanad berhasil digambar dan menampilkan rute yang sesuai dengan teks arabnya.
- Memverifikasi apakah matan dilabeli dengan benar antara "Temporal-Lokal" atau "Universal" berdasarkan kata kunci yang dikandungnya.
