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
    
    # Kişisel bilgiler (CustomUser üzerinden yönetilir)
    # first_name, last_name, avatar, phone_number
    
    # İsteğe bağlı bilgiler
    about = models.TextField(blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = "Müşteri Profili"
        verbose_name_plural = "Müşteri Profilleri"
    
    def __str__(self):
        return f"{self.user.full_name} - {self.user.email}"
    
    @property
    def full_name(self):
        """CustomUser'dan full_name al"""
        return self.user.full_name
