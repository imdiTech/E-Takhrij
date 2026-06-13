import sys
from api.core.ai_core import ai_core
ai_core.initialize()
if ai_core.vector_store:
    try:
        count = ai_core.vector_store._collection.count()
        print(f"ChromaDB has {count} items.")
    except Exception as e:
        print(f"Error accessing collection: {e}")
else:
    print("Vector store not initialized")
