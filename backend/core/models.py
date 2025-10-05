from django.db import models
from django.contrib.auth.models import AbstractUser
from django.utils import timezone
from django.contrib.auth.tokens import default_token_generator
from datetime import timedelta
import secrets
import string
import uuid
import os
from PIL import Image
from io import BytesIO
from django.core.files import File
from .utils import avatar_upload_path
from .utils.crypto import encrypt_text, decrypt_text

# Create your models here.

class CustomUser(AbstractUser):
    ROLE_CHOICES = [
        ('client', 'Müşteri'),
        ('vendor', 'Esnaf'),
    ]
    role = models.CharField(max_length=16, choices=ROLE_CHOICES, default="client", db_index=True)
    email = models.EmailField(unique=True)
    
    # Permission fields
    can_provide_services = models.BooleanField(default=False)  # Hizmet verebilir mi?
    can_request_services = models.BooleanField(default=True)   # Hizmet isteyebilir mi?
    
    # Yeni doğrulama sistemi
    is_verified = models.BooleanField(default=False)  # Genel doğrulama durumu
    verification_method = models.CharField(
        max_length=10, 
        choices=[('email', 'Email'), ('sms', 'SMS')], 
        default='email'
    )
    
    phone_number = models.CharField(max_length=20, null=True, blank=True)
    
    first_name = models.CharField(max_length=100, blank=True)
    last_name = models.CharField(max_length=100, blank=True)
    avatar = models.ImageField(upload_to=avatar_upload_path, null=True, blank=True)
    
    # ClientProfile'dan taşınan alanlar
    about = models.TextField(blank=True)  # Hakkında bilgisi
    
    # SMS doğrulama
    sms_verification_code = models.CharField(max_length=6, null=True, blank=True)
    sms_code_expires_at = models.DateTimeField(null=True, blank=True)
    
    REQUIRED_FIELDS = ["email"]

    class Meta:
        indexes = [
            models.Index(fields=['role']),
            models.Index(fields=['date_joined']),
            models.Index(fields=['role', 'date_joined']),
        ]

    def save(self, *args, **kwargs):
        # Role'e göre permission'ları otomatik set et
        if self.role == 'vendor':
            self.can_provide_services = True
            self.can_request_services = True
        elif self.role == 'client':
            self.can_provide_services = False
            self.can_request_services = True
        
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.username} ({self.role})"
    
    def can_chat(self):
        """Chat yapabilir mi?"""
        return self.is_verified and self.is_active
    
    def get_chat_permissions(self):
        """Chat izinleri"""
        if self.role == 'vendor':
            return {
                'can_receive_messages': True,  # Müşterilerden mesaj alabilir
                'can_send_as_vendor': True,    # Esnaf olarak mesaj gönderebilir
                'can_send_as_client': True,    # Müşteri olarak da mesaj gönderebilir
                'can_access_all_chats': False,
            }
        elif self.role == 'client':
            return {
                'can_receive_messages': True,  # Esnaftan mesaj alabilir
                'can_send_as_client': True,    # Müşteri olarak mesaj gönderebilir
                'can_send_as_vendor': False,   # Esnaf olarak mesaj gönderemez
                'can_access_all_chats': False,
            }
        return {
            'can_receive_messages': False, 
            'can_send_as_vendor': False, 
            'can_send_as_client': False,
            'can_access_all_chats': False,
        }
    
    @property
    def is_verified_user(self):
        """Doğrulama durumu - sadece is_verified kullanır"""
        return self.is_verified
    
    @property
    def verification_status(self):
        """Doğrulama durumunu döndürür"""
        if self.is_verified:
            return 'verified'
        else:
            return 'unverified'
    
    @property
    def full_name(self):
        """Tam adı döndür"""
        if self.first_name and self.last_name:
            return f"{self.first_name} {self.last_name}"
        elif self.first_name:
            return self.first_name
        elif self.last_name:
            return self.last_name
        else:
            return self.username or self.email
    
    def save_avatar(self, image_file):
        """Avatar dosyasını 200x200 boyutunda kaydet"""
        try:
            # Eski avatar'ı sil
            if self.avatar:
                if os.path.exists(self.avatar.path):
                    os.remove(self.avatar.path)
            
            # Resmi aç ve işle
            img = Image.open(image_file)
            
            # RGBA'yı RGB'ye çevir (JPEG için)
            if img.mode in ('RGBA', 'LA', 'P'):
                img = img.convert('RGB')
            
            # 200x200 boyutunda resize et (aspect ratio korunarak)
            img.thumbnail((200, 200), Image.Resampling.LANCZOS)
            
            # Yeni canvas oluştur (200x200)
            new_img = Image.new('RGB', (200, 200), (255, 255, 255))
            
            # Resmi ortala
            x = (200 - img.width) // 2
            y = (200 - img.height) // 2
            new_img.paste(img, (x, y))
            
            # BytesIO'ya kaydet
            buffer = BytesIO()
            new_img.save(buffer, format='JPEG', quality=85, optimize=True)
            buffer.seek(0)
            
            # Dosya adını oluştur
            file_uuid = str(uuid.uuid4())
            filename = f'{file_uuid}_200x200.jpg'
            
            # Django File objesi oluştur
            django_file = File(buffer, name=filename)
            
            # Avatar field'ına kaydet
            self.avatar.save(filename, django_file, save=False)
            
            return True
        except Exception as e:
            print(f"Avatar kaydetme hatası: {e}")
            return False
    
    @property
    def permissions(self):
        """Role-based permissions"""
        if self.role == 'vendor':
            return {
                'can_provide_services': True,
                'can_request_services': True,  # Esnaflar da müşteri olarak davranabilir
                'can_manage_users': False,
                'can_access_admin': False
            }
        else:  # client
            return {
                'can_provide_services': False,
                'can_request_services': True,
                'can_manage_users': False,
                'can_access_admin': False
            }
    
    def auto_upgrade_to_vendor(self):
        """Client'ı otomatik olarak vendor'a yükselt (sadece upgrade request'i varsa)"""
        if self.role == 'client' and self.is_verified and hasattr(self, 'vendor_upgrade_request'):
            # Sadece vendor upgrade request'i olan client'ları yükselt
            self.role = 'vendor'
            self.can_provide_services = True
            self.can_request_services = True
            self.save()
            return True
        return False
    
    def create_email_verification(self) -> 'EmailVerification':
        """Email verification token'ı oluştur"""
        # Eski verification kayıtlarını sil
        EmailVerification.objects.filter(user=self).delete()
        
        # Süresi dolmuş token'ları temizle (7 günden eski)
        EmailVerification.objects.filter(
            expires_at__lt=timezone.now() - timedelta(days=7)
        ).delete()
        
        # Güvenli token oluştur
        token = secrets.token_urlsafe(32)
        expires_at = timezone.now() + timedelta(hours=24)  # 24 saat geçerli
        
        return EmailVerification.objects.create(
            user=self,
            token=token,
            expires_at=expires_at
        )
    
    def send_verification_email(self) -> bool:
        """Email doğrulama linki gönder"""
        try:
            from .utils.email_service import EmailService
            
            # Verification token oluştur
            verification = self.create_email_verification()
            
            # Email gönder - kullanıcı rolünü de geç
            email_sent = EmailService.send_verification_link_email(self.email, verification.token, self.role)
            
            return email_sent
            
        except Exception as e:
            print(f"Exception in send_verification_email: {e}")
            return False
    
    def create_sms_verification(self) -> 'SMSVerification':
        """SMS verification kodu oluştur"""
        # Eski kodları temizle
        SMSVerification.objects.filter(user=self).delete()
        
        # 6 haneli kod oluştur
        import random
        code = ''.join([str(random.randint(0, 9)) for _ in range(6)])
        
        # 5 dakika geçerli
        expires_at = timezone.now() + timedelta(minutes=5)
        
        return SMSVerification.objects.create(
            user=self,
            code=code,
            expires_at=expires_at
        )
    
    def send_sms_verification(self) -> bool:
        """SMS doğrulama kodu gönder"""
        try:
            from .utils.sms_service import IletiMerkeziSMS
            
            if not self.phone_number:
                return False
            
            # Verification kodu oluştur
            verification = self.create_sms_verification()
            
            # SMS gönder
            sms_service = IletiMerkeziSMS()
            sms_sent = sms_service.send_verification_code(
                self.phone_number, 
                verification.code
            )
            
            if sms_sent:
                # User model'ini güncelle
                self.sms_verification_code = verification.code
                self.sms_code_expires_at = verification.expires_at
                self.save()
            
            return sms_sent
            
        except Exception as e:
            print(f"SMS verification hatası: {e}")
            return False
    
    def verify_sms_code(self, code: str) -> bool:
        """SMS kodunu doğrula"""
        try:
            verification = SMSVerification.objects.filter(
                user=self,
                code=code,
                is_used=False
            ).first()
            
            if verification and verification.is_valid:
                # Kodu kullanıldı olarak işaretle
                verification.is_used = True
                verification.save()
                
                # Kullanıcıyı doğrula
                self.is_verified = True
                self.verification_method = 'sms'
                self.sms_verification_code = None
                self.sms_code_expires_at = None
                self.save()
                
                return True
            
            return False
            
        except Exception as e:
            print(f"SMS doğrulama hatası: {e}")
            return False

class EmailVerification(models.Model):
    """Email verification token'ları için model"""
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='email_verifications')
    token = models.CharField(max_length=64, unique=True)  # Güvenli token
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()  # Geçerlilik süresi
    is_used = models.BooleanField(default=False)  # Kullanıldı mı?
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.user.email} - {self.token[:10]}..."
    
    @property
    def is_expired(self) -> bool:
        """Token süresi dolmuş mu?"""
        return timezone.now() > self.expires_at
    
    @property
    def is_valid(self) -> bool:
        """Token geçerli mi?"""
        return not self.is_expired and not self.is_used

class SMSVerification(models.Model):
    """SMS verification token'ları için model"""
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='sms_verifications')
    code = models.CharField(max_length=6)  # 6 haneli kod
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()  # 5 dakika geçerli
    is_used = models.BooleanField(default=False)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.user.email} - {self.code}"
    
    @property
    def is_expired(self) -> bool:
        return timezone.now() > self.expires_at
    
    @property
    def is_valid(self) -> bool:
        return not self.is_expired and not self.is_used

class ServiceArea(models.Model):
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True)

    def __str__(self):
        return self.name

    class Meta:
        indexes = [
            models.Index(fields=['name']),
        ]

class Category(models.Model):
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    service_area = models.ForeignKey(ServiceArea, on_delete=models.CASCADE, related_name="categories")

    def __str__(self):
        return f"{self.name} ({self.service_area.name})"

    class Meta:
        indexes = [
            models.Index(fields=['name']),
            models.Index(fields=['service_area']),
        ]

class CarBrand(models.Model):
    """Araba markaları için model"""
    name = models.CharField(max_length=100, unique=True)
    logo = models.ImageField(upload_to="car_brand_logos/", blank=True, null=True)
    description = models.TextField(blank=True)
    is_active = models.BooleanField(default=True, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['name']
        indexes = [
            models.Index(fields=['is_active']),
        ]

    def __str__(self):
        return self.name


class VendorUpgradeRequest(models.Model):
    """Client'tan vendor'a yükseltme talebi için model"""
    STATUS_CHOICES = [
        ('pending', 'Beklemede'),
        ('approved', 'Onaylandı'),
        ('rejected', 'Reddedildi'),
        ('requires_info', 'Bilgi Gerekli')
    ]
    
    # Temel bilgiler
    user = models.OneToOneField(CustomUser, on_delete=models.CASCADE, related_name='vendor_upgrade_request')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    requested_at = models.DateTimeField(auto_now_add=True)
    processed_at = models.DateTimeField(null=True, blank=True)
    admin_notes = models.TextField(blank=True)
    
    # İşletme bilgileri (Client'da olmayan)
    business_type = models.CharField(max_length=16, choices=[
        ("sahis", "Şahıs Şirketi"),
        ("limited", "Limited Şirketi"),
        ("anonim", "Anonim Şirketi"),
        ("esnaf", "Esnaf"),
    ])
    company_title = models.CharField(max_length=150)
    tax_office = models.CharField(max_length=100)
    tax_no = models.CharField(max_length=20)
    display_name = models.CharField(max_length=100)
    
    # Hizmet bilgileri
    service_areas = models.ManyToManyField(ServiceArea, blank=True)
    categories = models.ManyToManyField(Category, blank=True)
    car_brands = models.ManyToManyField(CarBrand, blank=True)
    
    # Konum bilgileri
    address = models.CharField(max_length=255)  # Tam adres
    city = models.CharField(max_length=64)      # Şehir
    district = models.CharField(max_length=64)  # İlçe
    subdistrict = models.CharField(max_length=128)  # Mahalle/Semt
    
    # İletişim bilgileri
    business_phone = models.CharField(max_length=20)  # İşyeri telefonu
    
    # İşletme açıklaması
    about = models.TextField(blank=True)  # İşletme hakkında
    
    # Yönetici bilgileri (Client'da olmayan)
    manager_birthdate = models.DateField()
    manager_tc = models.CharField(max_length=11)
    
    # İşletme belgeleri
    business_license = models.FileField(upload_to='business_licenses/')
    tax_certificate = models.FileField(upload_to='tax_certificates/')
    identity_document = models.FileField(upload_to='identity_documents/')
    
    # Ek bilgiler
    social_media = models.JSONField(default=dict, blank=True)
    working_hours = models.JSONField(default=dict, blank=True)
    unavailable_dates = models.JSONField(default=list, blank=True)
    
    class Meta:
        verbose_name = "Esnaf Yükseltme Talebi"
        verbose_name_plural = "Esnaf Yükseltme Talepleri"
        ordering = ['-requested_at']
        indexes = [
            models.Index(fields=['status']),
            models.Index(fields=['requested_at']),
        ]
    
    def __str__(self):
        return f"{self.user.email} - {self.get_status_display()}"
    
    @property
    def is_pending(self):
        return self.status == 'pending'
    
    @property
    def is_approved(self):
        return self.status == 'approved'
    
    @property
    def is_rejected(self):
        return self.status == 'rejected'
    
    def approve(self, admin_user):
        """Admin tarafından onaylanır"""
        if not admin_user.is_staff:
            raise PermissionError("Sadece admin'ler onaylayabilir")
        
        self.status = 'approved'
        self.processed_at = timezone.now()
        self.save()
        
        # Kullanıcıyı vendor'a yükselt
        self.user.role = 'vendor'
        self.user.can_provide_services = True
        self.user.can_request_services = True
        self.user.save()
        
        # VendorProfile oluştur (eğer yoksa)
        from vendors.models import VendorProfile
        vendor_profile, created = VendorProfile.objects.get_or_create(
            user=self.user,
            defaults={
                'business_type': self.business_type,
                'company_title': self.company_title,
                'tax_office': self.tax_office,
                'tax_no': self.tax_no,
                'display_name': self.display_name,
                'subdistrict': self.subdistrict,
                'manager_name': f"{self.user.first_name} {self.user.last_name}",
                'manager_birthdate': self.manager_birthdate,
                'manager_tc': self.manager_tc,
                'business_phone': self.business_phone,
                'city': self.city,
                'district': self.district,
                'address': self.address,
                'about': self.about,

                'avatar': self.user.avatar,
                'social_media': self.social_media,
                'working_hours': self.working_hours,
                'unavailable_dates': self.unavailable_dates,
            }
        )
        
        # Service areas, categories ve car brands ekle
        vendor_profile.service_areas.set(self.service_areas.all())
        vendor_profile.categories.set(self.categories.all())
        vendor_profile.car_brands.set(self.car_brands.all())
        
        return vendor_profile
    
    def auto_approve_if_verified(self):
        """Eğer kullanıcı is_verified ise otomatik onayla"""
        if self.user.is_verified:
            # Admin olmadan da otomatik onaylanabilir
            return self.approve(self.user)
        return False


class Favorite(models.Model):
    """Kullanıcıların esnaf favorileri için model"""
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='favorites')
    vendor = models.ForeignKey('vendors.VendorProfile', on_delete=models.CASCADE, related_name='favorited_by')
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ('user', 'vendor')  # Aynı esnaf bir kullanıcı tarafından sadece bir kez favoriye eklenebilir
        ordering = ['-created_at']
        verbose_name = "Favori"
        verbose_name_plural = "Favoriler"
    
    def __str__(self):
        return f"{self.user.email} -> {self.vendor.display_name}"


# Müşterinin araçları
class Vehicle(models.Model):
    ENGINE_CHOICES = [
        ('benzin', 'Benzin'),
        ('dizel', 'Dizel'),
        ('hibrit', 'Hibrit'),
        ('elektrik', 'Elektrik'),
    ]

    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='vehicles')
    brand = models.CharField(max_length=100)
    model = models.CharField(max_length=100)
    year = models.PositiveIntegerField(null=True, blank=True)
    # Plaka gizliliği: şifreli saklanır
    plate_encrypted = models.TextField(blank=True)
    engine_type = models.CharField(max_length=16, choices=ENGINE_CHOICES, blank=True)
    kilometre = models.PositiveIntegerField(null=True, blank=True)

    # Bakım takip
    periodic_due_km = models.PositiveIntegerField(null=True, blank=True)
    periodic_due_date = models.DateField(null=True, blank=True)
    last_maintenance_notes = models.TextField(blank=True)

    # Muayene takip
    inspection_expiry = models.DateField(null=True, blank=True)
    exhaust_emission_date = models.DateField(null=True, blank=True)

    # Lastik & Sigorta
    tire_change_date = models.DateField(null=True, blank=True)
    traffic_insurance_expiry = models.DateField(null=True, blank=True)
    casco_expiry = models.DateField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-updated_at']
        indexes = [
            models.Index(fields=['user', 'brand']),
            models.Index(fields=['user', 'inspection_expiry']),
            models.Index(fields=['user', 'traffic_insurance_expiry']),
            models.Index(fields=['user', 'casco_expiry']),
        ]

    def __str__(self):
        return f"{self.user.email} - {self.brand} {self.model}"

    @property
    def plate(self) -> str:
        return decrypt_text(self.plate_encrypted or '') or ''

    @plate.setter
    def plate(self, value: str) -> None:
        self.plate_encrypted = encrypt_text((value or '').strip()) if value else ''

# Destek Merkezi - Support Ticket
class SupportTicket(models.Model):
    ROLE_CHOICES = [
        ('client', 'Müşteri'),
        ('vendor', 'Esnaf'),
        ('unknown', 'Bilinmiyor'),
    ]
    STATUS_CHOICES = [
        ('open', 'Açık'),
        ('pending', 'Beklemede'),
        ('resolved', 'Çözüldü'),
        ('closed', 'Kapalı'),
    ]
    PRIORITY_CHOICES = [
        ('low', 'Düşük'),
        ('normal', 'Normal'),
        ('high', 'Yüksek'),
        ('urgent', 'Acil'),
    ]

    public_id = models.CharField(max_length=12, unique=True, editable=False)
    user = models.ForeignKey(CustomUser, on_delete=models.SET_NULL, null=True, blank=True, related_name='support_tickets')
    role = models.CharField(max_length=16, choices=ROLE_CHOICES, default='unknown')
    requester_email = models.EmailField()
    requester_name = models.CharField(max_length=120, blank=True)

    subject = models.CharField(max_length=200)
    category = models.CharField(max_length=100, blank=True)
    message = models.TextField()
    attachment = models.FileField(upload_to='support_attachments/', null=True, blank=True)

    status = models.CharField(max_length=16, choices=STATUS_CHOICES, default='open', db_index=True)
    priority = models.CharField(max_length=16, choices=PRIORITY_CHOICES, default='normal')

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Destek Talebi'
        verbose_name_plural = 'Destek Talepleri'
        indexes = [
            models.Index(fields=['status']),
            models.Index(fields=['created_at']),
            models.Index(fields=['status', 'created_at']),
        ]

    def __str__(self):
        return f"{self.public_id} - {self.subject}"

    def save(self, *args, **kwargs):
        if not self.public_id:
            # Kısa, kullanıcıya gösterilebilir takip kodu
            self.public_id = uuid.uuid4().hex[:12]
        super().save(*args, **kwargs)


# Destek Mesajları - Support Messages
class SupportMessage(models.Model):
    ticket = models.ForeignKey(SupportTicket, on_delete=models.CASCADE, related_name='messages')
    sender_user = models.ForeignKey(CustomUser, on_delete=models.SET_NULL, null=True, blank=True, related_name='support_messages')
    is_admin = models.BooleanField(default=False, help_text='Admin tarafından gönderilen mesaj mı?')
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['created_at']
        verbose_name = 'Destek Mesajı'
        verbose_name_plural = 'Destek Mesajları'
        indexes = [
            models.Index(fields=['ticket']),
            models.Index(fields=['created_at']),
        ]

    def __str__(self):
        sender = 'Admin' if self.is_admin else (self.sender_user.email if self.sender_user else 'Anonim')
        return f"{self.ticket.public_id} - {sender} - {self.created_at.strftime('%d.%m.%Y %H:%M')}"

