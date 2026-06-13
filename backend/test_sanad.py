from app import create_app
from api.core.data import data_store
import sys

app = create_app()
# The data is loaded inside create_app
hadith = None
for h in data_store.hadith_data:
    if h['sanad']:
        hadith = h
        break

if hadith:
    print(f"Hadith ID: {hadith['id']}")
    print(f"Indonesian: {hadith['terjemahan']}")
    print(f"Sanad: {hadith['sanad']}")
else:
    print("No hadith found with sanad")
