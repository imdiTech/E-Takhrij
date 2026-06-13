"""
Admin API views — DRF APIView implementation.
Combines GET/POST and PUT/DELETE into standard DRF Class-Based Views.
"""
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.core.paginator import Paginator
from django.db.models import Q

from api.models.user import User
from api.models.hadith import Hadith
from api.models.theme import Theme, SubTheme, ThematicHadith
from api.serializers import UserSerializer, HadithSerializer, ThemeSerializer, SubThemeSerializer, ThematicHadithSerializer
from api.permissions import IsAdminUserCustom


# =====================================================================
# HADITH CRUD ENDPOINTS
# =====================================================================

class HadithListCreateView(APIView):
    permission_classes = [IsAuthenticated, IsAdminUserCustom]

    def get(self, request):
        page = int(request.GET.get('page', 1))
        limit = int(request.GET.get('limit', 10))
        search = request.GET.get('q', '').strip()

        queryset = Hadith.objects.all()
        if search:
            queryset = queryset.filter(
                Q(terjemahan__icontains=search) |
                Q(kitab__icontains=search) |
                Q(nomor__icontains=search)
            )

        queryset = queryset.order_by('-id')
        paginator = Paginator(queryset, limit)
        page_obj = paginator.get_page(page)

        serializer = HadithSerializer(page_obj.object_list, many=True)

        return Response({
            "success": True,
            "hadiths": serializer.data,
            "page": page,
            "limit": limit,
            "total_results": paginator.count,
            "total_pages": paginator.num_pages
        })

    def post(self, request):
        data = request.data
        if not data.get('kitab') or not data.get('nomor'):
            return Response({"success": False, "message": "Nama kitab dan nomor hadis wajib diisi."}, status=400)

        serializer = HadithSerializer(data=data)
        if serializer.is_valid():
            try:
                hadith = serializer.save()
                from api.core.data import data_store
                data_store.load_data()

                return Response({"success": True, "message": "Hadis baru berhasil ditambahkan!", "hadith": HadithSerializer(hadith).data}, status=201)
            except Exception as e:
                return Response({"success": False, "message": f"Terjadi kesalahan saat menyimpan: {str(e)}"}, status=500)
        return Response({"success": False, "message": "Data tidak valid.", "errors": serializer.errors}, status=400)


class HadithDetailView(APIView):
    permission_classes = [IsAuthenticated, IsAdminUserCustom]

    def put(self, request, hadith_id):
        try:
            hadith = Hadith.objects.get(pk=hadith_id)
        except Hadith.DoesNotExist:
            return Response({"success": False, "message": "Hadis tidak ditemukan."}, status=404)

        data = request.data
        if not data.get('kitab') or not data.get('nomor'):
            return Response({"success": False, "message": "Nama kitab dan nomor hadis wajib diisi."}, status=400)

        serializer = HadithSerializer(hadith, data=data, partial=True)
        if serializer.is_valid():
            try:
                updated_hadith = serializer.save()
                from api.core.data import data_store
                data_store.load_data()

                return Response({"success": True, "message": "Hadis berhasil diperbarui!", "hadith": HadithSerializer(updated_hadith).data})
            except Exception as e:
                return Response({"success": False, "message": f"Terjadi kesalahan saat memperbarui: {str(e)}"}, status=500)
        return Response({"success": False, "message": "Data tidak valid.", "errors": serializer.errors}, status=400)

    def delete(self, request, hadith_id):
        try:
            hadith = Hadith.objects.get(pk=hadith_id)
        except Hadith.DoesNotExist:
            return Response({"success": False, "message": "Hadis tidak ditemukan."}, status=404)

        try:
            hadith.delete()
            from api.core.data import data_store
            data_store.load_data()
            return Response({"success": True, "message": "Hadis berhasil dihapus."})
        except Exception as e:
            return Response({"success": False, "message": f"Terjadi kesalahan saat menghapus: {str(e)}"}, status=500)


# =====================================================================
# USER ACCOUNT MANAGEMENT ENDPOINTS
# =====================================================================

class UserListView(APIView):
    permission_classes = [IsAuthenticated, IsAdminUserCustom]

    def get(self, request):
        users = User.objects.all()
        serializer = UserSerializer(users, many=True)
        return Response({
            "success": True,
            "users": serializer.data
        })


class UserDetailView(APIView):
    permission_classes = [IsAuthenticated, IsAdminUserCustom]

    def delete(self, request, user_id):
        if request.user.id == user_id:
            return Response({"success": False, "message": "Anda tidak bisa menghapus akun Anda sendiri saat sedang aktif."}, status=400)

        try:
            user = User.objects.get(pk=user_id)
        except User.DoesNotExist:
            return Response({"success": False, "message": "Pengguna tidak ditemukan."}, status=404)

        try:
            user.delete()
            return Response({"success": True, "message": "Akun pengguna berhasil dihapus."})
        except Exception as e:
            return Response({"success": False, "message": f"Gagal menghapus akun: {str(e)}"}, status=500)


class UserToggleAdminView(APIView):
    permission_classes = [IsAuthenticated, IsAdminUserCustom]

    def put(self, request, user_id):
        if request.user.id == user_id:
            return Response({"success": False, "message": "Anda tidak bisa memotong hak akses Admin Anda sendiri."}, status=400)

        try:
            user = User.objects.get(pk=user_id)
        except User.DoesNotExist:
            return Response({"success": False, "message": "Pengguna tidak ditemukan."}, status=404)

        user.is_admin = not user.is_admin
        try:
            user.save()
            role = "Admin" if user.is_admin else "Client"
            return Response({"success": True, "message": f"Status pengguna berhasil diubah menjadi {role}.", "is_admin": user.is_admin})
        except Exception as e:
            return Response({"success": False, "message": f"Gagal mengubah peran: {str(e)}"}, status=500)


# =====================================================================
# THEMATIC CRUD ENDPOINTS
# =====================================================================

class ThemeListCreateView(APIView):
    permission_classes = [IsAuthenticated, IsAdminUserCustom]

    def get(self, request):
        themes = Theme.objects.order_by('tema')
        serializer = ThemeSerializer(themes, many=True)
        return Response({
            "success": True,
            "themes": serializer.data
        })

    def post(self, request):
        serializer = ThemeSerializer(data=request.data)
        if serializer.is_valid():
            try:
                theme = serializer.save()
                return Response({"success": True, "message": "Tema berhasil ditambahkan!", "theme": ThemeSerializer(theme).data}, status=201)
            except Exception as e:
                return Response({"success": False, "message": f"Terjadi kesalahan: {str(e)}"}, status=500)
        return Response({"success": False, "message": "Judul tema wajib diisi."}, status=400)


class ThemeDetailView(APIView):
    permission_classes = [IsAuthenticated, IsAdminUserCustom]

    def put(self, request, theme_id):
        try:
            theme = Theme.objects.get(pk=theme_id)
        except Theme.DoesNotExist:
            return Response({"success": False, "message": "Tema tidak ditemukan."}, status=404)

        serializer = ThemeSerializer(theme, data=request.data, partial=True)
        if serializer.is_valid():
            try:
                updated_theme = serializer.save()
                return Response({"success": True, "message": "Tema berhasil diperbarui!", "theme": ThemeSerializer(updated_theme).data})
            except Exception as e:
                return Response({"success": False, "message": f"Terjadi kesalahan: {str(e)}"}, status=500)
        return Response({"success": False, "message": "Judul tema wajib diisi."}, status=400)

    def delete(self, request, theme_id):
        try:
            theme = Theme.objects.get(pk=theme_id)
        except Theme.DoesNotExist:
            return Response({"success": False, "message": "Tema tidak ditemukan."}, status=404)

        try:
            theme.delete()
            return Response({"success": True, "message": "Tema berhasil dihapus."})
        except Exception as e:
            return Response({"success": False, "message": f"Terjadi kesalahan: {str(e)}"}, status=500)


class SubThemeListCreateView(APIView):
    permission_classes = [IsAuthenticated, IsAdminUserCustom]

    def get(self, request, theme_id):
        subthemes = SubTheme.objects.filter(theme_id=theme_id).order_by('id')
        serializer = SubThemeSerializer(subthemes, many=True)
        return Response({
            "success": True,
            "sub_themes": serializer.data
        })

    def post(self, request, theme_id):
        try:
            theme = Theme.objects.get(pk=theme_id)
        except Theme.DoesNotExist:
            return Response({"success": False, "message": "Tema tidak ditemukan."}, status=404)

        data = request.data.copy() if hasattr(request.data, 'copy') else dict(request.data)
        data['theme_id'] = theme.id

        serializer = SubThemeSerializer(data=data)
        if serializer.is_valid():
            try:
                subtheme = serializer.save()
                return Response({"success": True, "message": "Sub Tema berhasil ditambahkan!", "sub_theme": SubThemeSerializer(subtheme).data}, status=201)
            except Exception as e:
                return Response({"success": False, "message": f"Terjadi kesalahan: {str(e)}"}, status=500)
        return Response({"success": False, "message": "Judul Sub Tema wajib diisi."}, status=400)


class SubThemeDetailView(APIView):
    permission_classes = [IsAuthenticated, IsAdminUserCustom]

    def put(self, request, theme_id, sub_theme_id):
        try:
            subtheme = SubTheme.objects.get(pk=sub_theme_id, theme_id=theme_id)
        except SubTheme.DoesNotExist:
            return Response({"success": False, "message": "Sub Tema tidak ditemukan."}, status=404)

        serializer = SubThemeSerializer(subtheme, data=request.data, partial=True)
        if serializer.is_valid():
            try:
                updated_subtheme = serializer.save()
                return Response({"success": True, "message": "Sub Tema berhasil diperbarui!", "sub_theme": SubThemeSerializer(updated_subtheme).data})
            except Exception as e:
                return Response({"success": False, "message": f"Terjadi kesalahan: {str(e)}"}, status=500)
        return Response({"success": False, "message": "Judul Sub Tema wajib diisi."}, status=400)

    def delete(self, request, theme_id, sub_theme_id):
        try:
            subtheme = SubTheme.objects.get(pk=sub_theme_id, theme_id=theme_id)
        except SubTheme.DoesNotExist:
            return Response({"success": False, "message": "Sub Tema tidak ditemukan."}, status=404)

        try:
            subtheme.delete()
            return Response({"success": True, "message": "Sub Tema berhasil dihapus."})
        except Exception as e:
            return Response({"success": False, "message": f"Terjadi kesalahan: {str(e)}"}, status=500)


class ThematicHadithListCreateView(APIView):
    permission_classes = [IsAuthenticated, IsAdminUserCustom]

    def get(self, request, sub_theme_id):
        hadiths = ThematicHadith.objects.filter(sub_theme_id=sub_theme_id).order_by('-id')
        serializer = ThematicHadithSerializer(hadiths, many=True)
        return Response({
            "success": True,
            "hadiths": serializer.data
        })

    def post(self, request, sub_theme_id):
        try:
            subtheme = SubTheme.objects.get(pk=sub_theme_id)
        except SubTheme.DoesNotExist:
            return Response({"success": False, "message": "Sub Tema tidak ditemukan."}, status=404)

        data = request.data
        hadith_id = data.get('hadith_id')

        if not hadith_id:
            return Response({"success": False, "message": "Pilihan hadis wajib disertakan."}, status=400)

        try:
            Hadith.objects.get(pk=hadith_id)
        except Hadith.DoesNotExist:
            return Response({"success": False, "message": "Data hadis tidak ditemukan di database utama."}, status=404)

        if ThematicHadith.objects.filter(sub_theme_id=sub_theme_id, hadith_id=hadith_id).exists():
            return Response({"success": False, "message": "Hadis ini sudah dimasukkan ke dalam Sub Tema ini."}, status=400)

        data_dict = data.copy() if hasattr(data, 'copy') else dict(data)
        data_dict['sub_theme_id'] = subtheme.id

        serializer = ThematicHadithSerializer(data=data_dict)
        if serializer.is_valid():
            try:
                hadith_thematic = serializer.save()
                return Response({"success": True, "message": "Hadis tematik berhasil ditambahkan!", "hadith": ThematicHadithSerializer(hadith_thematic).data}, status=201)
            except Exception as e:
                return Response({"success": False, "message": f"Terjadi kesalahan: {str(e)}"}, status=500)
        return Response({"success": False, "message": "Data tidak valid."}, status=400)


class ThematicHadithDetailView(APIView):
    permission_classes = [IsAuthenticated, IsAdminUserCustom]

    def put(self, request, sub_theme_id, hadith_id):
        try:
            hadith_thematic = ThematicHadith.objects.get(pk=hadith_id, sub_theme_id=sub_theme_id)
        except ThematicHadith.DoesNotExist:
            return Response({"success": False, "message": "Hadis tematik tidak ditemukan."}, status=404)

        serializer = ThematicHadithSerializer(hadith_thematic, data=request.data, partial=True)
        if serializer.is_valid():
            try:
                updated_hadith = serializer.save()
                return Response({"success": True, "message": "Syarh hadis berhasil diperbarui!", "hadith": ThematicHadithSerializer(updated_hadith).data})
            except Exception as e:
                return Response({"success": False, "message": f"Terjadi kesalahan: {str(e)}"}, status=500)
        return Response({"success": False, "message": "Data tidak valid."}, status=400)

    def delete(self, request, sub_theme_id, hadith_id):
        try:
            hadith = ThematicHadith.objects.get(pk=hadith_id, sub_theme_id=sub_theme_id)
        except ThematicHadith.DoesNotExist:
            return Response({"success": False, "message": "Hadis tematik tidak ditemukan."}, status=404)

        try:
            hadith.delete()
            return Response({"success": True, "message": "Hadis tematik berhasil dihapus."})
        except Exception as e:
            return Response({"success": False, "message": f"Terjadi kesalahan: {str(e)}"}, status=500)
