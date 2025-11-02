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
from core.models import CustomUser

logger = logging.getLogger('admin_panel.views')
from .services import HostingerAPIService
from .models import *
from .serializers import *
from core.models import CustomUser, ServiceArea, Category, CarBrand, SupportTicket, SupportMessage
from vendors.models import VendorProfile, Review

# Helper function for admin logging
def create_admin_log(level, message, module, request, admin_user=None):
    """Create SystemLog with admin user info in message"""
    if admin_user:
        message_with_user = f"{message} (admin_email={admin_user.email} admin_id={admin_user.id})"
    else:
        message_with_user = message
    
    return SystemLog.objects.create(
        level=level,
        message=message_with_user,
        module=module,
        ip_address=request.META.get('REMOTE_ADDR'),
        user_agent=request.META.get('HTTP_USER_AGENT', '')
    )

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
        total_users = CustomUser.objects.filter(role='client').count()
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
    queryset = CustomUser.objects.all()  # Tüm kullanıcıları getir (client ve vendor)
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
    
    @action(detail=False, methods=['get'], url_path='search-minimal')
    def search_minimal(self, request):
        """
         Yalnızca id ve display_name değerlerini döndüren optimize edilmiş satıcı arama uç noktası.
        Yönetici panelinde açılır menü/otomatik tamamlama kullanımı için tasarlanmıştır.
        Veritabanı yükünü en aza indirmek için yoğun şekilde önbelleğe alınmıştır. Yalnızca id ve display_name değerlerini döndüren optimize edilmiş satıcı arama uç noktası.
        Yönetici panelinde açılır menü/otomatik tamamlama kullanımı için tasarlanmıştır.
        Veritabanı yükünü en aza indirmek için yoğun şekilde önbelleğe alınmıştır.
        """
        search_query = request.query_params.get('q', '').strip()
        
        # Minimum 2 characters to search
        if len(search_query) < 2:
            return Response({
                'results': [],
                'count': 0
            })
        
        # Build cache key
        cache_key = f'vendor_search_{hashlib.md5(search_query.lower().encode()).hexdigest()}'
        
        # Check cache first (5 minute TTL)
        cached_result = cache.get(cache_key)
        if cached_result is not None:
            return Response(cached_result)
        
        # Perform optimized database query
        # Only select id and display_name to minimize data transfer
        queryset = VendorProfile.objects.values('id', 'display_name')
        
        # Search by display_name (most common use case)
        queryset = queryset.filter(display_name__icontains=search_query)
        
        # Limit to 20 results for performance
        results = list(queryset[:10])
        
        response_data = {
            'results': results,
            'count': len(results)
        }
        
        # Cache the result for 5 minutes
        cache.set(cache_key, response_data, 300)
        
        return Response(response_data)

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
        
        serializer = self.get_serializer(page_obj.object_list, many=True, context={'request': request})
        
        return Response({
            'results': serializer.data,
            'count': paginator.count,
            'page': page,
            'page_size': page_size,
            'total_pages': paginator.num_pages,
        })
    
    @admin_permission_required('blog', 'read')
    def retrieve(self, request, *args, **kwargs):
        """Get single blog post with request context for absolute URLs"""
        instance = self.get_object()
        serializer = self.get_serializer(instance, context={'request': request})
        return Response(serializer.data)
    
    @admin_permission_required('blog', 'write')
    def create(self, request, *args, **kwargs):
        data = request.data.copy()
        
        # Handle featured_image and og_image URL strings (convert to file objects)
        for field_name in ['featured_image', 'og_image']:
            if field_name in data:
                field_value = data.get(field_name)
                # If it's a string (URL path), try to load file from storage
                if isinstance(field_value, str) and field_value.strip():
                    try:
                        from django.core.files.storage import default_storage
                        from django.core.files.base import ContentFile
                        import os
                        
                        # Normalize URL to file path
                        # Handle absolute URLs (http://localhost:8000/media/...)
                        original_url = field_value
                        if '://' in field_value:
                            # Extract path from absolute URL: http://localhost:8000/media/blog/images/abc.jpg
                            # Split by :// and get path part
                            parts = field_value.split('://', 1)[1].split('/', 1)
                            if len(parts) > 1:
                                # parts[1] is now: media/blog/images/abc.jpg
                                file_path = parts[1]
                            else:
                                file_path = field_value
                        else:
                            file_path = field_value
                        
                        # Remove query params
                        file_path = file_path.split('?')[0]
                        
                        # Remove /media/, /api/admin/media/ prefixes
                        # Handle both /media/ and media/ formats
                        if file_path.startswith('/media/'):
                            file_path = file_path[7:]  # Remove '/media/'
                        elif file_path.startswith('media/'):
                            file_path = file_path[6:]  # Remove 'media/'
                        elif file_path.startswith('/api/admin/media/'):
                            file_path = file_path[17:]  # Remove '/api/admin/media/'
                        elif file_path.startswith('api/admin/media/'):
                            file_path = file_path[16:]  # Remove 'api/admin/media/'
                        
                        # Remove leading slash if exists
                        file_path = file_path.lstrip('/')
                        
                        logger.info(f"{field_name} original URL: {original_url}, normalized path: {file_path}")
                        
                        # Check if file exists in storage
                        if default_storage.exists(file_path):
                            # Read file from storage
                            file_content = default_storage.open(file_path, 'rb').read()
                            file_name = os.path.basename(file_path)
                            
                            # Create ContentFile for ImageField
                            django_file = ContentFile(file_content, name=file_name)
                            
                            # Set file in data
                            data[field_name] = django_file
                            logger.info(f"{field_name} loaded from storage path: {file_path}")
                        else:
                            # File doesn't exist, remove from data
                            logger.warning(f"{field_name} URL path not found in storage: {file_path}. Removing from data.")
                            data.pop(field_name, None)
                    except Exception as e:
                        logger.error(f"Error loading {field_name} from URL: {e}. Removing from data.")
                        data.pop(field_name, None)
                elif isinstance(field_value, str) and not field_value.strip():
                    # Empty string - set to None
                    data[field_name] = None
        
        # Set published_at if status is published
        if data.get('status') == 'published' and not data.get('published_at'):
            data['published_at'] = timezone.now().isoformat()
        
        serializer = self.get_serializer(data=data)
        serializer.is_valid(raise_exception=True)
        # Save with created_by=request.user (admin who created it)
        blog = serializer.save(created_by=request.user)
        
        # Activity log
        from .activity_logger import log_blog_activity
        if blog.status == 'published':
            log_blog_activity(
                f'Yeni blog yazısı yayınlandı: {blog.title[:50]}...',
                {
                    'blog_id': blog.id,
                    'title': blog.title,
                    'slug': blog.slug,
                    'author': request.user.email if request.user else None
                }
            )
        else:
            log_blog_activity(
                f'Yeni blog yazısı oluşturuldu: {blog.title[:50]}...',
                {
                    'blog_id': blog.id,
                    'title': blog.title,
                    'slug': blog.slug,
                    'status': blog.status,
                    'author': request.user.email if request.user else None
                }
            )
        
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)
    
    @admin_permission_required('blog', 'write')
    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        
        data = request.data.copy()
        
        # Remove created_by from data - it should not be changed on update
        if 'created_by' in data:
            data.pop('created_by', None)
        
        # Handle featured_image and og_image URL strings
        # ImageField can't accept URL strings directly, only file uploads
        # If URL string is provided, check if it matches current file
        # If it matches, remove from data (no change needed)
        # If it doesn't match or file doesn't exist, remove from data (keep existing file)
        for field_name in ['featured_image', 'og_image']:
            if field_name in data:
                field_value = data.get(field_name)
                # If it's a string (URL path), handle it
                if isinstance(field_value, str):
                    current_file = getattr(instance, field_name, None)
                    if current_file:
                        # Normalize paths for comparison
                        # Normalize incoming URL to storage path
                        field_path_for_compare = field_value
                        if '://' in field_value:
                            # Extract path from absolute URL
                            parts = field_value.split('://', 1)[1].split('/', 1)
                            if len(parts) > 1:
                                field_path_for_compare = parts[1]  # media/blog/images/abc.jpg
                            else:
                                field_path_for_compare = field_value
                        else:
                            field_path_for_compare = field_value
                        
                        # Remove query params
                        field_path_for_compare = field_path_for_compare.split('?')[0]
                        
                        # Remove /media/, /api/admin/media/ prefixes
                        if field_path_for_compare.startswith('/media/'):
                            field_path = field_path_for_compare[7:]  # Remove '/media/'
                        elif field_path_for_compare.startswith('media/'):
                            field_path = field_path_for_compare[6:]  # Remove 'media/'
                        elif field_path_for_compare.startswith('/api/admin/media/'):
                            field_path = field_path_for_compare[17:]  # Remove '/api/admin/media/'
                        elif field_path_for_compare.startswith('api/admin/media/'):
                            field_path = field_path_for_compare[16:]  # Remove 'api/admin/media/'
                        else:
                            field_path = field_path_for_compare
                        
                        field_path = field_path.lstrip('/')
                        
                        # Normalize current file path
                        current_path = str(current_file).replace('/media/', '').replace('/api/admin/media/', '').lstrip('/')
                        
                        logger.info(f"{field_name} comparison - incoming: {field_path}, current: {current_path}")
                        
                        if field_path == current_path or field_path == '':
                            # File hasn't changed or is empty, remove from update data
                            logger.info(f"{field_name} hasn't changed, keeping existing file")
                            data.pop(field_name, None)
                        else:
                            # Different path - load new file from storage
                            logger.info(f"{field_name} path changed from {current_path} to {field_path}, loading new file")
                            try:
                                from django.core.files.storage import default_storage
                                from django.core.files.base import ContentFile
                                import os
                                
                                # Normalize URL to file path
                                original_url = field_value
                                if '://' in field_value:
                                    # Extract path from absolute URL: http://localhost:8000/media/blog/images/abc.jpg
                                    # Split by :// and get path part
                                    parts = field_value.split('://', 1)[1].split('/', 1)
                                    if len(parts) > 1:
                                        # parts[1] is now: media/blog/images/abc.jpg
                                        file_path = parts[1]
                                    else:
                                        file_path = field_value
                                else:
                                    file_path = field_value
                                
                                # Remove query params
                                file_path = file_path.split('?')[0]
                                
                                # Remove /media/, /api/admin/media/ prefixes
                                # Handle both /media/ and media/ formats
                                if file_path.startswith('/media/'):
                                    file_path = file_path[7:]  # Remove '/media/'
                                elif file_path.startswith('media/'):
                                    file_path = file_path[6:]  # Remove 'media/'
                                elif file_path.startswith('/api/admin/media/'):
                                    file_path = file_path[17:]  # Remove '/api/admin/media/'
                                elif file_path.startswith('api/admin/media/'):
                                    file_path = file_path[16:]  # Remove 'api/admin/media/'
                                
                                # Remove leading slash if exists
                                file_path = file_path.lstrip('/')
                                
                                logger.info(f"{field_name} original URL: {original_url}, normalized path: {file_path}")
                                
                                # Check if file exists in storage
                                if default_storage.exists(file_path):
                                    # Read file from storage
                                    file_content = default_storage.open(file_path, 'rb').read()
                                    file_name = os.path.basename(file_path)
                                    
                                    # Create ContentFile for ImageField
                                    django_file = ContentFile(file_content, name=file_name)
                                    
                                    # Set file in data (this will replace existing file)
                                    data[field_name] = django_file
                                    logger.info(f"{field_name} loaded from storage path: {file_path}, file size: {len(file_content)} bytes")
                                else:
                                    # File doesn't exist in storage, log available files for debugging
                                    logger.warning(f"{field_name} URL path not found in storage: {file_path}")
                                    # Try to list files in blog/images/ directory for debugging
                                    try:
                                        import os
                                        blog_images_dir = 'blog/images/'
                                        if default_storage.exists(blog_images_dir):
                                            listed_files = default_storage.listdir(blog_images_dir)[1]  # Get files
                                            logger.info(f"Available files in {blog_images_dir}: {listed_files[:5]}...")  # Log first 5
                                    except Exception as e2:
                                        logger.error(f"Error listing files: {e2}")
                                    logger.warning(f"{field_name} not found, keeping existing file.")
                                    data.pop(field_name, None)
                            except Exception as e:
                                # Error loading file, keep existing file
                                logger.error(f"Error loading {field_name} from URL: {e}", exc_info=True)
                                data.pop(field_name, None)
                    else:
                        # No current file, but URL string provided - try to load file from URL/path
                        if field_value.strip() == '':
                            # Empty string - clear the field
                            data[field_name] = None
                            logger.info(f"{field_name} cleared (empty string)")
                        else:
                            # Try to load file from URL/path
                            try:
                                from django.core.files.storage import default_storage
                                from django.core.files.base import ContentFile
                                import os
                                
                                # Normalize URL to file path
                                # Handle absolute URLs (http://localhost:8000/media/...)
                                original_url = field_value
                                if '://' in field_value:
                                    # Extract path from absolute URL: http://localhost:8000/media/blog/images/abc.jpg
                                    # Split by :// and get path part
                                    parts = field_value.split('://', 1)[1].split('/', 1)
                                    if len(parts) > 1:
                                        # parts[1] is now: media/blog/images/abc.jpg
                                        file_path = parts[1]
                                    else:
                                        file_path = field_value
                                else:
                                    file_path = field_value
                                
                                # Remove query params
                                file_path = file_path.split('?')[0]
                                
                                # Remove /media/, /api/admin/media/ prefixes
                                # Handle both /media/ and media/ formats
                                if file_path.startswith('/media/'):
                                    file_path = file_path[7:]  # Remove '/media/'
                                elif file_path.startswith('media/'):
                                    file_path = file_path[6:]  # Remove 'media/'
                                elif file_path.startswith('/api/admin/media/'):
                                    file_path = file_path[17:]  # Remove '/api/admin/media/'
                                elif file_path.startswith('api/admin/media/'):
                                    file_path = file_path[16:]  # Remove 'api/admin/media/'
                                
                                # Remove leading slash if exists
                                file_path = file_path.lstrip('/')
                                
                                logger.info(f"{field_name} original URL: {original_url}, normalized path: {file_path}")
                                
                                # Check if file exists in storage
                                if default_storage.exists(file_path):
                                    # Read file from storage
                                    file_content = default_storage.open(file_path, 'rb').read()
                                    file_name = os.path.basename(file_path)
                                    
                                    # Create ContentFile for ImageField
                                    django_file = ContentFile(file_content, name=file_name)
                                    
                                    # Set file in data (this will be saved by serializer)
                                    data[field_name] = django_file
                                    logger.info(f"{field_name} loaded from storage path: {file_path}, file size: {len(file_content)} bytes")
                                else:
                                    # File doesn't exist in storage, log for debugging
                                    logger.warning(f"{field_name} URL path not found in storage: {file_path}")
                                    # Try to list files in blog/images/ directory for debugging
                                    try:
                                        blog_images_dir = 'blog/images/'
                                        if default_storage.exists(blog_images_dir):
                                            listed_files = default_storage.listdir(blog_images_dir)[1]  # Get files
                                            logger.info(f"Available files in {blog_images_dir}: {listed_files[:5]}...")  # Log first 5
                                    except Exception as e2:
                                        logger.error(f"Error listing files: {e2}")
                                    logger.warning(f"{field_name} not found, removing from data.")
                                    data.pop(field_name, None)
                            except Exception as e:
                                # Error loading file, remove from data
                                logger.error(f"Error loading {field_name} from URL: {e}", exc_info=True)
                                data.pop(field_name, None)
                # If it's None or empty string, keep as None to clear the field
                elif field_value is None or field_value == '':
                    data[field_name] = None
        
        # Set published_at if status is published and not already set
        if data.get('status') == 'published' and not instance.published_at:
            data['published_at'] = timezone.now().isoformat()
        
        serializer = self.get_serializer(instance, data=data, partial=partial)
        if not serializer.is_valid():
            # Log validation errors
            logger.error(f"Blog post update validation errors: {serializer.errors}")
            logger.error(f"Data sent: {data}")
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        self.perform_update(serializer)
        
        # Refresh instance to get updated image fields
        instance.refresh_from_db()
        
        # Return updated data with request context for absolute URLs
        serializer = self.get_serializer(instance, context={'request': request})
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
    """Görsel yükleme - Blog için resimleri 1200x630px boyutunda üretir"""
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
        
        try:
            from PIL import Image
            from io import BytesIO
            from django.core.files.base import ContentFile
            import uuid
            
            # Resmi aç
            img = Image.open(image_file)
            
            # RGBA'yı RGB'ye çevir (JPEG için)
            if img.mode in ('RGBA', 'LA', 'P'):
                # Transparent arka plan için beyaz arka plan oluştur
                background = Image.new('RGB', img.size, (255, 255, 255))
                if img.mode == 'RGBA':
                    background.paste(img, mask=img.split()[3])  # Alpha channel'ı mask olarak kullan
                else:
                    background.paste(img)
                img = background
            elif img.mode != 'RGB':
                img = img.convert('RGB')
            
            # 1200x630px boyutunda resize et (aspect ratio korunarak crop yapılacak)
            target_width = 1200
            target_height = 630
            target_aspect = target_width / target_height
            
            # Orijinal boyutları al
            original_width, original_height = img.size
            original_aspect = original_width / original_height
            
            # Resmi hedef boyutlara göre crop ve resize et
            if original_aspect > target_aspect:
                # Resim daha geniş, yükseklikten crop yap
                new_height = original_height
                new_width = int(original_height * target_aspect)
                left = (original_width - new_width) // 2
                img = img.crop((left, 0, left + new_width, new_height))
            else:
                # Resim daha yüksek, genişlikten crop yap
                new_width = original_width
                new_height = int(original_width / target_aspect)
                top = (original_height - new_height) // 2
                img = img.crop((0, top, new_width, top + new_height))
            
            # Resmi 1200x630px'e resize et
            img = img.resize((target_width, target_height), Image.Resampling.LANCZOS)
            
            # BytesIO'ya kaydet (JPEG formatında, optimize edilmiş)
            buffer = BytesIO()
            img.save(buffer, format='JPEG', quality=85, optimize=True)
            buffer.seek(0)
            
            # Dosya adını oluştur
            unique_filename = f"{uuid.uuid4()}_1200x630.jpg"
            
            # Django ContentFile objesi oluştur
            django_file = ContentFile(buffer.read(), name=unique_filename)
            
            # Save file
            from django.core.files.storage import default_storage
            file_path = f"blog/images/{unique_filename}"
            saved_path = default_storage.save(file_path, django_file)
            
            # Return URL
            file_url = default_storage.url(saved_path)
            
            return Response({'url': file_url}, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            logger.error(f"Image upload/resize error: {e}")
            return Response({
                'error': 'Görsel işlenirken hata oluştu',
                'details': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

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
        # Force sender_user and is_admin for admin side messages
        data = request.data.copy()
        data['sender_user'] = getattr(request.user, 'id', None)
        data['is_admin'] = True
        serializer = self.get_serializer(data=data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        # Ensure ticket status is at least 'pending' (Cevaplandı)
        try:
            msg = serializer.instance
            if msg and msg.ticket and msg.ticket.status not in ('resolved', 'closed') and msg.ticket.status != 'pending':
                from django.utils import timezone as dj_tz
                msg.ticket.status = 'pending'
                msg.ticket.updated_at = dj_tz.now()
                msg.ticket.save(update_fields=['status', 'updated_at'])
        except Exception:
            pass
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)
    
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
        qs = super().get_queryset().select_related('ticket', 'sender_user')
        ticket_id = self.request.query_params.get('ticket')
        if ticket_id and ticket_id.isdigit():
            qs = qs.filter(ticket_id=int(ticket_id))
        ordering = self.request.query_params.get('ordering')
        if ordering == '-created_at':
            qs = qs.order_by('-created_at')
        else:
            qs = qs.order_by('created_at')
        return qs

class ReviewViewSet(viewsets.ModelViewSet):
    """Müşteri yorumları yönetimi"""
    queryset = Review.objects.all()
    serializer_class = ReviewSerializer
    permission_classes = [permissions.IsAuthenticated]
    authentication_classes = [AdminTokenAuthentication]
    
    @admin_permission_required('vendors', 'read')
    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        
        # Search functionality
        search = request.query_params.get('search', None)
        if search:
            queryset = queryset.filter(
                models.Q(comment__icontains=search) |
                models.Q(user__email__icontains=search) |
                models.Q(user__first_name__icontains=search) |
                models.Q(user__last_name__icontains=search) |
                models.Q(vendor__display_name__icontains=search)
            )
        
        # Filter by user
        user_id = request.query_params.get('user', None)
        if user_id:
            queryset = queryset.filter(user_id=user_id)
        
        # Filter by vendor
        vendor_id = request.query_params.get('vendor', None)
        if vendor_id:
            queryset = queryset.filter(vendor_id=vendor_id)
        
        # Filter by rating
        rating = request.query_params.get('rating', None)
        if rating:
            queryset = queryset.filter(rating=rating)
        
        
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
    def update(self, request, *args, **kwargs):
        return super().update(request, *args, **kwargs)
    
    @admin_permission_required('vendors', 'delete')
    def destroy(self, request, *args, **kwargs):
        return super().destroy(request, *args, **kwargs)
    
    def get_queryset(self):
        return super().get_queryset().select_related('user', 'vendor', 'service')

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
    
    @action(detail=True, methods=['post'])
    def upload_logo(self, request, pk=None):
        """Araba markası logosu yükle"""
        try:
            brand = self.get_object()
            logo_file = request.FILES.get('logo')
            
            if not logo_file:
                return Response({
                    'error': 'Logo dosyası bulunamadı'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Dosya boyutunu kontrol et (5MB max)
            if logo_file.size > 5 * 1024 * 1024:
                return Response({
                    'error': 'Logo dosyası çok büyük (max 5MB)'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Dosya tipini kontrol et
            allowed_types = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
            if logo_file.content_type not in allowed_types:
                return Response({
                    'error': 'Geçersiz dosya tipi. Sadece JPEG, PNG, GIF ve WebP desteklenir'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Logo dosyasını kaydet
            brand.logo = logo_file
            brand.save()
            
            # Başarılı yükleme log'u
            SystemLog.objects.create(
                level='info',
                message=f'Araba markası logosu güncellendi: {brand.name}',
                module='content_management',
                ip_address=request.META.get('REMOTE_ADDR'),
                user_agent=request.META.get('HTTP_USER_AGENT', '')
            )
            
            return Response({
                'message': 'Logo başarıyla yüklendi',
                'logo_url': brand.logo.url if brand.logo else None
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            logger.error(f"Logo upload error: {e}")
            return Response({
                'error': 'Logo yüklenemedi',
                'details': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class SystemLogViewSet(viewsets.ReadOnlyModelViewSet):
    """Sistem log görüntüleme"""
    queryset = SystemLog.objects.all()
    serializer_class = SystemLogSerializer
    permission_classes = [permissions.IsAuthenticated]
    authentication_classes = [AdminTokenAuthentication]
    
    @admin_permission_required('logs', 'read')
    def list(self, request, *args, **kwargs):
        return super().list(request, *args, **kwargs)

class RecentActivitiesView(APIView):
    """Son aktiviteler - optimize edilmiş cache-based"""
    permission_classes = [permissions.IsAuthenticated]
    authentication_classes = [AdminTokenAuthentication]
    
    @admin_permission_required('dashboard', 'read')
    def get(self, request):
        """Son aktiviteleri getir - cache'den"""
        cache_key = 'admin_recent_activities'
        activities = cache.get(cache_key)
        
        if activities is None:
            activities = self._fetch_recent_activities()
            # 5 dakika cache
            cache.set(cache_key, activities, 300)
        
        return Response(activities, status=status.HTTP_200_OK)
    
    def _fetch_recent_activities(self):
        """SystemLog'dan son aktiviteleri getir - optimize edilmiş"""
        from django.utils import timezone
        
        # Son 10 aktiviteyi getir (sadece activity_type != 'system' olanlar)
        recent_activities = SystemLog.objects.filter(
            activity_type__in=['user_registered', 'vendor_created', 'support_ticket', 'blog_published', 'user_verified', 'vendor_verified']
        ).order_by('-created_at')[:10]
        
        activities = []
        for activity in recent_activities:
            # Activity type'a göre icon belirle
            icon_map = {
                'user_registered': 'Users',
                'vendor_created': 'Shield',
                'support_ticket': 'MessageSquare',
                'blog_published': 'FileText',
                'user_verified': 'Users',
                'vendor_verified': 'Shield',
            }
            
            # Type'a göre frontend type belirle
            type_map = {
                'user_registered': 'user',
                'vendor_created': 'vendor',
                'support_ticket': 'support',
                'blog_published': 'blog',
                'user_verified': 'user',
                'vendor_verified': 'vendor',
            }
            
            activities.append({
                'id': f'activity_{activity.id}',
                'type': type_map.get(activity.activity_type, 'user'),
                'message': activity.message,
                'time': self._get_time_ago(activity.created_at),
                'icon': icon_map.get(activity.activity_type, 'Users'),
                'data': activity.activity_data
            })
        
        return activities
    
    def _get_time_ago(self, datetime_obj):
        """Zaman farkını Türkçe olarak döndür"""
        from django.utils import timezone
        now = timezone.now()
        diff = now - datetime_obj
        
        if diff.days > 0:
            return f'{diff.days} gün önce'
        elif diff.seconds > 3600:
            hours = diff.seconds // 3600
            return f'{hours} saat önce'
        elif diff.seconds > 60:
            minutes = diff.seconds // 60
            return f'{minutes} dakika önce'
        else:
            return 'Az önce'

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

    @admin_permission_required('users', 'write')
    def create(self, request, *args, **kwargs):
        """Yeni admin oluşturma"""
        serializer = AdminUserCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        
        # Log admin creation
        create_admin_log(
            level='info',
            message=f"New admin created: {user.email} (role={user.role})",
            module='admin_management',
            request=request,
            admin_user=request.user
        )
        
        return Response(AdminUserSerializer(user).data, status=status.HTTP_201_CREATED)

# ========== Admin Permission Management ==========
class AdminPermissionViewSet(viewsets.ModelViewSet):
    """Admin permission yönetimi"""
    queryset = AdminPermission.objects.all()
    serializer_class = AdminPermissionSerializer
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

class AdminRoleManagementView(APIView):
    """Admin rol tanımları yönetimi"""
    permission_classes = [permissions.IsAuthenticated]
    authentication_classes = [AdminTokenAuthentication]

    @admin_permission_required('settings', 'read')
    def get(self, request):
        """Mevcut rol tanımlarını getir"""
        # AdminPermission modelinden rol tanımlarını oluştur
        roles = {}
        permissions = AdminPermission.objects.all()
        
        for perm in permissions:
            if perm.role not in roles:
                roles[perm.role] = {
                    'key': perm.role,
                    'name': dict(AdminPermission.ROLE_CHOICES).get(perm.role, perm.role.title()),
                    'description': f'{perm.role.title()} rolü',
                    'permissions': {}
                }
            
            roles[perm.role]['permissions'][perm.permission] = {
                'read': perm.can_read,
                'write': perm.can_write,
                'delete': perm.can_delete
            }
        
        return Response(list(roles.values()))

    @admin_permission_required('settings', 'write')
    def post(self, request):
        """Rol tanımlarını güncelle"""
        roles_data = request.data.get('roles', [])
        
        # Mevcut permission'ları temizle
        AdminPermission.objects.all().delete()
        
        # Yeni permission'ları oluştur
        for role_data in roles_data:
            role_key = role_data.get('key')
            permissions = role_data.get('permissions', {})
            
            for permission_key, perm_data in permissions.items():
                AdminPermission.objects.create(
                    role=role_key,
                    permission=permission_key,
                    can_read=perm_data.get('read', False),
                    can_write=perm_data.get('write', False),
                    can_delete=perm_data.get('delete', False)
                )
        
        # Log role update
        SystemLog.objects.create(
            level='info',
            message=f"Admin roles updated by {getattr(request.user, 'email', 'unknown')}",
            module='admin_management',
            ip_address=request.META.get('REMOTE_ADDR'),
            user_agent=request.META.get('HTTP_USER_AGENT', '')
        )
        
        return Response({'message': 'Rol tanımları güncellendi'}, status=status.HTTP_200_OK)

# ========== Server Monitoring Views ==========
class ServerMonitoringView(APIView):
    """Sunucu monitoring API'si"""
    permission_classes = []  # Geçici olarak devre dışı
    authentication_classes = []

    def get(self, request):
        """Tüm sunucuların monitoring verilerini getir"""
        try:
            # Gerçek monitoring servisini kullan
            from .server_monitoring import RealServerMonitoringService
            
            real_monitoring = RealServerMonitoringService()
            servers_data = real_monitoring.get_all_servers_summary()
            
            return Response({
                'servers': servers_data,
                'total_servers': len(servers_data),
                'timestamp': timezone.now().isoformat()
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            logger.error(f"Server monitoring error: {e}")
            return Response({
                'error': 'Sunucu verileri alınamadı',
                'details': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class ServerDetailView(APIView):
    """Belirli bir sunucunun detaylı bilgileri"""
    permission_classes = []  # Geçici olarak devre dışı
    authentication_classes = []

    def get(self, request, server_id):
        """Sunucu detaylarını getir"""
        try:
            hostinger_service = HostingerAPIService()
            server_data = hostinger_service.get_server_monitoring_data(server_id)
            
            if not server_data:
                return Response({
                    'error': 'Sunucu bulunamadı'
                }, status=status.HTTP_404_NOT_FOUND)
            
            # Detaylı formatla
            formatted_data = {
                'id': server_data.get('id'),
                'name': server_data.get('name'),
                'os': f"{server_data.get('os')} {server_data.get('os_version')}",
                'ip_address': server_data.get('ip_address'),
                'status': server_data.get('status'),
                'region': server_data.get('region'),
                'created_at': server_data.get('created_at'),
                'ssh_command': f"ssh root@{server_data.get('ip_address')}",
                'metrics': {
                    'cpu_usage': hostinger_service.format_percentage(server_data.get('cpu_usage', 0)),
                    'cpu_raw': server_data.get('cpu_usage', 0),
                    'memory_usage': hostinger_service.format_percentage(server_data.get('memory_usage', 0)),
                    'memory_raw': server_data.get('memory_usage', 0),
                    'memory_used': hostinger_service.format_bytes(server_data.get('memory_used', 0)),
                    'memory_total': hostinger_service.format_bytes(server_data.get('memory_total', 0)),
                    'disk_usage': f"{hostinger_service.format_bytes(server_data.get('disk_used', 0))} / {hostinger_service.format_bytes(server_data.get('disk_total', 0))}",
                    'disk_percentage': hostinger_service.format_percentage(server_data.get('disk_usage', 0)),
                    'disk_raw': server_data.get('disk_usage', 0),
                    'network_in': hostinger_service.format_bytes(server_data.get('network_in', 0)),
                    'network_out': hostinger_service.format_bytes(server_data.get('network_out', 0)),
                    'bandwidth_usage': f"{hostinger_service.format_bytes(server_data.get('bandwidth_used', 0))} / {hostinger_service.format_bytes(server_data.get('bandwidth_total', 0))}",
                    'bandwidth_raw': server_data.get('bandwidth_used', 0),
                    'uptime': server_data.get('uptime', 0),
                    'load_average': server_data.get('load_average', [0, 0, 0]),
                }
            }
            
            return Response(formatted_data, status=status.HTTP_200_OK)
            
        except Exception as e:
            logger.error(f"Server detail error: {e}")
            return Response({
                'error': 'Sunucu detayları alınamadı',
                'details': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class ServerActionView(APIView):
    """Sunucu aksiyonları (restart, etc.)"""
    permission_classes = []  # Geçici olarak devre dışı
    authentication_classes = []

    def post(self, request, server_id):
        """Sunucu aksiyonu gerçekleştir"""
        action = request.data.get('action')
        
        if not action:
            return Response({
                'error': 'Aksiyon belirtilmedi'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            hostinger_service = HostingerAPIService()
            
            if action == 'restart':
                success = hostinger_service.restart_vm(server_id)
                if success:
                    return Response({
                        'message': 'Sunucu yeniden başlatılıyor...',
                        'action': 'restart',
                        'server_id': server_id
                    }, status=status.HTTP_200_OK)
                else:
                    return Response({
                        'error': 'Sunucu yeniden başlatılamadı'
                    }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            else:
                return Response({
                    'error': 'Geçersiz aksiyon'
                }, status=status.HTTP_400_BAD_REQUEST)
                
        except Exception as e:
            logger.error(f"Server action error: {e}")
            return Response({
                'error': 'Aksiyon gerçekleştirilemedi',
                'details': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# ========== Domain Management Views ==========
class DomainViewSet(viewsets.ModelViewSet):
    """Domain yönetimi"""
    queryset = Domain.objects.all()
    serializer_class = DomainSerializer
    permission_classes = []  # Geçici olarak devre dışı
    authentication_classes = []
    
    def get_serializer_class(self):
        if self.action == 'create':
            return DomainCreateSerializer
        elif self.action in ['update', 'partial_update']:
            return DomainUpdateSerializer
        return DomainSerializer
    
    def list(self, request):
        """Domain listesi"""
        try:
            domains = Domain.objects.all().order_by('name')
            serializer = self.get_serializer(domains, many=True)
            
            return Response({
                'domains': serializer.data,
                'total': domains.count(),
                'expiring_soon': domains.filter(status='expiring_soon').count(),
                'expired': domains.filter(status='expired').count(),
                'active': domains.filter(status='active').count()
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            logger.error(f"Domain list error: {e}")
            return Response({
                'error': 'Domain listesi alınamadı',
                'details': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    def create(self, request):
        """Yeni domain ekle"""
        try:
            serializer = self.get_serializer(data=request.data)
            if serializer.is_valid():
                domain = serializer.save()
                
                # Başarılı oluşturma log'u
                create_admin_log(
                    level='info',
                    message=f'Yeni domain eklendi: {domain.name}',
                    module='domain_management',
                    request=request,
                    admin_user=request.user
                )
                
                return Response({
                    'message': 'Domain başarıyla eklendi',
                    'domain': DomainSerializer(domain).data
                }, status=status.HTTP_201_CREATED)
            else:
                return Response({
                    'error': 'Geçersiz veri',
                    'details': serializer.errors
                }, status=status.HTTP_400_BAD_REQUEST)
                
        except Exception as e:
            logger.error(f"Domain create error: {e}")
            return Response({
                'error': 'Domain eklenemedi',
                'details': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    def update(self, request, pk=None):
        """Domain güncelle"""
        try:
            domain = self.get_object()
            serializer = self.get_serializer(domain, data=request.data, partial=True)
            
            if serializer.is_valid():
                updated_domain = serializer.save()
                
                return Response({
                    'message': 'Domain başarıyla güncellendi',
                    'domain': DomainSerializer(updated_domain).data
                }, status=status.HTTP_200_OK)
            else:
                return Response({
                    'error': 'Geçersiz veri',
                    'details': serializer.errors
                }, status=status.HTTP_400_BAD_REQUEST)
                
        except Exception as e:
            logger.error(f"Domain update error: {e}")
            return Response({
                'error': 'Domain güncellenemedi',
                'details': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    def destroy(self, request, pk=None):
        """Domain sil"""
        try:
            domain = self.get_object()
            domain_name = domain.name
            domain.delete()
            
            # Silme log'u
            SystemLog.objects.create(
                level='info',
                message=f'Domain silindi: {domain_name}',
                module='domain_management',
                ip_address=request.META.get('REMOTE_ADDR'),
                user_agent=request.META.get('HTTP_USER_AGENT', '')
            )
            
            return Response({
                'message': 'Domain başarıyla silindi'
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            logger.error(f"Domain delete error: {e}")
            return Response({
                'error': 'Domain silinemedi',
                'details': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=True, methods=['post'])
    def refresh(self, request, pk=None):
        """Domain bilgilerini yenile"""
        try:
            domain = self.get_object()
            from .domain_service import DomainService
            
            domain_service = DomainService()
            domain_info = domain_service.get_domain_info(domain.name)
            
            # Domain bilgilerini güncelle
            domain.registrar = domain_info['registrar']
            domain.registration_date = domain_info['registration_date']
            domain.expiration_date = domain_info['expiration_date']
            domain.nameservers = domain_info['nameservers']
            domain.admin_email = domain_info['admin_email']
            domain.tech_email = domain_info['tech_email']
            domain.status = domain_info['status']
            
            # days_until_expiry güncellenmiş olacak (save() metodu içinde hesaplanır)
            domain.save()
            
            # Refresh domain to get calculated fields
            domain.refresh_from_db()
            
            return Response({
                'message': 'Domain bilgileri başarıyla yenilendi',
                'domain': DomainSerializer(domain).data
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            logger.error(f"Domain refresh error: {e}")
            return Response({
                'error': 'Domain bilgileri yenilenemedi',
                'details': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=False, methods=['get'])
    def expiring_soon(self, request):
        """Yakında dolacak domainler"""
        try:
            days = int(request.query_params.get('days', 30))
            expiring_domains = Domain.objects.filter(
                status='expiring_soon',
                days_until_expiry__lte=days
            ).order_by('expiration_date')
            
            serializer = self.get_serializer(expiring_domains, many=True)
            
            return Response({
                'domains': serializer.data,
                'count': expiring_domains.count(),
                'days_threshold': days
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            logger.error(f"Expiring domains error: {e}")
            return Response({
                'error': 'Yakında dolacak domainler alınamadı',
                'details': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# ========== Hostinger Subscriptions Views ==========
class HostingerSubscriptionsView(APIView):
    """Hostinger subscriptions API'si"""
    permission_classes = []  # Geçici olarak devre dışı
    authentication_classes = []

    def get(self, request):
        """Tüm subscriptions'ları getir"""
        try:
            hostinger_service = HostingerAPIService()
            subscriptions = hostinger_service.get_subscriptions()
            
            return Response({
                'subscriptions': subscriptions,
                'total_subscriptions': len(subscriptions),
                'timestamp': timezone.now().isoformat()
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            logger.error(f"Subscriptions error: {e}")
            return Response({
                'error': 'Subscriptions verileri alınamadı',
                'details': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class HostingerSubscriptionDetailView(APIView):
    """Belirli bir subscription'ın detayları"""
    permission_classes = []
    authentication_classes = []

    def get(self, request, subscription_id):
        """Belirli bir subscription'ın detaylarını getir"""
        try:
            hostinger_service = HostingerAPIService()
            subscription = hostinger_service.get_subscription_details(subscription_id)
            
            if subscription:
                return Response({
                    'subscription': subscription,
                    'timestamp': timezone.now().isoformat()
                }, status=status.HTTP_200_OK)
            else:
                return Response({
                    'error': 'Subscription bulunamadı'
                }, status=status.HTTP_404_NOT_FOUND)
                
        except Exception as e:
            logger.error(f"Subscription detail error: {e}")
            return Response({
                'error': 'Subscription detayları alınamadı',
                'details': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)