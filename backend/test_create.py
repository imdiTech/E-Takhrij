from app import create_app
from api.core.db import db
from models.theme import Theme, SubTheme

app = create_app()
with app.app_context():
    # create theme
    theme = Theme(tema="Test", deskripsi="Test")
    db.session.add(theme)
    db.session.commit()
    
    # create subtheme
    sub = SubTheme(theme_id=theme.id, judul="Test Sub", deskripsi="Test Sub")
    try:
        db.session.add(sub)
        db.session.commit()
        print("SubTheme created, dict:")
        print(sub.to_dict())
    except Exception as e:
        print("ERROR:", str(e))
        import traceback
        traceback.print_exc()
