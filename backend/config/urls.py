"""
Root URL Configuration for Smart Takhrij.
Maps Flask Blueprint URL prefixes to Django include() patterns.
"""

from django.contrib import admin
from django.urls import path, include
from django.http import HttpResponse


def health(request):
    return HttpResponse("OK")


urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('api.urls')),
    path('health', health),
]
