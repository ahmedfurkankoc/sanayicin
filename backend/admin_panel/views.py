from rest_framework import viewsets, status, permissions
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework.views import APIView
from django.contrib.auth import authenticate
from django.utils.text import slugify
from django.core.cache import cache
from django.conf import settings
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
import hashlib
import secrets
import logging
from datetime import datetime, timedelta

logger = logging.getLogger('admin_panel.views')
from .models import BlogCategory, BlogPost, SystemLog, AnalyticsData, AdminNotification, AdminSettings, AdminPermission
from .serializers import (
    BlogCategorySerializer, BlogPostSerializer, SystemLogSerializer,
    AnalyticsDataSerializer, AdminNotificationSerializer, AdminSettingsSerializer,
    UserSerializer, VendorProfileSerializer, ServiceAreaSerializer, CategorySerializer,
    CarBrandSerializer, SupportTicketSerializer, SupportMessageSerializer,
    AdminLoginSerializer, AdminUserSerializer
)
from core.models import CustomUser, ServiceArea, Category, CarBrand, SupportTicket, SupportMessage
from vendors.models import VendorProfile

# Admin Authentication Views
@method_decorator(csrf_exempt, name='dispatch')
class AdminLoginView(APIView):
    """Admin paneli login API'si"""
    permission_classes = [permissions.AllowAny]
    authentication_classes = []  # Authentication'ı tamamen devre dışı bırak
    
    def post(self, request):
        serializer = AdminLoginSerializer(data=request.data)
        if not serializer.is_valid():
            return Response({'error': 'Geçersiz veri'}, status=status.HTTP_400_BAD_REQUEST)
        
        email = serializer.validated_data['email']
        password = serializer.validated_data['password']
        
        # Email ile username'i bul
        try:
            user_obj = CustomUser.objects.get(email=email)
            username = user_obj.username
        except CustomUser.DoesNotExist:
            return Response({'error': 'Kullanıcı bulunamadı'}, status=status.HTTP_401_UNAUTHORIZED)
        
        # Authentication
        user = authenticate(request, username=username, password=password)
        
        if not user:
            return Response({'error': 'Geçersiz şifre'}, status=status.HTTP_401_UNAUTHORIZED)
        
        # Admin erişim kontrolü
        if not self._can_access_admin(user):
            return Response({'error': 'Admin paneline erişim yetkiniz yok'}, status=status.HTTP_403_FORBIDDEN)
        
        # Token oluştur
        token = self._generate_admin_token(user)
        
        # Kullanıcı bilgilerini hazırla
        user_data = {
            'id': user.id,
            'email': user.email,
            'first_name': user.first_name,
            'last_name': user.last_name,
            'role': user.role,
            'is_superuser': user.is_superuser,
            'permissions': AdminPermission.get_user_permissions(user)
        }
        
        return Response({
            'token': token,
            'user': user_data,
            'message': 'Giriş başarılı'
        }, status=status.HTTP_200_OK)
    
    def get(self, request):
        print(f"=== ADMIN LOGIN VIEW REACHED (GET) ===")
        return Response({
            'message': 'Admin login endpoint reached successfully!',
            'method': 'GET'
        }, status=status.HTTP_200_OK)
    
    def _can_access_admin(self, user):
        """Kullanıcının admin paneline erişim yetkisi var mı?"""
        return (
            user.is_superuser or 
            user.role in ['admin', 'editor', 'support']
        )
    
    def _generate_admin_token(self, user):
        """Admin için basit token oluştur"""
        # Basit token: user_id + timestamp + random string
        timestamp = str(int(datetime.utcnow().timestamp()))
        random_string = secrets.token_hex(16)
        token_data = f"{user.id}:{timestamp}:{random_string}"
        
        # Token'ı hash'le
        token_hash = hashlib.sha256(token_data.encode()).hexdigest()
        
        # Cache'e token bilgilerini kaydet
        cache.set(f"admin_token_{token_hash}", {
            'user_id': user.id,
            'email': user.email,
            'role': user.role,
            'is_superuser': user.is_superuser,
            'expires_at': datetime.utcnow() + timedelta(hours=24),
            'type': 'admin'
        }, timeout=3600 * 24)  # 24 saat
        
        return token_hash

class AdminLogoutView(APIView):
    """Admin paneli logout API'si"""
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        # Cache'den kullanıcı bilgilerini sil
        cache_key = f"admin_user_{request.user.id}"
        cache.delete(cache_key)
        
        return Response({'message': 'Başarıyla çıkış yapıldı'}, status=status.HTTP_200_OK)

@method_decorator(csrf_exempt, name='dispatch')
class AdminUserInfoView(APIView):
    """Admin kullanıcı bilgileri"""
    permission_classes = [permissions.AllowAny]  # Token kontrolü manuel yapılacak
    authentication_classes = []  # Authentication'ı tamamen devre dışı bırak
    
    def get(self, request):
        # Token'ı header'dan al
        token = request.headers.get('Authorization', '').replace('Bearer ', '')
        
        if not token:
            return Response({'error': 'Token gerekli'}, status=status.HTTP_401_UNAUTHORIZED)
        
        # Cache'den token bilgilerini getir
        token_data = cache.get(f"admin_token_{token}")
        
        if not token_data:
            return Response({'error': 'Geçersiz token'}, status=status.HTTP_401_UNAUTHORIZED)
        
        # Token süresi kontrolü
        if datetime.utcnow() > token_data['expires_at']:
            cache.delete(f"admin_token_{token}")
            return Response({'error': 'Token süresi dolmuş'}, status=status.HTTP_401_UNAUTHORIZED)
        
        # Kullanıcı bilgilerini getir
        try:
            user = CustomUser.objects.get(id=token_data['user_id'])
            user_data = {
                'id': user.id,
                'email': user.email,
                'first_name': user.first_name,
                'last_name': user.last_name,
                'role': user.role,
                'is_superuser': user.is_superuser,
                'permissions': AdminPermission.get_user_permissions(user)
            }
            
            return Response(user_data, status=status.HTTP_200_OK)
            
        except CustomUser.DoesNotExist:
            return Response({'error': 'Kullanıcı bulunamadı'}, status=status.HTTP_401_UNAUTHORIZED)

# Permission Decorator
def admin_permission_required(permission_name, action_type='read'):
    """Admin permission decorator"""
    def decorator(view_func):
        def wrapper(self, request, *args, **kwargs):
            user = request.user
            
            # Superuser her şeye erişebilir
            if user.is_superuser:
                return view_func(self, request, *args, **kwargs)
            
            # Cache'den permission'ları getir
            cache_key = f"admin_user_{user.id}"
            cached_user = cache.get(cache_key)
            
            if cached_user:
                permissions = cached_user.get('permissions', {})
            else:
                permissions = AdminPermission.get_user_permissions(user)
            
            # Permission kontrolü
            if permission_name in permissions:
                if action_type == 'read' and permissions[permission_name]['read']:
                    return view_func(self, request, *args, **kwargs)
                elif action_type == 'write' and permissions[permission_name]['write']:
                    return view_func(self, request, *args, **kwargs)
                elif action_type == 'delete' and permissions[permission_name]['delete']:
                    return view_func(self, request, *args, **kwargs)
            
            return Response({
                'error': f'{permission_name} için {action_type} yetkisi yok'
            }, status=status.HTTP_403_FORBIDDEN)
        
        return wrapper
    return decorator

# Dashboard Stats View
class DashboardStatsView(APIView):
    """Dashboard istatistikleri"""
    permission_classes = [permissions.IsAuthenticated]
    
    @admin_permission_required('dashboard')
    def get(self, request):
        stats = {
            'total_users': CustomUser.objects.filter(role='client').count(),
            'total_vendors': CustomUser.objects.filter(role='vendor').count(),
            'total_admins': CustomUser.objects.filter(role__in=['admin', 'editor', 'support']).count(),
            'pending_support_tickets': SupportTicket.objects.filter(status='pending').count(),
            'published_blog_posts': BlogPost.objects.filter(status='published').count(),
            'active_service_areas': ServiceArea.objects.filter(is_active=True).count(),
            'active_categories': Category.objects.filter(is_active=True).count(),
            'active_car_brands': CarBrand.objects.filter(is_active=True).count(),
        }
        
        return Response(stats, status=status.HTTP_200_OK)

# ViewSets
class UserViewSet(viewsets.ModelViewSet):
    """Kullanıcı yönetimi"""
    queryset = CustomUser.objects.all()
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    @admin_permission_required('users', 'read')
    def list(self, request, *args, **kwargs):
        return super().list(request, *args, **kwargs)
    
    @admin_permission_required('users', 'write')
    def create(self, request, *args, **kwargs):
        return super().create(request, *args, **kwargs)
    
    @admin_permission_required('users', 'write')
    def update(self, request, *args, **kwargs):
        return super().update(request, *args, **kwargs)
    
    @admin_permission_required('users', 'delete')
    def destroy(self, request, *args, **kwargs):
        return super().destroy(request, *args, **kwargs)

class VendorProfileViewSet(viewsets.ModelViewSet):
    """Esnaf profili yönetimi"""
    queryset = VendorProfile.objects.all()
    serializer_class = VendorProfileSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    @admin_permission_required('vendors', 'read')
    def list(self, request, *args, **kwargs):
        return super().list(request, *args, **kwargs)
    
    @admin_permission_required('vendors', 'write')
    def create(self, request, *args, **kwargs):
        return super().create(request, *args, **kwargs)
    
    @admin_permission_required('vendors', 'write')
    def update(self, request, *args, **kwargs):
        return super().update(request, *args, **kwargs)
    
    @admin_permission_required('vendors', 'delete')
    def destroy(self, request, *args, **kwargs):
        return super().destroy(request, *args, **kwargs)

class BlogCategoryViewSet(viewsets.ModelViewSet):
    """Blog kategori yönetimi"""
    queryset = BlogCategory.objects.all()
    serializer_class = BlogCategorySerializer
    permission_classes = [permissions.IsAuthenticated]
    
    @admin_permission_required('blog', 'read')
    def list(self, request, *args, **kwargs):
        return super().list(request, *args, **kwargs)
    
    @admin_permission_required('blog', 'write')
    def create(self, request, *args, **kwargs):
        return super().create(request, *args, **kwargs)
    
    @admin_permission_required('blog', 'write')
    def update(self, request, *args, **kwargs):
        return super().update(request, *args, **kwargs)
    
    @admin_permission_required('blog', 'delete')
    def destroy(self, request, *args, **kwargs):
        return super().destroy(request, *args, **kwargs)

class BlogPostViewSet(viewsets.ModelViewSet):
    """Blog yazı yönetimi"""
    queryset = BlogPost.objects.all()
    serializer_class = BlogPostSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    @admin_permission_required('blog', 'read')
    def list(self, request, *args, **kwargs):
        return super().list(request, *args, **kwargs)
    
    @admin_permission_required('blog', 'write')
    def create(self, request, *args, **kwargs):
        return super().create(request, *args, **kwargs)
    
    @admin_permission_required('blog', 'write')
    def update(self, request, *args, **kwargs):
        return super().update(request, *args, **kwargs)
    
    @admin_permission_required('blog', 'delete')
    def destroy(self, request, *args, **kwargs):
        return super().destroy(request, *args, **kwargs)

class SupportTicketViewSet(viewsets.ModelViewSet):
    """Destek talebi yönetimi"""
    queryset = SupportTicket.objects.all()
    serializer_class = SupportTicketSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    @admin_permission_required('support', 'read')
    def list(self, request, *args, **kwargs):
        return super().list(request, *args, **kwargs)
    
    @admin_permission_required('support', 'write')
    def create(self, request, *args, **kwargs):
        return super().create(request, *args, **kwargs)
    
    @admin_permission_required('support', 'write')
    def update(self, request, *args, **kwargs):
        return super().update(request, *args, **kwargs)
    
    @admin_permission_required('support', 'delete')
    def destroy(self, request, *args, **kwargs):
        return super().destroy(request, *args, **kwargs)

class SupportMessageViewSet(viewsets.ModelViewSet):
    """Destek mesaj yönetimi"""
    queryset = SupportMessage.objects.all()
    serializer_class = SupportMessageSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    @admin_permission_required('support', 'read')
    def list(self, request, *args, **kwargs):
        return super().list(request, *args, **kwargs)
    
    @admin_permission_required('support', 'write')
    def create(self, request, *args, **kwargs):
        return super().create(request, *args, **kwargs)
    
    @admin_permission_required('support', 'write')
    def update(self, request, *args, **kwargs):
        return super().update(request, *args, **kwargs)
    
    @admin_permission_required('support', 'delete')
    def destroy(self, request, *args, **kwargs):
        return super().destroy(request, *args, **kwargs)

class ServiceAreaViewSet(viewsets.ModelViewSet):
    """Hizmet alanı yönetimi"""
    queryset = ServiceArea.objects.all()
    serializer_class = ServiceAreaSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    @admin_permission_required('content', 'read')
    def list(self, request, *args, **kwargs):
        return super().list(request, *args, **kwargs)
    
    @admin_permission_required('content', 'write')
    def create(self, request, *args, **kwargs):
        return super().create(request, *args, **kwargs)
    
    @admin_permission_required('content', 'write')
    def update(self, request, *args, **kwargs):
        return super().update(request, *args, **kwargs)
    
    @admin_permission_required('content', 'delete')
    def destroy(self, request, *args, **kwargs):
        return super().destroy(request, *args, **kwargs)

class CategoryViewSet(viewsets.ModelViewSet):
    """Kategori yönetimi"""
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [permissions.IsAuthenticated]
    
    @admin_permission_required('content', 'read')
    def list(self, request, *args, **kwargs):
        return super().list(request, *args, **kwargs)
    
    @admin_permission_required('content', 'write')
    def create(self, request, *args, **kwargs):
        return super().create(request, *args, **kwargs)
    
    @admin_permission_required('content', 'write')
    def update(self, request, *args, **kwargs):
        return super().update(request, *args, **kwargs)
    
    @admin_permission_required('content', 'delete')
    def destroy(self, request, *args, **kwargs):
        return super().destroy(request, *args, **kwargs)

class CarBrandViewSet(viewsets.ModelViewSet):
    """Araba markası yönetimi"""
    queryset = CarBrand.objects.all()
    serializer_class = CarBrandSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    @admin_permission_required('content', 'read')
    def list(self, request, *args, **kwargs):
        return super().list(request, *args, **kwargs)
    
    @admin_permission_required('content', 'write')
    def create(self, request, *args, **kwargs):
        return super().create(request, *args, **kwargs)
    
    @admin_permission_required('content', 'write')
    def update(self, request, *args, **kwargs):
        return super().update(request, *args, **kwargs)
    
    @admin_permission_required('content', 'delete')
    def destroy(self, request, *args, **kwargs):
        return super().destroy(request, *args, **kwargs)

class SystemLogViewSet(viewsets.ReadOnlyModelViewSet):
    """Sistem log görüntüleme"""
    queryset = SystemLog.objects.all()
    serializer_class = SystemLogSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    @admin_permission_required('logs', 'read')
    def list(self, request, *args, **kwargs):
        return super().list(request, *args, **kwargs)

class AnalyticsDataViewSet(viewsets.ReadOnlyModelViewSet):
    """Analitik veri görüntüleme"""
    queryset = AnalyticsData.objects.all()
    serializer_class = AnalyticsDataSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    @admin_permission_required('analytics', 'read')
    def list(self, request, *args, **kwargs):
        return super().list(request, *args, **kwargs)

class AdminNotificationViewSet(viewsets.ModelViewSet):
    """Admin bildirim yönetimi"""
    queryset = AdminNotification.objects.all()
    serializer_class = AdminNotificationSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    @admin_permission_required('dashboard', 'read')
    def list(self, request, *args, **kwargs):
        return super().list(request, *args, **kwargs)
    
    @admin_permission_required('dashboard', 'write')
    def create(self, request, *args, **kwargs):
        return super().create(request, *args, **kwargs)
    
    @admin_permission_required('dashboard', 'write')
    def update(self, request, *args, **kwargs):
        return super().update(request, *args, **kwargs)
    
    @admin_permission_required('dashboard', 'delete')
    def destroy(self, request, *args, **kwargs):
        return super().destroy(request, *args, **kwargs)

class AdminSettingsViewSet(viewsets.ModelViewSet):
    """Admin ayar yönetimi"""
    queryset = AdminSettings.objects.all()
    serializer_class = AdminSettingsSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    @admin_permission_required('settings', 'read')
    def list(self, request, *args, **kwargs):
        return super().list(request, *args, **kwargs)
    
    @admin_permission_required('settings', 'write')
    def create(self, request, *args, **kwargs):
        return super().create(request, *args, **kwargs)
    
    @admin_permission_required('settings', 'write')
    def update(self, request, *args, **kwargs):
        return super().update(request, *args, **kwargs)
    
    @admin_permission_required('settings', 'delete')
    def destroy(self, request, *args, **kwargs):
        return super().destroy(request, *args, **kwargs)