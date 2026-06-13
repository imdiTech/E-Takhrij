from flask import Blueprint, render_template, request, jsonify
from services.rag_service import generate_answer

ai_chat_bp = Blueprint('ai_chat', __name__)

@ai_chat_bp.route('/')
def chat_interface():
    return render_template('ai_chat/index.html')

@ai_chat_bp.route('/ask', methods=['POST'])
def ask():
    data = request.json
    query = data.get('query')
    if not query:
        return jsonify({'error': 'Query is required'}), 400
        
    answer = generate_answer(query)
    return jsonify({'answer': answer})
