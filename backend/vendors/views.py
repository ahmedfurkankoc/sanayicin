from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny
from django.db.models import Q
from .serializers import *
from core.models import CustomUser
from .models import VendorProfile, Appointment, Review, ServiceRequest, VendorView, VendorCall
from chat.models import Conversation, Message
import hashlib
from core.models import ServiceArea, CarBrand
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from datetime import datetime, time
import json
from rest_framework.authentication import TokenAuthentication
from rest_framework.permissions import IsAuthenticated
from rest_framework import viewsets
from django.http import Http404
from rest_framework.pagination import PageNumberPagination
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from django.core.cache import cache
from django.views.decorators.cache import cache_page
from django.utils.decorators import method_decorator
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
import logging

logger = logging.getLogger(__name__)

# Permission class'ları
class IsVendor(permissions.BasePermission):
    def has_permission(self, request, view):
        # Vendor, admin role veya superuser olabilir
        return request.user.is_authenticated and (
            request.user.role == "vendor" or 
            request.user.role == "admin" or
            request.user.is_staff or 
            request.user.is_superuser
        )

# Pagination sınıfı
class VendorSearchPagination(PageNumberPagination):
    page_size = 15  # Sayfa başına 15 sonuç
    page_size_query_param = 'page_size'
    max_page_size = 50  # Maksimum sayfa boyutu

class VendorSearchView(generics.ListAPIView):
    serializer_class = VendorProfileSerializer
    permission_classes = [AllowAny]
    pagination_class = VendorSearchPagination
    
    # Yüksek trafik için caching - 5 dakika
    @method_decorator(cache_page(300))
    def get(self, request, *args, **kwargs):
        return super().get(request, *args, **kwargs)
    
    def get_queryset(self):
        queryset = VendorProfile.objects.filter(
            user__is_verified=True,  # Sadece doğrulanmış kullanıcılar
            user__is_active=True     # Sadece aktif kullanıcılar
        ).select_related('user').prefetch_related('service_areas', 'categories', 'car_brands', 'reviews')
        
        # Filtreleme parametreleri
        city = self.request.query_params.get('city', '')
        district = self.request.query_params.get('district', '')
        service = self.request.query_params.get('service', '')
        category = self.request.query_params.get('category', '')
        car_brand = self.request.query_params.get('carBrand', '')
        search_query = self.request.query_params.get('q', '')  # Text search parametresi
        
        # Text search - esnaf adı, hizmet, açıklama gibi alanlarda arama (case-insensitive)
        if search_query:
            # Case-insensitive arama için search_query'yi normalize et
            normalized_query = search_query.lower().strip()
            
            # Türkçe karakter alternatifleri oluştur
            turkish_alternatives = [
                normalized_query,
                normalized_query.replace('i', 'ı'),
                normalized_query.replace('ı', 'i'),
                normalized_query.replace('o', 'ö'),
                normalized_query.replace('ö', 'o'),
                normalized_query.replace('u', 'ü'),
                normalized_query.replace('ü', 'u'),
                normalized_query.replace('s', 'ş'),
                normalized_query.replace('ş', 's'),
                normalized_query.replace('c', 'ç'),
                normalized_query.replace('ç', 'c'),
                normalized_query.replace('g', 'ğ'),
                normalized_query.replace('ğ', 'g')
            ]
            
            # Gelişmiş arama için birden fazla yaklaşım kullan
            from django.db.models import Q
            search_queries = Q()
            
            for alt_query in turkish_alternatives:
                search_queries |= (
                    Q(display_name__icontains=alt_query) |  # Esnaf adı
                    Q(company_title__icontains=alt_query) |  # Şirket adı
                    Q(about__icontains=alt_query) |  # Açıklama
                    Q(business_type__icontains=alt_query) |  # İşletme türü
                    Q(service_areas__name__icontains=alt_query) |  # Hizmet alanı adı
                    Q(categories__name__icontains=alt_query) |  # Kategori adı
                    Q(car_brands__name__icontains=alt_query) |  # Araba markası adı
                    # Şehir ve ilçe araması da ekle
                    Q(city__icontains=alt_query) |  # Şehir
                    Q(district__icontains=alt_query)  # İlçe
                )
            
            queryset = queryset.filter(search_queries).distinct()  # Duplicate sonuçları önle
        
        # Şehir filtresi
        if city:
            queryset = queryset.filter(city__icontains=city)
        
        # İlçe filtresi
        if district:
            queryset = queryset.filter(district__icontains=district)
        
        # Hizmet alanı filtresi
        if service:
            try:
                from core.models import ServiceArea
                # Önce ID olarak deneyelim
                if service.isdigit():
                    service_area = ServiceArea.objects.get(id=service)
                else:
                    # String ise name ile ara
                    service_area = ServiceArea.objects.get(name__icontains=service)
                # Vendor'ların service_areas field'ında bu hizmet alanı var mı kontrol et
                queryset = queryset.filter(service_areas=service_area)
            except ServiceArea.DoesNotExist:
                pass
        
        # Kategori filtresi
        if category:
            try:
                from core.models import Category
                category_obj = Category.objects.get(id=category)
                # Vendor'ların categories field'ında bu kategori var mı kontrol et
                queryset = queryset.filter(categories=category_obj)
            except Category.DoesNotExist:
                pass
        
        # Araba markası filtresi
        if car_brand:
            try:
                from core.models import CarBrand
                car_brand_obj = CarBrand.objects.get(id=car_brand)
                # Vendor'ların car_brands field'ında bu araba markası var mı kontrol et
                queryset = queryset.filter(car_brands=car_brand_obj)
            except Category.DoesNotExist:
                pass
        
        # Rating'e göre sırala (yüksek rating önce), sonra en yeni
        from django.db.models import Avg, Count
        return queryset.annotate(
            avg_rating=Avg('reviews__rating'),
            review_count=Count('reviews')
        ).order_by('-avg_rating', '-review_count', '-id')

class VendorDetailView(generics.RetrieveAPIView):
    serializer_class = VendorProfileSerializer
    permission_classes = [AllowAny]
    queryset = VendorProfile.objects.filter(user__is_verified=True, user__is_active=True)
    lookup_field = 'slug'
    
    def get_object(self):
        slug = self.kwargs.get('slug')
        try:
            return VendorProfile.objects.get(
                slug=slug,
                user__is_verified=True,
                user__is_active=True
            )
        except VendorProfile.DoesNotExist:
            from rest_framework.exceptions import NotFound
            raise NotFound("Vendor bulunamadı")


class VendorDashboardSummaryView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if not hasattr(request.user, 'vendor_profile'):
            return Response({"detail": "Vendor bulunamadı"}, status=status.HTTP_404_NOT_FOUND)
        vendor = request.user.vendor_profile
        now = timezone.now()
        month_bucket = now.strftime('%Y-%m')

        profile_views_month = VendorView.objects.filter(vendor=vendor, month_bucket=month_bucket).count()
        calls_month = VendorCall.objects.filter(vendor=vendor, month_bucket=month_bucket).count()

        # messages_total: vendor kullanıcısının dahil olduğu tüm konuşmalardaki mesaj sayısı
        user_obj = vendor.user
        conv_ids = Conversation.objects.filter(Q(user1=user_obj) | Q(user2=user_obj)).values_list('id', flat=True)
        messages_total = Message.objects.filter(conversation_id__in=conv_ids).count()

        reviews_qs = vendor.reviews.all()
        reviews_total = reviews_qs.count()
        from django.db.models import Avg
        average_rating = reviews_qs.aggregate(avg=Avg('rating'))['avg'] or 0

        data = {
            "profile_views_month": profile_views_month,
            "calls_month": calls_month,
            "messages_total": messages_total,
            "appointments_total": vendor.appointments.count(),
            "appointments_today": vendor.appointments.filter(appointment_date=now.date()).count(),
            "favorites_total": 0,
            "reviews_total": reviews_total,
            "average_rating": round(float(average_rating), 1)
        }
        return Response(data)


class VendorAnalyticsViewEvent(APIView):
    permission_classes = [AllowAny]

    def post(self, request, slug):
        try:
            vendor = VendorProfile.objects.get(slug=slug, user__is_active=True)
        except VendorProfile.DoesNotExist:
            return Response({"detail": "Vendor bulunamadı"}, status=status.HTTP_404_NOT_FOUND)
        viewer = request.user if request.user.is_authenticated else None
        if viewer and viewer == vendor.user:
            return Response({"status": "ignored"})
        ip = request.META.get('REMOTE_ADDR', '')
        ua = request.META.get('HTTP_USER_AGENT', '')
        ip_hash = hashlib.sha256(ip.encode()).hexdigest() if ip else ''
        ua_hash = hashlib.sha256(ua.encode()).hexdigest() if ua else ''
        month_bucket = timezone.now().strftime('%Y-%m')
        VendorView.objects.create(vendor=vendor, viewer=viewer, ip_hash=ip_hash, ua_hash=ua_hash, month_bucket=month_bucket)
        return Response({"status": "ok"})


class VendorAnalyticsCallEvent(APIView):
    permission_classes = [AllowAny]

    def post(self, request, slug):
        try:
            vendor = VendorProfile.objects.get(slug=slug, user__is_active=True)
        except VendorProfile.DoesNotExist:
            return Response({"detail": "Vendor bulunamadı"}, status=status.HTTP_404_NOT_FOUND)
        viewer = request.user if request.user.is_authenticated else None
        ip = request.META.get('REMOTE_ADDR', '')
        phone = request.data.get('phone', '')
        ip_hash = hashlib.sha256(ip.encode()).hexdigest() if ip else ''
        month_bucket = timezone.now().strftime('%Y-%m')
        VendorCall.objects.create(vendor=vendor, viewer=viewer, phone=phone, ip_hash=ip_hash, month_bucket=month_bucket)
        return Response({"status": "ok"})

class VendorProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = VendorProfileSerializer
    permission_classes = [IsVendor]

    def get_object(self):
        # VendorProfile'ı döndür, CustomUser'ı değil
        try:
            return VendorProfile.objects.get(user=self.request.user)
        except VendorProfile.DoesNotExist:
            # Vendor role'üne sahip kullanıcının VendorProfile'ı yok - bu bir hata durumu
            logger.error(f"Vendor user {self.request.user.email} has no VendorProfile. Role should be fixed.")
            from rest_framework.exceptions import NotFound
            raise NotFound("Vendor profili bulunamadı. Bu bir sistem hatası, lütfen destek ile iletişime geçin.")

    def get(self, request, *args, **kwargs):
        try:
            return super().get(request, *args, **kwargs)
        except Exception as e:
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"VendorProfileView error: {str(e)}")
            return Response({"detail": "Profile bilgileri alınamadı."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class VendorRegisterView(generics.CreateAPIView):
    queryset = VendorProfile.objects.all()
    serializer_class = VendorRegisterSerializer
    permission_classes = []

    def perform_create(self, serializer):
        return serializer.save()

    def create(self, request, *args, **kwargs):
        print("Received data:", request.data)
        serializer = self.get_serializer(data=request.data)
        if not serializer.is_valid():
            print("Validation errors:", serializer.errors)
            return Response({
                "detail": "Validation error",
                "errors": serializer.errors
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            profile = self.perform_create(serializer)
            return Response({
                "detail": "Hesabınız başarıyla oluşturuldu. Doğrulama yöntemi seçin.",
                "email": profile.user.email,
                "requires_verification": True
            }, status=status.HTTP_201_CREATED)
        except Exception as e:
            print("Registration error:", str(e))
            return Response({
                "detail": f"Registration failed: {str(e)}"
            }, status=status.HTTP_400_BAD_REQUEST)

class SetVendorPasswordView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get("email")
        password = request.data.get("password")
        password2 = request.data.get("password2")
        if not email or not password or not password2:
            return Response({"detail": "Tüm alanlar zorunludur."}, status=status.HTTP_400_BAD_REQUEST)
        if password != password2:
            return Response({"detail": "Şifreler eşleşmiyor."}, status=status.HTTP_400_BAD_REQUEST)
        if len(password) < 6:
            return Response({"detail": "Şifre en az 6 karakter olmalı."}, status=status.HTTP_400_BAD_REQUEST)
        try:
            user = CustomUser.objects.get(email=email, role="vendor")
        except CustomUser.DoesNotExist:
            return Response({"detail": "Kullanıcı bulunamadı."}, status=status.HTTP_404_NOT_FOUND)
        user.set_password(password)
        user.save()
        return Response({"detail": "Şifre başarıyla oluşturuldu."}, status=status.HTTP_200_OK)

class AppointmentViewSet(viewsets.ModelViewSet):
    serializer_class = AppointmentSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        # Sadece vendor'ın kendi randevularını göster
        if hasattr(self.request.user, 'vendor_profile'):
            queryset = Appointment.objects.filter(vendor=self.request.user.vendor_profile)
            
            # Geçmiş tarihli pending randevuları otomatik iptal et
            for appointment in queryset.filter(status='pending'):
                appointment.auto_cancel_if_expired()
            
            # Güncellenmiş queryset'i döndür
            return Appointment.objects.filter(vendor=self.request.user.vendor_profile)
        return Appointment.objects.none()
    
    def get_serializer_class(self):
        if self.action == 'create':
            return AppointmentCreateSerializer
        return AppointmentSerializer
    
    def create(self, request, *args, **kwargs):
        """Müşteri randevu talebi oluşturur"""
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            # Vendor'ı otomatik set et
            vendor_profile = request.user.vendor_profile
            appointment = serializer.save(vendor=vendor_profile)
            
            # Email bildirimi gönder
            self.send_appointment_notification(appointment)
            
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['post'])
    def confirm(self, request, pk=None):
        """Randevuyu onayla"""
        appointment = self.get_object()
        # Geçmiş tarih/saat için onaylamayı engelle
        from django.utils import timezone
        from datetime import datetime
        appointment_datetime = datetime.combine(
            appointment.appointment_date,
            appointment.appointment_time
        )
        now = timezone.now()
        current_datetime = datetime.combine(now.date(), now.time())

        if appointment_datetime < current_datetime:
            # Otomatik iptal et ve bildirim gönder
            previous_status = appointment.status
            if previous_status == 'pending':
                appointment.status = 'cancelled'
                appointment.save()
                try:
                    self.send_cancellation_notification(appointment)
                except Exception:
                    pass
                return Response({
                    'error': 'Randevu tarihi/saatı geçmiş. Randevu otomatik olarak iptal edildi.'
                }, status=status.HTTP_400_BAD_REQUEST)
            return Response({
                'error': 'Geçmiş tarihli randevu onaylanamaz.'
            }, status=status.HTTP_400_BAD_REQUEST)

        appointment.status = 'confirmed'
        appointment.save()
        
        # Email bildirimi gönder
        self.send_confirmation_notification(appointment)
        # Push notification - client'a
        try:
            channel_layer = get_channel_layer()
            from core.models import CustomUser
            target_user = CustomUser.objects.filter(email=appointment.client_email).first()
            if channel_layer is not None and target_user is not None:
                async_to_sync(channel_layer.group_send)(
                    f"user_{target_user.id}",
                    {
                        'type': 'notification.new',
                        'payload': {
                            'kind': 'appointment_confirmed',
                            'title': 'Randevunuz Onaylandı',
                            'message': appointment.service_description,
                            'link': '/musteri/taleplerim'
                        }
                    }
                )
        except Exception:
            pass
        
        return Response({'status': 'confirmed'})
    
    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        """Randevuyu reddet"""
        appointment = self.get_object()
        appointment.status = 'rejected'
        appointment.save()
        
        # Email bildirimi gönder
        self.send_rejection_notification(appointment)
        # Push notification - client'a
        try:
            channel_layer = get_channel_layer()
            from core.models import CustomUser
            target_user = CustomUser.objects.filter(email=appointment.client_email).first()
            if channel_layer is not None and target_user is not None:
                async_to_sync(channel_layer.group_send)(
                    f"user_{target_user.id}",
                    {
                        'type': 'notification.new',
                        'payload': {
                            'kind': 'appointment_rejected',
                            'title': 'Randevunuz Reddedildi',
                            'message': appointment.service_description,
                            'link': '/musteri/taleplerim'
                        }
                    }
                )
        except Exception:
            pass
        
        return Response({'status': 'rejected'})
    
    @action(detail=True, methods=['post'])
    def complete(self, request, pk=None):
        """Randevuyu tamamla - Sadece saati geçmiş randevular tamamlanabilir"""
        from django.utils import timezone
        from datetime import datetime, time
        
        appointment = self.get_object()
        
        # Randevu tarih ve saati
        appointment_datetime = datetime.combine(
            appointment.appointment_date, 
            appointment.appointment_time
        )
        
        # Şu anki zaman
        now = timezone.now()
        current_datetime = datetime.combine(now.date(), now.time())
        
        # Randevu saati geçmiş mi kontrol et
        if appointment_datetime > current_datetime:
            return Response({
                'error': 'Randevu saati henüz gelmedi. Randevu tamamlanamaz.',
                'appointment_time': appointment_datetime.strftime('%Y-%m-%d %H:%M'),
                'current_time': current_datetime.strftime('%Y-%m-%d %H:%M')
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Randevu durumu kontrol et
        if appointment.status != 'confirmed':
            return Response({
                'error': 'Sadece onaylanmış randevular tamamlanabilir.'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Randevuyu tamamla
        appointment.status = 'completed'
        appointment.save()
        
        return Response({'status': 'completed'})
    
    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        """Randevuyu iptal et"""
        appointment = self.get_object()
        appointment.status = 'cancelled'
        appointment.save()
        
        # Email bildirimi gönder
        self.send_cancellation_notification(appointment)
        # Push notification - client'a
        try:
            channel_layer = get_channel_layer()
            from core.models import CustomUser
            target_user = CustomUser.objects.filter(email=appointment.client_email).first()
            if channel_layer is not None and target_user is not None:
                async_to_sync(channel_layer.group_send)(
                    f"user_{target_user.id}",
                    {
                        'type': 'notification.new',
                        'payload': {
                            'kind': 'appointment_cancelled',
                            'title': 'Randevunuz İptal Edildi',
                            'message': appointment.service_description,
                            'link': '/musteri/taleplerim'
                        }
                    }
                )
        except Exception:
            pass
        
        return Response({'status': 'cancelled'})
    
    def send_appointment_notification(self, appointment):
        """Yeni randevu talebi bildirimi - Asenkron"""
        try:
            from core.utils.email_service import EmailService
            
            # Asenkron email gönder
            appointment_data = {
                'client_name': appointment.client_name,
                'client_phone': appointment.client_phone,
                'client_email': appointment.client_email,
                'appointment_date': str(appointment.appointment_date),
                'appointment_time': str(appointment.appointment_time),
                'service_description': appointment.service_description,
                'vendor_email': appointment.vendor.user.email,
                'vendor_name': appointment.vendor.display_name,
                'vendor_phone': appointment.vendor.phone
            }
            
            EmailService.send_appointment_notification_async(appointment_data)
            
        except Exception as e:
            print(f"Async email gönderme hatası: {e}")
    
    def send_confirmation_notification(self, appointment):
        """Randevu onay bildirimi - Asenkron"""
        try:
            from core.utils.email_service import EmailService
            
            appointment_data = {
                'client_name': appointment.client_name,
                'client_phone': appointment.client_phone,
                'client_email': appointment.client_email,
                'appointment_date': str(appointment.appointment_date),
                'appointment_time': str(appointment.appointment_time),
                'service_description': appointment.service_description,
                'vendor_email': appointment.vendor.user.email,
                'vendor_name': appointment.vendor.display_name,
                'vendor_phone': appointment.vendor.phone
            }
            
            EmailService.send_confirmation_notification_async(appointment_data)
            
        except Exception as e:
            print(f"Async confirmation email gönderme hatası: {e}")
    
    def send_rejection_notification(self, appointment):
        """Randevu red bildirimi - Asenkron"""
        try:
            from core.utils.email_service import EmailService
            
            appointment_data = {
                'client_name': appointment.client_name,
                'client_phone': appointment.client_phone,
                'client_email': appointment.client_email,
                'appointment_date': str(appointment.appointment_date),
                'appointment_time': str(appointment.appointment_time),
                'service_description': appointment.service_description,
                'vendor_email': appointment.vendor.user.email,
                'vendor_name': appointment.vendor.display_name,
                'vendor_phone': appointment.vendor.phone
            }
            
            EmailService.send_rejection_notification_async(appointment_data)
            
        except Exception as e:
            print(f"Async rejection email gönderme hatası: {e}")
    
    def send_cancellation_notification(self, appointment):
        """Randevu iptal bildirimi - Asenkron"""
        try:
            from core.utils.email_service import EmailService
            
            appointment_data = {
                'client_name': appointment.client_name,
                'client_phone': appointment.client_phone,
                'client_email': appointment.client_email,
                'appointment_date': str(appointment.appointment_date),
                'appointment_time': str(appointment.appointment_time),
                'service_description': appointment.service_description,
                'vendor_email': appointment.vendor.user.email,
                'vendor_name': appointment.vendor.display_name,
                'vendor_phone': appointment.vendor.phone
            }
            
            EmailService.send_cancellation_notification_async(appointment_data)
            
        except Exception as e:
            print(f"Async cancellation email gönderme hatası: {e}")

class ClientAppointmentView(APIView):
    permission_classes = [AllowAny]
    
    def post(self, request, slug):
        """Müşteri randevu talebi oluşturur"""
        try:
            vendor = VendorProfile.objects.get(slug=slug, user__is_verified=True, user__is_active=True)
        except VendorProfile.DoesNotExist:
            return Response({"detail": "Esnaf bulunamadı"}, status=status.HTTP_404_NOT_FOUND)
        
        # Çalışma saatleri kontrolü
        if not vendor.working_hours or len(vendor.working_hours) == 0:
            return Response({"detail": "Bu esnaf henüz çalışma saatlerini belirlememiş"}, status=status.HTTP_400_BAD_REQUEST)
        
        serializer = AppointmentCreateSerializer(data=request.data)
        if serializer.is_valid():
            appointment = serializer.save(vendor=vendor)
            
            # Email bildirimi gönder
            self.send_appointment_notification(appointment)
            
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    def send_appointment_notification(self, appointment):
        """Yeni randevu talebi bildirimi - Asenkron"""
        try:
            from core.utils.email_service import EmailService
            
            # Asenkron email gönder
            appointment_data = {
                'client_name': appointment.client_name,
                'client_phone': appointment.client_phone,
                'client_email': appointment.client_email,
                'appointment_date': str(appointment.appointment_date),
                'appointment_time': str(appointment.appointment_time),
                'service_description': appointment.service_description,
                'vendor_email': appointment.vendor.user.email,
                'vendor_name': appointment.vendor.display_name,
                'vendor_phone': appointment.vendor.phone
            }
            
            EmailService.send_appointment_notification_async(appointment_data)
            
        except Exception as e:
            print(f"Async email gönderme hatası: {e}")

class ClientAppointmentListView(APIView):
    """Müşterinin randevu taleplerini listeler (email ile)"""
    permission_classes = [AllowAny]
    
    def get(self, request):
        """Müşterinin email'ine göre randevularını getirir"""
        email = request.query_params.get('email')
        if not email:
            return Response({"detail": "Email parametresi gerekli"}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            # Email'e göre randevuları getir
            appointments = Appointment.objects.filter(
                client_email=email
            ).order_by('-created_at')
            
            # Geçmiş tarihli pending randevuları otomatik iptal et
            for appointment in appointments.filter(status='pending'):
                appointment.auto_cancel_if_expired()
            
            # Güncellenmiş randevuları getir
            appointments = Appointment.objects.filter(
                client_email=email
            ).order_by('-created_at')
            
            serializer = AppointmentSerializer(appointments, many=True)
            return Response(serializer.data, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response({"detail": "Randevular getirilemedi"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class CarBrandListView(APIView):
    """Aktif araba markalarını listele"""
    permission_classes = [AllowAny]
    
    def get(self, request):
        car_brands = CarBrand.objects.filter(is_active=True)
        serializer = CarBrandDetailSerializer(car_brands, many=True)
        return Response(serializer.data)


class ReviewViewSet(viewsets.ModelViewSet):
    """Değerlendirme işlemleri için ViewSet"""
    serializer_class = ReviewSerializer
    permission_classes = [AllowAny]  # GET için public, POST için authentication kontrolü create'de yapılacak
    
    def get_queryset(self):
        vendor_slug = self.kwargs.get('vendor_slug')
        if vendor_slug:
            try:
                vendor = VendorProfile.objects.get(slug=vendor_slug)
                return Review.objects.filter(vendor=vendor)
            except VendorProfile.DoesNotExist:
                return Review.objects.none()
        return Review.objects.none()
    
    def perform_create(self, serializer):
        """Yeni değerlendirme oluştur"""
        vendor_slug = self.kwargs.get('vendor_slug')
        try:
            vendor = VendorProfile.objects.get(slug=vendor_slug)
            serializer.save(vendor=vendor)
        except VendorProfile.DoesNotExist:
            raise Http404("Vendor bulunamadı")
    
    @action(detail=True, methods=['post'])
    def mark_as_read(self, request, pk=None):
        """Değerlendirmeyi okundu olarak işaretle"""
        review = self.get_object()
        if not hasattr(request.user, 'vendor_profile') or review.vendor != request.user.vendor_profile:
            return Response({"detail": "Bu işlem için yetkiniz yok"}, status=status.HTTP_403_FORBIDDEN)
        
        review.is_read = True
        review.save()
        return Response({"status": "success"})
    
    @action(detail=False, methods=['get'])
    def unread_count(self, request):
        """Okunmamış değerlendirme sayısını döndür"""
        if not hasattr(request.user, 'vendor_profile'):
            return Response({"detail": "Bu işlem için yetkiniz yok"}, status=status.HTTP_403_FORBIDDEN)
        
        count = Review.objects.filter(
            vendor=request.user.vendor_profile,
            is_read=False
        ).count()
        
        return Response({"unread_count": count})


class ServiceRequestCreateView(APIView):
    """Belirli bir vendor'a müşteri talebi oluşturur"""
    permission_classes = [IsAuthenticated]

    def post(self, request, slug):
        try:
            vendor = VendorProfile.objects.get(slug=slug, user__is_verified=True, user__is_active=True)
        except VendorProfile.DoesNotExist:
            return Response({"detail": "Esnaf bulunamadı"}, status=status.HTTP_404_NOT_FOUND)

        serializer = ServiceRequestSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            service_request = serializer.save(vendor=vendor, status='pending')
            # Push to vendor
            try:
                channel_layer = get_channel_layer()
                if channel_layer is not None:
                    async_to_sync(channel_layer.group_send)(
                        f"user_{vendor.user.id}",
                        {
                            'type': 'notification.new',
                            'payload': {
                                'kind': 'service_request_created',
                                'title': 'Yeni Talep',
                                'message': service_request.title,
                                'link': '/esnaf/taleplerim'
                            }
                        }
                    )
            except Exception:
                pass
            return Response(ServiceRequestSerializer(service_request).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class VendorServiceRequestListView(APIView):
    """Vendor tarafı: kendi taleplerini listeler"""
    permission_classes = [IsAuthenticated, IsVendor]

    def get(self, request):
        # Tek bir talep detayı için ID parametresi kontrolü
        request_id = request.query_params.get('id')
        if request_id:
            try:
                service_request = ServiceRequest.objects.get(
                    id=request_id, 
                    vendor=request.user.vendor_profile
                )
                serializer = ServiceRequestSerializer(service_request)
                return Response(serializer.data)
            except ServiceRequest.DoesNotExist:
                return Response({'detail': 'Talep bulunamadı'}, status=404)
        
        # Normal liste işlemi
        status_filter = request.query_params.get('status')  # pending/responded/completed/cancelled
        last_days = request.query_params.get('last_days')
        only_pending = request.query_params.get('only_pending')
        only_quotes = request.query_params.get('only_quotes')
        queryset = ServiceRequest.objects.filter(vendor=request.user.vendor_profile)
        if status_filter in ['pending', 'responded', 'completed', 'cancelled', 'closed']:
            queryset = queryset.filter(status=status_filter)
        if only_pending == 'true':
            queryset = queryset.filter(status='pending')
        if only_quotes == 'true':
            queryset = queryset.filter(request_type='quote')
        if last_days and str(last_days).isdigit():
            from datetime import timedelta
            since = timezone.now() - timedelta(days=int(last_days))
            queryset = queryset.filter(created_at__gte=since)
        queryset = queryset.order_by('-created_at')
        serializer = ServiceRequestSerializer(queryset, many=True)
        return Response(serializer.data)


class VendorServiceRequestUnreadCountView(APIView):
    """Vendor tarafı: bekleyen talep sayısı"""
    permission_classes = [IsAuthenticated, IsVendor]

    def get(self, request):
        pending_count = ServiceRequest.objects.filter(vendor=request.user.vendor_profile, status='pending').count()
        return Response({"unread_count": pending_count})


class VendorServiceRequestReplyView(APIView):
    permission_classes = [IsAuthenticated, IsVendor]

    def post(self, request, pk):
        """Vendor talebe cevap verir; mesajı ekler ve status responded yapar"""
        try:
            sr = ServiceRequest.objects.get(id=pk, vendor=request.user.vendor_profile)
        except ServiceRequest.DoesNotExist:
            return Response({"detail": "Talep bulunamadı"}, status=status.HTTP_404_NOT_FOUND)
        content = (request.data.get('message') or '').strip()
        phone = (request.data.get('phone') or '').strip()
        price = request.data.get('price')
        days = request.data.get('days')
        if not content:
            return Response({"detail": "Mesaj zorunlu"}, status=status.HTTP_400_BAD_REQUEST)
        # messages alanına ekle
        msgs = list(sr.messages or [])
        offer_payload = {
            'by': 'vendor',
            'content': content,
            'at': timezone.now().isoformat()
        }
        if price is not None:
            try:
                price_val = float(price)
                offer_payload['price'] = price_val
                sr.last_offered_price = price_val
            except Exception:
                pass
        if days is not None:
            try:
                days_val = int(days)
                offer_payload['days'] = days_val
                sr.last_offered_days = days_val
            except Exception:
                pass
        msgs.append(offer_payload)
        sr.messages = msgs
        sr.unread_for_vendor = False
        if phone:
            sr.client_phone = phone
        if sr.status == 'pending':
            sr.status = 'responded'
        sr.save()
        # Push to client
        try:
            channel_layer = get_channel_layer()
            if channel_layer is not None:
                async_to_sync(channel_layer.group_send)(
                    f"user_{sr.user.id}",
                    {
                        'type': 'notification.new',
                        'payload': {
                            'kind': 'vendor_offer_sent',
                            'title': 'Yeni Teklif',
                            'message': sr.title,
                            'link': '/musteri/taleplerim'
                        }
                    }
                )
        except Exception:
            pass
        return Response(ServiceRequestSerializer(sr).data)


class VendorServiceRequestMarkReadView(APIView):
    permission_classes = [IsAuthenticated, IsVendor]

    def post(self, request, pk):
        try:
            sr = ServiceRequest.objects.get(id=pk, vendor=request.user.vendor_profile)
        except ServiceRequest.DoesNotExist:
            return Response({"detail": "Talep bulunamadı"}, status=status.HTTP_404_NOT_FOUND)
        sr.unread_for_vendor = False
        sr.save(update_fields=['unread_for_vendor'])
        return Response({"status": "ok"})


class VendorServiceRequestUpdateStatusView(APIView):
    permission_classes = [IsAuthenticated, IsVendor]

    def post(self, request, pk):
        try:
            sr = ServiceRequest.objects.get(id=pk, vendor=request.user.vendor_profile)
        except ServiceRequest.DoesNotExist:
            return Response({"detail": "Talep bulunamadı"}, status=status.HTTP_404_NOT_FOUND)
        new_status = request.data.get('status')
        if new_status not in ['pending', 'responded', 'completed', 'cancelled']:
            return Response({"detail": "Geçersiz durum"}, status=status.HTTP_400_BAD_REQUEST)
        sr.status = new_status
        sr.save(update_fields=['status'])
        return Response(ServiceRequestSerializer(sr).data)


class ClientServiceRequestListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        # Tek bir talep detayı için ID parametresi kontrolü
        request_id = request.query_params.get('id')
        if request_id:
            try:
                service_request = ServiceRequest.objects.get(
                    id=request_id, 
                    user=request.user
                )
                serializer = ServiceRequestSerializer(service_request)
                return Response(serializer.data)
            except ServiceRequest.DoesNotExist:
                return Response({'detail': 'Talep bulunamadı'}, status=404)
        
        # Normal liste işlemi
        status_filter = request.query_params.get('status')
        last_days = request.query_params.get('last_days')
        queryset = ServiceRequest.objects.filter(user=request.user)
        if status_filter in ['pending', 'responded', 'completed', 'cancelled', 'closed']:
            queryset = queryset.filter(status=status_filter)
        if last_days and str(last_days).isdigit():
            from datetime import timedelta
            since = timezone.now() - timedelta(days=int(last_days))
            queryset = queryset.filter(created_at__gte=since)
        queryset = queryset.order_by('-created_at')
        serializer = ServiceRequestSerializer(queryset, many=True)
        return Response(serializer.data)


class ClientServiceRequestReplyView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        try:
            sr = ServiceRequest.objects.get(id=pk, user=request.user)
        except ServiceRequest.DoesNotExist:
            return Response({"detail": "Talep bulunamadı"}, status=status.HTTP_404_NOT_FOUND)
        content = (request.data.get('message') or '').trim() if hasattr(str, 'trim') else str(request.data.get('message') or '').strip()
        if not content:
            return Response({"detail": "Mesaj zorunlu"}, status=status.HTTP_400_BAD_REQUEST)
        msgs = list(sr.messages or [])
        msgs.append({
            'by': 'client',
            'content': content,
            'at': timezone.now().isoformat()
        })
        sr.messages = msgs
        sr.unread_for_vendor = True
        sr.save()
        return Response(ServiceRequestSerializer(sr).data)
