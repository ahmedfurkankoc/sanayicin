from django.shortcuts import render
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from .serializers import ClientProfileSerializer, ClientRegisterSerializer
from .models import ClientProfile
from core.models import CustomUser

# Create your views here.

class IsClient(permissions.BasePermission):
    def has_permission(self, request, view):
        # Client, admin role veya superuser olabilir
        return request.user.is_authenticated and (
            request.user.role == "client" or 
            request.user.role == "both" or
            request.user.role == "admin" or
            request.user.is_staff or 
            request.user.is_superuser
        )

class ClientRegisterView(generics.CreateAPIView):
    queryset = ClientProfile.objects.all()
    serializer_class = ClientRegisterSerializer
    permission_classes = []

class ClientProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = ClientProfileSerializer
    permission_classes = [IsClient]

    def get_object(self):
        # ClientProfile'ı döndür, CustomUser'ı değil
        try:
            return ClientProfile.objects.get(user=self.request.user)
        except ClientProfile.DoesNotExist:
            # Eğer ClientProfile yoksa ve admin/superuser ise, test için boş profile oluştur
            if self.request.user.is_staff or self.request.user.is_superuser:
                # Test için admin/superuser için dummy profile
                return ClientProfile.objects.create(
                    user=self.request.user,
                    first_name="Admin Test",
                    last_name="Müşteri",
                    phone="5551234567",
                    city="İstanbul",
                    district="Kadıköy",
                    address="Test Adres",
                    about="Admin test müşteri profili"
                )
            else:
                # Normal kullanıcı için 404
                from rest_framework.exceptions import NotFound
                raise NotFound("Müşteri profili bulunamadı.")

    def get(self, request, *args, **kwargs):
        try:
            instance = self.get_object()
            serializer = self.get_serializer(instance)
            return Response(serializer.data)
        except Exception as e:
            return Response(
                {"error": "Müşteri profili bulunamadı."}, 
                status=status.HTTP_404_NOT_FOUND
            )

    def put(self, request, *args, **kwargs):
        try:
            instance = self.get_object()
            serializer = self.get_serializer(instance, data=request.data, partial=True)
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response(
                {"error": "Müşteri profili güncellenirken hata oluştu."}, 
                status=status.HTTP_400_BAD_REQUEST
            )
