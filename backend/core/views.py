# Ortak view'lar burada tutulabilir. Şu an vendor/customer view'lar ilgili app'lere taşındı.
from rest_framework import generics, permissions, status, serializers
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from django.core.cache import cache
from django.utils import timezone
from datetime import timedelta
from .models import CustomUser, ServiceArea, Category, EmailVerification, SMSVerification
from .serializers import CustomUserSerializer
from .utils.email_service import EmailService
from .utils.sms_service import IletiMerkeziSMS
import logging
import secrets
from django.urls import reverse
from django.contrib.auth.tokens import default_token_generator

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
            'is_verified': user.is_verified_user,  # Güncellendi
            'verification_status': user.verification_status,  # Yeni
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
    """Avatar yükle"""
    try:
        if 'avatar' not in request.FILES:
            return Response(
                {'error': 'Avatar dosyası gerekli'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        avatar_file = request.FILES['avatar']
        
        # Dosya boyutu kontrolü (5MB)
        if avatar_file.size > 5 * 1024 * 1024:
            return Response(
                {'error': 'Dosya boyutu 5MB\'dan küçük olmalı'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Dosya tipi kontrolü
        allowed_types = ['image/jpeg', 'image/jpg', 'image/png']
        if avatar_file.content_type not in allowed_types:
            return Response(
                {'error': 'Sadece JPEG ve PNG dosyaları kabul edilir'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Avatar'ı kaydet
        success = request.user.save_avatar(avatar_file)
        
        if success:
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
        token = request.data.get('token')
        
        if not token:
            return Response(
                {'error': 'Doğrulama token\'ı gerekli'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Token'ı bul
        try:
            verification = EmailVerification.objects.get(token=token)
        except EmailVerification.DoesNotExist:
            return Response(
                {'error': 'Geçersiz doğrulama linki'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Token geçerli mi?
        if not verification.is_valid:
            if verification.is_expired:
                return Response(
                    {'error': 'Doğrulama linki süresi dolmuş'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            else:
                return Response(
                    {'error': 'Bu doğrulama linki zaten kullanılmış'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        # Kullanıcıyı doğrula
        user = verification.user
        user.is_verified = True
        user.verification_method = 'email'
        user.email_verified = True  # Geriye uyumluluk için
        user.save()
        
        # Token'ı kullanıldı olarak işaretle
        verification.is_used = True
        verification.save()
        
        return Response({
            'message': 'Email başarıyla doğrulandı',
            'email': user.email,
            'is_verified': True
        })
        
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
        
        # SMS gönder
        sms_sent = user.send_sms_verification()
        
        if sms_sent:
            return Response({
                'message': 'SMS doğrulama kodu gönderildi',
                'phone_number': formatted_phone
            })
        else:
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
        
        # SMS kodunu doğrula
        is_valid = user.verify_sms_code(code)
        
        if is_valid:
            return Response({
                'message': 'SMS kodu başarıyla doğrulandı',
                'email': user.email,
                'is_verified': True
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

@api_view(['POST'])
@permission_classes([AllowAny])
def forgot_password(request):
    """Şifre sıfırlama emaili gönder"""
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
        
        # Reset URL oluştur
        reset_url = request.build_absolute_uri(
            reverse('reset_password_confirm', kwargs={'uidb64': user.pk, 'token': token})
        )
        
        # Email gönder
        email_sent = EmailService.send_password_reset_email(email, reset_url)
        
        if email_sent:
            return Response({
                'message': 'Şifre sıfırlama emaili gönderildi',
                'email': email
            })
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
    """Şifre sıfırlama token'ını kontrol et ve şifreyi güncelle"""
    try:
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
