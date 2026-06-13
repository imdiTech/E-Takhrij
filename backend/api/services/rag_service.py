from api.core.ai_core import ai_core
from api.services.hadith_service import search_hadith

def generate_answer(query):
    """
    RAG Logic:
    1. Search query in Vector DB (Semantic Search via ChromaDB)
    2. Fallback to keyword search in SQLite if Vector DB is empty or fails
    3. Pass results to LLM
    4. Generate answer
    """
    if ai_core.llm is None:
        return "AI is not initialized. Please check GOOGLE_API_KEY."

    relevant_hadiths = []
    
    # 1. Coba gunakan ChromaDB (Semantic Search) jika tersedia
    if ai_core.vector_store:
        try:
            if ai_core.vector_store._collection.count() > 0:
                print(f"RAG: Melakukan semantic search untuk query: '{query}'...")
                results = ai_core.vector_store.similarity_search(query, k=5)
                for doc in results:
                    h_id = doc.metadata.get('hadith_id')
                    if h_id:
                        from api.services.hadith_service import get_hadith_by_id
                        h = get_hadith_by_id(int(h_id))
                        if h:
                            relevant_hadiths.append(h)
        except Exception as e:
            print(f"RAG: Error semantic search via ChromaDB: {e}")

    # 2. Fallback ke keyword search jika semantic search kosong atau gagal
    if not relevant_hadiths:
        print(f"RAG: Menggunakan fallback keyword search untuk query: '{query}'...")
        relevant_hadiths = search_hadith(query=query)
        relevant_hadiths = relevant_hadiths[:5]
    
    if not relevant_hadiths:
        context_text = "Tidak ada data hadis yang relevan ditemukan untuk pertanyaan ini."
    else:
        context_text = "\n\n".join([f"Hadis {d['kitab']} No {d['nomor']} (Bab: {d['bab']}): {d['terjemahan']}" for d in relevant_hadiths])
    
    # Update LLM from DB settings before invoking
    ai_core.update_llm()
    
    if ai_core.llm is None:
        return "AI is not initialized. Please check GOOGLE_API_KEY."

    from api.models.settings import AISetting
    try:
        setting = AISetting.objects.first()
        base_prompt = setting.prompt if setting else """Anda adalah asisten cerdas untuk Takhrij Hadis dengan nama "SANTRI ILHA"."""
    except Exception:
        base_prompt = """Anda adalah asisten cerdas untuk Takhrij Hadis dengan nama "SANTRI ILHA"."""
    
    prompt = f"""
{base_prompt}

Konteks:
{context_text}

Pertanyaan:
{query}

Jawaban:
"""
    
    try:
        response = ai_core.llm.invoke(prompt)
        content = response.content
        
        # Handle cases where response.content is a list of blocks/dicts (common in multimodal/newer LangChain packages)
        if isinstance(content, list):
            text_parts = []
            for part in content:
                if isinstance(part, dict) and "text" in part:
                    text_parts.append(part["text"])
                elif isinstance(part, str):
                    text_parts.append(part)
            content = "".join(text_parts)
        # Handle cases where content is a dictionary
        elif isinstance(content, dict):
            content = content.get("text", str(content))
            
        return str(content)
    except Exception as e:
        return f"Error generating answer: {str(e)}"
