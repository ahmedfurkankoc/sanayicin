from rest_framework import serializers
from django.contrib.auth import get_user_model
from core.models import CustomUser, ServiceArea, Category, CarBrand, SupportTicket, SupportMessage
from .models import *
from vendors.models import VendorProfile

User = get_user_model()

# ========== Admin Authentication Serializers ==========
class AdminLoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField()

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
    
    class Meta:
        model = BlogPost
        fields = '__all__'
        read_only_fields = ['author', 'created_at', 'updated_at', 'view_count']

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
    class Meta:
        model = CustomUser
        fields = [
            'id', 'email', 'first_name', 'last_name', 'role', 'is_verified', 
            'is_active', 'date_joined', 'last_login', 'phone_number'
        ]
        read_only_fields = ['id', 'date_joined', 'last_login']

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