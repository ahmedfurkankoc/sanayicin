from django.shortcuts import render
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from .serializers import ClientProfileSerializer, ClientRegisterSerializer
from .models import ClientProfile
from core.models import CustomUser
from rest_framework_simplejwt.tokens import RefreshToken
import logging

logger = logging.getLogger(__name__)

# Create your views here.

class IsClient(permissions.BasePermission):
    def has_permission(self, request, view):
        # Client, vendor (esnaflar da client olarak davranabilir), admin role veya superuser olabilir
        return request.user.is_authenticated and (
            request.user.role == "client" or 
            request.user.role == "vendor" or  # 'both' yerine 'vendor'
            request.user.role == "admin" or
            request.user.is_staff or 
            request.user.is_superuser
        )

class ClientRegisterView(generics.CreateAPIView):
    queryset = ClientProfile.objects.all()
    serializer_class = ClientRegisterSerializer
    permission_classes = [AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        if not serializer.is_valid():
            return Response({
                "detail": "Validation error",
                "errors": serializer.errors
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            profile = serializer.save()
            return Response({
                "detail": "Hesabınız başarıyla oluşturuldu. Email doğrulama kodu gönderildi.",
                "email": profile.user.email,
                "requires_verification": True
            }, status=status.HTTP_201_CREATED)
        except Exception as e:
            logger.error(f"Client registration error: {e}")
            return Response({
                "detail": f"Registration failed: {str(e)}"
            }, status=status.HTTP_400_BAD_REQUEST)

class ClientProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = ClientProfileSerializer
    permission_classes = [IsClient]

    def get_object(self):
        return self.request.user.client_profile

class ClientSetPasswordView(generics.UpdateAPIView):
    """Client şifre belirleme view'ı"""
    permission_classes = [AllowAny]
    
    def update(self, request, *args, **kwargs):
        try:
            email = request.data.get('email')
            password = request.data.get('password')
            password2 = request.data.get('password2')
            
            if not all([email, password, password2]):
                return Response({
                    'detail': 'Email, şifre ve şifre tekrarı gerekli'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            if password != password2:
                return Response({
                    'detail': 'Şifreler eşleşmiyor'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            if len(password) < 6:
                return Response({
                    'detail': 'Şifre en az 6 karakter olmalı'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Kullanıcıyı bul
            try:
                user = CustomUser.objects.get(email=email, role='client')
            except CustomUser.DoesNotExist:
                return Response({
                    'detail': 'Bu email ile kayıtlı müşteri bulunamadı'
                }, status=status.HTTP_404_NOT_FOUND)
            
            # Şifreyi güncelle
            user.set_password(password)
            user.save()
            
            return Response({
                'detail': 'Şifre başarıyla güncellendi'
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            logger.error(f"Client set password error: {e}")
            return Response({
                'detail': 'Şifre güncellenirken hata oluştu'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
