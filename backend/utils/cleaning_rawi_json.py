import json
import re
import os

# Tentukan path file input dan output
input_file = 'data/rawi.json'
output_file = 'data/rawi_cleaned.json'

# Fungsi Regex untuk memisahkan teks Latin dan Arab
def split_name_language(text):
    if not text:
        return text, ""
    
    # Pola untuk mendeteksi batas teks Latin dan dimulainya teks Arab
    # match = re.match(r'^([\w\s\(\)\-\.]+?)\s+(\(\s*[\u0600-\u06FF].*|[\u0600-\u06FF].*)$', str(text))
    match = re.match(r'^([\w\s\(\)\-\.\']+?)\s+(\(\s*[\u0600-\u06FF].*|[\u0600-\u06FF].*)$', str(text))
    
    if match:
        name_en = match.group(1).strip()
        name_ar = match.group(2).strip()
        return name_en, name_ar
    else:
        # Jika tidak ada teks Arab, kembalikan teks utuh ke name_en
        return text, ""

# 1. Membaca file JSON
try:
    print(f"Membaca data dari {input_file}...")
    with open(input_file, 'r', encoding='utf-8') as f:
        rawi_data = json.load(f)
        
    # 2. Memproses setiap item perawi di dalam JSON
    for item in rawi_data:
        if 'name' in item:
            original_name = item['name']
            name_en, name_ar = split_name_language(original_name)
            
            # Update dictionary: timpa 'name' dengan nama latin, tambahkan kunci 'name_ar'
            item['name'] = name_en
            item['name_ar'] = name_ar

    # 3. Menyimpan kembali ke file JSON yang baru
    print("Menyimpan data yang sudah dipisah...")
    # Pastikan direktori 'data' ada
    os.makedirs(os.path.dirname(output_file), exist_ok=True)
    
    with open(output_file, 'w', encoding='utf-8') as f:
        # ensure_ascii=False sangat penting agar huruf Arab tidak berubah menjadi kode unicode \uXXXX
        json.dump(rawi_data, f, ensure_ascii=False, indent=4)
        
    print(f"Berhasil! File JSON baru telah disimpan di: {output_file}")

    # Menampilkan contoh hasil pertama untuk konfirmasi
    # Menampilkan 10 contoh hasil pertama untuk konfirmasi
    print("\n--- 10 Contoh Hasil Data Teratas ---")

    # Menggunakan min() untuk mencegah error jika jumlah data ternyata kurang dari 10
    batas_tampil = min(10, len(rawi_data))

    for i in range(batas_tampil):
        print(f"Data ke-{i + 1}")
        print(f"  name    : {rawi_data[i]['name']}")
        print(f"  name_ar : {rawi_data[i].get('name_ar', '')}")
        print("-" * 30) # Garis pemisah antar data

except FileNotFoundError:
    print(f"Error: File {input_file} tidak ditemukan. Pastikan file JSON ada di folder yang benar.")
except Exception as e:
    print(f"Terjadi kesalahan yang tidak terduga: {e}")