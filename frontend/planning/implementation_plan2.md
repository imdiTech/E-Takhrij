# Rencana Implementasi: Visualisasi Sanad Menggunakan D3.js pada Frontend

Meningkatkan visualisasi sanad hadis dari gambar statis Base64 yang dihasilkan oleh Python Matplotlib menjadi **grafik interaktif berbasis D3.js yang dinamis, responsif, dan premium** langsung di sisi frontend.

## User Review Required

> [!NOTE]
> - Grafik sanad berbasis D3.js akan menggunakan data `hadith.sanad` (daftar perawi) dan `hadith.sanad_edges` (relasi transmisi) yang sudah dikembalikan oleh API backend.
> - Perubahan ini sepenuhnya di sisi frontend, tanpa merusak endpoint atau model database backend.
> - D3.js sudah berhasil diinstal di dalam package dependencies (`npm install d3`).

## Proposed Changes

### Frontend Component

#### [NEW] [SanadGraphD3.jsx](file:///Users/imdie85/dev/hadith-dev/projects/smart-takhrij/frontend/src/components/SanadGraphD3.jsx)
Membuat komponen visualisasi baru dengan fitur:
- **Force Simulation**: Menata letak perawi secara dinamis sehingga mudah dibaca dan tidak tumpang tindih.
- **Color Coding**: 
  - *Mukharrij/Pencatat* (indeks pertama, e.g., Bukhari, Muslim) diwarnai emas/kuning.
  - *Sahabat Nabi* (indeks terakhir) diwarnai hijau zamrud (emerald).
  - *Perawi Perantara* diwarnai biru indigo.
- **Path Highlighting**: Hover pada suatu perawi akan menyoroti alur transmisinya (menggelapkan perawi dan jalur lain).
- **Zoom & Drag**: Pengguna dapat menggeser (pan) dan memperbesar (zoom) grafik secara bebas menggunakan mouse/touchpad.
- **Controls Panel**: Tombol reset posisi zoom, pencarian perawi dalam grafik, dan panel detail perawi yang dipilih.
- **Directed Transmission Arrows**: Panah penunjuk alur riwayat dari guru ke murid.

#### [MODIFY] [DetailPage.jsx](file:///Users/imdie85/dev/hadith-dev/projects/smart-takhrij/frontend/src/pages/DetailPage.jsx)
- Mengimpor komponen `SanadGraphD3` baru.
- Mengganti tampilan gambar statis di dalam tab `Visual` dengan komponen `SanadGraphD3`.
- Mengirimkan data `hadith` (termasuk `sanad` dan `sanad_edges`) ke komponen baru tersebut.

## Verification Plan

### Automated Tests
- Memastikan tidak ada error saat kompilasi frontend (`npm run dev`).
- Melakukan verifikasi runtime dengan memuat halaman detail hadis dan memastikan SVG ter-render sempurna tanpa error di konsol browser.

### Manual Verification
- Membuka halaman detail hadis (misalnya, nomor 1).
- Mencoba berinteraksi dengan grafik (menggeser perawi, memperbesar grafik, mengarahkan kursor pada perawi untuk menyorot jalurnya).
- Menguji tombol reset zoom dan fungsionalitas pencarian.
