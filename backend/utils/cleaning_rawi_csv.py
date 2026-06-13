import pandas as pd
import re
from io import StringIO
from config import Config

# Simulasi data CSV yang Anda berikan
csv_data = Config.RAWIS_JSON_PATH

# Membaca data CSV menggunakan Pandas
df = pd.read_csv(StringIO(csv_data))

# Fungsi Regex untuk memisahkan teks Latin dan Arab
def split_name_language(text):
    if pd.isna(text):
        return pd.Series(["", ""])
    
    # Mencari pola di mana teks Latin berakhir dan teks Arab (atau kurung pembuka Arab) dimulai
    # \u0600-\u06FF adalah blok Unicode untuk karakter Arab
    match = re.match(r'^([\w\s\(\)\-\.]+?)\s+(\(\s*[\u0600-\u06FF].*|[\u0600-\u06FF].*)$', str(text))
    
    if match:
        name_en = match.group(1).strip()
        name_ar = match.group(2).strip()
        return pd.Series([name_en, name_ar])
    else:
        # Jika tidak ada teks Arab yang terdeteksi, masukkan semua ke name_en
        return pd.Series([text, ""])

# Mengaplikasikan fungsi ke kolom 'name' dan membuat dua kolom baru
df[['name_en', 'name_ar']] = df['name'].apply(split_name_language)

# (Opsional) Menghapus kolom 'name' yang lama jika sudah tidak dibutuhkan
# df = df.drop(columns=['name'])

# Menampilkan hasil
print("Hasil Pemisahan:")
print("name_en :", df['name_en'].iloc[0])
print("name_ar :", df['name_ar'].iloc[0])

# Menyimpan kembali ke CSV baru
# df.to_csv("data_rawis_cleaned.csv", index=False)