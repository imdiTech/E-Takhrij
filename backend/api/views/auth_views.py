"""
Auth API views — DRF implementation.
Flask-Login replaced with Django contrib.auth, integrated with DRF decorators.
All logic preserved exactly.
"""
import uuid
from django.contrib.auth import login, logout
from rest_framework.decorators import api_view, permission_classes, authentication_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response

from api.models.user import User
from api.serializers import UserSerializer


@api_view(['POST'])
@authentication_classes([])
@permission_classes([AllowAny])
def register(request):
    data = request.data
    username = data.get('username', '').strip()
    password = data.get('password', '').strip()

    if not username or not password:
        return Response({"success": False, "message": "Username dan password wajib diisi."}, status=400)

    if User.objects.filter(username=username).exists():
        return Response({"success": False, "message": "Username sudah digunakan."}, status=400)

    user = User(username=username, is_admin=False)
    user.set_password(password)

    try:
        user.save()
        return Response({"success": True, "message": "Pendaftaran berhasil! Silakan login."}, status=201)
    except Exception as e:
        return Response({"success": False, "message": f"Terjadi kesalahan: {str(e)}"}, status=500)


@api_view(['POST'])
@authentication_classes([])
@permission_classes([AllowAny])
def login_view(request):
    if request.user.is_authenticated:
        return Response({
            "success": True,
            "message": "Anda sudah login.",
            "user": UserSerializer(request.user).data
        })

    data = request.data
    username = data.get('username', '').strip()
    password = data.get('password', '').strip()

    if not username or not password:
        return Response({"success": False, "message": "Username dan password wajib diisi."}, status=400)

    try:
        user = User.objects.get(username=username)
    except User.DoesNotExist:
        return Response({"success": False, "message": "Username atau password salah."}, status=401)

    if not user.check_password(password):
        return Response({"success": False, "message": "Username atau password salah."}, status=401)

    login(request, user)

    return Response({
        "success": True,
        "message": "Login berhasil!",
        "user": UserSerializer(user).data
    })


@api_view(['POST'])
@authentication_classes([])
@permission_classes([AllowAny])
def logout_view(request):
    logout(request)
    return Response({"success": True, "message": "Logout berhasil!"})


@api_view(['GET'])
@permission_classes([AllowAny])  # Manual check to return standard 401 JSON instead of DRF default Exception
def me(request):
    if not request.user.is_authenticated:
        return Response({"success": False, "message": "Belum terautentikasi."}, status=401)

    return Response({
        "success": True,
        "user": UserSerializer(request.user).data
    })


@api_view(['POST'])
@authentication_classes([])
@permission_classes([AllowAny])
def google_login(request):
    from google.oauth2 import id_token
    from google.auth.transport import requests as google_requests
    from django.conf import settings

    data = request.data
    token = data.get('credential')

    if not token:
        return Response({"success": False, "message": "Token Google tidak ditemukan."}, status=400)

    try:
        client_id = settings.GOOGLE_CLIENT_ID
        idinfo = id_token.verify_oauth2_token(token, google_requests.Request(), client_id)

        # Token is valid. Get email
        email = idinfo.get('email')
        if not email:
            return Response({"success": False, "message": "Gagal mengambil email dari akun Google."}, status=400)

        try:
            user = User.objects.get(username=email)
        except User.DoesNotExist:
            # Create user if not exists
            user_name = email
            if len(user_name) > 50:
                user_name = user_name[:50]

            # Ensure unique username
            base_name = user_name
            counter = 1
            while User.objects.filter(username=user_name).exists():
                suffix = f"_{counter}"
                user_name = base_name[:50 - len(suffix)] + suffix
                counter += 1

            user = User(username=user_name, is_admin=False)
            user.set_password(str(uuid.uuid4()))
            user.save()

        login(request, user)
        return Response({
            "success": True,
            "message": "Login Google berhasil!",
            "user": UserSerializer(user).data
        })
    except ValueError as e:
        return Response({"success": False, "message": f"Token Google tidak valid: {str(e)}"}, status=400)
    except Exception as e:
        return Response({"success": False, "message": f"Terjadi kesalahan: {str(e)}"}, status=500)
