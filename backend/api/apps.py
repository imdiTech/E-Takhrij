import os
from django.apps import AppConfig


class ApiConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'api'

    def ready(self):
        """
        Startup initialization — replaces Flask's create_app() context.
        Loads data store and AI core on server start.
        Guarded against double-execution in development (autoreloader).
        """
        # Avoid double initialization with Django's autoreloader
        import sys
        if 'runserver' in sys.argv and os.environ.get('RUN_MAIN') != 'true':
            return

        from api.core.data import data_store
        from api.core.ai_core import ai_core

        print("Initializing Data Store...")
        data_store.load_data()

        print("Initializing AI Core...")
        ai_core.initialize()
