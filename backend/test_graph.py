from api.services.sanad_service import generate_sanad_graph

sanad = ['Abu Bakar bin Abu Syaibah', "Waki'", "Syu'bah", 'al Hakam', 'Abdurrahman bin Abu Laila', 'Samurah bin Jundab']
graph_url = generate_sanad_graph(sanad)
print("Graph generated successfully, length:", len(graph_url) if graph_url else 0)
