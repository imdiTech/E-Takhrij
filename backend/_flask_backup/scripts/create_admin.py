"""
Create admin user — adapted for Django.
Usage: python scripts/create_admin.py
"""
import os
import sys

# Add project root to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

import django
django.setup()

from api.models.user import User


def add_admin_user():
    # Check if user already exists
    try:
        user = User.objects.get(username='ilha')
        print("User 'ilha' already exists. Updating password and ensuring admin rights...")
        user.set_password('@Admin2026')
        user.is_admin = True
        user.save()
    except User.DoesNotExist:
        print("Creating new admin user 'ilha'...")
        user = User(username='ilha', is_admin=True)
        user.set_password('@Admin2026')
        user.save()

    print("Success! Admin user 'ilha' has been saved/updated in the database.")

if __name__ == '__main__':
    add_admin_user()
