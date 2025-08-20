# Ortak view'lar burada tutulabilir. Şu an vendor/client view'lar ilgili app'lere taşındı.
from rest_framework import generics, permissions, status, serializers
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from django.core.cache import cache
from django.utils import timezone
from datetime import timedelta
from .models import CustomUser, ServiceArea, Category, EmailVerification, SMSVerification, VendorUpgradeRequest
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
        
        # Kullanıcının hangi profil tipine sahip olduğunu kontrol et
        has_vendor_profile = False
        has_client_profile = False
        
        if user.role == 'vendor':
            # VendorProfile var mı kontrol et
            try:
                from vendors.models import VendorProfile
                VendorProfile.objects.get(user=user)
                has_vendor_profile = True
            except VendorProfile.DoesNotExist:
                has_vendor_profile = False
        
        if user.role == 'client' or user.role == 'vendor':
            # ClientProfile var mı kontrol et
            try:
                from clients.models import ClientProfile
                ClientProfile.objects.get(user=user)
                has_client_profile = True
            except ClientProfile.DoesNotExist:
                has_client_profile = False
        
        # Eğer vendor role'ü ama VendorProfile yoksa, client olarak login yap
        effective_role = user.role
        if user.role == 'vendor' and not has_vendor_profile and has_client_profile:
            effective_role = 'client'
            logger.warning(f"User {user.email} has vendor role but no VendorProfile, using client role for login")
        
        return Response({
            'access': str(refresh.access_token),
            'refresh': str(refresh),
            'email': user.email,
            'is_verified': user.is_verified_user,  # Güncellendi
            'verification_status': user.verification_status,  # Yeni
            'role': effective_role,  # Gerçek kullanılabilir role
            'user_role': user.role,  # Database'deki role
            'has_vendor_profile': has_vendor_profile,
            'has_client_profile': has_client_profile,
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
        # Önce süresi dolmuş token'ları temizle
        from datetime import timedelta
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
        
        # Otomatik vendor upgrade - client is_verified olduğunda
        upgrade_message = ""
        if user.role == 'client':
            try:
                # Client'ı otomatik olarak vendor'a yükselt
                if user.auto_upgrade_to_vendor():
                    upgrade_message = " Hesabınız otomatik olarak esnaf hesabına yükseltildi!"
                    logger.info(f"User {user.email} automatically upgraded to vendor after email verification")
                else:
                    # Eğer otomatik upgrade yapılamadıysa, upgrade request var mı kontrol et
                    if hasattr(user, 'vendor_upgrade_request'):
                        try:
                            vendor_profile = user.vendor_upgrade_request.auto_approve_if_verified()
                            if vendor_profile:
                                upgrade_message = " Esnaf yükseltme talebiniz onaylandı ve hesabınız açıldı!"
                                logger.info(f"User {user.email} vendor upgrade request approved after email verification")
                        except Exception as e:
                            logger.error(f"Vendor upgrade request approval error: {e}")
            except Exception as e:
                logger.error(f"Auto upgrade error for user {user.email}: {e}")
                # Hata olsa bile email verification başarılı
        
        return Response({
            'message': f'Email başarıyla doğrulandı{upgrade_message}',
            'email': user.email,
            'is_verified': True,
            'role': user.role,
            'auto_upgraded': user.role == 'vendor'
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
            # Otomatik vendor upgrade - client is_verified olduğunda
            upgrade_message = ""
            if user.role == 'client':
                try:
                    # Client'ı otomatik olarak vendor'a yükselt
                    if user.auto_upgrade_to_vendor():
                        upgrade_message = " Hesabınız otomatik olarak esnaf hesabına yükseltildi!"
                        logger.info(f"User {user.email} automatically upgraded to vendor after SMS verification")
                    else:
                        # Eğer otomatik upgrade yapılamadıysa, upgrade request var mı kontrol et
                        if hasattr(user, 'vendor_upgrade_request'):
                            try:
                                vendor_profile = user.vendor_upgrade_request.auto_approve_if_verified()
                                if vendor_profile:
                                    upgrade_message = " Esnaf yükseltme talebiniz onaylandı ve hesabınız açıldı!"
                                    logger.info(f"User {user.email} vendor upgrade request approved after SMS verification")
                            except Exception as e:
                                logger.error(f"Vendor upgrade request approval error: {e}")
                except Exception as e:
                    logger.error(f"Auto upgrade error for user {user.email}: {e}")
                    # Hata olsa bile SMS verification başarılı
            
            return Response({
                'message': f'SMS kodu başarıyla doğrulandı{upgrade_message}',
                'email': user.email,
                'is_verified': True,
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

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def request_vendor_upgrade(request):
    """Client'tan vendor'a yükseltme talebi"""
    try:
        from .models import VendorUpgradeRequest
        
        # Kullanıcı sadece client olabilir
        if request.user.role != 'client':
            return Response(
                {'error': 'Sadece müşteriler esnafa yükseltilebilir'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Mevcut upgrade request var mı kontrol et
        if hasattr(request.user, 'vendor_upgrade_request'):
            return Response(
                {'error': 'Zaten bir yükseltme talebiniz bulunuyor'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Form data'yı al
        data = request.data.copy()
        
        # Client bilgilerini otomatik doldur
        client_profile = request.user.client_profile
        data.update({
            'manager_name': f"{client_profile.first_name} {client_profile.last_name}",
            'business_phone': client_profile.phone,
            'city': client_profile.city,
            'district': client_profile.district,
            'address': client_profile.address,
            'about': client_profile.about or ''
        })
        
        # Upgrade request oluştur
        serializer = VendorUpgradeRequestSerializer(data=data)
        if serializer.is_valid():
            upgrade_request = serializer.save(user=request.user)
            
            # Eğer kullanıcı is_verified ise otomatik onayla
            if request.user.is_verified:
                try:
                    vendor_profile = upgrade_request.auto_approve_if_verified()
                    if vendor_profile:
                        return Response({
                            'message': 'Hesabınız otomatik olarak esnaf hesabına yükseltildi!',
                            'auto_approved': True,
                            'vendor_profile_id': vendor_profile.id
                        }, status=status.HTTP_200_OK)
                except Exception as e:
                    logger.error(f"Auto approval error: {e}")
                    # Hata olsa bile upgrade request oluşturuldu
            
            # is_verified değilse normal flow
            return Response({
                'message': 'Esnaf yükseltme talebiniz alındı. Email/SMS doğrulaması gerekli.',
                'request_id': upgrade_request.id,
                'auto_approved': False,
                'requires_verification': True
            }, status=status.HTTP_201_CREATED)
        else:
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
            
    except Exception as e:
        logger.error(f"Vendor upgrade request error: {e}")
        return Response(
            {'error': 'Yükseltme talebi oluşturulamadı'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def check_vendor_upgrade_status(request):
    """Vendor upgrade request durumunu kontrol et"""
    try:
        if hasattr(request.user, 'vendor_upgrade_request'):
            upgrade_request = request.user.vendor_upgrade_request
            return Response({
                'status': upgrade_request.status,
                'requested_at': upgrade_request.requested_at,
                'processed_at': upgrade_request.processed_at,
                'admin_notes': upgrade_request.admin_notes
            })
        else:
            return Response({'status': 'no_request'})
            
    except Exception as e:
        logger.error(f"Check vendor upgrade status error: {e}")
        return Response(
            {'error': 'Durum kontrol edilemedi'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

# VendorUpgradeRequest Serializer
class VendorUpgradeRequestSerializer(serializers.ModelSerializer):
    class Meta:
        model = VendorUpgradeRequest
        fields = [
            'business_type', 'company_title', 'tax_office', 'tax_no', 'display_name',
            'service_areas', 'categories', 'car_brands', 'subdistrict',
            'manager_birthdate', 'manager_tc', 'business_license', 'tax_certificate',
            'identity_document', 'social_media', 'working_hours', 'unavailable_dates'
        ]
    
    def validate_manager_tc(self, value):
        """TC kimlik numarası validasyonu"""
        if not value.isdigit() or len(value) != 11:
            raise serializers.ValidationError("TC kimlik numarası 11 haneli olmalıdır.")
        return value
    
    def validate_tax_no(self, value):
        """Vergi numarası validasyonu"""
        if not value.isdigit() or len(value) < 9 or len(value) > 11:
            raise serializers.ValidationError("Vergi numarası 9-11 haneli olmalıdır.")
        return value
