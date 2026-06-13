# Rencana Pembuatan UI Frontend (ReactJS)

Anda meminta untuk membuat UI yang sama persis dengan yang ada di folder `/backend/templates` ke dalam aplikasi ReactJS di folder `/frontend`.
Ini adalah tugas yang lumayan besar karena kita akan mengonversi template HTML statis (Jinja) menjadi komponen React yang dinamis.

## User Review Required
> [!WARNING]
> Aplikasi Flask Anda saat ini mengirimkan data langsung ke HTML (contoh: `hadiths`, `kitab`, `chapters`). Karena kita menggunakan React, React membutuhkan **REST API** (endpoint JSON) dari backend untuk mendapatkan data tersebut.
> Untuk tahap ini, **saya akan membuat rancangan UI statis terlebih dahulu (dengan data contoh/dummy)** agar tampilannya sama persis. Integrasi API (menghubungkan React dengan Flask) harus dilakukan sebagai langkah berikutnya.

## Proposed Changes

### 1. Konfigurasi Dasar React
- Menyiapkan **Tailwind CSS v4** dengan Vite.
- Menginstal dan mengonfigurasi **React Router** untuk navigasi halaman.
- Menambahkan aset global seperti font (Outfit, Amiri) dan icon (FontAwesome) di file utama.
- Menyalin gaya CSS kustom dari `base.html` (seperti `.glass-panel`, modifikasi *dark mode*, dll) ke `frontend/src/index.css`.

### 2. Komponen Dasar (Layouts)
- **`Layout.jsx`**: Komponen utama yang berisi *Navbar* dan *Footer*, meniru `base.html`.
- **`Sidebar.jsx`**: Komponen untuk menu samping (Kategori Kitab, Bab, Statistik, promo ILHA) meniru `sidebar.html`.

### 3. Halaman Utama (Pages)
- **`SearchPage.jsx`**: Meniru `hadith/index.html`. Akan memuat *Hero section*, form pencarian, *dropdown filter*, daftar hasil hadis, *pagination*, dan *loading modal*.
- **`DetailPage.jsx`**: Meniru `hadith/detail.html`. Menampilkan sanad, matan, dan tombol "Smart Analyze" dengan UI yang baru diperbarui.
- **`ChatPage.jsx`**: Meniru antarmuka Tanya ILHA (`ai_chat/index.html`).

## Open Questions
- Apakah Anda setuju dengan pendekatan membuat antarmuka secara statis (dummy data) terlebih dahulu untuk memastikan tampilannya sama persis, sebelum kita merombak backend Flask untuk menyediakan API JSON?
- Terdapat beberapa library eksternal yang dipakai di UI lama (Lottie player, FontAwesome). Saya akan memasangnya via CDN atau package NPM. Apakah ada preferensi? (Default: NPM jika ada, atau CDN).

## Verification Plan
1. Jalankan `npm run dev` di folder `frontend`.
2. Buka browser dan lihat apakah tampilan beranda (Search), halaman detail, dan halaman chat sudah sama persis dengan aplikasi lama. Fitur *Dark Mode* harus berfungsi dengan baik.
