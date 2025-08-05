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
    email_verified = models.BooleanField(default=False)  # Email doğrulama durumu

    REQUIRED_FIELDS = ["email"]

    def save(self, *args, **kwargs):
        # Superuser oluşturulduğunda role'ü admin yap
        if self.is_superuser and not self.pk:
            self.role = "admin"
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.username} ({self.role})"
    

    
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


