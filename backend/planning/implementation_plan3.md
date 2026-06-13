# Rencana Refactoring Struktur Proyek (Frontend & Backend)

Tujuan utama dari perubahan ini adalah memisahkan arsitektur proyek saat ini menjadi dua bagian utama:
1. **Frontend**: Menggunakan ReactJS.
2. **Backend**: Menggunakan kode Flask yang ada saat ini, dipindahkan ke dalam folder `backend` tanpa mengubah struktur internalnya.

## User Review Required
> [!WARNING]
> Saat ini aplikasi Flask sedang berjalan di terminal Anda (`flask run`). **Saya menyarankan Anda untuk mematikan server Flask tersebut terlebih dahulu (dengan menekan `CTRL+C`) sebelum kita mengeksekusi rencana ini**, untuk menghindari error file tidak ditemukan saat proses pemindahan.

> [!IMPORTANT]
> Karena kita akan memindahkan aplikasi dari sistem *server-side rendering* (Jinja templates) ke ReactJS (*client-side rendering*), Anda nantinya harus mengubah fungsi-fungsi *routing* di Flask (yang saat ini mengembalikan `render_template`) menjadi API yang mengembalikan JSON (REST API). Pada tahap ini, saya hanya akan memindahkan file-file dan menyiapkan kerangka ReactJS-nya saja. Migrasi dari template HTML ke React Components akan dilakukan secara bertahap setelahnya.

## Proposed Changes

### 1. Memindahkan Aplikasi Saat Ini ke `backend/`
Semua file dan folder yang berkaitan dengan aplikasi Flask akan dipindahkan ke dalam folder baru bernama `backend`.
- Folder yang dipindahkan: `data`, `extensions`, `forms`, `models`, `routes`, `scripts`, `services`, `static`, `templates`, `utils`, `planning`.
- File yang dipindahkan: `app.py`, `config.py`, `requirements.txt`, `seed_chroma.py`, dan semua file `test_*.py`.
- Folder seperti `.venv` dan `.vscode` akan dibiarkan di direktori utama, namun konfigurasi `.vscode` mungkin perlu sedikit penyesuaian path nantinya.

### 2. Inisialisasi Frontend ReactJS
Saya akan membuat folder `frontend` dan menginisialisasi kerangka aplikasi ReactJS menggunakan **Vite** (karena lebih cepat dan direkomendasikan untuk proyek modern).
- Menjalankan perintah `npx create-vite@latest frontend --template react` (atau `react-ts` jika Anda lebih suka TypeScript, tapi kita akan pakai JavaScript biasa untuk mempermudah).
- Menginstal dependensi dasar untuk React (Tailwind CSS, react-router-dom, dll) agar siap dipakai mendesain UI.

## Open Questions
- Apakah Anda ingin menginisialisasi project ReactJS menggunakan JavaScript biasa atau TypeScript? (Secara default saya akan menggunakan JavaScript).
- Apakah Anda ingin saya sekalian menginstal Tailwind CSS pada kerangka React yang baru?

## Verification Plan
1. Memastikan semua file backend sukses dipindahkan tanpa merusak struktur internalnya.
2. Memastikan aplikasi React berhasil dibuat di folder `frontend` dan bisa dijalankan via `npm run dev`.
