"""
Unified URL patterns for the API app.
"""
from django.urls import path
from api.views import hadith_views, ai_chat_views, auth_views, admin_api_views, thematic_views

urlpatterns = [
    # -----------------------------------------------------------------------
    # Public Hadith API (/api/hadith/*)
    # -----------------------------------------------------------------------
    path('hadith/', hadith_views.index),
    path('hadith/search', hadith_views.search),
    path('hadith/rawi/info', hadith_views.rawi_info),
    path('hadith/<int:hadith_id>', hadith_views.detail),
    path('hadith/analysis/cross-chain/<int:hadith_id>', hadith_views.cross_chain_analysis),
    path('hadith/chapters/<str:kitab_name>', hadith_views.get_chapters),

    # -----------------------------------------------------------------------
    # AI Chat API (/api/ai/*)
    # -----------------------------------------------------------------------
    path('ai/', ai_chat_views.chat_interface),
    path('ai/ask', ai_chat_views.ask),

    # -----------------------------------------------------------------------
    # Auth API (/api/auth/*)
    # -----------------------------------------------------------------------
    path('auth/register', auth_views.register),
    path('auth/login', auth_views.login_view),
    path('auth/logout', auth_views.logout_view),
    path('auth/me', auth_views.me),
    path('auth/google', auth_views.google_login),

    # -----------------------------------------------------------------------
    # Thematic API (/api/thematic/*)
    # -----------------------------------------------------------------------
    path('thematic/themes', thematic_views.get_themes),
    path('thematic/subthemes/<int:sub_theme_id>/hadiths', thematic_views.get_thematic_hadiths),

    # -----------------------------------------------------------------------
    # Admin API (/api/admin-api/*) - Using Class-Based Views
    # -----------------------------------------------------------------------
    path('admin-api/hadith', admin_api_views.HadithListCreateView.as_view()),
    path('admin-api/hadith/<int:hadith_id>', admin_api_views.HadithDetailView.as_view()),

    path('admin-api/users', admin_api_views.UserListView.as_view()),
    path('admin-api/users/<int:user_id>/toggle-admin', admin_api_views.UserToggleAdminView.as_view()),
    path('admin-api/users/<int:user_id>', admin_api_views.UserDetailView.as_view()),

    path('admin-api/themes', admin_api_views.ThemeListCreateView.as_view()),
    path('admin-api/themes/<int:theme_id>', admin_api_views.ThemeDetailView.as_view()),

    path('admin-api/themes/<int:theme_id>/subthemes', admin_api_views.SubThemeListCreateView.as_view()),
    path('admin-api/themes/<int:theme_id>/subthemes/<int:sub_theme_id>', admin_api_views.SubThemeDetailView.as_view()),

    path('admin-api/subthemes/<int:sub_theme_id>/hadiths', admin_api_views.ThematicHadithListCreateView.as_view()),
    path('admin-api/subthemes/<int:sub_theme_id>/hadiths/<int:hadith_id>', admin_api_views.ThematicHadithDetailView.as_view()),
]
