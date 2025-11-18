from rest_framework import serializers
from django.contrib.auth import get_user_model
from core.models import CustomUser, ServiceArea, Category, CarBrand, SupportTicket, SupportMessage
from .models import *
from vendors.models import VendorProfile, Review

User = get_user_model()

# ========== Admin Authentication Serializers ==========
class AdminLoginSerializer(serializers.Serializer):
    email = serializers.EmailField(required=False)
    password = serializers.CharField(required=False)
    token = serializers.CharField(required=False)  # Şifrelenmiş token (SMS doğrulama için)
    sms_code = serializers.CharField(required=False, max_length=6)  # SMS kodu

class AdminUserSerializer(serializers.ModelSerializer):
    """Admin kullanıcı serializer'ı (AdminUser)"""
    class Meta:
        model = AdminUser
        fields = ['id', 'email', 'first_name', 'last_name', 'role', 'is_superuser', 'date_joined']
        read_only_fields = ['id', 'date_joined']

# ========== Blog Serializers ==========
class BlogCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = BlogCategory
        fields = '__all__'

class BlogPostSerializer(serializers.ModelSerializer):
    author_name = serializers.CharField(source='author.get_full_name', read_only=True)
    category_name = serializers.CharField(source='category.name', read_only=True)
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)
    
    class Meta:
        model = BlogPost
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at', 'view_count', 'author']
        extra_kwargs = {
            'featured_image': {'required': False, 'allow_null': True, 'allow_empty_file': True},
            'og_image': {'required': False, 'allow_null': True, 'allow_empty_file': True},
        }
    
    def to_representation(self, instance):
        """Override to ensure image URLs are absolute"""
        data = super().to_representation(instance)
        
        # Get request from context to build absolute URLs
        request = self.context.get('request')
        
        # Convert image fields to absolute URLs
        for field_name in ['featured_image', 'og_image']:
            # Get the ImageField from instance directly to access .url property
            image_field = getattr(instance, field_name, None)
            
            if not image_field:
                # No image, set to None
                data[field_name] = None
                continue
            
            # Get URL from ImageField - this returns relative path like '/media/blog/images/...'
            try:
                image_url = image_field.url if hasattr(image_field, 'url') else str(image_field)
            except Exception:
                # If .url fails, try to get string representation
                image_url = str(image_field) if image_field else None
            
            if not image_url or image_url == '' or image_url == 'null':
                data[field_name] = None
                continue
            
            # If it's already an absolute URL, normalize it
            if isinstance(image_url, str) and (image_url.startswith('http://') or image_url.startswith('https://')):
                # Already absolute, just normalize /api/admin/media to /media
                data[field_name] = image_url.replace('/api/admin/media', '/media')
                continue
            
            # If it's a relative path, make it absolute
            if isinstance(image_url, str) and image_url.strip():
                if request:
                    # Use request to build absolute URL
                    # image_url is relative path like '/media/blog/images/...'
                    absolute_url = request.build_absolute_uri(image_url)
                    data[field_name] = absolute_url
                else:
                    # Fallback: prepend default backend URL if no request context
                    from django.conf import settings
                    base_url = getattr(settings, 'BASE_URL', 'http://localhost:8000')
                    # Ensure image_url starts with / for proper URL construction
                    if not image_url.startswith('/'):
                        image_url = '/' + image_url
                    data[field_name] = f"{base_url}{image_url}"
            else:
                data[field_name] = None
        
        return data
    
    def to_internal_value(self, data):
        """Handle empty strings for ImageFields before validation"""
        # Make a mutable copy
        if isinstance(data, dict):
            data = data.copy()
            
            # Convert empty strings to None for ImageFields
            for field_name in ['featured_image', 'og_image']:
                if field_name in data:
                    value = data[field_name]
                    # Convert empty strings to None
                    if isinstance(value, str) and value.strip() == '':
                        data[field_name] = None
                    # URL strings are handled in the view, not here
        
        return super().to_internal_value(data)

# ========== System Serializers ==========
class SystemLogSerializer(serializers.ModelSerializer):
    user_email = serializers.SerializerMethodField()
    
    class Meta:
        model = SystemLog
        fields = '__all__'
        read_only_fields = ['created_at']
    
    def get_user_email(self, obj):
        """Get user email from either CustomUser or AdminUser"""
        if obj.user:
            # CustomUser'dan email al
            return obj.user.email
        else:
            # Message içinden email'i parse et (AdminUser için)
            message = obj.message or ''
            # Email pattern'ini ara: email=xxx@xxx.com, username=xxx@xxx.com, veya admin_email=xxx@xxx.com
            import re
            email_match = re.search(r'(?:email=|username=|admin_email=)([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})', message)
            if email_match:
                return email_match.group(1)
        return None

class AdminNotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = AdminNotification
        fields = '__all__'
        read_only_fields = ['created_at']

class AdminSettingsSerializer(serializers.ModelSerializer):
    class Meta:
        model = AdminSettings
        fields = '__all__'
        read_only_fields = ['created_at']

# ========== User Serializers ==========
class UserSerializer(serializers.ModelSerializer):
    """CustomUser serializer'ı"""
    password = serializers.CharField(write_only=True, required=False, min_length=6)
    
    class Meta:
        model = CustomUser
        fields = [
            'id', 'email', 'first_name', 'last_name', 'role', 'is_verified', 
            'is_active', 'date_joined', 'last_login', 'phone_number', 'password'
        ]
        read_only_fields = ['id', 'date_joined', 'last_login']
    
    def create(self, validated_data):
        """Kullanıcı oluştururken şifre hash'lenir"""
        password = validated_data.pop('password', None)
        if password:
            user = CustomUser.objects.create_user(
                username=validated_data['email'],  # username = email
                password=password,
                **validated_data
            )
        else:
            # Şifre yoksa geçici şifre oluştur
            import secrets
            import string
            temp_password = ''.join(secrets.choices(string.ascii_letters + string.digits, k=12))
            user = CustomUser.objects.create_user(
                username=validated_data['email'],
                password=temp_password,
                **validated_data
            )
        return user

# ========== Vendor Serializers ==========
class VendorProfileSerializer(serializers.ModelSerializer):
    """Esnaf profili serializer'ı"""
    user_email = serializers.CharField(source='user.email', read_only=True)
    user_name = serializers.CharField(source='user.get_full_name', read_only=True)
    user_is_verified = serializers.BooleanField(source='user.is_verified', read_only=True)
    
    class Meta:
        model = VendorProfile
        fields = '__all__'
        read_only_fields = ['user', 'created_at', 'updated_at']

class ReviewSerializer(serializers.ModelSerializer):
    """Değerlendirme serializer'ı"""
    user_email = serializers.CharField(source='user.email', read_only=True)
    user_name = serializers.CharField(source='user.get_full_name', read_only=True)
    vendor_display_name = serializers.CharField(source='vendor.display_name', read_only=True)
    service_name = serializers.CharField(source='service.name', read_only=True)
    
    class Meta:
        model = Review
        fields = [
            'id', 'vendor', 'vendor_display_name', 'user', 'user_email', 'user_name',
            'service', 'service_name', 'rating', 'comment', 'service_date',
            'is_read', 'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']

# ========== Content Management Serializers ==========
class ServiceAreaSerializer(serializers.ModelSerializer):
    """Hizmet alanı serializer'ı"""
    class Meta:
        model = ServiceArea
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at']

class CategorySerializer(serializers.ModelSerializer):
    """Kategori serializer'ı"""
    class Meta:
        model = Category
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at']

class CarBrandSerializer(serializers.ModelSerializer):
    """Araba markası serializer'ı"""
    class Meta:
        model = CarBrand
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at']

# ========== Support Serializers ==========
class SupportTicketSerializer(serializers.ModelSerializer):
    user_email = serializers.CharField(source='user.email', read_only=True)
    user_name = serializers.CharField(source='user.get_full_name', read_only=True)
    
    class Meta:
        model = SupportTicket
        fields = '__all__'
        read_only_fields = ['user', 'created_at', 'updated_at']

class SupportMessageSerializer(serializers.ModelSerializer):
    user_email = serializers.CharField(source='sender_user.email', read_only=True)
    user_name = serializers.CharField(source='sender_user.get_full_name', read_only=True)
    
    class Meta:
        model = SupportMessage
        fields = '__all__'
        read_only_fields = ['sender_user', 'created_at']

# ========== Admin Permission Serializers ==========
class AdminPermissionSerializer(serializers.ModelSerializer):
    """Admin permission serializer'ı"""
    class Meta:
        model = AdminPermission
        fields = ['id', 'role', 'permission', 'can_read', 'can_write', 'can_delete']
        read_only_fields = ['id']

class AdminRoleSerializer(serializers.Serializer):
    """Admin rol tanımları için serializer"""
    key = serializers.CharField(max_length=20)
    name = serializers.CharField(max_length=100)
    description = serializers.CharField(max_length=500)
    permissions = serializers.DictField()

class AdminUserCreateSerializer(serializers.ModelSerializer):
    """Yeni admin oluşturma serializer'ı"""
    password = serializers.CharField(write_only=True, min_length=8)
    
    class Meta:
        model = AdminUser
        fields = ['email', 'first_name', 'last_name', 'role', 'password']
    
    def create(self, validated_data):
        password = validated_data.pop('password')
        user = AdminUser.objects.create(**validated_data)
        user.set_password(password)
        user.save()
        return user

# ========== Dashboard Serializers ==========
class DashboardStatsSerializer(serializers.Serializer):
    """Dashboard istatistikleri serializer'ı"""
    total_users = serializers.IntegerField()
    total_vendors = serializers.IntegerField()
    total_admins = serializers.IntegerField()
    pending_support_tickets = serializers.IntegerField()
    published_blog_posts = serializers.IntegerField()
    active_service_areas = serializers.IntegerField()
    active_categories = serializers.IntegerField()
    active_car_brands = serializers.IntegerField()

# ========== Domain Serializers ==========
class DomainSerializer(serializers.ModelSerializer):
    """Domain serializer'ı"""
    is_expiring_soon = serializers.BooleanField(read_only=True)
    is_expired = serializers.BooleanField(read_only=True)
    
    class Meta:
        model = Domain
        fields = [
            'id', 'name', 'registrar', 'registration_date', 'expiration_date',
            'status', 'days_until_expiry', 'nameservers', 'admin_email',
            'tech_email', 'auto_renew', 'last_checked', 'created_at',
            'updated_at', 'is_expiring_soon', 'is_expired'
        ]
        read_only_fields = [
            'id', 'status', 'days_until_expiry', 'last_checked',
            'created_at', 'updated_at', 'is_expiring_soon', 'is_expired'
        ]

class DomainCreateSerializer(serializers.ModelSerializer):
    """Domain oluşturma serializer'ı"""
    class Meta:
        model = Domain
        fields = ['name', 'auto_renew']
    
    def create(self, validated_data):
        from .domain_service import DomainService
        
        domain_name = validated_data['name']
        domain_service = DomainService()
        
        # WHOIS bilgilerini al
        domain_info = domain_service.get_domain_info(domain_name)
        
        # Domain objesini oluştur
        domain = Domain.objects.create(
            name=domain_info['name'],
            registrar=domain_info['registrar'],
            registration_date=domain_info['registration_date'],
            expiration_date=domain_info['expiration_date'],
            nameservers=domain_info['nameservers'],
            admin_email=domain_info['admin_email'],
            tech_email=domain_info['tech_email'],
            auto_renew=validated_data.get('auto_renew', False),
            status=domain_info['status']
        )
        
        return domain

class DomainUpdateSerializer(serializers.ModelSerializer):
    """Domain güncelleme serializer'ı"""
    class Meta:
        model = Domain
        fields = ['auto_renew']
    
    def update(self, instance, validated_data):
        instance.auto_renew = validated_data.get('auto_renew', instance.auto_renew)
        instance.save()
        return instance