"""
AI Core extension — migrated from Flask Config to Django settings.
Logic is 100% identical, only config import changed.
"""
import os
from langchain_google_genai import ChatGoogleGenerativeAI, GoogleGenerativeAIEmbeddings
from langchain_chroma import Chroma
from django.conf import settings


class AICore:
    def __init__(self):
        self.llm = None
        self.embeddings = None
        self.vector_store = None

    def initialize(self):
        # Ambil API key dari Django settings
        api_key = settings.GOOGLE_API_KEY

        # Cek jika api_key ada dan bukan string kosong
        if api_key:
            os.environ["GOOGLE_API_KEY"] = api_key

            # Gunakan penamaan model yang valid dari DB jika ada
            try:
                from api.models.settings import AISetting
                setting = AISetting.objects.first()
                model_name = setting.model_name if setting else "gemini-2.5-flash"
            except Exception:
                model_name = "gemini-2.5-flash"

            self.llm = ChatGoogleGenerativeAI(model=model_name, temperature=0.3)
            self.embeddings = GoogleGenerativeAIEmbeddings(model="models/embedding-001")

            # Initialize Chroma DB
            self.vector_store = Chroma(
                persist_directory=settings.VECTOR_STORE_PATH,
                embedding_function=self.embeddings
            )
            print(f"AI Core initialized successfully with Gemini ({model_name}).")
        else:
            print("Warning: GOOGLE_API_KEY not set. AI Core running in mock/disabled mode.")

    def update_llm(self):
        """Update LLM instance if model choice changed in settings."""
        if not settings.GOOGLE_API_KEY:
            return

        try:
            from api.models.settings import AISetting
            setting = AISetting.objects.first()
            model_name = setting.model_name if setting else "gemini-2.5-flash"
        except Exception:
            model_name = "gemini-2.5-flash"

        if self.llm is None or getattr(self.llm, 'model', None) != model_name:
            self.llm = ChatGoogleGenerativeAI(model=model_name, temperature=0.3)
            print(f"AI Core LLM updated to model: {model_name}")

# Global instance
ai_core = AICore()