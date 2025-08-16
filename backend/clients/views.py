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
        # Client, vendor (esnaflar da customer olarak davranabilir), admin role veya superuser olabilir
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
