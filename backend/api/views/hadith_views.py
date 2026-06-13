"""
Hadith views — DRF implementation.
All business logic preserved.
"""
import math
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from api.services.hadith_service import get_hadith_by_id, search_hadith, get_chapters_by_kitab, find_syawahid_muttabi
from api.services.sanad_service import generate_sanad_graph
from api.services.takhrij_analyzer import analyze_cross_chain


@api_view(['GET'])
@permission_classes([AllowAny])
def index(request):
    return Response({"message": "Hadith API ready"})


@api_view(['GET'])
@permission_classes([AllowAny])
def search(request):
    query = request.GET.get('q', '').strip()
    kitab = request.GET.get('kitab', '').strip()
    bab = request.GET.get('bab', '').strip()
    search_type = request.GET.get('search_type', 'phrase').strip()
    
    try:
        page = int(request.GET.get('page', 1))
    except ValueError:
        page = 1
        
    try:
        limit = int(request.GET.get('limit', 10))
    except ValueError:
        limit = 10

    # Restrict limit to allowed choices: 10, 25, 50, 100
    if limit not in [10, 25, 50, 100]:
        limit = 10

    if page < 1:
        page = 1

    chapters = []
    hadiths = None
    total_results = 0
    total_pages = 1

    if kitab and kitab.lower() != 'all':
        chapters = get_chapters_by_kitab(kitab)

    if query or kitab or bab:
        # If kitab is selected but no bab yet, show chapters first
        if kitab and kitab.lower() != 'all' and not bab and not query:
            hadiths = None
        else:
            all_hadiths = search_hadith(query=query, kitab=kitab, bab=bab, search_type=search_type)
            total_results = len(all_hadiths)

            # Slicing for pagination
            total_pages = math.ceil(total_results / limit) if total_results > 0 else 1
            if page > total_pages:
                page = total_pages

            start_idx = (page - 1) * limit
            end_idx = start_idx + limit
            hadiths = all_hadiths[start_idx:end_idx]
    else:
        hadiths = None

    return Response({
        "hadiths": hadiths,
        "query": query,
        "kitab": kitab,
        "bab": bab,
        "search_type": search_type,
        "chapters": chapters,
        "page": page,
        "limit": limit,
        "total_results": total_results,
        "total_pages": total_pages
    })


@api_view(['GET'])
@permission_classes([AllowAny])
def rawi_info(request):
    import re
    name = request.GET.get('name', '').strip()
    if not name:
        return Response({"success": False, "message": "Nama perawi wajib diisi."}, status=400)

    from api.core.data import get_rawi_df
    df = get_rawi_df()
    if df is None or df.empty:
        return Response({"success": False, "message": "Data perawi tidak tersedia."}, status=404)

    # 1. Coba exact match
    match = df[df['name'] == name]
    if not match.empty:
        # fillna to prevent NaN which DRF Response can't serialize
        return Response({"success": True, "rawi": match.iloc[0].fillna("").to_dict()})

    # 2. Coba substring match (case insensitive)
    escaped_name = re.escape(name)
    match = df[df['name'].str.contains(escaped_name, case=False, na=False)]
    if not match.empty:
        return Response({"success": True, "rawi": match.iloc[0].fillna("").to_dict()})

    # 3. Coba matching menggunakan cleaned name
    def local_clean(n):
        if not n: return ""
        n_clean = re.sub(r'\(.*?\)', '', n)
        n_clean = n_clean.replace('ibn', 'bin').replace('Ibn', 'bin').replace('\'', '').replace('\u2019', '')
        n_clean = re.sub(r'[^a-zA-Z\s]', '', n_clean)
        return ' '.join(n_clean.lower().split())

    q_clean = local_clean(name)
    if q_clean:
        for _, row in df.iterrows():
            row_name = row.get('name', '')
            if q_clean in local_clean(row_name) or local_clean(row_name) in q_clean:
                return Response({"success": True, "rawi": row.fillna("").to_dict()})

    return Response({"success": False, "message": "Profil perawi tidak ditemukan."}, status=404)


@api_view(['GET'])
@permission_classes([AllowAny])
def detail(request, hadith_id):
    hadith = get_hadith_by_id(hadith_id)
    if not hadith:
        return Response({"error": "Hadith not found"}, status=404)

    kitab = hadith.get('kitab', '')
    bab = hadith.get('bab', '')
    chapters = get_chapters_by_kitab(kitab) if kitab else []

    sanad_graph = generate_sanad_graph(hadith.get('sanad', []), hadith.get('sanad_edges', []))
    syawahid, muttabi = find_syawahid_muttabi(hadith_id)

    return Response({
        "hadith": hadith,
        "sanad_graph": sanad_graph,
        "kitab": kitab,
        "bab": bab,
        "chapters": chapters,
        "syawahid": syawahid,
        "muttabi": muttabi
    })


@api_view(['GET'])
@permission_classes([AllowAny])
def cross_chain_analysis(request, hadith_id):
    if not hadith_id:
        return Response({"success": False, "message": "Parameter hadith_id wajib diisi."}, status=400)

    report = analyze_cross_chain(hadith_id)

    if "error" in report:
        return Response({"success": False, "message": report["error"]}, status=404)

    return Response({"success": True, "data": report})


@api_view(['GET'])
@permission_classes([AllowAny])
def get_chapters(request, kitab_name):
    chapters = get_chapters_by_kitab(kitab_name)
    return Response({"chapters": chapters})
