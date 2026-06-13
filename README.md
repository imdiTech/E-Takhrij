# Panduan Deployment Smart Takhrij (Ubuntu 24.04 + Apache)

Panduan ini berisi langkah-langkah detail (step-by-step) untuk meng-host aplikasi Smart Takhrij di VPS Ubuntu 24.04 menggunakan Apache, Gunicorn, Django, dan React.

> [!NOTE]
> Semua perintah di bawah ini dijalankan di terminal VPS Anda. Pastikan Anda sudah login ke VPS menggunakan SSH dan memiliki hak akses `sudo`.

---

## 1. Persiapan Server & Instalasi Dependensi

Pertama, perbarui sistem operasi dan instal semua paket yang dibutuhkan, termasuk Apache, Node.js (untuk build frontend), dan Python.

```bash
# Update sistem
sudo apt update && sudo apt upgrade -y

# Instal dependensi utama
sudo apt install -y apache2 python3 python3-venv python3-pip npm git

# Aktifkan modul Apache yang diperlukan untuk reverse proxy & rewrite
sudo a2enmod proxy proxy_http rewrite headers
sudo systemctl restart apache2
```

---

## 2. Pindahkan/Clone Source Code Aplikasi

Buat direktori untuk aplikasi Anda dan berikan izin yang sesuai agar Anda bisa mengeditnya tanpa harus selalu menggunakan `sudo`.

```bash
# Buat folder aplikasi
sudo mkdir -p /var/www/smart-takhrij

# Ubah kepemilikan folder ke user Anda (misalnya user 'ubuntu' atau 'root')
sudo chown -R $USER:$USER /var/www/smart-takhrij

# Masuk ke folder tersebut
cd /var/www/smart-takhrij
```

> [!TIP]
> Jika Anda menggunakan Git, Anda bisa clone repository Anda di sini:
> `git clone <URL_REPO_ANDA> .`
>
> Jika tidak menggunakan Git, silakan upload (menggunakan SFTP/FileZilla/rsync) seluruh folder `frontend` dan `backend` ke dalam direktori `/var/www/smart-takhrij`.

---

## 3. Konfigurasi Backend (Django + Gunicorn)

Kita akan membuat Virtual Environment untuk Python dan menginstal semua dependensi backend.

```bash
# Masuk ke folder backend
cd /var/www/smart-takhrij/backend

# Buat virtual environment
python3 -m venv .venv

# Aktifkan virtual environment
source .venv/bin/activate

# Instal dependensi proyek dan Gunicorn (sebagai application server)
pip install -r requirements.txt gunicorn
```

### Konfigurasi `.env`
Anda perlu membuat file `.env` di dalam folder backend.
```bash
nano .env
```
Isi file tersebut dengan variabel environment Anda, misalnya:
```ini
SECRET_KEY=kunci-rahasia-django-anda
DEBUG=False
ALLOWED_HOSTS=*
# Tambahkan API keys lainnya seperti GOOGLE_API_KEY, dll
```
*(Tekan `Ctrl+O`, `Enter` untuk menyimpan, lalu `Ctrl+X` untuk keluar dari nano).*

### Migrasi Database & Static Files
Masih di dalam virtual environment, jalankan:
```bash
# Migrasi database (SQLite)
python manage.py migrate

# Kumpulkan semua static files Django (untuk admin panel dll)
python manage.py collectstatic --noinput

# Keluar dari virtual environment
deactivate
```

---

## 4. Membuat Service Systemd untuk Gunicorn

Agar backend Django tetap berjalan di latar belakang (dan otomatis menyala ulang jika server restart), kita buatkan service `systemd`.

```bash
sudo nano /etc/systemd/system/smart-takhrij.service
```

Paste konfigurasi berikut ke dalamnya:

```ini
[Unit]
Description=Gunicorn daemon for Smart Takhrij
After=network.target

[Service]
User=www-data
Group=www-data
WorkingDirectory=/var/www/smart-takhrij/backend
Environment="PATH=/var/www/smart-takhrij/backend/.venv/bin"
# Jalankan gunicorn di port 8000
ExecStart=/var/www/smart-takhrij/backend/.venv/bin/gunicorn --access-logfile - --workers 3 --bind 127.0.0.1:8000 config.wsgi:application

[Install]
WantedBy=multi-user.target
```

Simpan dan keluar (`Ctrl+O`, `Enter`, `Ctrl+X`), lalu jalankan service tersebut:

```bash
sudo systemctl daemon-reload
sudo systemctl start smart-takhrij
sudo systemctl enable smart-takhrij
```

> [!TIP]
> Cek status backend Anda dengan: `sudo systemctl status smart-takhrij`
> Pastikan statusnya **active (running)**.

---

## 5. Konfigurasi Frontend (React / Vite)

Sekarang kita akan melakukan *build* aplikasi React menjadi file statis HTML/JS/CSS yang siap disajikan oleh Apache.

```bash
# Masuk ke folder frontend
cd /var/www/smart-takhrij/frontend

# Instal dependensi Node.js
npm install

# Build untuk production
npm run build
```

Setelah selesai, folder `dist` akan terbuat di `/var/www/smart-takhrij/frontend/dist`.

---

## 6. Konfigurasi VirtualHost Apache

Langkah terakhir adalah mengonfigurasi Apache agar menyajikan frontend React, dan meneruskan (proxy) permintaan API ke Gunicorn.

```bash
sudo nano /etc/apache2/sites-available/smart-takhrij.conf
```

Paste konfigurasi berikut:

```apache
<VirtualHost *:80>
    # Jika punya domain, hapus tanda # di bawah dan ganti nama domainnya
    # ServerName domainanda.com

    DocumentRoot /var/www/smart-takhrij/frontend/dist

    # Izinkan akses ke folder frontend
    <Directory /var/www/smart-takhrij/frontend/dist>
        Options -Indexes +FollowSymLinks
        AllowOverride All
        Require all granted
        
        # Konfigurasi fallback untuk React Router (SPA)
        RewriteEngine On
        RewriteBase /
        RewriteRule ^index\.html$ - [L]
        RewriteCond %{REQUEST_FILENAME} !-f
        RewriteCond %{REQUEST_FILENAME} !-d
        RewriteRule . /index.html [L]
    </Directory>

    # Menyajikan folder statis Django (Admin Panel, dll)
    Alias /static /var/www/smart-takhrij/backend/staticfiles
    <Directory /var/www/smart-takhrij/backend/staticfiles>
        Require all granted
    </Directory>

    # Menyajikan folder media (Jika ada)
    Alias /media /var/www/smart-takhrij/backend/media
    <Directory /var/www/smart-takhrij/backend/media>
        Require all granted
    </Directory>

    # Proxy permintaan API dan Admin ke Gunicorn (Backend)
    ProxyPreserveHost On
    ProxyPass /api http://127.0.0.1:8000/api
    ProxyPassReverse /api http://127.0.0.1:8000/api

    ProxyPass /admin http://127.0.0.1:8000/admin
    ProxyPassReverse /admin http://127.0.0.1:8000/admin

    # Logging
    ErrorLog ${APACHE_LOG_DIR}/smart_takhrij_error.log
    CustomLog ${APACHE_LOG_DIR}/smart_takhrij_access.log combined
</VirtualHost>
```

Simpan dan keluar, lalu aktifkan site tersebut:

```bash
# Nonaktifkan default site (opsional, jika Anda hanya host aplikasi ini)
sudo a2dissite 000-default.conf

# Aktifkan konfigurasi yang baru dibuat
sudo a2ensite smart-takhrij.conf

# Periksa apakah ada error sintaks di Apache
sudo apache2ctl configtest

# Restart Apache
sudo systemctl restart apache2
```

---

## Selesai! 🎉

Aplikasi Anda sekarang sudah online! 
Anda dapat mengaksesnya melalui **IP Address VPS** Anda di browser (contoh: `http://192.168.1.100`).

> [!IMPORTANT]
> **Izin SQLite**: Karena Django menggunakan SQLite (`data/app.db`), pastikan user `www-data` (yang menjalankan gunicorn) memiliki izin untuk menulis ke folder `data` dan file `app.db`.
> Jalankan perintah ini:
> ```bash
> sudo chown -R www-data:www-data /var/www/smart-takhrij/backend/data
> sudo chmod -R 775 /var/www/smart-takhrij/backend/data
> ```
