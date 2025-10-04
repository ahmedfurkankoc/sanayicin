from django.db import models
from django.contrib.auth import get_user_model
from django.utils import timezone
from django.core.validators import FileExtensionValidator
from core.models import CustomUser, ServiceArea, Category, CarBrand, SupportTicket, SupportMessage
import uuid

User = get_user_model()

# Admin Panel Permission Sistemi
class AdminPermission(models.Model):
    """Admin paneli permission sistemi - optimize ve cache-friendly"""
    PERMISSION_CHOICES = [
        ('dashboard', 'Dashboard'),
        ('users', 'Kullanıcı Yönetimi'),
        ('vendors', 'Esnaf Yönetimi'),
        ('support', 'Destek Talepleri'),
        ('blog', 'Blog Yönetimi'),
        ('content', 'İçerik Yönetimi'),
        ('analytics', 'İstatistikler'),
        ('settings', 'Sistem Ayarları'),
        ('live_support', 'Canlı Destek'),
        ('logs', 'Sistem Logları'),
    ]
    
    ROLE_CHOICES = [
        ('admin', 'Admin'),
        ('editor', 'Editör'),
        ('support', 'Teknik Destek'),
    ]
    
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, db_index=True)
    permission = models.CharField(max_length=20, choices=PERMISSION_CHOICES, db_index=True)
    can_read = models.BooleanField(default=False, db_index=True)
    can_write = models.BooleanField(default=False, db_index=True)
    can_delete = models.BooleanField(default=False, db_index=True)
    
    class Meta:
        verbose_name = "Admin İzni"
        verbose_name_plural = "Admin İzinleri"
        unique_together = ['role', 'permission']
        indexes = [
            models.Index(fields=['role', 'permission']),
            models.Index(fields=['role', 'can_read']),
            models.Index(fields=['role', 'can_write']),
        ]
    
    def __str__(self):
        return f"{self.get_role_display()} - {self.get_permission_display()}"
    
    @classmethod
    def get_user_permissions(cls, user):
        """Kullanıcının izinlerini cache-friendly şekilde getir"""
        if user.is_superuser:
            # Superuser her şeye erişebilir
            return {
                perm[0]: {'read': True, 'write': True, 'delete': True}
                for perm in cls.PERMISSION_CHOICES
            }
        
        # Normal admin rolleri için permission'ları getir
        permissions = cls.objects.filter(role=user.role).values(
            'permission', 'can_read', 'can_write', 'can_delete'
        )
        
        return {
            perm['permission']: {
                'read': perm['can_read'],
                'write': perm['can_write'],
                'delete': perm['can_delete']
            }
            for perm in permissions
        }

# Mevcut modeller: ServiceArea, Category, CarBrand, SupportTicket, SupportMessage
# Bu modelleri genişletmek yerine admin paneli için yeni modeller ekleyelim

class BlogCategory(models.Model):
    """Blog kategorileri"""
    name = models.CharField(max_length=100, unique=True, verbose_name="Kategori Adı")
    slug = models.SlugField(max_length=100, unique=True, verbose_name="Slug")
    description = models.TextField(blank=True, verbose_name="Açıklama")
    is_active = models.BooleanField(default=True, verbose_name="Aktif")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Oluşturulma Tarihi")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="Güncellenme Tarihi")

    class Meta:
        verbose_name = "Blog Kategorisi"
        verbose_name_plural = "Blog Kategorileri"
        ordering = ['name']

    def __str__(self):
        return self.name

class BlogPost(models.Model):
    """Blog yazıları"""
    STATUS_CHOICES = [
        ('draft', 'Taslak'),
        ('published', 'Yayınlandı'),
        ('archived', 'Arşivlendi'),
    ]

    title = models.CharField(max_length=200, verbose_name="Başlık")
    slug = models.SlugField(max_length=200, unique=True, verbose_name="Slug")
    content = models.TextField(verbose_name="İçerik")
    excerpt = models.TextField(max_length=500, blank=True, verbose_name="Özet")
    featured_image = models.ImageField(
        upload_to='blog/images/',
        blank=True,
        null=True,
        verbose_name="Öne Çıkan Görsel"
    )
    category = models.ForeignKey(
        BlogCategory,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        verbose_name="Kategori"
    )
    author = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        verbose_name="Yazar"
    )
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='draft',
        verbose_name="Durum"
    )
    is_featured = models.BooleanField(default=False, verbose_name="Öne Çıkan")
    view_count = models.PositiveIntegerField(default=0, verbose_name="Görüntülenme Sayısı")
    published_at = models.DateTimeField(null=True, blank=True, verbose_name="Yayın Tarihi")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Oluşturulma Tarihi")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="Güncellenme Tarihi")

    class Meta:
        verbose_name = "Blog Yazısı"
        verbose_name_plural = "Blog Yazıları"
        ordering = ['-created_at']

    def __str__(self):
        return self.title

    def save(self, *args, **kwargs):
        if self.status == 'published' and not self.published_at:
            self.published_at = timezone.now()
        super().save(*args, **kwargs)

class SystemLog(models.Model):
    """Sistem logları"""
    LOG_LEVEL_CHOICES = [
        ('debug', 'Debug'),
        ('info', 'Info'),
        ('warning', 'Warning'),
        ('error', 'Error'),
        ('critical', 'Critical'),
    ]

    level = models.CharField(max_length=10, choices=LOG_LEVEL_CHOICES, verbose_name="Seviye")
    message = models.TextField(verbose_name="Mesaj")
    module = models.CharField(max_length=100, blank=True, verbose_name="Modül")
    user = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        verbose_name="Kullanıcı"
    )
    ip_address = models.GenericIPAddressField(null=True, blank=True, verbose_name="IP Adresi")
    user_agent = models.TextField(blank=True, verbose_name="User Agent")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Oluşturulma Tarihi")

    class Meta:
        verbose_name = "Sistem Logu"
        verbose_name_plural = "Sistem Logları"
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.level} - {self.message[:50]}"

class AnalyticsData(models.Model):
    """Analitik veriler"""
    date = models.DateField(verbose_name="Tarih")
    metric_name = models.CharField(max_length=100, verbose_name="Metrik Adı")
    metric_value = models.FloatField(verbose_name="Metrik Değeri")
    metadata = models.JSONField(default=dict, blank=True, verbose_name="Metadata")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Oluşturulma Tarihi")

    class Meta:
        verbose_name = "Analitik Veri"
        verbose_name_plural = "Analitik Veriler"
        ordering = ['-date']
        unique_together = ['date', 'metric_name']

    def __str__(self):
        return f"{self.date} - {self.metric_name}: {self.metric_value}"

class AdminNotification(models.Model):
    """Admin bildirimleri"""
    NOTIFICATION_TYPE_CHOICES = [
        ('new_user', 'Yeni Kullanıcı'),
        ('new_vendor', 'Yeni Esnaf'),
        ('support_ticket', 'Destek Talebi'),
        ('system_alert', 'Sistem Uyarısı'),
        ('upgrade_request', 'Yükseltme Talebi'),
    ]

    title = models.CharField(max_length=200, verbose_name="Başlık")
    message = models.TextField(verbose_name="Mesaj")
    notification_type = models.CharField(
        max_length=20,
        choices=NOTIFICATION_TYPE_CHOICES,
        verbose_name="Bildirim Türü"
    )
    is_read = models.BooleanField(default=False, verbose_name="Okundu")
    related_object_id = models.CharField(max_length=100, blank=True, verbose_name="İlgili Obje ID")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Oluşturulma Tarihi")

    class Meta:
        verbose_name = "Admin Bildirimi"
        verbose_name_plural = "Admin Bildirimleri"
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.title} - {self.notification_type}"

class AdminSettings(models.Model):
    """Admin paneli ayarları"""
    key = models.CharField(max_length=100, unique=True, verbose_name="Anahtar")
    value = models.TextField(verbose_name="Değer")
    description = models.TextField(blank=True, verbose_name="Açıklama")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="Güncellenme Tarihi")

    class Meta:
        verbose_name = "Admin Ayarı"
        verbose_name_plural = "Admin Ayarları"
    def __str__(self):
        return f"{self.key}: {self.value[:50]}"
