from django.core.management.base import BaseCommand
from api.models.user import User

class Command(BaseCommand):
    help = 'Creates a default admin user.'

    def handle(self, *args, **options):
        try:
            user = User.objects.get(username='ilha')
            self.stdout.write("User 'ilha' already exists. Updating password and ensuring admin rights...")
            user.set_password('@Admin2026')
            user.is_admin = True
            user.save()
            self.stdout.write(self.style.SUCCESS("Success! Admin user 'ilha' has been updated."))
        except User.DoesNotExist:
            self.stdout.write("Creating new admin user 'ilha'...")
            user = User(username='ilha', is_admin=True)
            user.set_password('@Admin2026')
            user.save()
            self.stdout.write(self.style.SUCCESS("Success! Admin user 'ilha' has been created."))
