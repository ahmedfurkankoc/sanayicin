from django.db import models
from core.models import CustomUser
from core.models import ServiceArea, Category, CarBrand
from core.utils import avatar_upload_path
import uuid
import os
from PIL import Image
from io import BytesIO
from django.core.files import File

class VendorProfile(models.Model):
    BUSINESS_TYPE_CHOICES = [
        ("sahis", "Şahıs Şirketi"),
        ("limited", "Limited Şirketi"),
        ("anonim", "Anonim Şirketi"),
        ("esnaf", "Esnaf"),
    ]
    user = models.OneToOneField(CustomUser, on_delete=models.CASCADE, related_name="vendor_profile")
    slug = models.CharField(max_length=50, unique=True, blank=True)
    business_type = models.CharField(max_length=16, choices=BUSINESS_TYPE_CHOICES)
    service_areas = models.ManyToManyField(ServiceArea, blank=True)
    categories = models.ManyToManyField(Category, blank=True)
    car_brands = models.ManyToManyField(CarBrand, verbose_name="Hizmet Verilen Araba Markaları", blank=True)
    company_title = models.CharField(max_length=150)
    tax_office = models.CharField(max_length=100)
    tax_no = models.CharField(max_length=20)
    display_name = models.CharField(max_length=100)
    about = models.TextField(blank=True)
    # profile_photo ve avatar artık CustomUser'dan alınıyor
    business_phone = models.CharField(max_length=20)  # İşyeri telefon numarası
    address = models.CharField(max_length=255)
    city = models.CharField(max_length=64)
    district = models.CharField(max_length=64)
    subdistrict = models.CharField(max_length=128)
    # Sosyal medya
    social_media = models.JSONField(default=dict, blank=True)
    # Çalışma saatleri
    working_hours = models.JSONField(default=dict, blank=True)
    # Müsait olmayan tarihler (tatil günleri)
    unavailable_dates = models.JSONField(default=list, blank=True)
    # Yetkili kişi bilgileri (manager_name artık CustomUser'dan alınıyor)
    manager_birthdate = models.DateField()
    manager_tc = models.CharField(max_length=11)
    # manager_phone kaldırıldı - CustomUser'dan alınacak
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.display_name} ({self.user.email})"
    
    @property
    def phone_number(self):
        """CustomUser'dan telefon numarasını al"""
        return self.user.phone_number
    
    @property
    def manager_phone(self):
        """Geriye uyumluluk için property"""
        return self.user.phone_number
    
    @property
    def manager_name(self):
        """CustomUser'dan manager_name al"""
        return self.user.full_name

    def save(self, *args, **kwargs):
        if not self.slug:
            # Benzersiz slug oluştur
            base_slug = f"{self.display_name.lower().replace(' ', '-')}-{str(uuid.uuid4())[:8]}"
            # Türkçe karakterleri değiştir
            base_slug = base_slug.replace('ç', 'c').replace('ğ', 'g').replace('ı', 'i').replace('ö', 'o').replace('ş', 's').replace('ü', 'u')
            # Sadece alfanumerik karakterler ve tire
            import re
            base_slug = re.sub(r'[^a-z0-9-]', '', base_slug)
            self.slug = base_slug
        super().save(*args, **kwargs)
    


class Appointment(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Beklemede'),
        ('confirmed', 'Onaylandı'),
        ('completed', 'Tamamlandı'),
        ('cancelled', 'İptal Edildi'),
        ('rejected', 'Reddedildi'),
    ]
    
    vendor = models.ForeignKey(VendorProfile, on_delete=models.CASCADE, related_name='appointments')
    customer_name = models.CharField(max_length=100)
    customer_phone = models.CharField(max_length=20)
    customer_email = models.EmailField()
    service_description = models.TextField()
    appointment_date = models.DateField()
    appointment_time = models.TimeField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.customer_name} - {self.vendor.display_name} - {self.appointment_date}"
    
    @property
    def is_pending(self):
        return self.status == 'pending'
    
    @property
    def is_confirmed(self):
        return self.status == 'confirmed'
    
    @property
    def is_completed(self):
        return self.status == 'completed'
    
    @property
    def is_cancelled(self):
        return self.status in ['cancelled', 'rejected']
