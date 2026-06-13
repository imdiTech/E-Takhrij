import re

def extract_sanad_graph(text):
    pattern = r'\[(.*?)\]'
    matches = list(re.finditer(pattern, text))
    
    if not matches:
        return [], []
        
    edges = []
    nodes = []
    
    # "telah menceritakan" is sequential. We shouldn't break on it unless preceded by "dan"
    # Actually, let's just use exact break words that indicate a new chain.
    break_keywords = [
        "riwayat lain",
        "dan menceritakan",
        "dan telah menceritakan",
        "dan juga",
        "ia berkata",
        "keduanya berkata",
        "beliau bersabda"
    ]
    
    current_group = [] # Narrators at the current "level"
    prev_group = []    # Narrators at the previous "level"
    
    for i, match in enumerate(matches):
        name = match.group(1)
        if name not in nodes:
            nodes.append(name)
            
        if i == 0:
            current_group = [name]
            continue
            
        prev_end = matches[i-1].end()
        curr_start = match.start()
        between_text = text[prev_end:curr_start].lower().strip()
        
        is_break = any(kw in between_text for kw in break_keywords)
        
        # We also need to be careful with "dan", it means parallel
        is_parallel = False
        words = between_text.split()
        if "dan" in words or "serta" in words:
            # If "dari" is not there, and it's not a break, it's parallel
            if "dari" not in between_text and not is_break:
                is_parallel = True
                
        if is_break:
            prev_group = []
            current_group = [name]
        elif is_parallel:
            current_group.append(name)
            for p in prev_group:
                edges.append((p, name))
        else:
            prev_group = current_group
            current_group = [name]
            for p in prev_group:
                edges.append((p, name))
                
    # Remove duplicate edges
    edges = list(set(edges))
    return nodes, edges

text = "Telah menceritakan kepada kami [Abu Bakar bin Abu Syaibah] telah menceritakan kepada kami [Waki'] dari [Syu'bah] dari [al Hakam] dari [Abdurrahman bin Abu Laila] dari [Samurah bin Jundab]. (dalam riwayat lain disebutkan) dan juga telah menceritakan kepada kami [Abu Bakar bin Abu Syaibah] telah menceritakan kepada kami [Waki'] dari [Syu'bah] dan [Sufyan] dari [Habib] dari [Maimun bin Abu Syabib] dari [al-Mughirah bin Syu'bah] keduanya berkata"

nodes, edges = extract_sanad_graph(text)
print("Nodes:", nodes)
print("Edges:", edges)
