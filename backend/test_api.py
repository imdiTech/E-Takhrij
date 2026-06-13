from app import create_app
from api.core.db import db
from models.theme import Theme

app = create_app()
with app.app_context():
    client = app.test_client()
    # We need to bypass login_required or mock it.
    # Since we can't easily mock flask_login in a simple script without writing more code,
    # let's just invoke the function directly.
    from routes.admin_api import admin_subtheme_create
    from flask import request
    
    with app.test_request_context(json={'judul': 'SubTema 1', 'deskripsi': 'Deskripsi SubTema 1'}):
        # mock current_user
        from flask_login import login_user
        from models.user import User
        # assuming admin user exists with id 1
        admin = User.query.first()
        if admin:
            print("Running test with admin context...")
            login_user(admin)
            
            # create theme to use
            theme = Theme.query.first()
            if not theme:
                theme = Theme(tema="Test", deskripsi="Test")
                db.session.add(theme)
                db.session.commit()
            
            # test endpoint
            res = admin_subtheme_create(theme.id)
            print("Response:", res[0].get_json() if isinstance(res, tuple) else res.get_json())
            print("Status:", res[1] if isinstance(res, tuple) else 200)
        else:
            print("No admin user found")
