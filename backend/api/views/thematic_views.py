"""
Thematic API views — DRF implementation.
Public endpoints for reading themes and thematic hadiths.
"""
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from api.models.theme import Theme, SubTheme, ThematicHadith
from api.serializers import ThemeSerializer, SubThemeSerializer, ThematicHadithSerializer


@api_view(['GET'])
@permission_classes([AllowAny])
def get_themes(request):
    themes = Theme.objects.order_by('tema')
    serializer = ThemeSerializer(themes, many=True)
    return Response({
        "success": True,
        "themes": serializer.data
    })


@api_view(['GET'])
@permission_classes([AllowAny])
def get_thematic_hadiths(request, sub_theme_id):
    try:
        sub_theme = SubTheme.objects.get(pk=sub_theme_id)
    except SubTheme.DoesNotExist:
        return Response({"success": False, "message": "Sub Tema tidak ditemukan."}, status=404)

    hadiths = ThematicHadith.objects.filter(sub_theme_id=sub_theme_id).order_by('id')
    serializer = ThematicHadithSerializer(hadiths, many=True)
    
    return Response({
        "success": True,
        "sub_theme": SubThemeSerializer(sub_theme).data,
        "hadiths": serializer.data
    })
