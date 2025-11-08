from django.db import models
from django.contrib.auth.hashers import make_password, check_password
from django.contrib.auth import get_user_model
from django.utils import timezone
from django.core.files.base import ContentFile
from django.core.files.storage import default_storage
from io import BytesIO
from PIL import Image
import re
from django.core.validators import FileExtensionValidator
from core.models import  ServiceArea, Category, CarBrand, SupportTicket, SupportMessage
import uuid

User = get_user_model()

class AdminUser(models.Model):
    ROLE_CHOICES = [
        ('admin', 'Admin'),
        ('editor', 'Editör'),
        ('support', 'Teknik Destek'),
    ]

    email = models.EmailField(unique=True, db_index=True)
    first_name = models.CharField(max_length=150, blank=True)
    last_name = models.CharField(max_length=150, blank=True)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, db_index=True)
    is_superuser = models.BooleanField(default=False, db_index=True)
    is_active = models.BooleanField(default=True, db_index=True)
    password = models.CharField(max_length=128)
    date_joined = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Admin Kullanıcı'
        verbose_name_plural = 'Admin Kullanıcılar'
        indexes = [
            models.Index(fields=['email']),
            models.Index(fields=['role']),
            models.Index(fields=['is_superuser']),
            models.Index(fields=['is_active']),
        ]

    def __str__(self):
        return f"{self.email} ({self.role})"

    # Password helpers
    def set_password(self, raw_password: str) -> None:
        self.password = make_password(raw_password)

    def check_password(self, raw_password: str) -> bool:
        return check_password(raw_password, self.password)

    def get_full_name(self) -> str:
        return f"{self.first_name} {self.last_name}".strip()

    # DRF/Django auth compatibility flags
    @property
    def is_authenticated(self) -> bool:
        return True

    @property
    def is_anonymous(self) -> bool:
        return False

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
        ('definitions', 'Tanımlamalar'),
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
    featured_image_alt = models.CharField(max_length=150, blank=True, verbose_name="Öne Çıkan Görsel Alt Metin")
    category = models.ForeignKey(
        BlogCategory,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        verbose_name="Kategori"
    )
    author_admin = models.ForeignKey(
        AdminUser,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        verbose_name="Yazar (Admin)"
    )
    created_by_admin = models.ForeignKey(
        AdminUser,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='blog_posts_created',
        verbose_name="Oluşturan (Admin)"
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
    
    # SEO Fields
    meta_title = models.CharField(max_length=60, blank=True, verbose_name="Meta Başlık")
    meta_description = models.TextField(max_length=160, blank=True, verbose_name="Meta Açıklama")
    meta_keywords = models.CharField(max_length=255, blank=True, verbose_name="Meta Anahtar Kelimeler")
    canonical_url = models.URLField(blank=True, verbose_name="Canonical URL")
    
    # Social Media
    og_title = models.CharField(max_length=100, blank=True, verbose_name="OG Başlık")
    og_description = models.TextField(max_length=200, blank=True, verbose_name="OG Açıklama")
    og_image = models.ImageField(upload_to='blog/og/', blank=True, null=True, verbose_name="OG Görsel")
    og_alt = models.CharField(max_length=150, blank=True, verbose_name="OG Görsel Alt Metin")
    
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Oluşturulma Tarihi")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="Güncellenme Tarihi")

    class Meta:
        verbose_name = "Blog Yazısı"
        verbose_name_plural = "Blog Yazıları"
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['status']),
            models.Index(fields=['created_at']),
        ]

    def __str__(self):
        return self.title

    def save(self, *args, **kwargs):
        if self.status == 'published' and not self.published_at:
            self.published_at = timezone.now()

        # Ensure alt texts
        if not (self.featured_image_alt or '').strip():
            base = (self.title or 'Sanayicin').strip()
            self.featured_image_alt = f"{base} | Kapak Görseli"
        if not (self.og_alt or '').strip():
            base = (self.title or 'Sanayicin').strip()
            self.og_alt = f"{base} | Open Graph Görseli"

        def _process_imagefield_to_1200x630(image_field: models.ImageField) -> None:
            if not image_field:
                return
            try:
                image_field.open('rb')
                img = Image.open(image_field)
                # Normalize mode
                if img.mode in ('RGBA', 'LA', 'P'):
                    background = Image.new('RGB', img.size, (255, 255, 255))
                    if img.mode == 'RGBA':
                        background.paste(img, mask=img.split()[3])
                    else:
                        background.paste(img)
                    img = background
                elif img.mode != 'RGB':
                    img = img.convert('RGB')

                target_width, target_height = 1200, 630
                target_aspect = target_width / target_height
                original_width, original_height = img.size
                original_aspect = (original_width / original_height) if original_height else target_aspect

                # Skip if already exact size
                if original_width == target_width and original_height == target_height:
                    return

                # Center-crop to target aspect
                if original_aspect > target_aspect:
                    # Wider: crop width
                    new_width = int(original_height * target_aspect)
                    left = (original_width - new_width) // 2
                    img = img.crop((left, 0, left + new_width, original_height))
                elif original_aspect < target_aspect:
                    # Taller: crop height
                    new_height = int(original_width / target_aspect)
                    top = (original_height - new_height) // 2
                    img = img.crop((0, top, original_width, top + new_height))

                # Resize to 1200x630
                img = img.resize((target_width, target_height), Image.Resampling.LANCZOS)

                buffer = BytesIO()
                img.save(buffer, format='JPEG', quality=85, optimize=True)
                buffer.seek(0)

                # Overwrite the existing file path to keep references
                image_field.save(image_field.name, ContentFile(buffer.read()), save=False)
            except Exception:
                # In case of any processing error, leave the original file intact
                return

        # Process cover and og images if present
        if getattr(self, 'featured_image', None):
            _process_imagefield_to_1200x630(self.featured_image)
        if getattr(self, 'og_image', None):
            _process_imagefield_to_1200x630(self.og_image)

        # Process images inside HTML content (only media under blog/ paths)
        if getattr(self, 'content', None):
            try:
                content_updated = False
                # Find /media/... or /api/admin/media/... src values
                paths = set()
                for m in re.findall(r"src=[\"'](?:/api/admin)?/media/([^\"']+)[\"']", self.content or ''):
                    # Only process blog-related uploads
                    if m.startswith('blog/'):
                        paths.add(m)

                for rel_path in paths:
                    try:
                        # Normalize storage relative path
                        storage_path = rel_path
                        if default_storage.exists(storage_path):
                            with default_storage.open(storage_path, 'rb') as f:
                                img = Image.open(f)
                                if img.mode in ('RGBA', 'LA', 'P'):
                                    bg = Image.new('RGB', img.size, (255, 255, 255))
                                    if img.mode == 'RGBA':
                                        bg.paste(img, mask=img.split()[3])
                                    else:
                                        bg.paste(img)
                                    img = bg
                                elif img.mode != 'RGB':
                                    img = img.convert('RGB')

                                target_width, target_height = 1200, 630
                                target_aspect = target_width / target_height
                                w, h = img.size
                                if not (w == target_width and h == target_height):
                                    aspect = (w / h) if h else target_aspect
                                    if aspect > target_aspect:
                                        new_w = int(h * target_aspect)
                                        left = (w - new_w) // 2
                                        img = img.crop((left, 0, left + new_w, h))
                                    elif aspect < target_aspect:
                                        new_h = int(w / target_aspect)
                                        top = (h - new_h) // 2
                                        img = img.crop((0, top, w, top + new_h))
                                    img = img.resize((target_width, target_height), Image.Resampling.LANCZOS)

                                    buf = BytesIO()
                                    img.save(buf, format='JPEG', quality=85, optimize=True)
                                    buf.seek(0)
                                    # Overwrite existing file to keep URLs unchanged
                                    default_storage.delete(storage_path)
                                    default_storage.save(storage_path, ContentFile(buf.read()))
                                    content_updated = True
                    except Exception:
                        continue

                # If we changed any files, no need to alter HTML since paths are unchanged
                if content_updated:
                    pass
            except Exception:
                pass

        super().save(*args, **kwargs)

class SystemLog(models.Model):
    """Sistem logları - genişletilmiş (activity logları dahil)"""
    LOG_LEVEL_CHOICES = [
        ('debug', 'Debug'),
        ('info', 'Info'),
        ('warning', 'Warning'),
        ('error', 'Error'),
        ('critical', 'Critical'),
    ]
    
    ACTIVITY_TYPE_CHOICES = [
        ('system', 'Sistem'),
        ('user_registered', 'Kullanıcı Kaydı'),
        ('vendor_created', 'Esnaf Oluşturuldu'),
        ('support_ticket', 'Destek Talebi'),
        ('blog_published', 'Blog Yayınlandı'),
        ('user_verified', 'Kullanıcı Doğrulandı'),
        ('vendor_verified', 'Esnaf Doğrulandı'),
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
    
    # Activity log alanları
    activity_type = models.CharField(
        max_length=20, 
        choices=ACTIVITY_TYPE_CHOICES, 
        default='system',
        db_index=True,
        verbose_name="Aktivite Türü"
    )
    activity_data = models.JSONField(default=dict, blank=True, verbose_name="Aktivite Verisi")

    class Meta:
        verbose_name = "Sistem Logu"
        verbose_name_plural = "Sistem Logları"
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['module']),
            models.Index(fields=['level']),
            models.Index(fields=['created_at']),
            models.Index(fields=['activity_type']),
            models.Index(fields=['activity_type', 'created_at']),
        ]

    def __str__(self):
        return f"{self.level} - {self.message[:50]}"

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
        indexes = [
            models.Index(fields=['is_read']),
            models.Index(fields=['notification_type']),
            models.Index(fields=['created_at']),
        ]

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

class Domain(models.Model):
    """Domain yönetimi"""
    STATUS_CHOICES = [
        ('active', 'Aktif'),
        ('expired', 'Süresi Dolmuş'),
        ('expiring_soon', 'Yakında Dolacak'),
        ('error', 'Hata'),
    ]

    name = models.CharField(max_length=255, unique=True, verbose_name="Domain Adı")
    registrar = models.CharField(max_length=255, blank=True, verbose_name="Kayıt Şirketi")
    registration_date = models.DateTimeField(null=True, blank=True, verbose_name="Kayıt Tarihi")
    expiration_date = models.DateTimeField(null=True, blank=True, verbose_name="Bitiş Tarihi")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active', verbose_name="Durum")
    days_until_expiry = models.IntegerField(null=True, blank=True, verbose_name="Kalan Gün")
    nameservers = models.JSONField(default=list, blank=True, verbose_name="Name Server'lar")
    admin_email = models.EmailField(blank=True, verbose_name="Admin E-posta")
    tech_email = models.EmailField(blank=True, verbose_name="Teknik E-posta")
    auto_renew = models.BooleanField(default=False, verbose_name="Otomatik Yenileme")
    last_checked = models.DateTimeField(auto_now=True, verbose_name="Son Kontrol")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Oluşturulma Tarihi")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="Güncellenme Tarihi")

    class Meta:
        verbose_name = "Domain"
        verbose_name_plural = "Domainler"
        ordering = ['name']
        indexes = [
            models.Index(fields=['status']),
            models.Index(fields=['expiration_date']),
            models.Index(fields=['days_until_expiry']),
        ]

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        # Domain durumunu güncelle
        if self.expiration_date:
            from datetime import datetime, timedelta
            from django.utils import timezone as django_timezone
            now = django_timezone.now()
            days_left = (self.expiration_date - now).days
            
            self.days_until_expiry = days_left
            
            if days_left < 0:
                self.status = 'expired'
            elif days_left <= 30:
                self.status = 'expiring_soon'
            else:
                self.status = 'active'
        
        super().save(*args, **kwargs)

    @property
    def is_expiring_soon(self):
        """30 gün içinde dolacak mı?"""
        return self.days_until_expiry is not None and self.days_until_expiry <= 30

    @property
    def is_expired(self):
        """Süresi dolmuş mu?"""
        return self.days_until_expiry is not None and self.days_until_expiry < 0
