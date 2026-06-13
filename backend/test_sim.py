import json
import re

def extract_matan(terjemahan):
    idx = terjemahan.rfind(']')
    if idx != -1:
        return terjemahan[idx+1:].strip()
    return terjemahan

def compute_similarity(m1, m2):
    w1 = set(re.findall(r'\w+', m1.lower()))
    w2 = set(re.findall(r'\w+', m2.lower()))
    if not w1 or not w2: return 0
    return len(w1.intersection(w2)) / len(w1.union(w2))

# load some hadiths
data = json.load(open('data/hadiths/ind/ind-bukhari.json'))['hadiths']
h1 = data[0]
m1 = extract_matan(h1['text'])
print("H1 Matan:", m1[:100])

for i in range(1, 100):
    m2 = extract_matan(data[i]['text'])
    sim = compute_similarity(m1, m2)
    if sim > 0.1:
        print(f"H{i} sim {sim:.2f}")
