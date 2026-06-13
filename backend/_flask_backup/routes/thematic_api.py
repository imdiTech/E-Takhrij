from flask import Blueprint, jsonify
from extensions.db import db
from models.theme import Theme, SubTheme, ThematicHadith

thematic_api_bp = Blueprint('thematic_api', __name__)

@thematic_api_bp.route('/themes', methods=['GET'])
def get_themes():
    themes = Theme.query.order_by(Theme.tema.asc()).all()
    return jsonify({
        "success": True,
        "themes": [theme.to_dict() for theme in themes]
    })

@thematic_api_bp.route('/subthemes/<int:sub_theme_id>/hadiths', methods=['GET'])
def get_thematic_hadiths(sub_theme_id):
    sub_theme = SubTheme.query.get(sub_theme_id)
    if not sub_theme:
        return jsonify({"success": False, "message": "Sub Tema tidak ditemukan."}), 404
        
    hadiths = ThematicHadith.query.filter_by(sub_theme_id=sub_theme_id).order_by(ThematicHadith.id.asc()).all()
    return jsonify({
        "success": True,
        "sub_theme": sub_theme.to_dict(),
        "hadiths": [h.to_dict() for h in hadiths]
    })
