"""
Sanad Service — migrated from Flask to Django.
Removed flask import, all graph/networkx logic preserved.
"""
import networkx as nx
from api.core.data import data_store
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import io
import base64
import json
# Mengimpor modul pengelola memori dan rawi service yang sudah ada
from api.core.data import get_hadith_df, get_rawi_df
from api.services.rawi_service import get_rawi_by_indices

def parse_sanad(hadith_id):
    """
    Membongkar rantai perawi (Sanad) dari satu hadis target.
    Mengambil urutan perawi (chain_indx) lalu memetakan profil lengkapnya.
    """
    hadith_df = get_hadith_df()
    if hadith_df is None or hadith_df.empty:
        return []

    # Filter data hadis berdasarkan ID
    hadith_data = hadith_df[hadith_df["id"] == int(hadith_id)]
    if hadith_data.empty:
        return []

    # Mengambil string urutan indeks sanad (asumsi kolom bernama 'chain_indx')
    chain_str = str(hadith_data.iloc[0].get("chain_indx", ""))
    if not chain_str or chain_str == "nan":
        return []

    # Mengubah string '1, 2, 3' menjadi list integer [1, 2, 3]
    try:
        rawi_indices = [int(idx.strip()) for idx in chain_str.split(",") if idx.strip().isdigit()]
    except Exception:
        return []

    # Memuat profil lengkap dari masing-masing perawi menggunakan service yang ada
    rawi_profiles = get_rawi_by_indices(rawi_indices)

    # Memastikan urutan list hasil sesuai dengan urutan silsilah pada sanad asli
    profile_map = {rawi.get("scholar_indx"): rawi for rawi in rawi_profiles}

    # Menyusun rantai terurut
    sanad_chain = []
    for idx in rawi_indices:
        if idx in profile_map:
            sanad_chain.append(profile_map[idx])

    return sanad_chain

def get_related_rawi(scholar_indx):
    """
    Mendapatkan data satu rawi spesifik beserta relasi mentahnya.
    """
    rawi_df = get_rawi_df()
    if rawi_df is None or rawi_df.empty:
        return None

    rawi_data = rawi_df[rawi_df["scholar_indx"] == int(scholar_indx)]
    if rawi_data.empty:
        return None

    return rawi_data.iloc[0].to_dict()

def build_sanad_graph(rawi_list):
    """
    Mengubah data silsilah perawi menjadi bentuk graf (jaringan) untuk visualisasi SNA.
    Menyuntikkan (Inject) daftar nama guru (teachers) dan murid (students).
    Hasil akhir diubah menjadi format JSON (json.dumps) agar bisa digambar di web.
    """
    if not rawi_list:
        return json.dumps({"nodes": [], "edges": []})

    nodes = []
    edges = []
    seen_nodes = set()

    # 1. Membangun Nodes (Titik Perawi)
    for rawi in rawi_list:
        scholar_id = rawi.get("scholar_indx")
        if scholar_id not in seen_nodes:
            # Memisahkan nama jika diperlukan, atau mengambil default name
            rawi_name = rawi.get("name_ar") if rawi.get("name_ar") else rawi.get("name", "Anonim")

            nodes.append({
                "id": scholar_id,
                "label": str(rawi_name),
                "grade": rawi.get("grade", "Tidak diketahui"),
                "death_place": rawi.get("death_place", "Tidak diketahui")
            })
            seen_nodes.add(scholar_id)

    # 2. Menyusun Relasi Transmisi / Edges (Guru ke Murid)
    for i in range(len(rawi_list) - 1):
        student = rawi_list[i]
        teacher = rawi_list[i + 1]

        edges.append({
            "from": teacher.get("scholar_indx"), # Alur transmisi dari Guru
            "to": student.get("scholar_indx"),   # Menuju ke Murid
            "type": "meriwayatkan"
        })

    # Membungkus dan mengembalikan string JSON graf sanad
    return json.dumps({"nodes": nodes, "edges": edges}, ensure_ascii=False)

def get_rawi_info(nama):
    """Find narrator info from the dataframe."""
    if data_store.rawis_df is None:
        return None

    matches = data_store.rawis_df[data_store.rawis_df['name'] == nama]
    if not matches.empty:
        return matches.iloc[0].to_dict()
    return None

def generate_sanad_graph(sanad_nodes, sanad_edges=None):
    """Generate a base64 encoded image of the sanad graph."""
    if not sanad_nodes:
        return None

    G = nx.DiGraph()

    if sanad_edges and len(sanad_edges) > 0:
        for edge in sanad_edges:
            G.add_edge(edge[0], edge[1])
    else:
        # Fallback to sequential
        for i in range(len(sanad_nodes) - 1):
            G.add_edge(sanad_nodes[i], sanad_nodes[i+1])

    plt.figure(figsize=(10, 6))
    pos = nx.spring_layout(G)
    nx.draw(G, pos, with_labels=True, node_color='lightblue', edge_color='gray', node_size=2000, font_size=10, font_weight='bold')

    img = io.BytesIO()
    plt.savefig(img, format='png', bbox_inches='tight')
    img.seek(0)
    graph_url = base64.b64encode(img.getvalue()).decode()
    plt.close()

    return graph_url
