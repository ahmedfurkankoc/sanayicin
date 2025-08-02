# Ortak view'lar burada tutulabilir. Şu an vendor/customer view'lar ilgili app'lere taşındı.
from rest_framework import generics, permissions, status, serializers
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from django.core.cache import cache
from django.utils import timezone
from datetime import timedelta
from .models import CustomUser, ServiceArea, Category, EmailVerification
from .serializers import CustomUserSerializer
from .utils.email_service import EmailService
import logging
import secrets
from django.urls import reverse

logger = logging.getLogger(__name__)

class ServiceAreaSerializer(serializers.ModelSerializer):
    class Meta:
        model = ServiceArea
        fields = ("id", "name", "description")

class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ("id", "name", "description", "service_area")

class ServiceAreaListView(generics.ListAPIView):
    queryset = ServiceArea.objects.all()
    serializer_class = ServiceAreaSerializer
    permission_classes = []

class CategoryListView(generics.ListAPIView):
    serializer_class = CategorySerializer
    permission_classes = []

    def get_queryset(self):
        qs = Category.objects.all()
        service_area = self.request.query_params.get("service_area")
        if service_area:
            qs = qs.filter(service_area_id=service_area)
        return qs

# Rate limiting için cache key'leri
def get_rate_limit_key(email: str, action: str) -> str:
    return f"email_verification_rate_limit:{action}:{email}"

def check_rate_limit(email: str, action: str, max_attempts: int, window_minutes: int) -> bool:
    """Rate limiting kontrolü"""
    cache_key = get_rate_limit_key(email, action)
    attempts = cache.get(cache_key, 0)
    
    if attempts >= max_attempts:
        return False
    
    # Attempt sayısını artır
    cache.set(cache_key, attempts + 1, window_minutes * 60)
    return True

@api_view(['POST'])
@permission_classes([AllowAny])
def login(request):
    """Email ve şifre ile giriş yap"""
    try:
        email = request.data.get('email')
        password = request.data.get('password')
        
        if not email or not password:
            return Response(
                {'error': 'Email ve şifre gerekli'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Kullanıcıyı bul
        try:
            user = CustomUser.objects.get(email=email)
        except CustomUser.DoesNotExist:
            return Response(
                {'error': 'Geçersiz email veya şifre'}, 
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        # Şifreyi kontrol et
        if not user.check_password(password):
            return Response(
                {'error': 'Geçersiz email veya şifre'}, 
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        # JWT token oluştur
        from rest_framework_simplejwt.tokens import RefreshToken
        refresh = RefreshToken.for_user(user)
        
        return Response({
            'access': str(refresh.access_token),
            'refresh': str(refresh),
            'email': user.email,
            'email_verified': user.email_verified,
            'role': user.role,
        })
        
    except Exception as e:
        logger.error(f"Login error: {e}")
        return Response(
            {'error': 'Giriş yapılırken hata oluştu'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def upload_avatar(request):
    """Avatar yükleme endpoint'i - vendor ve customer için"""
    try:
        # Dosya kontrolü
        if 'avatar' not in request.FILES:
            return Response(
                {'error': 'Avatar dosyası gerekli'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        image_file = request.FILES['avatar']
        
        # Dosya tipi kontrolü
        allowed_types = ['image/jpeg', 'image/jpg', 'image/png']
        if image_file.content_type not in allowed_types:
            return Response(
                {'error': 'Sadece JPEG ve PNG dosyaları kabul edilir'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Dosya boyutu kontrolü (5MB)
        if image_file.size > 5 * 1024 * 1024:
            return Response(
                {'error': 'Dosya boyutu 5MB\'dan küçük olmalıdır'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Kullanıcı role'üne göre avatar'ı kaydet
        user = request.user
        avatar_url = None
        
        if user.role == 'vendor':
            # Vendor profile'ı bul
            try:
                vendor_profile = user.vendor_profile
                success = vendor_profile.save_avatar(image_file)
                if success:
                    vendor_profile.save()
                    avatar_url = vendor_profile.avatar.url if vendor_profile.avatar else None
            except:
                return Response(
                    {'error': 'Vendor profili bulunamadı'}, 
                    status=status.HTTP_404_NOT_FOUND
                )
        elif user.role == 'client':
            # Client profile'ı bul
            try:
                client_profile = user.client_profile
                success = client_profile.save_avatar(image_file)
                if success:
                    client_profile.save()
                    avatar_url = client_profile.avatar.url if client_profile.avatar else None
            except:
                return Response(
                    {'error': 'Client profili bulunamadı'}, 
                    status=status.HTTP_404_NOT_FOUND
                )
        else:
            return Response(
                {'error': 'Geçersiz kullanıcı rolü'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if avatar_url:
            return Response({
                'message': 'Avatar başarıyla yüklendi',
                'avatar_url': avatar_url
            })
        else:
            return Response(
                {'error': 'Avatar yüklenirken hata oluştu'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
            
    except Exception as e:
        logger.error(f"Avatar upload hatası: {e}")
        return Response(
            {'error': 'Avatar yüklenirken hata oluştu'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['POST'])
@permission_classes([AllowAny])
def send_verification_email(request):
    """Email doğrulama kodu gönder"""
    try:
        email = request.data.get('email')
        
        if not email:
            return Response(
                {'error': 'Email adresi gerekli'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Rate limiting kontrolü (15 dakikada max 3 deneme)
        if not check_rate_limit(email, 'send', 3, 15):
            return Response(
                {'error': 'Çok fazla deneme yaptınız. 15 dakika sonra tekrar deneyin.'}, 
                status=status.HTTP_429_TOO_MANY_REQUESTS
            )
        
        # Kullanıcıyı bul (email_verified=False olan)
        try:
            user = CustomUser.objects.get(email=email, email_verified=False)
        except CustomUser.DoesNotExist:
            return Response(
                {'error': 'Email doğrulama kodu gönderildi'}, 
                status=status.HTTP_200_OK
            )
        
        # Email gönder (token otomatik oluşturulur)
        success = user.send_verification_email()
        
        if success:
            return Response({
                'message': 'Doğrulama kodu gönderildi',
                'email': email
            })
        else:
            return Response(
                {'error': 'Email doğrulama kodu gönderilemedi'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
            
    except Exception as e:
        logger.error(f"Email verification error: {str(e)}")
        return Response(
            {'error': 'Bir hata oluştu'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['POST'])
@permission_classes([AllowAny])
def verify_email(request):
    """Email doğrulama token'ını kontrol et"""
    try:
        token = request.data.get('token')
        
        if not token:
            return Response(
                {'error': 'Token gerekli'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Token'ı kontrol et
        try:
            verification = EmailVerification.objects.get(
                token=token,
                is_used=False,
                expires_at__gt=timezone.now()
            )
        except EmailVerification.DoesNotExist:
            return Response(
                {'error': 'Geçersiz veya süresi dolmuş doğrulama linki'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Email'i doğrulanmış olarak işaretle
        user = verification.user
        user.email_verified = True
        user.save()
        
        # Token'ı kullanıldı olarak işaretle
        verification.is_used = True
        verification.save()
        
        # Hoş geldin emaili gönder
        try:
            EmailService.send_welcome_email(user.email, user.first_name or user.username, user.role)
        except Exception as e:
            logger.error(f"Welcome email failed: {e}")
        
        return Response({
            'message': 'Email başarıyla doğrulandı',
            'user': {
                'id': user.id,
                'email': user.email,
                'username': user.username,
                'role': user.role,
                'email_verified': user.email_verified,
                'first_name': user.first_name,
                'last_name': user.last_name
            }
        })
                
    except Exception as e:
        logger.error(f"Email verification error: {str(e)}")
        return Response(
            {'error': 'Bir hata oluştu'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['POST'])
@permission_classes([AllowAny])
def resend_verification_email(request):
    """Doğrulama kodunu tekrar gönder"""
    try:
        email = request.data.get('email')
        
        if not email:
            return Response(
                {'error': 'Email adresi gerekli'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Rate limiting kontrolü (15 dakikada max 3 deneme)
        if not check_rate_limit(email, 'resend', 3, 15):
            return Response(
                {'error': 'Çok fazla deneme yaptınız. 15 dakika sonra tekrar deneyin.'}, 
                status=status.HTTP_429_TOO_MANY_REQUESTS
            )
        
        # Kullanıcıyı bul
        try:
            user = CustomUser.objects.get(email=email, email_verified=False)
        except CustomUser.DoesNotExist:
            return Response(
                {'error': 'Email doğrulama kodu gönderildi'}, 
                status=status.HTTP_200_OK
            )
        
        # Email gönder
        success = user.send_verification_email()
        
        if success:
            return Response({
                'message': 'Doğrulama kodu tekrar gönderildi',
                'email': email
            })
        else:
            return Response(
                {'error': 'Email gönderilemedi'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
            
    except Exception as e:
        logger.error(f"Resend verification error: {str(e)}")
        return Response(
            {'error': 'Bir hata oluştu'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['POST'])
@permission_classes([AllowAny])
def forgot_password(request):
    """Şifre sıfırlama linki gönder"""
    try:
        email = request.data.get('email')
        
        if not email:
            return Response(
                {'error': 'Email adresi gerekli'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Rate limiting kontrolü (15 dakikada max 3 deneme)
        if not check_rate_limit(email, 'forgot_password', 3, 15):
            return Response(
                {'error': 'Çok fazla deneme yaptınız. 15 dakika sonra tekrar deneyin.'}, 
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
        
        # Şifre sıfırlama token'ı oluştur (24 saat geçerli)
        reset_token = secrets.token_urlsafe(32)
        cache_key = f"password_reset_token:{reset_token}"
        cache.set(cache_key, user.email, 24 * 60 * 60)  # 24 saat
        
        # Şifre sıfırlama linki oluştur
        reset_url = f"https://esnaf.sanayicin.com/esnaf/sifre-yenile/{reset_token}"
        
        # Email gönder
        try:
            EmailService.send_password_reset_email(email, user.first_name or user.username, reset_url)
            logger.info(f"Password reset email sent to {email}")
        except Exception as e:
            logger.error(f"Password reset email failed for {email}: {e}")
            return Response(
                {'error': 'Şifre sıfırlama emaili gönderilemedi'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        
        return Response({
            'message': 'Şifre sıfırlama linki email adresinize gönderildi'
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Forgot password error: {e}")
        return Response(
            {'error': 'Şifre sıfırlama işlemi başarısız'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['POST'])
@permission_classes([AllowAny])
def reset_password(request):
    """Şifre sıfırlama token'ı ile şifreyi güncelle"""
    try:
        token = request.data.get('token')
        password = request.data.get('password')
        password2 = request.data.get('password2')
        
        if not token or not password or not password2:
            return Response(
                {'error': 'Token ve şifre bilgileri gerekli'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if password != password2:
            return Response(
                {'error': 'Şifreler eşleşmiyor'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if len(password) < 6:
            return Response(
                {'error': 'Şifre en az 6 karakter olmalı'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Token'ı kontrol et
        cache_key = f"password_reset_token:{token}"
        email = cache.get(cache_key)
        
        if not email:
            return Response(
                {'error': 'Geçersiz veya süresi dolmuş token'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Kullanıcıyı bul
        try:
            user = CustomUser.objects.get(email=email)
        except CustomUser.DoesNotExist:
            return Response(
                {'error': 'Kullanıcı bulunamadı'}, 
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Şifreyi güncelle
        user.set_password(password)
        user.save()
        
        # Token'ı sil
        cache.delete(cache_key)
        
        logger.info(f"Password reset successful for {email}")
        
        return Response({
            'message': 'Şifreniz başarıyla güncellendi'
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Reset password error: {e}")
        return Response(
            {'error': 'Şifre güncelleme işlemi başarısız'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
