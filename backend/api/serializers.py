from rest_framework import serializers
from api.models.user import User
from api.models.hadith import Hadith
from api.models.theme import Theme, SubTheme, ThematicHadith

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'is_admin']


class HadithSerializer(serializers.ModelSerializer):
    sanad = serializers.JSONField(source='sanad_json', required=False, default=list)
    sanad_edges = serializers.JSONField(source='sanad_edges_json', required=False, default=list)
    narators_id = serializers.JSONField(source='narators_id_json', required=False, default=list)
    
    # Aliases
    source = serializers.CharField(source='kitab', read_only=True)
    chapter_no = serializers.CharField(source='bab', read_only=True)
    text_ar = serializers.CharField(source='arab', read_only=True)
    text_en = serializers.CharField(source='english', read_only=True)
    matan_arab = serializers.CharField(read_only=True)

    class Meta:
        model = Hadith
        fields = [
            'id', 'kitab', 'source', 'nomor', 'bab', 'chapter_no', 
            'arab', 'text_ar', 'terjemahan', 'english', 'text_en', 
            'sanad', 'sanad_edges', 'narators_id', 'matan_arab'
        ]

    def to_representation(self, instance):
        """
        DRF automatically escapes JSONField strings. Because our database 
        stores json.dumps strings natively, we need to ensure they are 
        properly parsed back to lists before sending to frontend.
        The `instance.sanad` property handles the json.loads() already.
        """
        ret = super().to_representation(instance)
        # Re-map fields using the model's parsed properties to avoid double-escaping
        ret['sanad'] = instance.sanad
        ret['sanad_edges'] = instance.sanad_edges
        ret['narators_id'] = instance.narators_id
        return ret


class SubThemeSerializer(serializers.ModelSerializer):
    hadith_count = serializers.SerializerMethodField()

    class Meta:
        model = SubTheme
        fields = ['id', 'theme_id', 'judul', 'deskripsi', 'created_at', 'updated_at', 'hadith_count']

    def get_hadith_count(self, obj):
        return obj.hadiths.count()


class ThemeSerializer(serializers.ModelSerializer):
    sub_themes_count = serializers.SerializerMethodField()
    sub_themes = SubThemeSerializer(many=True, read_only=True)

    class Meta:
        model = Theme
        fields = ['id', 'tema', 'deskripsi', 'created_at', 'updated_at', 'sub_themes_count', 'sub_themes']

    def get_sub_themes_count(self, obj):
        return obj.sub_themes.count()


class ThematicHadithSerializer(serializers.ModelSerializer):
    # Read-only attributes mapped from the parent Hadith for frontend compatibility
    kitab = serializers.CharField(source='hadith.kitab', read_only=True)
    nomor = serializers.CharField(source='hadith.nomor', read_only=True)
    bab = serializers.CharField(source='hadith.bab', read_only=True)
    arab = serializers.CharField(source='hadith.arab', read_only=True)
    terjemahan = serializers.CharField(source='hadith.terjemahan', read_only=True)
    english = serializers.CharField(source='hadith.english', read_only=True)
    matan_arab = serializers.CharField(source='hadith.matan_arab', read_only=True)
    
    # We use SerializerMethodField for json strings to avoid DRF double-escaping
    sanad = serializers.SerializerMethodField()
    sanad_edges = serializers.SerializerMethodField()

    class Meta:
        model = ThematicHadith
        fields = [
            'id', 'sub_theme_id', 'hadith_id', 'syarh_hadith',
            'kitab', 'nomor', 'bab', 'arab', 'terjemahan', 'english',
            'matan_arab', 'sanad', 'sanad_edges'
        ]

    def get_sanad(self, obj):
        return obj.hadith.sanad if obj.hadith else []

    def get_sanad_edges(self, obj):
        return obj.hadith.sanad_edges if obj.hadith else []
