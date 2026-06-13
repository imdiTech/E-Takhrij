from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from api.models import User, Hadith, Theme, SubTheme, ThematicHadith, AISetting


@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = ('id', 'username', 'is_admin')
    search_fields = ('username',)
    list_filter = ('is_admin',)


@admin.register(Hadith)
class HadithAdmin(admin.ModelAdmin):
    list_display = ('id', 'kitab', 'nomor', 'bab')
    search_fields = ('kitab', 'nomor', 'bab', 'terjemahan', 'arab')
    list_filter = ('kitab',)


@admin.register(Theme)
class ThemeAdmin(admin.ModelAdmin):
    list_display = ('id', 'tema', 'created_at')
    search_fields = ('tema', 'deskripsi')


@admin.register(SubTheme)
class SubThemeAdmin(admin.ModelAdmin):
    list_display = ('id', 'theme', 'judul', 'created_at')
    search_fields = ('judul', 'deskripsi')
    list_filter = ('theme',)


@admin.register(ThematicHadith)
class ThematicHadithAdmin(admin.ModelAdmin):
    list_display = ('id', 'sub_theme', 'hadith')
    search_fields = ('syarh_hadith',)
    list_filter = ('sub_theme',)
    raw_id_fields = ('hadith',) # To prevent loading 36k hadiths in a dropdown


@admin.register(AISetting)
class AISettingAdmin(admin.ModelAdmin):
    list_display = ('id', 'model_name', 'updated_at')

    def has_add_permission(self, request):
        # Only allow one instance
        if self.model.objects.exists():
            return False
        return super().has_add_permission(request)
