from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny
from django.db.models import Q
from .serializers import VendorProfileSerializer, VendorRegisterSerializer, AppointmentSerializer, AppointmentCreateSerializer, CarBrandDetailSerializer
from core.models import CustomUser
from .models import VendorProfile, Appointment
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
        ).select_related('user').prefetch_related('service_areas', 'categories', 'car_brands')
        
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
                service_area = ServiceArea.objects.get(id=service)
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
        
        return queryset.order_by('-id')  # En yeni vendor'lar önce

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

class VendorProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = VendorProfileSerializer
    permission_classes = [IsVendor]

    def get_object(self):
        # VendorProfile'ı döndür, CustomUser'ı değil
        try:
            return VendorProfile.objects.get(user=self.request.user)
        except VendorProfile.DoesNotExist:
            # Eğer VendorProfile yoksa ve admin/superuser ise, test için boş profile oluştur
            if self.request.user.is_staff or self.request.user.is_superuser:
                # Test için admin/superuser için dummy profile
                return VendorProfile.objects.create(
                    user=self.request.user,
                    business_type="esnaf",
                    company_title="Admin Test Şirketi",
                    tax_office="Test Vergi Dairesi",
                    tax_no="1234567890",
                    display_name="Admin Test",
                    about="Admin test profili",
                    phone="5551234567",
                    address="Test Adres",
                    city="İstanbul",
                    district="Kadıköy",
                    subdistrict="Test Mahalle",
                    manager_name="Admin Test",
                    manager_birthdate="1990-01-01",
                    manager_tc="12345678901",
                    manager_phone="5551234567"
                )
            else:
                # Normal vendor için 404 döndür
                from rest_framework.exceptions import NotFound
                raise NotFound("Vendor profile not found")

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
        appointment.status = 'confirmed'
        appointment.save()
        
        # Email bildirimi gönder
        self.send_confirmation_notification(appointment)
        
        return Response({'status': 'confirmed'})
    
    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        """Randevuyu reddet"""
        appointment = self.get_object()
        appointment.status = 'rejected'
        appointment.save()
        
        # Email bildirimi gönder
        self.send_rejection_notification(appointment)
        
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
        
        return Response({'status': 'cancelled'})
    
    def send_appointment_notification(self, appointment):
        """Yeni randevu talebi bildirimi - Asenkron"""
        try:
            from core.utils.email_service import EmailService
            
            # Asenkron email gönder
            appointment_data = {
                'customer_name': appointment.customer_name,
                'customer_phone': appointment.customer_phone,
                'customer_email': appointment.customer_email,
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
                'customer_name': appointment.customer_name,
                'customer_phone': appointment.customer_phone,
                'customer_email': appointment.customer_email,
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
                'customer_name': appointment.customer_name,
                'customer_phone': appointment.customer_phone,
                'customer_email': appointment.customer_email,
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
                'customer_name': appointment.customer_name,
                'customer_phone': appointment.customer_phone,
                'customer_email': appointment.customer_email,
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

class CustomerAppointmentView(APIView):
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
                'customer_name': appointment.customer_name,
                'customer_phone': appointment.customer_phone,
                'customer_email': appointment.customer_email,
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

class CarBrandListView(APIView):
    """Aktif araba markalarını listele"""
    permission_classes = [AllowAny]
    
    def get(self, request):
        car_brands = CarBrand.objects.filter(is_active=True)
        serializer = CarBrandDetailSerializer(car_brands, many=True)
        return Response(serializer.data)
