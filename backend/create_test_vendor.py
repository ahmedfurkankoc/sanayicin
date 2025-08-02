#!/usr/bin/env python
import os
import django
from datetime import date

# Django ayarlarını yükle
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from vendors.models import VendorProfile
from core.models import CustomUser, ServiceArea, Category

def create_test_vendor():
    # Test kullanıcısı oluştur
    user, created = CustomUser.objects.get_or_create(
        email='test@vendor.com',
        defaults={
            'username': 'testvendor',
            'role': 'vendor',
            'email_verified': True,
            'is_active': True
        }
    )
    
    if created:
        user.set_password('test123456')
        user.save()
        print(f"Test kullanıcısı oluşturuldu: {user.email}")
    else:
        print(f"Test kullanıcısı zaten mevcut: {user.email}")
    
    # Service area ve category al
    service_area = ServiceArea.objects.first()
    category = Category.objects.first()
    
    if not service_area:
        service_area = ServiceArea.objects.create(name="Test Hizmet Alanı", description="Test açıklama")
    if not category:
        category = Category.objects.create(name="Test Kategori", description="Test açıklama", service_area=service_area)
    
    # Test vendor profili oluştur
    vendor, created = VendorProfile.objects.get_or_create(
        user=user,
        defaults={
            'business_type': 'esnaf',
            'company_title': 'Test Şirketi A.Ş.',
            'tax_office': 'Test Vergi Dairesi',
            'tax_no': '1234567890',
            'display_name': 'Test Esnaf',
            'about': 'Bu bir test esnaf profilidir. Kaliteli hizmet sunuyoruz.',
            'phone': '0555 123 45 67',
            'address': 'Test Mahallesi, Test Sokak No:1',
            'city': 'İstanbul',
            'district': 'Kadıköy',
            'subdistrict': 'Fenerbahçe',
            'manager_name': 'Test Yönetici',
            'manager_birthdate': date(1990, 1, 1),
            'manager_tc': '12345678901',
            'manager_phone': '0555 123 45 67',
            'social_media': {
                'instagram': 'https://instagram.com/testesnaf',
                'facebook': 'https://facebook.com/testesnaf',
                'twitter': 'https://twitter.com/testesnaf',
                'website': 'https://www.testesnaf.com'
            },
            'working_hours': {
                'monday': {'open': '09:00', 'close': '18:00', 'closed': False},
                'tuesday': {'open': '09:00', 'close': '18:00', 'closed': False},
                'wednesday': {'open': '09:00', 'close': '18:00', 'closed': False},
                'thursday': {'open': '09:00', 'close': '18:00', 'closed': False},
                'friday': {'open': '09:00', 'close': '18:00', 'closed': False},
                'saturday': {'open': '10:00', 'close': '16:00', 'closed': False},
                'sunday': {'open': '00:00', 'close': '00:00', 'closed': True}
            }
        }
    )
    
    if created:
        # Service areas ve categories ekle
        vendor.service_areas.add(service_area)
        vendor.categories.add(category)
        vendor.save()
        print(f"Test vendor profili oluşturuldu: {vendor.display_name}")
        print(f"Slug: {vendor.slug}")
        print(f"URL: http://localhost:3000/musteri/esnaf/{vendor.slug}")
    else:
        # Mevcut vendor'ı güncelle
        vendor.social_media = {
            'instagram': 'https://instagram.com/testesnaf',
            'facebook': 'https://facebook.com/testesnaf',
            'twitter': 'https://twitter.com/testesnaf',
            'website': 'https://www.testesnaf.com'
        }
        vendor.working_hours = {
            'monday': {'open': '09:00', 'close': '18:00', 'closed': False},
            'tuesday': {'open': '09:00', 'close': '18:00', 'closed': False},
            'wednesday': {'open': '09:00', 'close': '18:00', 'closed': False},
            'thursday': {'open': '09:00', 'close': '18:00', 'closed': False},
            'friday': {'open': '09:00', 'close': '18:00', 'closed': False},
            'saturday': {'open': '10:00', 'close': '16:00', 'closed': False},
            'sunday': {'open': '00:00', 'close': '00:00', 'closed': True}
        }
        vendor.save()
        print(f"Test vendor profili güncellendi: {vendor.display_name}")
        print(f"Slug: {vendor.slug}")
        print(f"URL: http://localhost:3000/musteri/esnaf/{vendor.slug}")

if __name__ == '__main__':
    create_test_vendor() 