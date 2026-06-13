from flask import Blueprint, render_template, request, jsonify
from services.hadith_service import get_all_hadiths, get_hadith_by_id, search_hadith, get_chapters_by_kitab, find_syawahid_muttabi
from services.sanad_service import generate_sanad_graph
from services.takhrij_analyzer import analyze_cross_chain

hadith_bp = Blueprint('hadith', __name__)

@hadith_bp.route('/')
def index():
    return jsonify({"message": "Hadith API ready"})

@hadith_bp.route('/search')
def search():
    query = request.args.get('q', '').strip()
    kitab = request.args.get('kitab', '').strip()
    bab = request.args.get('bab', '').strip()
    search_type = request.args.get('search_type', 'phrase').strip()
    page = request.args.get('page', 1, type=int)
    limit = request.args.get('limit', 10, type=int)
    
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
            import math
            total_pages = math.ceil(total_results / limit) if total_results > 0 else 1
            if page > total_pages:
                page = total_pages
                
            start_idx = (page - 1) * limit
            end_idx = start_idx + limit
            hadiths = all_hadiths[start_idx:end_idx]
    else:
        hadiths = None
        
    return jsonify({
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

@hadith_bp.route('/rawi/info')
def rawi_info():
    name = request.args.get('name', '').strip()
    if not name:
        return jsonify({"success": False, "message": "Nama perawi wajib diisi."}), 400
        
    from extensions.data import get_rawi_df
    import re
    df = get_rawi_df()
    if df is None or df.empty:
        return jsonify({"success": False, "message": "Data perawi tidak tersedia."}), 404
        
    # 1. Coba exact match
    match = df[df['name'] == name]
    if not match.empty:
        return jsonify({"success": True, "rawi": match.iloc[0].to_dict()})
        
    # 2. Coba substring match (case insensitive)
    # Escape regex special chars in the name to avoid errors
    escaped_name = re.escape(name)
    match = df[df['name'].str.contains(escaped_name, case=False, na=False)]
    if not match.empty:
        return jsonify({"success": True, "rawi": match.iloc[0].to_dict()})
        
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
                return jsonify({"success": True, "rawi": row.to_dict()})
                
    return jsonify({"success": False, "message": "Profil perawi tidak ditemukan."}), 404


@hadith_bp.route('/<int:hadith_id>')
def detail(hadith_id):
    hadith = get_hadith_by_id(hadith_id)
    if not hadith:
        return "Hadith not found", 404
        
    kitab = hadith.get('kitab', '')
    bab = hadith.get('bab', '')
    chapters = get_chapters_by_kitab(kitab) if kitab else []
    
    sanad_graph = generate_sanad_graph(hadith.get('sanad', []), hadith.get('sanad_edges', []))
    syawahid, muttabi = find_syawahid_muttabi(hadith_id)
    
    return jsonify({
        "hadith": hadith,
        "sanad_graph": sanad_graph,
        "kitab": kitab,
        "bab": bab,
        "chapters": chapters,
        "syawahid": syawahid,
        "muttabi": muttabi
    })

# Asumsi blueprint Anda: hadith_bp = Blueprint("hadith", __name__, url_prefix="/hadith")

@hadith_bp.route("/analysis/cross-chain/<int:hadith_id>")
def cross_chain_analysis(hadith_id):
    if not hadith_id:
        return jsonify({"success": False, "message": "Parameter hadith_id wajib diisi."}), 400

    report = analyze_cross_chain(hadith_id)
    
    if "error" in report:
        return jsonify({"success": False, "message": report["error"]}), 404

    return jsonify({"success": True, "data": report})

@hadith_bp.route('/chapters/<string:kitab_name>')
def get_chapters(kitab_name):
    chapters = get_chapters_by_kitab(kitab_name)
    return jsonify({"chapters": chapters})