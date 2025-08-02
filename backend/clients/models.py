from django.db import models
from core.models import CustomUser
from core.utils import avatar_upload_path
import uuid
import os
from PIL import Image
from io import BytesIO
from django.core.files import File

# Create your models here.

class ClientProfile(models.Model):
    user = models.OneToOneField(CustomUser, on_delete=models.CASCADE, related_name='client_profile')
    
    # Kişisel bilgiler
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    phone = models.CharField(max_length=20)
    
    # Konum bilgileri
    city = models.CharField(max_length=100)
    district = models.CharField(max_length=100)
    address = models.TextField()
    
    # İsteğe bağlı bilgiler
    profile_photo = models.ImageField(upload_to='client_photos/', null=True, blank=True)
    avatar = models.ImageField(upload_to=avatar_upload_path, null=True, blank=True)
    about = models.TextField(blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = "Müşteri Profili"
        verbose_name_plural = "Müşteri Profilleri"
    
    def __str__(self):
        return f"{self.first_name} {self.last_name} - {self.user.email}"
    
    @property
    def full_name(self):
        return f"{self.first_name} {self.last_name}"
    
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
