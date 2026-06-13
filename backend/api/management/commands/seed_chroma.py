import time
from django.core.management.base import BaseCommand
from api.core.data import data_store
from api.core.ai_core import ai_core
from api.services.hadith_service import extract_matan

class Command(BaseCommand):
    help = 'Seeds ChromaDB with hadith embeddings.'

    def handle(self, *args, **options):
        if not ai_core.vector_store:
            self.stdout.write(self.style.ERROR("Vector store not initialized. Cek konfigurasi GOOGLE_API_KEY Anda."))
            return

        self.stdout.write(self.style.NOTICE(f"Memuat {len(data_store.hadith_data)} hadis. Menyiapkan data untuk embedding..."))

        texts = []
        metadatas = []
        ids = []

        for h in data_store.hadith_data:
            matan = extract_matan(h.get('terjemahan', ''))
            # Filter jika matan terlalu pendek atau kosong
            if len(matan) > 10:
                texts.append(matan)
                metadatas.append({
                    "hadith_id": str(h.get("id")),
                    "kitab": h.get("kitab"),
                    "nomor": str(h.get("nomor"))
                })
                ids.append(f"hadith_{h.get('id')}")

        total_texts = len(texts)
        self.stdout.write(self.style.NOTICE(f"Siap untuk memproses embedding pada {total_texts} teks matan."))

        # Tambahkan teks dalam batch untuk menghindari Rate Limit API Google
        batch_size = 50
        for i in range(0, total_texts, batch_size):
            end_idx = min(i + batch_size, total_texts)
            batch_texts = texts[i:end_idx]
            batch_metadatas = metadatas[i:end_idx]
            batch_ids = ids[i:end_idx]

            self.stdout.write(f"Memproses batch hadis {i+1} sampai {end_idx}...")
            try:
                ai_core.vector_store.add_texts(
                    texts=batch_texts,
                    metadatas=batch_metadatas,
                    ids=batch_ids
                )
                time.sleep(2)
            except Exception as e:
                self.stdout.write(self.style.ERROR(f"Error saat embedding batch {i+1}-{end_idx}: {e}"))
                self.stdout.write(self.style.WARNING("Mencoba melanjutkan ke batch berikutnya..."))
                time.sleep(5)

        self.stdout.write(self.style.SUCCESS("\nSelesai! Data hadis berhasil dimasukkan ke dalam ChromaDB."))
