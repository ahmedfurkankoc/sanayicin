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

# Create your models here.

class CustomUser(AbstractUser):
    ROLE_CHOICES = [
        ('client', 'Müşteri'),
        ('vendor', 'Esnaf'),
        ('both', 'Esnaf + Müşteri'),
        ('admin', 'Admin'),
    ]
    role = models.CharField(max_length=16, choices=ROLE_CHOICES, default="client")
    email = models.EmailField(unique=True)
    
    # Yeni doğrulama sistemi
    is_verified = models.BooleanField(default=False)  # Genel doğrulama durumu
    verification_method = models.CharField(
        max_length=10, 
        choices=[('email', 'Email'), ('sms', 'SMS')], 
        default='email'
    )
    
    # Merkezi telefon numarası (hem müşteri hem esnaf için)
    phone_number = models.CharField(max_length=20, null=True, blank=True)
    
    # SMS doğrulama
    sms_verification_code = models.CharField(max_length=6, null=True, blank=True)
    sms_code_expires_at = models.DateTimeField(null=True, blank=True)
    
    # Geriye uyumluluk için email_verified tutulacak (geçiş süreci için)
    email_verified = models.BooleanField(default=False)

    REQUIRED_FIELDS = ["email"]

    def save(self, *args, **kwargs):
        # Superuser oluşturulduğunda role'ü admin yap
        if self.is_superuser and not self.pk:
            self.role = "admin"
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.username} ({self.role})"
    
    @property
    def is_verified_user(self):
        """Geriye uyumluluk için - hem eski hem yeni sistemi kontrol eder"""
        return self.is_verified or self.email_verified
    
    @property
    def verification_status(self):
        """Doğrulama durumunu döndürür"""
        if self.is_verified:
            return 'verified'
        elif self.email_verified:
            return 'legacy_verified'  # Eski sistemden gelen
        else:
            return 'unverified'
    
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
            
            # Email gönder
            email_sent = EmailService.send_verification_link_email(self.email, verification.token)
            
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

class Category(models.Model):
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    service_area = models.ForeignKey(ServiceArea, on_delete=models.CASCADE, related_name="categories")

    def __str__(self):
        return f"{self.name} ({self.service_area.name})"

class CarBrand(models.Model):
    """Araba markaları için model"""
    name = models.CharField(max_length=100, unique=True)
    logo = models.ImageField(upload_to="car_brand_logos/", blank=True, null=True)
    description = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['name']

    def __str__(self):
        return self.name


