from django.core.management.base import BaseCommand
from api.core.data import data_store
from api.models.hadith import Hadith
from api.models.user import User

class Command(BaseCommand):
    help = 'Migrates in-memory JSON hadith data to the SQLite database.'

    def handle(self, *args, **options):
        self.stdout.write("Loading data from JSON...")
        # Reloading data ensures we are getting fresh data from the JSON/SQLite files
        data_store.load_data()

        hadiths = data_store.hadith_data
        self.stdout.write(f"Migrating {len(hadiths)} hadiths to database...")

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

            if len(hadith_objects) >= 1000:
                Hadith.objects.bulk_create(hadith_objects)
                hadith_objects = []
                self.stdout.write(f"Inserted up to ID {h['id']}...")

        if hadith_objects:
            Hadith.objects.bulk_create(hadith_objects)

        self.stdout.write(self.style.SUCCESS("Migration complete!"))

        if not User.objects.filter(username='admin').exists():
            self.stdout.write("Creating default admin user (admin / admin)...")
            admin = User(username='admin', is_admin=True)
            admin.set_password('admin')
            admin.save()
