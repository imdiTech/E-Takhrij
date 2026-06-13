from transformers import pipeline

try:
    print("Loading NER pipeline...")
    ner_pipeline = pipeline("ner", model="CAMeL-Lab/bert-base-arabic-camelbert-mix-ner", grouped_entities=True)
    text = "حَدَّثَنَا أَبُو بَكْرِ بْنُ أَبِي شَيْبَةَ ، حَدَّثَنَا وَكِيعٌ ، عَنْ شُعْبَةَ ، عَنِ الْحَكَمِ"
    results = ner_pipeline(text)
    print("Results:", results)
except Exception as e:
    print("Error:", e)
