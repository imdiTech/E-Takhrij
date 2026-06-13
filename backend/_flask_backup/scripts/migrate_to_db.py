"""
Migrate data to database — adapted for Django.
Usage: python scripts/migrate_to_db.py
"""
import os
import sys

# Add project root to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

import django
django.setup()

from extensions.data import data_store
from api.models.hadith import Hadith
from api.models.user import User


def run_migration():
    # Load JSON data into memory
    print("Loading data from JSON...")
    data_store.load_data()

    # Get data
    hadiths = data_store.hadith_data

    print(f"Migrating {len(hadiths)} hadiths to database...")

    # Delete existing hadiths in DB
    Hadith.objects.all().delete()

    # Insert hadiths in batches
    hadith_objects = []
    for h in hadiths:
        hadith_obj = Hadith(
            id=h['id'],
            kitab=h['kitab'],
            nomor=h['nomor'],
            bab=h['bab'],
            arab=h['arab'],
            terjemahan=h['terjemahan'],
            english=h['english'],
        )
        hadith_obj.sanad = h['sanad']
        hadith_obj.sanad_edges = h['sanad_edges']
        hadith_objects.append(hadith_obj)

        # Commit in batches of 1000 to save memory
        if len(hadith_objects) >= 1000:
            Hadith.objects.bulk_create(hadith_objects)
            hadith_objects = []
            print(f"Inserted {h['id']} hadiths...")

    if hadith_objects:
        Hadith.objects.bulk_create(hadith_objects)

    print("Migration complete!")

    # Create an initial admin user
    if not User.objects.filter(username='admin').exists():
        print("Creating default admin user (admin / admin)...")
        admin = User(username='admin', is_admin=True)
        admin.set_password('admin')
        admin.save()

if __name__ == '__main__':
    run_migration()
