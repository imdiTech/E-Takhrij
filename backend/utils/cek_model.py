import os
import google.generativeai as genai
from dotenv import load_dotenv

# Muat API Key dari file .env di folder backend
backend_env = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), '.env')
if os.path.exists(backend_env):
    load_dotenv(backend_env)
else:
    load_dotenv()
api_key = os.environ.get("GOOGLE_API_KEY")

if not api_key:
    print("API Key tidak ditemukan di .env!")
else:
    print(f"Mengecek model untuk API Key: {api_key[:10]}...\n")
    genai.configure(api_key=api_key)
    
    print("Daftar Model yang bisa digunakan untuk Chat/Teks:")
    for m in genai.list_models():
        if 'generateContent' in m.supported_generation_methods:
            print(f"- {m.name.replace('models/', '')}")