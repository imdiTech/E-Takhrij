from app import create_app
from api.services.hadith_service import search_hadith

app = create_app()

with app.app_context():
    print("\n--- Test 1: Single Word (Exact) ---")
    res1 = search_hadith("sholat", search_type="single")
    print(f"Found {len(res1)} hadiths with exact word 'sholat'")

    print("\n--- Test 2: Phrase (Consecutive) ---")
    res2 = search_hadith("sholat subuh", search_type="phrase")
    print(f"Found {len(res2)} hadiths with exact phrase 'sholat subuh'")

    print("\n--- Test 3: Random (All words present) ---")
    res3 = search_hadith("sholat subuh", search_type="random")
    print(f"Found {len(res3)} hadiths with both 'sholat' and 'subuh' anywhere")

    print("\n--- Test 4: Kitab Filter ---")
    res4 = search_hadith("sholat", kitab="Sahih al Bukhari", search_type="phrase")
    print(f"Found {len(res4)} hadiths with 'sholat' in Sahih al Bukhari")

    print("\n--- Test 5: All Kitab Filter ---")
    res5 = search_hadith("sholat", kitab="all", search_type="phrase")
    print(f"Found {len(res5)} hadiths with 'sholat' across ALL books (should match phrase results)")

    print("\n--- Test 6: Flexible Arabic Long Sentence ---")
    query_ar = "إِنَّ الْمَرْأَةَ كَالضِّلَعِ إِذَا ذَهَبْتَ تُقِيمُهَا كَسَرْتَهَا وَإِنْ تَرَكْتَهَا اسْتَمْتَعْتَ بِهَا وَفِيهَا عِوَجٌ"
    res6 = search_hadith(query_ar, search_type="phrase")
    print(f"Found {len(res6)} hadiths matching long Arabic sentence")
    for i, h in enumerate(res6[:3]):
        print(f"  {i+1}. {h.get('kitab')} No. {h.get('nomor')} - Score: {h.get('match_score', 1.0):.2f}")
        print(f"     Arab: {h.get('arab')[:100]}...")


