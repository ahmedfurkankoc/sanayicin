from rest_framework import generics, permissions, status, serializers
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from django.views.decorators.csrf import csrf_exempt, ensure_csrf_cookie
from django.utils.decorators import method_decorator
from rest_framework.views import APIView
from rest_framework.authentication import SessionAuthentication
from django.core.cache import cache
from django.core.paginator import Paginator, EmptyPage
from django.utils import timezone
from django.db.models import Count, Q
from datetime import timedelta
from .models import CustomUser, ServiceArea, Category, CarBrand, EmailVerification, Favorite, SupportTicket, SupportMessage, Vehicle
from .serializers import CustomUserSerializer, FavoriteSerializer, FavoriteCreateSerializer, SupportTicketSerializer, SupportMessageSerializer, SupportTicketDetailSerializer, VehicleSerializer, PublicBlogPostListSerializer, PublicBlogPostDetailSerializer
from admin_panel.models import BlogPost
from .utils.email_service import EmailService
from .utils.sms_service import IletiMerkeziSMS
from .utils.otp_service import OTPService
from .utils.password_validator import validate_strong_password_simple
from .utils.crypto import encrypt_text, decrypt_text
from core.tasks import send_otp_sms_async
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.settings import api_settings as sj_settings
from rest_framework_simplejwt.token_blacklist.models import BlacklistedToken
from vendors.models import VendorProfile
from admin_panel.models import BlogCategory
from admin_panel.activity_logger import log_support_activity, log_user_activity
import logging
import secrets
import json
from django.urls import reverse
import os
from django.contrib.auth.tokens import default_token_generator
from django.conf import settings

logger = logging.getLogger(__name__)

class ServiceAreaSerializer(serializers.ModelSerializer):
    class Meta:
        model = ServiceArea
        fields = ("id", "name", "description")

class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ("id", "name", "description", "service_area")


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_support_ticket(request):
    """Giriş yapmış kullanıcıdan destek talebi oluşturur (kullanıcıya bağlı)."""
    data = request.data.copy()
    # role ve requester bilgilerini sunucu tarafında bağla
    data['role'] = getattr(request.user, 'role', 'unknown')
    if not data.get('requester_email'):
        data['requester_email'] = request.user.email
    if not data.get('requester_name'):
        data['requester_name'] = getattr(request.user, 'full_name', '') or request.user.get_full_name() or request.user.email
    serializer = SupportTicketSerializer(data=data)
    if serializer.is_valid():
        ticket = serializer.save(user=request.user)
        
        # Activity log
        log_support_activity(
            f'Yeni destek talebi: {ticket.subject[:50]}...',
            {
                'ticket_id': ticket.id,
                'subject': ticket.subject,
                'priority': ticket.priority,
                'status': ticket.status,
                'user_email': request.user.email
            }
        )
        
        try:
            # E-posta bildirimi (opsiyonel, varsa)
            EmailService.send_generic_email(
                to_email=ticket.requester_email,
                subject=f"Destek Talebiniz Alındı - {ticket.public_id}",
                html_content=f"<p>Talebiniz alındı. Takip kodu: <b>{ticket.public_id}</b></p>"
            )
        except Exception:
            pass
        return Response(SupportTicketSerializer(ticket).data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([AllowAny])
def get_support_ticket_status(request, public_id: str):
    """Takip kodu ile bilet durumunu döndürür."""
    try:
        ticket = SupportTicket.objects.get(public_id=public_id)
    except SupportTicket.DoesNotExist:
        return Response({ 'detail': 'Ticket bulunamadı' }, status=404)
    data = {
        'public_id': ticket.public_id,
        'status': ticket.status,
        'priority': ticket.priority,
        'subject': ticket.subject,
        'created_at': ticket.created_at,
        'updated_at': ticket.updated_at,
    }
    return Response(data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def list_my_support_tickets(request):
    """Giriş yapan kullanıcının kendi destek taleplerini döndürür."""
    tickets = SupportTicket.objects.filter(user=request.user).order_by('-created_at')
    serializer = SupportTicketSerializer(tickets, many=True)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_support_ticket_details(request, ticket_id: str):
    """Destek talebi detaylarını ve mesajlarını döndürür."""
    try:
        ticket = SupportTicket.objects.get(id=ticket_id, user=request.user)
    except SupportTicket.DoesNotExist:
        return Response({'detail': 'Ticket bulunamadı'}, status=404)
    
    serializer = SupportTicketDetailSerializer(ticket)
    return Response(serializer.data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def send_support_message(request, ticket_id: str):
    """Destek talebine yeni mesaj gönderir."""
    try:
        ticket = SupportTicket.objects.get(id=ticket_id, user=request.user)
    except SupportTicket.DoesNotExist:
        return Response({'detail': 'Ticket bulunamadı'}, status=404)
    
    if ticket.status not in ['open', 'pending']:
        return Response({'detail': 'Bu ticket artık yanıt kabul etmiyor'}, status=400)
    
    message_content = request.data.get('message', '').strip()
    if not message_content:
        return Response({'detail': 'Mesaj içeriği gerekli'}, status=400)
    
    # Mesaj oluştur
    message = SupportMessage.objects.create(
        ticket=ticket,
        sender_user=request.user,
        is_admin=False,
        content=message_content
    )
    
    # Ticket'ı güncelle
    ticket.updated_at = timezone.now()
    ticket.save(update_fields=['updated_at'])
    
    serializer = SupportMessageSerializer(message)
    return Response(serializer.data, status=201)

class CarBrandSerializer(serializers.ModelSerializer):
    logo_url = serializers.SerializerMethodField()
    
    class Meta:
        model = CarBrand
        fields = ("id", "name", "logo", "logo_url", "description", "is_active")
    
    def get_logo_url(self, obj):
        if obj.logo:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.logo.url)
            # Fallback: relative URL
            return f"/media/{obj.logo.name}"
        return None

class ServiceAreaListView(generics.ListAPIView):
    queryset = ServiceArea.objects.all()
    serializer_class = ServiceAreaSerializer
    permission_classes = []
    pagination_class = None

class CategoryListView(generics.ListAPIView):
    serializer_class = CategorySerializer
    permission_classes = []
    pagination_class = None

    def get_queryset(self):
        qs = Category.objects.all()
        service_area = self.request.query_params.get("service_area")
        if service_area:
            qs = qs.filter(service_area_id=service_area)
        return qs

class CarBrandListView(generics.ListAPIView):
    queryset = CarBrand.objects.filter(is_active=True)
    serializer_class = CarBrandSerializer
    permission_classes = []
    pagination_class = None
    
    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context

# ===== Public Blog Views =====
@api_view(['GET'])
@permission_classes([AllowAny])
def public_blog_list(request):
    qs = BlogPost.objects.filter(status='published').order_by('-published_at', '-created_at')
    
    # Kategori slug'ına göre filtreleme
    category_slug = request.GET.get('category')
    if category_slug:
        try:
            category = BlogCategory.objects.get(slug=category_slug, is_active=True)
            qs = qs.filter(category=category)
        except BlogCategory.DoesNotExist:
            return Response({'detail': 'Kategori bulunamadı'}, status=404)
    
    try:
        page = int(request.GET.get('page', '1'))
    except Exception:
        page = 1
    try:
        page_size = int(request.GET.get('page_size', '9'))
    except Exception:
        page_size = 9
    page = max(1, page)
    page_size = max(1, min(page_size, 50))
    paginator = Paginator(qs, page_size)
    try:
        page_obj = paginator.page(page)
    except EmptyPage:
        page_obj = paginator.page(paginator.num_pages)
        page = paginator.num_pages
    serializer = PublicBlogPostListSerializer(page_obj.object_list, many=True, context={'request': request})
    return Response({
        'results': serializer.data,
        'count': paginator.count,
        'page': page,
        'page_size': page_size,
        'total_pages': paginator.num_pages,
    })


@api_view(['GET'])
@permission_classes([AllowAny])
def public_blog_detail(request, slug: str):
    try:
        post = BlogPost.objects.get(slug=slug, status='published')
        # View count artır
        post.view_count = (post.view_count or 0) + 1
        post.save(update_fields=['view_count'])
    except BlogPost.DoesNotExist:
        return Response({'detail': 'Blog bulunamadı'}, status=404)
    serializer = PublicBlogPostDetailSerializer(post, context={'request': request})
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([AllowAny])
def public_blog_categories(request):
    """Blog kategorilerini listele (public) - Sadece blog yazısı olan kategoriler"""
    
    # Aktif kategorileri al ve her kategorinin published blog sayısını say
    categories = BlogCategory.objects.filter(
        is_active=True
    ).annotate(
        blog_count=Count('blogpost', filter=Q(blogpost__status='published'))
    ).filter(
        blog_count__gt=0  # Sadece blog sayısı 0'dan büyük olanlar
    ).order_by('name')
    
    return Response([{
        'id': cat.id,
        'name': cat.name,
        'slug': cat.slug,
        'description': cat.description,
    } for cat in categories])


@api_view(['GET'])
@permission_classes([AllowAny])
def public_blog_related(request, slug: str):
    """İlgili blog yazıları (aynı kategoriden veya öne çıkan yazılar)"""
    try:
        post = BlogPost.objects.get(slug=slug, status='published')
        # Aynı kategoriden başka yazılar (kendisi hariç)
        related_posts = BlogPost.objects.filter(
            status='published'
        ).exclude(id=post.id)
        
        if post.category:
            # Önce aynı kategoriden
            related_posts = related_posts.filter(category=post.category).order_by('-published_at', '-created_at')
        else:
            # Kategori yoksa öne çıkanlar
            related_posts = related_posts.filter(is_featured=True).order_by('-published_at', '-created_at')
        
        # En fazla 4 ilgili yazı
        related_posts = related_posts[:4]
        
        serializer = PublicBlogPostListSerializer(related_posts, many=True, context={'request': request})
        return Response(serializer.data)
    except BlogPost.DoesNotExist:
        return Response({'detail': 'Blog bulunamadı'}, status=404)

# Rate limiting için cache key'leri
def get_rate_limit_key(email: str, action: str) -> str:
    return f"email_verification_rate_limit:{action}:{email}"

def get_sms_rate_limit_key(phone: str, action: str) -> str:
    return f"sms_verification_rate_limit:{action}:{phone}"

def check_rate_limit(email: str, action: str, max_attempts: int, window_minutes: int) -> bool:
    """Rate limiting kontrolü"""
    cache_key = get_rate_limit_key(email, action)
    attempts = cache.get(cache_key, 0)
    
    if attempts >= max_attempts:
        return False
    
    # Attempt sayısını artır
    cache.set(cache_key, attempts + 1, window_minutes * 60)
    return True

def check_sms_rate_limit(phone: str, action: str, max_attempts: int, window_minutes: int) -> bool:
    """SMS rate limiting kontrolü"""
    cache_key = get_sms_rate_limit_key(phone, action)
    attempts = cache.get(cache_key, 0)
    
    if attempts >= max_attempts:
        return False
    
    # Attempt sayısını artır
    cache.set(cache_key, attempts + 1, window_minutes * 60)
    return True

class LoginView(APIView):
    """Login endpoint - CSRF koruması olmadan (ilk istekte CSRF token yok)"""
    permission_classes = [AllowAny]
    authentication_classes = []  # CSRF korumasını bypass etmek için authentication'ı kaldır
    
    def post(self, request):
    """Email ve şifre ile giriş yap"""
    try:
        email = request.data.get('email')
        password = request.data.get('password')
        
        if not email or not password:
            return Response(
                    {'error': 'Giriş bilgileri hatalı.'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
            # Kullanıcıyı bul ve şifreyi kontrol et
            # Güvenlik: Hatalı girişte fazla bilgi verme
            from auditlog.utils import log_login_failed, log_login_success
            
        try:
            user = CustomUser.objects.get(email=email)
                if not user.check_password(password):
                    # Şifre hatalı - genel mesaj ve audit log
                    log_login_failed(request, email=email, metadata={'reason': 'invalid_password'})
            return Response(
                        {'error': 'Giriş bilgileri hatalı.'}, 
                status=status.HTTP_401_UNAUTHORIZED
            )
            except CustomUser.DoesNotExist:
                # Kullanıcı bulunamadı - genel mesaj (aynı mesaj, timing attack koruması için) ve audit log
                log_login_failed(request, email=email, metadata={'reason': 'user_not_found'})
            return Response(
                    {'error': 'Giriş bilgileri hatalı.'}, 
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        # Kullanıcının hangi profil tipine sahip olduğunu kontrol et
        has_vendor_profile = False
        
        if user.role == 'vendor':
            # VendorProfile var mı kontrol et
            try:
                VendorProfile.objects.get(user=user)
                has_vendor_profile = True
            except VendorProfile.DoesNotExist:
                has_vendor_profile = False
        
        # Artık tüm kullanıcı bilgileri CustomUser'da
        effective_role = user.role
        
            # Django Session Authentication kullan (en güvenli)
            # Session cookie otomatik olarak HttpOnly, Secure, SameSite ayarlarıyla set edilir
            from django.contrib.auth import login as django_login
            from django.conf import settings
            django_login(request, user)
            
            # Debug: Session cookie'nin set edilip edilmediğini kontrol et
            logger.info(f"Login successful for {user.email}. Session key: {request.session.session_key}")
            
            # CSRF token'ı response'a ekle (frontend için)
            from django.middleware.csrf import get_token
            csrf_token = get_token(request)
            
            # Başarılı giriş audit log
            log_login_success(
                request, 
                user=user,
                metadata={
                    'role': effective_role,
                    'has_vendor_profile': has_vendor_profile,
                    'is_verified': user.is_verified_user
                }
            )
            
        response = Response({
            'email': user.email,
            'is_verified': user.is_verified_user,
            'verification_status': user.verification_status,
            'role': effective_role,
            'user_role': user.role,
            'has_vendor_profile': has_vendor_profile,
                'message': 'Login successful',
                'csrf_token': csrf_token  # Frontend için CSRF token
            })
            
            # Django REST Framework Response kullanıldığında session cookie otomatik eklenmez
            # Manuel olarak session cookie'yi response'a eklemeliyiz
            session_cookie_name = getattr(settings, 'SESSION_COOKIE_NAME', 'sessionid')
            session_cookie_age = getattr(settings, 'SESSION_COOKIE_AGE', 86400 * 7)
            session_cookie_secure = getattr(settings, 'SESSION_COOKIE_SECURE', False)
            session_cookie_httponly = getattr(settings, 'SESSION_COOKIE_HTTPONLY', True)
            session_cookie_samesite = getattr(settings, 'SESSION_COOKIE_SAMESITE', 'Lax')
            
        response.set_cookie(
                key=session_cookie_name,
                value=request.session.session_key,
                max_age=session_cookie_age,
                secure=session_cookie_secure,
                httponly=session_cookie_httponly,
                samesite=session_cookie_samesite,
                path='/',
                domain=None  # None = current domain
            )
            
            # Debug: Response header'larını kontrol et
            logger.info(f"Login response headers: {dict(response.items())}")
            logger.info(f"Session cookie set: {session_cookie_name}={request.session.session_key}")

        return response

    except Exception as e:
        logger.error(f"Login error: {e}")
        return Response(
            {'error': 'Giriş yapılırken hata oluştu'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


# Refresh endpoint kaldırıldı - Session Authentication'da refresh token'a gerek yok
# Session otomatik olarak yenilenir (SESSION_SAVE_EVERY_REQUEST = True)

class CsrfTokenView(APIView):
    """CSRF token endpoint - Rate limit'ten muaf (güvenlik için gerekli)"""
    permission_classes = [AllowAny]
    throttle_classes = []  # Rate limit'ten muaf
    
    def get(self, request):
        from django.middleware.csrf import get_token
        csrf_token = get_token(request)
        return Response({'csrf_token': csrf_token})

# Backward compatibility için function view
@api_view(['GET'])
@permission_classes([AllowAny])
def get_csrf_token(request):
    """CSRF token'ı döndür (frontend için) - Deprecated, CsrfTokenView kullan"""
    from django.middleware.csrf import get_token
    csrf_token = get_token(request)
    return Response({'csrf_token': csrf_token})


@method_decorator(csrf_exempt, name='dispatch')  # CSRF'yi tamamen kapat (logout için)
class LogoutView(APIView):
    """Logout endpoint - CSRF koruması olmadan (Login ile aynı mantık)"""
    permission_classes = [AllowAny]
    authentication_classes = []  # CSRF korumasını bypass etmek için authentication'ı kaldır
    
    def post(self, request):
        """Session'ı temizler (Django session authentication)."""
        from django.contrib.auth import logout as django_logout
        from auditlog.utils import log_logout
        from django.conf import settings
        
        # Logout audit log (user bilgisi varsa)
        if request.user.is_authenticated:
            log_logout(request, request.user)
        
        django_logout(request)

        # Session ve CSRF cookie'lerini temizle (legacy isimler dahil)
        session_cookie_name = getattr(settings, 'SESSION_COOKIE_NAME', 'sa_rdx')
        csrf_cookie_name = getattr(settings, 'CSRF_COOKIE_NAME', 'sa_cx')
        session_cookie_samesite = getattr(settings, 'SESSION_COOKIE_SAMESITE', 'Lax')
        csrf_cookie_samesite = getattr(settings, 'CSRF_COOKIE_SAMESITE', 'Lax')

    response = Response({'detail': 'Logged out'})
        # Yeni isimler
        response.delete_cookie(
            key=session_cookie_name,
            path='/',
            domain=None,
            samesite=session_cookie_samesite,
        )
        response.delete_cookie(
            key=csrf_cookie_name,
            path='/',
            domain=None,
            samesite=csrf_cookie_samesite,
        )
        # Eski random isimler (geri uyumluluk)
        for cookie_name in request.COOKIES.keys():
            if cookie_name.startswith('sa_sess_') or cookie_name.startswith('sa_csrf_'):
                response.delete_cookie(
                    key=cookie_name,
                    path='/',
                    domain=None,
                )

    return response


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def clear_notifications(request):
    """Kullanıcının bildirilen mesajlarını temizle (persist)."""
    try:
        user = request.user
        payload = request.data or {}
        message_ids = payload.get('message_ids') or []
        if not isinstance(message_ids, list):
            message_ids = []

        cache_key = f"notifications_cleared:{user.id}"
        cleared: set[int] = set(cache.get(cache_key, []))
        # Sadece int değerleri al
        for mid in message_ids:
            try:
                cleared.add(int(mid))
            except Exception:
                continue
        # 30 gün sakla
        cache.set(cache_key, list(cleared), 60 * 60 * 24 * 30)

        return Response({"status": "ok", "cleared_count": len(message_ids)})
    except Exception as e:
        logger.error(f"clear_notifications error: {e}")
        return Response({"error": "Bildirimler silinemedi"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def upload_avatar(request):
    """Avatar yükle"""
    try:
        if 'avatar' not in request.FILES:
            return Response(
                {'error': 'Avatar dosyası gerekli'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        avatar_file = request.FILES['avatar']
        
        # Güvenli dosya doğrulama (magic bytes ile)
        from core.utils.file_validation import validate_image_upload
        is_valid, error_message = validate_image_upload(
            avatar_file,
            max_size=5 * 1024 * 1024,  # 5MB
            allowed_types=['image/jpeg', 'image/jpg', 'image/png'],
            strict_validation=True  # Magic bytes kontrolü aktif
        )
        
        if not is_valid:
            return Response(
                {'error': error_message}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Avatar'ı kaydet
        success = request.user.save_avatar(avatar_file)
        
        if success:
            # User modelini database'e kaydet (save_avatar save=False kullanıyor)
            request.user.save()
            
            return Response({
                'message': 'Avatar başarıyla yüklendi',
                'avatar_url': request.user.avatar.url if request.user.avatar else None
            })
        else:
            return Response(
                {'error': 'Avatar yüklenirken hata oluştu'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
            
    except Exception as e:
        logger.error(f"Avatar upload error: {e}")
        return Response(
            {'error': 'Avatar yüklenirken hata oluştu'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['POST'])
@permission_classes([AllowAny])
def send_verification_email(request):
    """Email doğrulama linki gönder"""
    try:
        email = request.data.get('email')
        
        if not email:
            return Response(
                {'error': 'Email adresi gerekli'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Rate limiting kontrolü
        if not check_rate_limit(email, 'send_email', 3, 10):
            return Response(
                {'error': 'Çok fazla deneme. 10 dakika sonra tekrar deneyin.'}, 
                status=status.HTTP_429_TOO_MANY_REQUESTS
            )
        
        # Kullanıcıyı bul
        try:
            user = CustomUser.objects.get(email=email)
        except CustomUser.DoesNotExist:
            return Response(
                {'error': 'Bu email adresi ile kayıtlı kullanıcı bulunamadı'}, 
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Zaten doğrulanmış mı?
        if user.is_verified_user:
            return Response(
                {'error': 'Bu hesap zaten doğrulanmış'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Email gönder
        email_sent = user.send_verification_email()
        
        if email_sent:
            return Response({
                'message': 'Doğrulama emaili gönderildi',
                'email': email
            })
        else:
            return Response(
                {'error': 'Email gönderilemedi. Lütfen daha sonra tekrar deneyin.'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
            
    except Exception as e:
        logger.error(f"Send verification email error: {e}")
        return Response(
            {'error': 'Email gönderilirken hata oluştu'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['POST'])
@permission_classes([AllowAny])
def verify_email(request):
    """Email doğrulama token'ını kontrol et"""
    try:
        # Önce süresi dolmuş token'ları temizle
        EmailVerification.objects.filter(expires_at__lt=timezone.now()).delete()
        
        token = request.data.get('token')
        
        if not token:
            logger.warning("Email verification attempted without token")
            return Response(
                {'error': 'Doğrulama token\'ı gerekli'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        logger.info(f"Email verification attempted with token: {token[:20]}...")
        
        # Token'ı bul
        try:
            verification = EmailVerification.objects.get(token=token)
        except EmailVerification.DoesNotExist:
            logger.warning(f"Invalid verification token attempted: {token[:20]}...")
            return Response(
                {'error': 'Geçersiz doğrulama linki'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Token geçerli mi?
        if not verification.is_valid:
            if verification.is_expired:
                logger.warning(f"Expired verification token attempted for user: {verification.user.email}")
                return Response(
                    {'error': 'Doğrulama linki süresi dolmuş'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            else:
                logger.warning(f"Already used verification token attempted for user: {verification.user.email}")
                return Response(
                    {'error': 'Bu doğrulama linki zaten kullanılmış'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        # Kullanıcıyı doğrula
        user = verification.user
        logger.info(f"Email verification successful for user: {user.email}")
        
        user.is_verified = True
        user.verification_method = 'email'
        user.is_verified = True  # Ana verification field
        user.save()
        
        # Token'ı kullanıldı olarak işaretle
        verification.is_used = True
        verification.save()
        
        # Otomatik vendor upgrade artık yok - client-to-vendor upgrade direkt VendorProfile oluşturarak yapılıyor
        
        # Doğrulama sonrası otomatik login için Session Authentication kullan
        from django.contrib.auth import login as django_login
        django_login(request, user)
        
        # CSRF token'ı response'a ekle (frontend için)
        from django.middleware.csrf import get_token
        csrf_token = get_token(request)

        response = Response({
            'message': f'Email başarıyla doğrulandı{upgrade_message}',
            'email': user.email,
            'is_verified': True,
            'role': user.role,
            'auto_upgraded': user.role == 'vendor',
            'csrf_token': csrf_token  # Frontend için CSRF token
        })
        
        # Session cookie otomatik olarak Django tarafından set edilir
        # Manuel olarak session cookie'yi set etmeye gerek yok

        return response
        
    except Exception as e:
        logger.error(f"Verify email error: {e}")
        return Response(
            {'error': 'Email doğrulanırken hata oluştu'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['POST'])
@permission_classes([AllowAny])
def resend_verification_email(request):
    """Email doğrulama linkini tekrar gönder"""
    try:
        email = request.data.get('email')
        
        if not email:
            return Response(
                {'error': 'Email adresi gerekli'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Rate limiting kontrolü (daha sıkı)
        if not check_rate_limit(email, 'resend_email', 2, 5):
            return Response(
                {'error': 'Çok fazla deneme. 5 dakika sonra tekrar deneyin.'}, 
                status=status.HTTP_429_TOO_MANY_REQUESTS
            )
        
        # Kullanıcıyı bul
        try:
            user = CustomUser.objects.get(email=email)
        except CustomUser.DoesNotExist:
            return Response(
                {'error': 'Bu email adresi ile kayıtlı kullanıcı bulunamadı'}, 
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Zaten doğrulanmış mı?
        if user.is_verified_user:
            return Response(
                {'error': 'Bu hesap zaten doğrulanmış'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Email gönder
        email_sent = user.send_verification_email()
        
        if email_sent:
            return Response({
                'message': 'Doğrulama emaili tekrar gönderildi',
                'email': email
            })
        else:
            return Response(
                {'error': 'Email gönderilemedi. Lütfen daha sonra tekrar deneyin.'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
            
    except Exception as e:
        logger.error(f"Resend verification email error: {e}")
        return Response(
            {'error': 'Email gönderilirken hata oluştu'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['POST'])
@permission_classes([AllowAny])
def send_sms_verification(request):
    """SMS doğrulama kodu gönder"""
    try:
        phone_number = request.data.get('phone_number')
        email = request.data.get('email')  # Kullanıcıyı bulmak için
        
        if not phone_number or not email:
            return Response(
                {'error': 'Telefon numarası ve email gerekli'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Rate limiting kontrolü
        if not check_sms_rate_limit(phone_number, 'send_sms', 3, 10):
            return Response(
                {'error': 'Çok fazla deneme. 10 dakika sonra tekrar deneyin.'}, 
                status=status.HTTP_429_TOO_MANY_REQUESTS
            )
        
        # Kullanıcıyı bul
        try:
            user = CustomUser.objects.get(email=email)
        except CustomUser.DoesNotExist:
            return Response(
                {'error': 'Bu email adresi ile kayıtlı kullanıcı bulunamadı'}, 
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Zaten doğrulanmış mı?
        if user.is_verified_user:
            return Response(
                {'error': 'Bu hesap zaten doğrulanmış'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Telefon numarasını formatla
        sms_service = IletiMerkeziSMS()
        formatted_phone = sms_service.format_phone_number(phone_number)
        
        # Telefon numarasını kullanıcıya kaydet
        user.phone_number = formatted_phone
        user.save()
        
        # Redis OTP servisi kullan
        otp_service = OTPService()
        otp_service.clear_all_otps(formatted_phone)
        
        success, code, error_message = otp_service.send_otp(
            phone_number=formatted_phone,
            purpose='verification',
            user_id=user.id
        )
        
        if not success:
            return Response(
                {'error': error_message or 'OTP oluşturulamadı. Lütfen tekrar deneyin.'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        
        # SMS gönder (async - Celery)
        send_otp_sms_async.delay(formatted_phone, code, 'verification')
        # Async gönderim, başarı durumunu kontrol etmeden devam et
        sms_sent = True  # Celery queue'ya eklendi, başarılı kabul et
        
        if sms_sent:
            return Response({
                'message': 'SMS doğrulama kodu gönderildi',
                'phone_number': formatted_phone
            })
        else:
            otp_service.delete_otp(formatted_phone, 'verification')
            return Response(
                {'error': 'SMS gönderilemedi. Lütfen daha sonra tekrar deneyin.'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
            
    except Exception as e:
        logger.error(f"Send SMS verification error: {e}")
        return Response(
            {'error': 'SMS gönderilirken hata oluştu'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['POST'])
@permission_classes([AllowAny])
def verify_sms_code(request):
    """SMS doğrulama kodunu kontrol et"""
    try:
        email = request.data.get('email')
        code = request.data.get('code')
        
        if not email or not code:
            return Response(
                {'error': 'Email ve doğrulama kodu gerekli'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Kullanıcıyı bul
        try:
            user = CustomUser.objects.get(email=email)
        except CustomUser.DoesNotExist:
            return Response(
                {'error': 'Bu email adresi ile kayıtlı kullanıcı bulunamadı'}, 
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Telefon numarasını formatla
        sms_service = IletiMerkeziSMS()
        formatted_phone = sms_service.format_phone_number(user.phone_number)
        
        # Redis OTP servisi ile doğrula
        otp_service = OTPService()
        is_valid, error_message = otp_service.verify_otp(
            phone_number=formatted_phone,
            code=code,
            purpose='verification',
            mark_used=True
        )
        
        if is_valid:
            # Kullanıcıyı doğrula ve verification_method'u güncelle
            user.is_verified = True
            user.verification_method = 'sms'
            user.is_active = True  # SMS doğrulandıktan sonra hesabı aktif et
            
            # Eğer client ise ve vendor_profile varsa, role'ü vendor yap
            upgrade_message = ""
            if user.role == 'client' and hasattr(user, 'vendor_profile'):
                user.role = 'vendor'
                user.can_provide_services = True
                user.can_request_services = True
                upgrade_message = " Hesabınız esnaf hesabına yükseltildi!"
                logger.info(f"User {user.email} upgraded to vendor after SMS verification")
            
            user.save()
            
            # Activity log
            log_user_activity(
                f'Kullanıcı SMS ile doğrulandı: {user.email}',
                {
                    'user_id': user.id,
                    'email': user.email,
                    'role': user.role,
                    'verification_method': 'sms',
                    'is_verified': True
                }
            )
            
            return Response({
                'message': f'SMS kodu başarıyla doğrulandı{upgrade_message}',
                'email': user.email,
                'is_verified': user.is_verified,
                'verification_method': user.verification_method,
                'role': user.role,
                'auto_upgraded': user.role == 'vendor'
            })
        else:
            return Response(
                {'error': 'Geçersiz doğrulama kodu'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
            
    except Exception as e:
        logger.error(f"Verify SMS code error: {e}")
        return Response(
            {'error': 'SMS kodu doğrulanırken hata oluştu'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def check_verification_status(request):
    """Kullanıcının doğrulama durumunu kontrol et"""
    try:
        user = request.user
        
        return Response({
            'email': user.email,
            'is_verified': user.is_verified_user,
            'verification_status': user.verification_status,
            'verification_method': user.verification_method,
            'phone_number': user.phone_number
        })
        
    except Exception as e:
        logger.error(f"Check verification status error: {e}")
        return Response(
            {'error': 'Doğrulama durumu kontrol edilirken hata oluştu'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_profile(request):
    """Kullanıcı profil bilgilerini getir"""
    try:
        user = request.user
        
        return Response({
            'id': user.id,
            'email': user.email,
            'username': user.username,
            'first_name': user.first_name,
            'last_name': user.last_name,
            'role': user.role,
            'is_verified': user.is_verified,
            'phone_number': user.phone_number,
            'avatar': user.avatar.url if user.avatar else None,
            'can_provide_services': user.can_provide_services,
            'can_request_services': user.can_request_services,
            'verification_method': user.verification_method
        })
        
    except Exception as e:
        logger.error(f"Get profile error: {e}")
        return Response(
            {'error': 'Profil bilgileri alınırken hata oluştu'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def update_profile(request):
    """Kullanıcı profil bilgilerini güncelle (OTP desteği ile)"""
    try:
        user = request.user
        
        # Eğer OTP doğrulama gerekiyorsa (token ve sms_code varsa)
        if 'token' in request.data and 'sms_code' in request.data:
            return _verify_and_update_profile(request, user)
        
        # OTP gerektiren alanlar kontrolü
        requires_otp = False
        update_type = None
        
        if 'phone_number' in request.data:
            new_phone = request.data['phone_number']
            sms_service = IletiMerkeziSMS()
            formatted_phone = sms_service.format_phone_number(new_phone)
            
            if formatted_phone != user.phone_number:
                requires_otp = True
                update_type = 'phone_update'
        
        if 'email' in request.data:
            new_email = (request.data.get('email') or '').strip()
            if new_email.lower() != (user.email or '').lower():
                requires_otp = True
                update_type = 'email_update'
        
        if 'password' in request.data or 'new_password' in request.data:
            requires_otp = True
            update_type = 'password_update'
        
        if ('first_name' in request.data or 'last_name' in request.data) and not requires_otp:
            requires_otp = True
            update_type = 'profile_update'
        
        # OTP gerekiyorsa SMS gönder
        if requires_otp and update_type:
            return _send_update_otp(request, user, update_type)
        
        # OTP gerektirmeyen güncellemeler
        if 'about' in request.data:
            user.about = request.data['about']
        if 'avatar' in request.FILES:
            user.avatar = request.FILES['avatar']
        
        user.save()
        
        return Response({
            'message': 'Profil güncellendi',
            'first_name': user.first_name,
            'last_name': user.last_name,
            'phone_number': user.phone_number
        })
        
    except Exception as e:
        logger.error(f"Update profile error: {e}")
        return Response(
            {'error': 'Profil güncellenirken hata oluştu'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['POST'])
@permission_classes([AllowAny])
def forgot_password(request):
    """Şifre sıfırlama emaili gönder - Telefon varsa OTP de gönder"""
    try:
        email = request.data.get('email')
        
        if not email:
            return Response(
                {'error': 'Email adresi gerekli'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Rate limiting kontrolü
        if not check_rate_limit(email, 'forgot_password', 3, 10):
            return Response(
                {'error': 'Çok fazla deneme. 10 dakika sonra tekrar deneyin.'}, 
                status=status.HTTP_429_TOO_MANY_REQUESTS
            )
        
        # Kullanıcıyı bul
        try:
            user = CustomUser.objects.get(email=email)
        except CustomUser.DoesNotExist:
            return Response(
                {'error': 'Bu email adresi ile kayıtlı kullanıcı bulunamadı'}, 
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Şifre sıfırlama token'ı oluştur
        token = default_token_generator.make_token(user)
        
        # Reset URL oluştur - kullanıcı rolüne göre frontend URL'i
        if user.role == 'vendor':
            reset_url = f"https://test.sanayicin.com/esnaf/sifre-yenile/{user.pk}/{token}/"
        else:  # client veya diğer roller için
            reset_url = f"https://test.sanayicin.com/musteri/sifre-yenile/{user.pk}/{token}/"
        
        # Email gönder
        EmailService.send_password_reset_email(email, user.first_name or user.email, reset_url)
        email_sent = True  # Asenkron gönderim, her zaman True döndür
        
        # Telefon numarası varsa OTP de gönder
        otp_sent = False
        encrypted_token = None
        phone_last_4 = None
        
        if user.phone_number:
            try:
                sms_service = IletiMerkeziSMS()
                formatted_phone = sms_service.format_phone_number(user.phone_number)
                
                # OTP gönder
                otp_service = OTPService()
                otp_service.clear_all_otps(formatted_phone)
                
                success, code, error_message = otp_service.send_otp(
                    phone_number=formatted_phone,
                    purpose='password_reset',
                    user_id=user.id
                )
                
                if success:
                    # SMS gönder (async - Celery)
                    send_otp_sms_async.delay(formatted_phone, code, 'password_reset')
                    sms_sent = True  # Celery queue'ya eklendi
                    if sms_sent:
                        otp_sent = True
                        phone_last_4 = formatted_phone[-4:]
                        
                        # Token'ı şifrele (OTP doğrulaması için)
                        token_data = json.dumps({
                            'user_id': user.id,
                            'token': token,
                            'uidb64': str(user.pk),
                            'timestamp': timezone.now().timestamp()
                        })
                        encrypted_token = encrypt_text(token_data)
                    else:
                        otp_service.delete_otp(formatted_phone, 'password_reset')
            except Exception as e:
                logger.error(f"OTP sending error in forgot_password: {e}")
                # OTP gönderilemese bile email gönderildi, devam et
        
        if email_sent:
            response_data = {
                'message': 'Şifre sıfırlama emaili gönderildi',
                'email': email
            }
            
            if otp_sent and encrypted_token:
                response_data.update({
                    'message': 'Şifre sıfırlama emaili ve SMS kodu gönderildi',
                    'requires_sms_verification': True,
                    'token': encrypted_token,
                    'phone_last_4': phone_last_4
                })
            
            return Response(response_data)
        else:
            return Response(
                {'error': 'Email gönderilemedi. Lütfen daha sonra tekrar deneyin.'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
            
    except Exception as e:
        logger.error(f"Forgot password error: {e}")
        return Response(
            {'error': 'Şifre sıfırlama emaili gönderilirken hata oluştu'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['POST'])
@permission_classes([AllowAny])
def reset_password(request):
    """Şifre sıfırlama token'ını kontrol et ve şifreyi güncelle - OTP doğrulaması ile"""
    try:
        # OTP doğrulama akışı (encrypted_token ve sms_code varsa)
        if 'encrypted_token' in request.data and 'sms_code' in request.data:
            encrypted_token = request.data.get('encrypted_token')
            sms_code = request.data.get('sms_code')
            new_password = request.data.get('new_password')
            
            if not encrypted_token or not sms_code or not new_password:
                return Response(
                    {'error': 'Token, SMS kodu ve yeni şifre gerekli'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Token'ı çöz
            token_data_str = decrypt_text(encrypted_token)
            if not token_data_str:
                return Response(
                    {'error': 'Geçersiz token'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            try:
                token_data = json.loads(token_data_str)
            except json.JSONDecodeError:
                return Response(
                    {'error': 'Geçersiz token formatı'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            user_id = token_data.get('user_id')
            token = token_data.get('token')
            uidb64 = token_data.get('uidb64')
            
            if not user_id or not token or not uidb64:
                return Response(
                    {'error': 'Geçersiz token verisi'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Kullanıcıyı bul
            try:
                user = CustomUser.objects.get(pk=user_id)
            except CustomUser.DoesNotExist:
                return Response(
                    {'error': 'Geçersiz kullanıcı'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Token'ı kontrol et
            if not default_token_generator.check_token(user, token):
                return Response(
                    {'error': 'Geçersiz veya süresi dolmuş token'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # OTP doğrula
            if not user.phone_number:
                return Response(
                    {'error': 'Telefon numarası bulunamadı'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            sms_service = IletiMerkeziSMS()
            formatted_phone = sms_service.format_phone_number(user.phone_number)
            
            otp_service = OTPService()
            is_valid, error_message = otp_service.verify_otp(
                phone_number=formatted_phone,
                code=sms_code,
                purpose='password_reset',
                mark_used=True
            )
            
            if not is_valid:
                return Response(
                    {'error': error_message or 'Geçersiz SMS kodu'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Şifre validasyonu
            password_error = validate_strong_password_simple(new_password)
            if password_error:
                return Response(
                    {'error': password_error}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Şifreyi güncelle
            user.set_password(new_password)
            user.save()
            
            return Response({
                'message': 'Şifre başarıyla güncellendi'
            })
        
        # Eski akış (sadece token ile - backward compatibility)
        uidb64 = request.data.get('uidb64')
        token = request.data.get('token')
        new_password = request.data.get('new_password')
        
        if not uidb64 or not token or not new_password:
            return Response(
                {'error': 'Tüm alanlar gerekli'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Kullanıcıyı bul
        try:
            user = CustomUser.objects.get(pk=uidb64)
        except CustomUser.DoesNotExist:
            return Response(
                {'error': 'Geçersiz kullanıcı'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Token'ı kontrol et
        if not default_token_generator.check_token(user, token):
            return Response(
                {'error': 'Geçersiz veya süresi dolmuş token'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Telefon numarası varsa OTP zorunlu
        if user.phone_number:
            return Response(
                {'error': 'Bu hesap için SMS doğrulaması gereklidir. Lütfen OTP kodu ile devam edin.'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Şifre validasyonu
        password_error = validate_strong_password_simple(new_password)
        if password_error:
            return Response(
                {'error': password_error}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Şifreyi güncelle
        user.set_password(new_password)
        user.save()
        
        return Response({
            'message': 'Şifre başarıyla güncellendi'
        })
        
    except Exception as e:
        logger.error(f"Reset password error: {e}")
        return Response(
            {'error': 'Şifre güncellenirken hata oluştu'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

# Login OTP kaldırıldı - maliyet nedeniyle normal email/şifre girişi kullanılıyor

@api_view(['POST'])
@permission_classes([AllowAny])
def send_password_reset_otp(request):
    """Şifre sıfırlama için OTP kodu gönder"""
    try:
        phone_number = request.data.get('phone_number')
        
        if not phone_number:
            return Response(
                {'error': 'Telefon numarası gerekli'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Rate limiting kontrolü
        if not check_sms_rate_limit(phone_number, 'send_password_reset_otp', 3, 10):
            return Response(
                {'error': 'Çok fazla deneme. 10 dakika sonra tekrar deneyin.'}, 
                status=status.HTTP_429_TOO_MANY_REQUESTS
            )
        
        # Telefon numarasını formatla
        sms_service = IletiMerkeziSMS()
        formatted_phone = sms_service.format_phone_number(phone_number)
        
        if not sms_service.validate_phone_number(formatted_phone):
            return Response(
                {'error': 'Geçersiz telefon numarası'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Kullanıcıyı bul
        try:
            user = CustomUser.objects.get(phone_number=formatted_phone)
        except CustomUser.DoesNotExist:
            return Response(
                {'error': 'Bu telefon numarası ile kayıtlı kullanıcı bulunamadı'}, 
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Redis OTP servisi kullan
        otp_service = OTPService()
        
        # Eski OTP'leri temizle
        otp_service.clear_all_otps(formatted_phone)
        
        # OTP kodu oluştur ve Redis'e kaydet
        success, code, error_message = otp_service.send_otp(
            phone_number=formatted_phone,
            purpose='password_reset',
            user_id=user.id
        )
        
        if not success:
            return Response(
                {'error': error_message or 'OTP oluşturulamadı. Lütfen tekrar deneyin.'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        
        # SMS gönder (async - Celery)
        send_otp_sms_async.delay(formatted_phone, code, 'password_reset')
        sms_sent = True  # Celery queue'ya eklendi
        
        if sms_sent:
            return Response({
                'message': 'Şifre sıfırlama OTP kodu gönderildi',
                'phone_number': formatted_phone
            })
        else:
            # OTP kodunu sil (gönderilemediyse)
            otp_service.delete_otp(formatted_phone, 'password_reset')
            return Response(
                {'error': 'OTP kodu gönderilemedi. Lütfen daha sonra tekrar deneyin.'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
            
    except Exception as e:
        logger.error(f"Send password reset OTP error: {e}")
        return Response(
            {'error': 'OTP kodu gönderilirken hata oluştu'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['POST'])
@permission_classes([AllowAny])
def verify_password_reset_otp(request):
    """Şifre sıfırlama OTP kodunu doğrula ve şifreyi güncelle"""
    try:
        phone_number = request.data.get('phone_number')
        code = request.data.get('code')
        new_password = request.data.get('new_password')
        
        if not phone_number or not code or not new_password:
            return Response(
                {'error': 'Telefon numarası, OTP kodu ve yeni şifre gerekli'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Şifre validasyonu
        password_error = validate_strong_password_simple(new_password)
        if password_error:
            return Response(
                {'error': password_error}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Telefon numarasını formatla
        sms_service = IletiMerkeziSMS()
        formatted_phone = sms_service.format_phone_number(phone_number)
        
        # Redis OTP servisi ile doğrula
        otp_service = OTPService()
        
        # Önce OTP bilgilerini al (user_id için)
        otp_info = otp_service.get_otp_info(formatted_phone, 'password_reset')
        if not otp_info:
            return Response(
                {'error': 'OTP kodu bulunamadı veya süresi dolmuş'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # OTP kodunu doğrula
        is_valid, error_message = otp_service.verify_otp(
            phone_number=formatted_phone,
            code=code,
            purpose='password_reset',
            mark_used=True
        )
        
        if not is_valid:
            return Response(
                {'error': error_message or 'Geçersiz veya süresi dolmuş OTP kodu'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Kullanıcıyı bul
        user_id = otp_info.get('user_id')
        if not user_id:
            return Response(
                {'error': 'Kullanıcı bilgisi bulunamadı'}, 
                status=status.HTTP_404_NOT_FOUND
            )
        
        try:
            user = CustomUser.objects.get(id=user_id)
        except CustomUser.DoesNotExist:
            return Response(
                {'error': 'Kullanıcı bulunamadı'}, 
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Şifreyi güncelle
        user.set_password(new_password)
        user.save()
        
        return Response({
            'message': 'Şifre başarıyla güncellendi'
        })
        
    except Exception as e:
        logger.error(f"Verify password reset OTP error: {e}")
        return Response(
            {'error': 'Şifre güncellenirken hata oluştu'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

# ===== FAVORITE API VIEWS =====

class FavoriteListView(generics.ListAPIView):
    """Kullanıcının favori esnaflarını listele"""
    serializer_class = FavoriteSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return Favorite.objects.filter(user=self.request.user).select_related('vendor')


class FavoriteCreateView(generics.CreateAPIView):
    """Favoriye esnaf ekle"""
    serializer_class = FavoriteCreateSerializer
    permission_classes = [IsAuthenticated]
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def remove_favorite(request, vendor_id):
    """Favoriden esnaf çıkar"""
    try:
        favorite = Favorite.objects.get(user=request.user, vendor_id=vendor_id)
        favorite.delete()
        return Response({'detail': 'Favorilerden çıkarıldı'}, status=status.HTTP_200_OK)
    except Favorite.DoesNotExist:
        return Response({'detail': 'Bu esnaf favorilerinizde değil'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        logger.error(f"Remove favorite error: {e}")
        return Response({'detail': 'Favorilerden çıkarılırken hata oluştu'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def check_favorite(request, vendor_id):
    """Esnafın favori olup olmadığını kontrol et"""
    try:
        is_favorite = Favorite.objects.filter(user=request.user, vendor_id=vendor_id).exists()
        return Response({'is_favorite': is_favorite}, status=status.HTTP_200_OK)
    except Exception as e:
        logger.error(f"Check favorite error: {e}")
        return Response({'detail': 'Favori durumu kontrol edilemedi'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# ===== VEHICLE API VIEWS =====

class VehicleListCreateView(generics.ListCreateAPIView):
    serializer_class = VehicleSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Vehicle.objects.filter(user=self.request.user).order_by('-updated_at')

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class VehicleDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = VehicleSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Vehicle.objects.filter(user=self.request.user)

# ===== CLIENT MANAGEMENT VIEWS (ClientProfile yerine CustomUser kullanıyor) =====

@api_view(['POST'])
@permission_classes([AllowAny])
def client_register(request):
    """Client kayıt - 2 aşamalı: Bilgileri al → SMS OTP gönder"""
    try:
        data = request.data
        
        # Gerekli alanları kontrol et
        email = data.get('email')
        password = data.get('password')
        password2 = data.get('password2')
        first_name = data.get('first_name', '')
        last_name = data.get('last_name', '')
        phone_number = data.get('phone_number')
        
        if not all([email, password, password2, phone_number]):
            return Response({
                'error': 'Email, şifre, şifre tekrarı ve telefon numarası gerekli'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        if password != password2:
            return Response({
                'error': 'Şifreler eşleşmiyor'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Güçlü şifre doğrulaması
        password_errors = validate_strong_password_simple(password)
        if password_errors:
            return Response({
                'error': ' '.join(password_errors)
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Email zaten var mı kontrol et
        if CustomUser.objects.filter(email=email).exists():
            return Response({
                'error': 'Bu email ile zaten bir hesap mevcut'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Telefon numarası zaten kullanılıyor mu?
        sms_service = IletiMerkeziSMS()
        formatted_phone = sms_service.format_phone_number(phone_number)
        
        if not sms_service.validate_phone_number(formatted_phone):
            return Response({
                'error': 'Geçersiz telefon numarası'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        if CustomUser.objects.filter(phone_number=formatted_phone).exists():
            return Response({
                'error': 'Bu telefon numarası ile zaten bir hesap mevcut'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Kullanıcıyı oluştur (henüz aktif değil, OTP doğrulanınca aktif olacak)
        user = CustomUser.objects.create_user(
            username=email,
            email=email,
            password=password,
            role='client',
            first_name=first_name,
            last_name=last_name,
            about=data.get('about', ''),
            is_verified=False,
            is_active=False,  # OTP doğrulanınca aktif olacak
            phone_number=formatted_phone
        )
        
        # Avatar varsa kaydet (200x200 boyutunda işle)
        if 'avatar' in request.FILES:
            from core.utils.file_validation import validate_image_upload
            
            avatar_file = request.FILES['avatar']
            
            # Güvenli dosya doğrulama (magic bytes ile)
            is_valid, error_message = validate_image_upload(
                avatar_file,
                max_size=5 * 1024 * 1024,  # 5MB
                allowed_types=['image/jpeg', 'image/jpg', 'image/png'],
                strict_validation=True  # Magic bytes kontrolü aktif
            )
            
            if not is_valid:
                user.delete()
                return Response({
                    'error': error_message
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Avatar'ı 200x200 boyutunda kaydet
            success = user.save_avatar(avatar_file)
            if not success:
                user.delete()
                return Response({
                    'error': 'Avatar yüklenirken hata oluştu'
                }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            user.save()
        
        # SMS OTP gönder
        otp_service = OTPService()
        otp_service.clear_all_otps(formatted_phone)
        
        success, code, error_message = otp_service.send_otp(
            phone_number=formatted_phone,
            purpose='registration',
            user_id=user.id
        )
        
        if not success:
            user.delete()
            return Response({
                'error': error_message or 'OTP kodu gönderilemedi. Lütfen tekrar deneyin.'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
        # SMS gönder (async - Celery)
        send_otp_sms_async.delay(formatted_phone, code, 'registration')
        sms_sent = True  # Celery queue'ya eklendi
        
        if not sms_sent:
            otp_service.delete_otp(formatted_phone, 'registration')
            user.delete()
            return Response({
                'error': 'SMS gönderilemedi. Lütfen daha sonra tekrar deneyin.'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
        # Şifrelenmiş token oluştur (email, password, phone için)
        token_data = f"{email}##{password}##{formatted_phone}##{timezone.now().timestamp()}"
        encrypted_token = encrypt_text(token_data)
        
        return Response({
            'message': 'Kayıt bilgileri alındı. SMS doğrulama kodu gönderildi.',
            'token': encrypted_token,
            'phone_last_4': formatted_phone[-4:],
            'requires_sms_verification': True
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Client registration error: {e}")
        return Response({
            'error': 'Kayıt sırasında hata oluştu'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([AllowAny])
def verify_registration_otp(request):
    """Kayıt OTP kodunu doğrula ve hesabı aktif et"""
    try:
        token = request.data.get('token')
        sms_code = request.data.get('sms_code')
        
        if not token or not sms_code:
            return Response({
                'error': 'Token ve SMS kodu gerekli'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Token'ı çöz
        token_data = decrypt_text(token)
        if not token_data:
            return Response({
                'error': 'Geçersiz token'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Token'dan bilgileri al
        parts = token_data.split('##')
        if len(parts) < 3:
            return Response({
                'error': 'Geçersiz token formatı'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        email = parts[0]
        password = parts[1]
        phone_number = parts[2]
        
        # Kullanıcıyı bul
        try:
            user = CustomUser.objects.get(email=email, phone_number=phone_number, is_active=False)
        except CustomUser.DoesNotExist:
            return Response({
                'error': 'Kayıt bulunamadı veya zaten doğrulanmış'
            }, status=status.HTTP_404_NOT_FOUND)
        
        # OTP doğrula
        otp_service = OTPService()
        is_valid, error_message = otp_service.verify_otp(
            phone_number=phone_number,
            code=sms_code,
            purpose='registration',
            mark_used=True
        )
        
        if not is_valid:
            return Response({
                'error': error_message or 'Geçersiz SMS kodu'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Şifreyi tekrar kontrol et
        if not user.check_password(password):
            return Response({
                'error': 'Geçersiz kimlik bilgileri'
            }, status=status.HTTP_401_UNAUTHORIZED)
        
        # Hesabı aktif et ve doğrula
        user.is_active = True
        user.is_verified = True
        user.verification_method = 'sms'
        user.save()
        
        # Activity log
        log_user_activity(
            f'Yeni müşteri kaydoldu ve doğrulandı: {email}',
            {
                'user_id': user.id,
                'email': email,
                'role': 'client',
                'is_verified': True
            }
        )
        
        # Doğrulama sonrası otomatik login için Session Authentication kullan
        from django.contrib.auth import login as django_login
        django_login(request, user)
        
        # CSRF token'ı response'a ekle (frontend için)
        from django.middleware.csrf import get_token
        csrf_token = get_token(request)
        
        response = Response({
            'message': 'Hesabınız başarıyla doğrulandı ve aktif edildi.',
            'user': {
                'id': user.id,
            'email': user.email,
                'first_name': user.first_name,
                'last_name': user.last_name,
                'phone_number': user.phone_number,
                'is_verified': user.is_verified
            },
            'csrf_token': csrf_token  # Frontend için CSRF token
        }, status=status.HTTP_200_OK)
        
        # Session cookie otomatik olarak Django tarafından set edilir
        # Manuel olarak session cookie'yi set etmeye gerek yok
        
        return response
        
    except Exception as e:
        logger.error(f"Verify registration OTP error: {e}")
        return Response({
            'error': 'Doğrulama sırasında hata oluştu'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET', 'PATCH'])
@permission_classes([IsAuthenticated])
def client_profile(request):
    """Client profil görüntüleme ve güncelleme (CustomUser üzerinden)"""
    user = request.user
    
    if request.method == 'GET':
        return Response({
            'id': user.id,
            'email': user.email,
            'username': user.username,
            'first_name': user.first_name,
            'last_name': user.last_name,
            'phone_number': user.phone_number,
            'about': user.about,
            'avatar': user.avatar.url if user.avatar else None,
            'role': user.role,
            'is_verified': user.is_verified,
        })
    
    elif request.method == 'PATCH':
        try:
            # Eğer OTP doğrulama gerekiyorsa (token ve sms_code varsa)
            if 'token' in request.data and 'sms_code' in request.data:
                return _verify_and_update_profile(request, user)
            
            # OTP gerektiren alanlar kontrolü
            requires_otp = False
            update_type = None
            
            if 'phone_number' in request.data:
                new_phone = request.data['phone_number']
                sms_service = IletiMerkeziSMS()
                formatted_phone = sms_service.format_phone_number(new_phone)
                
                if formatted_phone != user.phone_number:
                    requires_otp = True
                    update_type = 'phone_update'
            
            if 'email' in request.data:
                new_email = (request.data.get('email') or '').strip()
                if new_email.lower() != (user.email or '').lower():
                    requires_otp = True
                    update_type = 'email_update'
            
            if 'password' in request.data or 'new_password' in request.data:
                requires_otp = True
                update_type = 'password_update'
            
            if ('first_name' in request.data or 'last_name' in request.data) and not requires_otp:
                # Ad-soyad değişikliği için de OTP iste (opsiyonel, ama güvenlik için)
                requires_otp = True
                update_type = 'profile_update'
            
            # OTP gerekiyorsa SMS gönder
            if requires_otp and update_type:
                return _send_update_otp(request, user, update_type)
            
            # OTP gerektirmeyen güncellemeler (about, avatar)
            if 'about' in request.data:
                user.about = request.data['about']
            if 'avatar' in request.FILES:
                user.avatar = request.FILES['avatar']

            user.save()
            
            return Response({
                'message': 'Profil başarıyla güncellendi',
                'profile': {
                    'id': user.id,
                    'email': user.email,
                    'first_name': user.first_name,
                    'last_name': user.last_name,
                    'phone_number': user.phone_number,
                    'about': user.about,
                    'avatar': user.avatar.url if user.avatar else None,
                    'is_verified': getattr(user, 'is_verified', False),
                }
            })
            
        except Exception as e:
            logger.error(f"Client profile update error: {e}")
            return Response({
                'error': 'Profil güncellenirken hata oluştu'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

def _send_update_otp(request, user, update_type):
    """Profil güncelleme için OTP gönder"""
    try:
        sms_service = IletiMerkeziSMS()
        
        # Telefon numarası güncellemesi için yeni telefonu kullan, diğerleri için mevcut telefonu
        if update_type == 'phone_update':
            new_phone = request.data.get('phone_number')
            formatted_phone = sms_service.format_phone_number(new_phone)
            
            if not sms_service.validate_phone_number(formatted_phone):
                return Response({
                    'error': 'Geçersiz telefon numarası'
                    }, status=status.HTTP_400_BAD_REQUEST)

            if CustomUser.objects.filter(phone_number=formatted_phone).exclude(id=user.id).exists():
                        return Response({
                    'error': 'Bu telefon numarası başka bir hesapta kullanılıyor'
                }, status=status.HTTP_400_BAD_REQUEST)
        else:
            if not user.phone_number:
                return Response({
                    'error': 'Telefon numaranız kayıtlı değil. Lütfen önce telefon numaranızı ekleyin.'
                }, status=status.HTTP_400_BAD_REQUEST)
            formatted_phone = sms_service.format_phone_number(user.phone_number)
        
        # OTP gönder
        otp_service = OTPService()
        otp_service.clear_all_otps(formatted_phone)
        
        success, code, error_message = otp_service.send_otp(
            phone_number=formatted_phone,
            purpose=update_type,
            user_id=user.id
        )
        
        if not success:
            return Response({
                'error': error_message or 'OTP kodu gönderilemedi. Lütfen tekrar deneyin.'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
        # SMS gönder (async - Celery)
        send_otp_sms_async.delay(formatted_phone, code, update_type)
        sms_sent = True  # Celery queue'ya eklendi
        
        if not sms_sent:
            otp_service.delete_otp(formatted_phone, update_type)
            return Response({
                'error': 'SMS gönderilemedi. Lütfen daha sonra tekrar deneyin.'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
        # Güncelleme verilerini şifrele
        update_data = {
            'update_type': update_type,
            'user_id': user.id,
            'timestamp': timezone.now().timestamp()
        }
        
        # Güncellenecek verileri ekle
        if update_type == 'phone_update':
            update_data['phone_number'] = formatted_phone
        elif update_type == 'email_update':
            update_data['email'] = request.data.get('email')
        elif update_type == 'password_update':
            update_data['new_password'] = request.data.get('new_password') or request.data.get('password')
        elif update_type == 'profile_update':
            update_data['first_name'] = request.data.get('first_name', user.first_name)
            update_data['last_name'] = request.data.get('last_name', user.last_name)
        
        token_data = json.dumps(update_data)
        encrypted_token = encrypt_text(token_data)
        
        phone_to_show = formatted_phone[-4:] if update_type == 'phone_update' else (user.phone_number[-4:] if user.phone_number else '')
        
        return Response({
            'message': f'{update_type.replace("_", " ").title()} için SMS doğrulama kodu gönderildi.',
            'token': encrypted_token,
            'phone_last_4': phone_to_show,
            'update_type': update_type,
            'requires_sms_verification': True
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Send update OTP error: {e}")
        return Response({
            'error': 'OTP gönderilirken hata oluştu'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

def _verify_and_update_profile(request, user):
    """OTP doğrula ve profili güncelle"""
    try:
        token = request.data.get('token')
        sms_code = request.data.get('sms_code')
        
        if not token or not sms_code:
            return Response({
                'error': 'Token ve SMS kodu gerekli'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Token'ı çöz
        token_data = decrypt_text(token)
        if not token_data:
            return Response({
                'error': 'Geçersiz token'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        update_data = json.loads(token_data)
        update_type = update_data.get('update_type')
        user_id = update_data.get('user_id')
        
        if user_id != user.id:
            return Response({
                'error': 'Geçersiz kullanıcı'
            }, status=status.HTTP_403_FORBIDDEN)
        
        # Telefon numarasını belirle (güncelleme tipine göre)
        sms_service = IletiMerkeziSMS()
        if update_type == 'phone_update':
            phone_to_verify = sms_service.format_phone_number(update_data.get('phone_number'))
        else:
            phone_to_verify = sms_service.format_phone_number(user.phone_number)
        
        # OTP doğrula
        otp_service = OTPService()
        is_valid, error_message = otp_service.verify_otp(
            phone_number=phone_to_verify,
            code=sms_code,
            purpose=update_type,
            mark_used=True
        )
        
        if not is_valid:
            return Response({
                'error': error_message or 'Geçersiz SMS kodu'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Profili güncelle
        if update_type == 'phone_update':
            user.phone_number = update_data.get('phone_number')
        elif update_type == 'email_update':
            new_email = update_data.get('email')
            if CustomUser.objects.filter(email=new_email).exclude(id=user.id).exists():
                return Response({
                    'error': 'Bu e-posta adresi başka bir hesapta kullanılıyor'
                }, status=status.HTTP_400_BAD_REQUEST)
            user.email = new_email
            user.is_verified = False  # Email değişti, tekrar doğrulama gerekli
        elif update_type == 'password_update':
            new_password = update_data.get('new_password')
            if new_password:
                password_errors = validate_strong_password_simple(new_password)
                if password_errors:
                    return Response({
                        'error': ' '.join(password_errors)
                    }, status=status.HTTP_400_BAD_REQUEST)
                user.set_password(new_password)
        elif update_type == 'profile_update':
            if 'first_name' in update_data:
                user.first_name = update_data['first_name']
            if 'last_name' in update_data:
                user.last_name = update_data['last_name']
        
        # Tüm güncellemeleri kaydet
            user.save()
            
            return Response({
                'message': 'Profil başarıyla güncellendi',
                'profile': {
                    'id': user.id,
                    'email': user.email,
                    'first_name': user.first_name,
                    'last_name': user.last_name,
                    'phone_number': user.phone_number,
                'is_verified': user.is_verified,
                }
        }, status=status.HTTP_200_OK)
            
    except Exception as e:
        logger.error(f"Verify and update profile error: {e}")
        return Response({
            'error': 'Profil güncellenirken hata oluştu'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([AllowAny])
def client_set_password(request):
    """Client şifre belirleme - OTP doğrulaması ile"""
    try:
        # OTP doğrulama akışı (encrypted_token ve sms_code varsa)
        if 'encrypted_token' in request.data and 'sms_code' in request.data:
            encrypted_token = request.data.get('encrypted_token')
            sms_code = request.data.get('sms_code')
            password = request.data.get('password')
            password2 = request.data.get('password2')
            
            if not all([encrypted_token, sms_code, password, password2]):
                return Response({
                    'detail': 'Token, SMS kodu, şifre ve şifre tekrarı gerekli'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            if password != password2:
                return Response({
                    'detail': 'Şifreler eşleşmiyor'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Token'ı çöz
            token_data_str = decrypt_text(encrypted_token)
            if not token_data_str:
                return Response({
                    'detail': 'Geçersiz token'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            try:
                token_data = json.loads(token_data_str)
            except json.JSONDecodeError:
                return Response({
                    'detail': 'Geçersiz token formatı'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            user_id = token_data.get('user_id')
            email = token_data.get('email')
            
            if not user_id or not email:
                return Response({
                    'detail': 'Geçersiz token verisi'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Kullanıcıyı bul
            try:
                user = CustomUser.objects.get(pk=user_id, email=email, role='client')
            except CustomUser.DoesNotExist:
                return Response({
                    'detail': 'Bu email ile kayıtlı müşteri bulunamadı'
                }, status=status.HTTP_404_NOT_FOUND)
            
            # OTP doğrula
            if not user.phone_number:
                return Response({
                    'detail': 'Telefon numarası bulunamadı'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            sms_service = IletiMerkeziSMS()
            formatted_phone = sms_service.format_phone_number(user.phone_number)
            
            otp_service = OTPService()
            is_valid, error_message = otp_service.verify_otp(
                phone_number=formatted_phone,
                code=sms_code,
                purpose='password_update',
                mark_used=True
            )
            
            if not is_valid:
                return Response({
                    'detail': error_message or 'Geçersiz SMS kodu'
                }, status=status.HTTP_400_BAD_REQUEST)
            
        # Güçlü şifre doğrulaması
        password_errors = validate_strong_password_simple(password)
        if password_errors:
            return Response({
                'detail': ' '.join(password_errors)
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Şifreyi güncelle
            user.set_password(password)
            user.save()
            
            return Response({
                'detail': 'Şifre başarıyla güncellendi'
            }, status=status.HTTP_200_OK)
        
        else:
            # İlk adım: OTP gönder
            email = request.data.get('email')
            
            if not email:
                return Response({
                    'detail': 'Email adresi gerekli'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Kullanıcıyı bul
            try:
                user = CustomUser.objects.get(email=email, role='client')
            except CustomUser.DoesNotExist:
                return Response({
                    'detail': 'Bu email ile kayıtlı müşteri bulunamadı'
                }, status=status.HTTP_404_NOT_FOUND)
            
            # Telefon numarası kontrolü
            if not user.phone_number:
                return Response({
                    'detail': 'Telefon numaranız kayıtlı değil. Lütfen önce telefon numaranızı ekleyin.'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # OTP gönder
            sms_service = IletiMerkeziSMS()
            formatted_phone = sms_service.format_phone_number(user.phone_number)
            
            otp_service = OTPService()
            otp_service.clear_all_otps(formatted_phone)
            
            success, code, error_message = otp_service.send_otp(
                phone_number=formatted_phone,
                purpose='password_update',
                user_id=user.id
            )
            
            if not success:
                return Response({
                    'detail': error_message or 'OTP kodu gönderilemedi. Lütfen tekrar deneyin.'
                }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            
            # SMS gönder (async - Celery)
            send_otp_sms_async.delay(formatted_phone, code, 'password_update')
            sms_sent = True  # Celery queue'ya eklendi
            
            if not sms_sent:
                otp_service.delete_otp(formatted_phone, 'password_update')
                return Response({
                    'detail': 'SMS gönderilemedi. Lütfen daha sonra tekrar deneyin.'
                }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            
            # Token oluştur
            token_data = json.dumps({
                'user_id': user.id,
                'email': user.email,
                'timestamp': timezone.now().timestamp()
            })
            encrypted_token = encrypt_text(token_data)
            
            return Response({
                'detail': 'SMS doğrulama kodu gönderildi',
                'requires_sms_verification': True,
                'token': encrypted_token,
                'phone_last_4': formatted_phone[-4:]
            }, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Client set password error: {e}")
        return Response({
            'detail': 'Şifre güncellenirken hata oluştu'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
