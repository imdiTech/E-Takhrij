from flask import Blueprint, render_template, request, jsonify
from services.hadith_service import get_all_hadiths, get_hadith_by_id, search_hadith, get_chapters_by_kitab, find_syawahid_muttabi
from services.sanad_service import generate_sanad_graph
from services.takhrij_analyzer import analyze_cross_chain

hadith_bp = Blueprint('hadith', __name__)

@hadith_bp.route('/')
def index():
    # Do not load all hadiths on the dashboard
    return render_template('hadith/index.html', hadiths=None)

@hadith_bp.route('/search')
def search():
    query = request.args.get('q', '').strip()
    kitab = request.args.get('kitab', '').strip()
    bab = request.args.get('bab', '').strip()
    search_type = request.args.get('search_type', 'phrase').strip()
    
    chapters = []
    hadiths = None
    
    if kitab and kitab.lower() != 'all':
        chapters = get_chapters_by_kitab(kitab)
        
    if query or kitab or bab:
        # If kitab is selected but no bab yet, we might want to show all hadiths in that kitab
        # or wait until bab is selected. The user said: "jika list chapter dipilih kemudian munculkan list hadisnya".
        # So if kitab is selected, we show chapters. If chapter is selected, we show hadiths.
        if kitab and kitab.lower() != 'all' and not bab and not query:
            hadiths = None
        else:
            hadiths = search_hadith(query=query, kitab=kitab, bab=bab, search_type=search_type)
    else:
        hadiths = None
        
    return render_template('hadith/index.html', 
                           hadiths=hadiths, 
                           query=query, 
                           kitab=kitab, 
                           bab=bab, 
                           search_type=search_type,
                           chapters=chapters)


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
    
    return render_template('hadith/detail.html', 
                           hadith=hadith, 
                           sanad_graph=sanad_graph,
                           kitab=kitab,
                           bab=bab,
                           chapters=chapters,
                           syawahid=syawahid,
                           muttabi=muttabi)

# Asumsi blueprint Anda: hadith_bp = Blueprint("hadith", __name__, url_prefix="/hadith")

@hadith_bp.route("/analysis/cross-chain/<int:hadith_id>")
def cross_chain_analysis(hadith_id):
    if not hadith_id:
        return jsonify({"success": False, "message": "Parameter hadith_id wajib diisi."}), 400

    report = analyze_cross_chain(hadith_id)
    
    if "error" in report:
        return jsonify({"success": False, "message": report["error"]}), 404

    # Deteksi jika *request* berbasis AJAX untuk memuat komponen secara dinamis
    if request.headers.get("X-Requested-With") == "XMLHttpRequest":
        return jsonify({"success": True, "data": report})

    return render_template("hadith/cross_analysis.html", report=report)