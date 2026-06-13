import re
import networkx as nx

def extract_edges_from_text(text):
    # Find all brackets and their positions
    pattern = r'\[(.*?)\]'
    matches = list(re.finditer(pattern, text))
    
    if not matches:
        return []
        
    edges = []
    
    # We will iterate through the matches and look at the text between them
    # Default is sequential connection: match[i-1] -> match[i]
    # But if the text between them contains branch-breaking words, we don't connect them.
    # What are branch-breaking words?
    # "(dalam riwayat lain disebutkan)", "dan juga telah menceritakan", "dan telah menceritakan"
    
    break_keywords = [
        "riwayat lain",
        "dan menceritakan",
        "dan telah menceritakan",
        "dan juga telah menceritakan",
        "ia berkata",
        "keduanya berkata"
    ]
    
    # Parallel keyword: "dan" or "serta" right between two names without much other text.
    # E.g. "[A] dan [B] dari [C]" -> Both A and B connect to C!
    # That means we need a way to group parallel narrators.
    
    # State machine approach:
    # We maintain a list of `current_sources` and `current_targets`.
    # Wait, simpler heuristic:
    # Just split the text into chunks using break_keywords.
    
    import re
    # Replace break keywords with a special token
    modified_text = text.lower()
    for kw in break_keywords:
        modified_text = modified_text.replace(kw, "|||")
        
    # Split text into independent chains
    # Actually, the original text string matching is better.
    
    edges = []
    current_chain = []
    
    for i in range(len(matches)):
        name = matches[i].group(1)
        
        if i == 0:
            current_chain.append(name)
            continue
            
        # Get text between previous match and this match
        prev_end = matches[i-1].end()
        curr_start = matches[i].start()
        between_text = text[prev_end:curr_start].lower().strip()
        
        # Check if it breaks the chain
        is_break = any(kw in between_text for kw in break_keywords)
        
        # Check if it's a parallel AND ("dan", "serta") with no "dari" or "menceritakan"
        is_parallel = "dan" in between_text.split() and "dari" not in between_text and "menceritakan" not in between_text
        
        if is_break:
            # We don't link this to the previous one
            current_chain = [name]
        elif is_parallel:
            # It's parallel to the previous one. We can add it as a parallel node.
            # But wait, parallel means they both connect to the same parent/child.
            # E.g., A dan B dari C. 
            # If we see A, current_chain = [A].
            # Then we see B (is_parallel). We shouldn't link A to B.
            # Instead, we should mark B as parallel to A.
            pass
            
            # For simplicity, if we just want a graph, we can link them if it's NOT a break.
            # If it's parallel, linking A to B is technically wrong (A didn't hear from B).
            # So if is_parallel, we skip linking A to B. But when C comes, both A and B should link to C!
        else:
            # Sequential connection
            pass
            
    # Let's try the simplest version that handles the worst issue: cross-linking different chains.
    return edges

text = "Telah menceritakan kepada kami [Abu Bakar bin Abu Syaibah] telah menceritakan kepada kami [Waki'] dari [Syu'bah] dari [al Hakam] dari [Abdurrahman bin Abu Laila] dari [Samurah bin Jundab]. (dalam riwayat lain disebutkan) dan juga telah menceritakan kepada kami [Abu Bakar bin Abu Syaibah] telah menceritakan kepada kami [Waki'] dari [Syu'bah] dan [Sufyan] dari [Habib] dari [Maimun bin Abu Syabib] dari [al-Mughirah bin Syu'bah] keduanya berkata"

# Let's write a better parser.
