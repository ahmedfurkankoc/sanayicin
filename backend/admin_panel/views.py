from rest_framework import viewsets, status, permissions
from django.db import models
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework.views import APIView
from django.core.paginator import Paginator
from .authentication import AdminTokenAuthentication
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
from django.utils import timezone

logger = logging.getLogger('admin_panel.views')
from .models import BlogCategory, BlogPost, SystemLog, AdminNotification, AdminSettings, AdminPermission, AdminUser
from .serializers import (
    BlogCategorySerializer, BlogPostSerializer, SystemLogSerializer,
    AdminNotificationSerializer, AdminSettingsSerializer,
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
            # Log invalid payload
            SystemLog.objects.create(
                level='warning',
                message='Admin login failed: invalid payload',
                module='admin_auth',
                ip_address=request.META.get('REMOTE_ADDR'),
                user_agent=request.META.get('HTTP_USER_AGENT', '')
            )
            return Response({'error': 'Geçersiz veri'}, status=status.HTTP_400_BAD_REQUEST)
        
        email = serializer.validated_data['email']
        password = serializer.validated_data['password']
        
        # AdminUser ile doğrulama
        try:
            admin_user = AdminUser.objects.get(email=email, is_active=True)
        except AdminUser.DoesNotExist:
            SystemLog.objects.create(
                level='warning',
                message=f'Admin login failed: user not found (email={email})',
                module='admin_auth',
                ip_address=request.META.get('REMOTE_ADDR'),
                user_agent=request.META.get('HTTP_USER_AGENT', '')
            )
            return Response({'error': 'Kullanıcı bulunamadı'}, status=status.HTTP_401_UNAUTHORIZED)
        
        # Password check
        if not admin_user.check_password(password):
            SystemLog.objects.create(
                level='warning',
                message=f'Admin login failed: wrong password (email={email})',
                module='admin_auth',
                ip_address=request.META.get('REMOTE_ADDR'),
                user_agent=request.META.get('HTTP_USER_AGENT', '')
            )
            return Response({'error': 'Geçersiz şifre'}, status=status.HTTP_401_UNAUTHORIZED)
        
        # Admin erişim kontrolü
        if not self._can_access_admin(admin_user):
            SystemLog.objects.create(
                level='warning',
                message=f"Admin login failed: no admin access (email={admin_user.email})",
                module='admin_auth',
                # SystemLog.user FK is CustomUser; avoid mismatched FK for admin
                ip_address=request.META.get('REMOTE_ADDR'),
                user_agent=request.META.get('HTTP_USER_AGENT', '')
            )
            return Response({'error': 'Admin paneline erişim yetkiniz yok'}, status=status.HTTP_403_FORBIDDEN)
        
        # Token oluştur
        token = self._generate_admin_token(admin_user)
        logger.info(f'Generated admin token for user {admin_user.email}: {token[:10]}...')
        
        # Kullanıcı bilgilerini hazırla
        user_data = {
            'id': admin_user.id,
            'email': admin_user.email,
            'first_name': admin_user.first_name,
            'last_name': admin_user.last_name,
            'role': admin_user.role,
            'is_superuser': admin_user.is_superuser,
            'permissions': AdminPermission.get_user_permissions(admin_user)
        }
        
        # HttpOnly admin cookie ayarla ve başarılı giriş logla
        SystemLog.objects.create(
            level='info',
            message=f"Admin login success (email={admin_user.email} user_id={admin_user.id})",
            module='admin_auth',
            # SystemLog.user is CustomUser; don't attach AdminUser here
            ip_address=request.META.get('REMOTE_ADDR'),
            user_agent=request.META.get('HTTP_USER_AGENT', '')
        )
        response = Response({
            'user': user_data,
            'token': token,
            'message': 'Giriş başarılı'
        }, status=status.HTTP_200_OK)

        # Cookie özellikleri (lokalde Secure kapalı, SameSite=Lax; prod'da Secure+None)
        is_debug = getattr(settings, 'DEBUG', False)
        secure_cookie = False if is_debug else True
        samesite_policy = 'Lax' if is_debug else 'None'
        # Cookie domain'ini None yap (subdomain sorunu için)
        cookie_domain = None
        cookie_path = '/'
        max_age_seconds = 60 * 60 * 24  # 24 saat

        response.set_cookie(
            key='admin_token',
            value=token,
            httponly=True,
            secure=secure_cookie,
            samesite=samesite_policy,
            domain=cookie_domain,
            path=cookie_path,
            max_age=max_age_seconds
        )

        return response
    
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
        cache_key = f"admin_token_{token_hash}"
        token_data = {
            'user_id': user.id,
            'email': user.email,
            'role': user.role,
            'is_superuser': user.is_superuser,
            'expires_at': datetime.utcnow() + timedelta(hours=24),
            'type': 'admin'
        }
        cache.set(cache_key, token_data, timeout=3600 * 24 * 30)  # 30 gün
        logger.info(f'Generated admin token for user {user.email}: {token_hash[:10]}...')
        
        return token_hash

class AdminLogoutView(APIView):
    """Admin paneli logout API'si"""
    permission_classes = [permissions.IsAuthenticated]
    authentication_classes = [AdminTokenAuthentication]
    
    def post(self, request):
        # Cookie'den token'ı al ve cache'den temizle
        token = request.COOKIES.get('admin_token')
        if token:
            cache.delete(f"admin_token_{token}")
        # Log logout
        try:
            SystemLog.objects.create(
                level='info',
                message=f"Admin logout (email={getattr(request.user, 'email', None)} user_id={getattr(request.user, 'id', None)})",
                module='admin_auth',
                # avoid attaching AdminUser to SystemLog.user (FK to CustomUser)
                ip_address=request.META.get('REMOTE_ADDR'),
                user_agent=request.META.get('HTTP_USER_AGENT', '')
            )
        except Exception:
            pass

        response = Response({'message': 'Başarıyla çıkış yapıldı'}, status=status.HTTP_200_OK)
        cookie_domain = getattr(settings, 'SESSION_COOKIE_DOMAIN', None) or None
        response.delete_cookie('admin_token', path='/', domain=cookie_domain)
        return response

@method_decorator(csrf_exempt, name='dispatch')
class AdminUserInfoView(APIView):
    """Admin kullanıcı bilgileri"""
    permission_classes = [permissions.IsAuthenticated]
    authentication_classes = [AdminTokenAuthentication]
    
    def get(self, request):
        user = getattr(request, 'user', None)
        if user and getattr(user, 'is_authenticated', False):
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
        return Response({'detail': 'Not authenticated'}, status=status.HTTP_401_UNAUTHORIZED)

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
    authentication_classes = [AdminTokenAuthentication]
    
    @admin_permission_required('dashboard')
    def get(self, request):
        now = timezone.now()
        window_days = 30
        curr_start = now - timedelta(days=window_days)
        prev_start = now - timedelta(days=window_days * 2)

        # Helper to compute percent change
        def pct(curr: int, prev: int) -> float:
            if prev <= 0 and curr <= 0:
                return 0.0
            if prev <= 0:
                return 100.0
            return ((curr - prev) / prev) * 100.0

        # Totals
        total_users = CustomUser.objects.all().count()
        total_vendors = CustomUser.objects.filter(role='vendor').count()
        total_admins = AdminUser.objects.filter(is_active=True).count()
        published_blog_posts = BlogPost.objects.filter(status='published').count()
        active_service_areas = ServiceArea.objects.count()
        active_categories = Category.objects.count()
        active_car_brands = CarBrand.objects.filter(is_active=True).count()

        # Windowed counts for change
        users_curr = CustomUser.objects.filter(date_joined__gte=curr_start).count()
        users_prev = CustomUser.objects.filter(date_joined__gte=prev_start, date_joined__lt=curr_start).count()

        vendors_curr = CustomUser.objects.filter(role='vendor', date_joined__gte=curr_start).count()
        vendors_prev = CustomUser.objects.filter(role='vendor', date_joined__gte=prev_start, date_joined__lt=curr_start).count()

        blogs_curr = BlogPost.objects.filter(created_at__gte=curr_start).count()
        blogs_prev = BlogPost.objects.filter(created_at__gte=prev_start, created_at__lt=curr_start).count()

        tickets_curr = SupportTicket.objects.filter(created_at__gte=curr_start).count()
        tickets_prev = SupportTicket.objects.filter(created_at__gte=prev_start, created_at__lt=curr_start).count()
        
        # Pending support tickets (for dashboard display)
        pending_support_tickets = SupportTicket.objects.filter(status='open').count()

        stats = {
            'total_users': total_users,
            'total_vendors': total_vendors,
            'total_admins': total_admins,
            'support_tickets': tickets_curr,
            'pending_support_tickets': pending_support_tickets,
            'published_blog_posts': published_blog_posts,
            'active_service_areas': active_service_areas,
            'active_categories': active_categories,
            'active_car_brands': active_car_brands,
            'users_change_pct': pct(users_curr, users_prev),
            'vendors_change_pct': pct(vendors_curr, vendors_prev),
            'blog_change_pct': pct(blogs_curr, blogs_prev),
            'support_change_pct': pct(tickets_curr, tickets_prev),
        }
        
        return Response(stats, status=status.HTTP_200_OK)

# Recent Admin Auth Logs
class AdminAuthLogsView(APIView):
    """List recent admin auth logs (success/failure)."""
    permission_classes = [permissions.IsAuthenticated]
    authentication_classes = [AdminTokenAuthentication]

    @admin_permission_required('logs', 'read')
    def get(self, request):
        try:
            limit = int(request.GET.get('limit', '10'))
        except Exception:
            limit = 10
        try:
            page = int(request.GET.get('page', '1'))
        except Exception:
            page = 1
        limit = max(1, min(limit, 200))
        page = max(1, page)
        qs = SystemLog.objects.filter(module='admin_auth').order_by('-created_at')
        total_count = qs.count()
        offset = (page - 1) * limit
        logs = qs[offset:offset+limit]
        data = []
        for log in logs:
            raw_message = log.message or ''
            email = None
            user_id = None

            # Fast non-regex parse: look inside first parentheses
            start = raw_message.find('(')
            end = raw_message.find(')', start + 1) if start != -1 else -1
            if start != -1 and end != -1 and end > start + 1:
                inner = raw_message[start + 1:end]
                # split by space or comma
                for token in inner.replace(',', ' ').split():
                    if token.startswith('email='):
                        email = token[len('email='):]
                    elif token.startswith('username=') and not email:
                        email = token[len('username='):]
                    elif token.startswith('user_id='):
                        val = token[len('user_id='):]
                        if val.isdigit():
                            user_id = int(val)

            # Complete missing piece from AdminUser if possible
            if email and user_id is None:
                au = AdminUser.objects.filter(email=email).only('id').first()
                if au:
                    user_id = au.id
            elif (email is None) and (user_id is not None):
                au = AdminUser.objects.filter(id=user_id).only('email').first()
                if au:
                    email = au.email

            # Build normalized message with user_id for display (without regex)
            display_message = raw_message
            if user_id is not None and start != -1 and end != -1 and end > start:
                display_message = raw_message[:start] + f"(user_id={user_id})" + raw_message[end+1:]

            data.append({
                'id': log.id,
                'level': log.level,
                'message': display_message,
                'username': email,  # show email in the Kullanıcı column
                'ip_address': log.ip_address,
                'user_agent': log.user_agent,
                'created_at': log.created_at.isoformat(),
            })
        return Response({'results': data, 'count': total_count, 'page': page, 'limit': limit}, status=status.HTTP_200_OK)

# ViewSets
class UserViewSet(viewsets.ModelViewSet):
    """Kullanıcı yönetimi"""
    queryset = CustomUser.objects.all()
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]
    authentication_classes = [AdminTokenAuthentication]
    
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
    authentication_classes = [AdminTokenAuthentication]
    pagination_class = None  # We'll handle pagination manually
    
    @admin_permission_required('vendors', 'read')
    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        
        # Search functionality
        search = request.query_params.get('search', None)
        if search:
            queryset = queryset.filter(
                models.Q(display_name__icontains=search) |
                models.Q(company_title__icontains=search) |
                models.Q(user__email__icontains=search) |
                models.Q(user__first_name__icontains=search) |
                models.Q(user__last_name__icontains=search)
            )
        
        # Filter by verification status
        is_verified = request.query_params.get('is_verified', None)
        if is_verified is not None:
            queryset = queryset.filter(user__is_verified=is_verified.lower() == 'true')
        
        # Order by creation date (newest first)
        queryset = queryset.order_by('-created_at')
        
        # Manual pagination
        page_size = int(request.query_params.get('page_size', 20))
        page = int(request.query_params.get('page', 1))
        
        paginator = Paginator(queryset, page_size)
        total_count = paginator.count
        
        try:
            page_obj = paginator.page(page)
        except:
            page_obj = paginator.page(1)
            page = 1
        
        serializer = self.get_serializer(page_obj.object_list, many=True)
        
        return Response({
            'results': serializer.data,
            'count': total_count,
            'page': page,
            'page_size': page_size,
            'total_pages': paginator.num_pages
        })
    
    @admin_permission_required('vendors', 'write')
    def create(self, request, *args, **kwargs):
        return super().create(request, *args, **kwargs)
    
    @admin_permission_required('vendors', 'write')
    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        
        # User verification güncelleme
        if 'user' in request.data and 'is_verified' in request.data['user']:
            user = instance.user
            user.is_verified = request.data['user']['is_verified']
            user.save()
        
        return super().update(request, *args, **kwargs)
    
    @admin_permission_required('vendors', 'delete')
    def destroy(self, request, *args, **kwargs):
        return super().destroy(request, *args, **kwargs)

class BlogCategoryViewSet(viewsets.ModelViewSet):
    """Blog kategori yönetimi"""
    queryset = BlogCategory.objects.all()
    serializer_class = BlogCategorySerializer
    permission_classes = [permissions.IsAuthenticated]
    authentication_classes = [AdminTokenAuthentication]
    
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
    authentication_classes = [AdminTokenAuthentication]
    pagination_class = None  # Manual pagination
    
    @admin_permission_required('blog', 'read')
    def list(self, request, *args, **kwargs):
        # Manual pagination and filtering
        page = int(request.query_params.get('page', 1))
        page_size = int(request.query_params.get('page_size', 10))
        search = request.query_params.get('search', '')
        status = request.query_params.get('status', '')
        category = request.query_params.get('category', '')
        
        queryset = self.get_queryset()
        
        # Apply filters
        if search:
            queryset = queryset.filter(
                Q(title__icontains=search) |
                Q(content__icontains=search) |
                Q(author__first_name__icontains=search) |
                Q(author__last_name__icontains=search)
            )
        
        if status:
            queryset = queryset.filter(status=status)
            
        if category:
            queryset = queryset.filter(category_id=category)
        
        # Order by created_at desc
        queryset = queryset.order_by('-created_at')
        
        # Manual pagination
        paginator = Paginator(queryset, page_size)
        try:
            page_obj = paginator.page(page)
        except EmptyPage:
            page_obj = paginator.page(paginator.num_pages)
        
        serializer = self.get_serializer(page_obj.object_list, many=True)
        
        return Response({
            'results': serializer.data,
            'count': paginator.count,
            'page': page,
            'page_size': page_size,
            'total_pages': paginator.num_pages,
        })
    
    @admin_permission_required('blog', 'write')
    def create(self, request, *args, **kwargs):
        # Set author to current user
        data = request.data.copy()
        data['author'] = request.user.id
        
        # Set published_at if status is published
        if data.get('status') == 'published' and not data.get('published_at'):
            data['published_at'] = timezone.now().isoformat()
        
        serializer = self.get_serializer(data=data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)
    
    @admin_permission_required('blog', 'write')
    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        
        data = request.data.copy()
        
        # Set published_at if status is published and not already set
        if data.get('status') == 'published' and not instance.published_at:
            data['published_at'] = timezone.now().isoformat()
        
        serializer = self.get_serializer(instance, data=data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        
        return Response(serializer.data)
    
    @admin_permission_required('blog', 'delete')
    def destroy(self, request, *args, **kwargs):
        return super().destroy(request, *args, **kwargs)

class BlogCategoryViewSet(viewsets.ModelViewSet):
    """Blog kategori yönetimi"""
    queryset = BlogCategory.objects.all()
    serializer_class = BlogCategorySerializer
    permission_classes = [permissions.IsAuthenticated]
    authentication_classes = [AdminTokenAuthentication]
    
    @admin_permission_required('blog', 'read')
    def list(self, request, *args, **kwargs):
        return super().list(request, *args, **kwargs)
    
    @admin_permission_required('blog', 'write')
    def create(self, request, *args, **kwargs):
        return super().create(request, *args, **kwargs)
    
    @admin_permission_required('blog', 'write')
    def update(self, request, *args, **kwargs):
        return super().update(request, *args, **kwargs)
    
    @admin_permission_required('blog', 'write')
    def destroy(self, request, *args, **kwargs):
        return super().destroy(request, *args, **kwargs)

class ImageUploadView(APIView):
    """Görsel yükleme"""
    permission_classes = [permissions.IsAuthenticated]
    authentication_classes = [AdminTokenAuthentication]
    
    @admin_permission_required('blog', 'write')
    def post(self, request):
        if 'image' not in request.FILES:
            return Response({'error': 'Görsel dosyası bulunamadı'}, status=status.HTTP_400_BAD_REQUEST)
        
        image_file = request.FILES['image']
        
        # Validate file type
        allowed_types = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
        if image_file.content_type not in allowed_types:
            return Response({'error': 'Geçersiz dosya türü'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Validate file size (max 5MB)
        if image_file.size > 5 * 1024 * 1024:
            return Response({'error': 'Dosya boyutu 5MB\'dan büyük olamaz'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Generate unique filename
        import uuid
        file_extension = image_file.name.split('.')[-1]
        unique_filename = f"{uuid.uuid4()}.{file_extension}"
        
        # Save file
        from django.core.files.storage import default_storage
        file_path = f"blog/images/{unique_filename}"
        saved_path = default_storage.save(file_path, image_file)
        
        # Return URL
        file_url = default_storage.url(saved_path)
        
        return Response({'url': file_url}, status=status.HTTP_201_CREATED)

class SupportTicketViewSet(viewsets.ModelViewSet):
    """Destek talebi yönetimi"""
    queryset = SupportTicket.objects.all()
    serializer_class = SupportTicketSerializer
    permission_classes = [permissions.IsAuthenticated]
    authentication_classes = [AdminTokenAuthentication]
    
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

    def get_queryset(self):
        qs = super().get_queryset().order_by('-created_at')
        search = self.request.query_params.get('search')
        status_q = self.request.query_params.get('status')
        if search:
            qs = qs.filter(
                models.Q(subject__icontains=search) |
                models.Q(message__icontains=search) |
                models.Q(user__email__icontains=search)
            )
        if status_q:
            qs = qs.filter(status=status_q)
        return qs

class SupportMessageViewSet(viewsets.ModelViewSet):
    """Destek mesaj yönetimi"""
    queryset = SupportMessage.objects.all()
    serializer_class = SupportMessageSerializer
    permission_classes = [permissions.IsAuthenticated]
    authentication_classes = [AdminTokenAuthentication]
    
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

    def get_queryset(self):
        qs = super().get_queryset().select_related('ticket', 'user').order_by('created_at')
        ticket_id = self.request.query_params.get('ticket')
        if ticket_id and ticket_id.isdigit():
            qs = qs.filter(ticket_id=int(ticket_id))
        return qs

class ServiceAreaViewSet(viewsets.ModelViewSet):
    """Hizmet alanı yönetimi"""
    queryset = ServiceArea.objects.all()
    serializer_class = ServiceAreaSerializer
    permission_classes = [permissions.IsAuthenticated]
    authentication_classes = [AdminTokenAuthentication]
    
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

    def get_queryset(self):
        qs = super().get_queryset().order_by('name')
        search = self.request.query_params.get('search')
        if search:
            qs = qs.filter(models.Q(name__icontains=search) | models.Q(description__icontains=search))
        return qs

class CategoryViewSet(viewsets.ModelViewSet):
    """Kategori yönetimi"""
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [permissions.IsAuthenticated]
    authentication_classes = [AdminTokenAuthentication]
    
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

    def get_queryset(self):
        qs = super().get_queryset().select_related('service_area').order_by('name')
        search = self.request.query_params.get('search')
        if search:
            qs = qs.filter(models.Q(name__icontains=search) | models.Q(description__icontains=search) | models.Q(service_area__name__icontains=search))
        service_area = self.request.query_params.get('service_area')
        if service_area and service_area.isdigit():
            qs = qs.filter(service_area_id=int(service_area))
        return qs

class CarBrandViewSet(viewsets.ModelViewSet):
    """Araba markası yönetimi"""
    queryset = CarBrand.objects.all()
    serializer_class = CarBrandSerializer
    permission_classes = [permissions.IsAuthenticated]
    authentication_classes = [AdminTokenAuthentication]
    
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

    def get_queryset(self):
        qs = super().get_queryset().order_by('name')
        search = self.request.query_params.get('search')
        if search:
            qs = qs.filter(models.Q(name__icontains=search) | models.Q(description__icontains=search))
        is_active = self.request.query_params.get('is_active')
        if is_active is not None:
            if is_active.lower() in ('true', '1'):
                qs = qs.filter(is_active=True)
            elif is_active.lower() in ('false', '0'):
                qs = qs.filter(is_active=False)
        return qs

class SystemLogViewSet(viewsets.ReadOnlyModelViewSet):
    """Sistem log görüntüleme"""
    queryset = SystemLog.objects.all()
    serializer_class = SystemLogSerializer
    permission_classes = [permissions.IsAuthenticated]
    authentication_classes = [AdminTokenAuthentication]
    
    @admin_permission_required('logs', 'read')
    def list(self, request, *args, **kwargs):
        return super().list(request, *args, **kwargs)

class AdminNotificationViewSet(viewsets.ModelViewSet):
    """Admin bildirim yönetimi"""
    queryset = AdminNotification.objects.all()
    serializer_class = AdminNotificationSerializer
    permission_classes = [permissions.IsAuthenticated]
    authentication_classes = [AdminTokenAuthentication]
    
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
    authentication_classes = [AdminTokenAuthentication]
    
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


# ========== AdminUser Management ==========
class AdminUserViewSet(viewsets.ModelViewSet):
    """AdminUser list/update for role assignments in Definitions page"""
    queryset = AdminUser.objects.all().order_by('-date_joined')
    serializer_class = AdminUserSerializer
    permission_classes = [permissions.IsAuthenticated]
    authentication_classes = [AdminTokenAuthentication]

    @admin_permission_required('users', 'read')
    def list(self, request, *args, **kwargs):
        return super().list(request, *args, **kwargs)

    @admin_permission_required('users', 'write')
    def update(self, request, *args, **kwargs):
        # Permit updating limited fields (e.g., role, is_active, names)
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        allowed = {'role', 'is_active', 'first_name', 'last_name'}
        data = {k: v for k, v in request.data.items() if k in allowed}
        serializer = self.get_serializer(instance, data=data, partial=partial or True)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        return Response(serializer.data)

    @admin_permission_required('users', 'delete')
    def destroy(self, request, *args, **kwargs):
        return super().destroy(request, *args, **kwargs)