from rest_framework import serializers
from django.contrib.auth import get_user_model
from core.models import CustomUser, ServiceArea, Category, CarBrand, SupportTicket, SupportMessage
from .models import BlogCategory, BlogPost, SystemLog, AnalyticsData, AdminNotification, AdminSettings, AdminPermission, AdminUser
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
    user_email = serializers.CharField(source='user.email', read_only=True)
    
    class Meta:
        model = SystemLog
        fields = '__all__'
        read_only_fields = ['created_at']

class AnalyticsDataSerializer(serializers.ModelSerializer):
    class Meta:
        model = AnalyticsData
        fields = '__all__'
        read_only_fields = ['created_at']

class AdminNotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = AdminNotification
        fields = '__all__'
        read_only_fields = ['created_at']

class AdminSettingsSerializer(serializers.ModelSerializer):
    class Meta:
        model = AdminSettings
        fields = '__all__'
        read_only_fields = ['updated_at']

# ========== Core Model Serializers ==========
class UserSerializer(serializers.ModelSerializer):
    """Kullanıcı serializer'ı"""
    class Meta:
        model = CustomUser
        fields = ['id', 'email', 'first_name', 'last_name', 'role', 'is_verified', 'date_joined', 'last_login']
        read_only_fields = ['id', 'date_joined', 'last_login']

class VendorProfileSerializer(serializers.ModelSerializer):
    """Esnaf profili serializer'ı"""
    user_email = serializers.CharField(source='user.email', read_only=True)
    user_name = serializers.CharField(source='user.get_full_name', read_only=True)
    
    class Meta:
        model = VendorProfile
        fields = '__all__'
        read_only_fields = ['user', 'created_at', 'updated_at']

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

class SupportTicketSerializer(serializers.ModelSerializer):
    """Destek talebi serializer'ı"""
    user_email = serializers.CharField(source='user.email', read_only=True)
    user_name = serializers.CharField(source='user.get_full_name', read_only=True)
    
    class Meta:
        model = SupportTicket
        fields = '__all__'
        read_only_fields = ['user', 'created_at', 'updated_at']

class SupportMessageSerializer(serializers.ModelSerializer):
    """Destek mesaj serializer'ı"""
    user_email = serializers.CharField(source='user.email', read_only=True)
    user_name = serializers.CharField(source='user.get_full_name', read_only=True)
    
    class Meta:
        model = SupportMessage
        fields = '__all__'
        read_only_fields = ['user', 'created_at']

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
from core.models import CustomUser, ServiceArea, Category, CarBrand, SupportTicket, SupportMessage
from .models import BlogCategory, BlogPost, SystemLog, AnalyticsData, AdminNotification, AdminSettings, AdminPermission
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
    user_email = serializers.CharField(source='user.email', read_only=True)
    
    class Meta:
        model = SystemLog
        fields = '__all__'
        read_only_fields = ['created_at']

class AnalyticsDataSerializer(serializers.ModelSerializer):
    class Meta:
        model = AnalyticsData
        fields = '__all__'
        read_only_fields = ['created_at']

class AdminNotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = AdminNotification
        fields = '__all__'
        read_only_fields = ['created_at']

class AdminSettingsSerializer(serializers.ModelSerializer):
    class Meta:
        model = AdminSettings
        fields = '__all__'
        read_only_fields = ['updated_at']

# ========== Core Model Serializers ==========
class UserSerializer(serializers.ModelSerializer):
    """Kullanıcı serializer'ı"""
    class Meta:
        model = CustomUser
        fields = ['id', 'email', 'first_name', 'last_name', 'role', 'is_verified', 'date_joined', 'last_login']
        read_only_fields = ['id', 'date_joined', 'last_login']

class VendorProfileSerializer(serializers.ModelSerializer):
    """Esnaf profili serializer'ı"""
    user_email = serializers.CharField(source='user.email', read_only=True)
    user_name = serializers.CharField(source='user.get_full_name', read_only=True)
    
    class Meta:
        model = VendorProfile
        fields = '__all__'
        read_only_fields = ['user', 'created_at', 'updated_at']

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

class SupportTicketSerializer(serializers.ModelSerializer):
    """Destek talebi serializer'ı"""
    user_email = serializers.CharField(source='user.email', read_only=True)
    user_name = serializers.CharField(source='user.get_full_name', read_only=True)
    
    class Meta:
        model = SupportTicket
        fields = '__all__'
        read_only_fields = ['user', 'created_at', 'updated_at']

class SupportMessageSerializer(serializers.ModelSerializer):
    """Destek mesaj serializer'ı"""
    user_email = serializers.CharField(source='user.email', read_only=True)
    user_name = serializers.CharField(source='user.get_full_name', read_only=True)
    
    class Meta:
        model = SupportMessage
        fields = '__all__'
        read_only_fields = ['user', 'created_at']

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
from core.models import CustomUser, ServiceArea, Category, CarBrand, SupportTicket, SupportMessage
from .models import BlogCategory, BlogPost, SystemLog, AnalyticsData, AdminNotification, AdminSettings, AdminPermission
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
    user_email = serializers.CharField(source='user.email', read_only=True)
    
    class Meta:
        model = SystemLog
        fields = '__all__'
        read_only_fields = ['created_at']

class AnalyticsDataSerializer(serializers.ModelSerializer):
    class Meta:
        model = AnalyticsData
        fields = '__all__'
        read_only_fields = ['created_at']

class AdminNotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = AdminNotification
        fields = '__all__'
        read_only_fields = ['created_at']

class AdminSettingsSerializer(serializers.ModelSerializer):
    class Meta:
        model = AdminSettings
        fields = '__all__'
        read_only_fields = ['updated_at']

# ========== Core Model Serializers ==========
class UserSerializer(serializers.ModelSerializer):
    """Kullanıcı serializer'ı"""
    class Meta:
        model = CustomUser
        fields = ['id', 'email', 'first_name', 'last_name', 'role', 'is_verified', 'date_joined', 'last_login']
        read_only_fields = ['id', 'date_joined', 'last_login']

class VendorProfileSerializer(serializers.ModelSerializer):
    """Esnaf profili serializer'ı"""
    user_email = serializers.CharField(source='user.email', read_only=True)
    user_name = serializers.CharField(source='user.get_full_name', read_only=True)
    
    class Meta:
        model = VendorProfile
        fields = '__all__'
        read_only_fields = ['user', 'created_at', 'updated_at']

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

class SupportTicketSerializer(serializers.ModelSerializer):
    """Destek talebi serializer'ı"""
    user_email = serializers.CharField(source='user.email', read_only=True)
    user_name = serializers.CharField(source='user.get_full_name', read_only=True)
    
    class Meta:
        model = SupportTicket
        fields = '__all__'
        read_only_fields = ['user', 'created_at', 'updated_at']

class SupportMessageSerializer(serializers.ModelSerializer):
    """Destek mesaj serializer'ı"""
    user_email = serializers.CharField(source='user.email', read_only=True)
    user_name = serializers.CharField(source='user.get_full_name', read_only=True)
    
    class Meta:
        model = SupportMessage
        fields = '__all__'
        read_only_fields = ['user', 'created_at']

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
from core.models import CustomUser, ServiceArea, Category, CarBrand, SupportTicket, SupportMessage
from .models import BlogCategory, BlogPost, SystemLog, AnalyticsData, AdminNotification, AdminSettings, AdminPermission
from vendors.models import VendorProfile

User = get_user_model()

# ========== Admin Authentication Serializers ==========
class AdminLoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField()

class AdminUserSerializer(serializers.ModelSerializer):
    """Admin kullanıcı serializer'ı"""
    class Meta:
        model = CustomUser
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
    user_email = serializers.CharField(source='user.email', read_only=True)
    
    class Meta:
        model = SystemLog
        fields = '__all__'
        read_only_fields = ['created_at']

class AnalyticsDataSerializer(serializers.ModelSerializer):
    class Meta:
        model = AnalyticsData
        fields = '__all__'
        read_only_fields = ['created_at']

class AdminNotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = AdminNotification
        fields = '__all__'
        read_only_fields = ['created_at']

class AdminSettingsSerializer(serializers.ModelSerializer):
    class Meta:
        model = AdminSettings
        fields = '__all__'
        read_only_fields = ['updated_at']

# ========== Core Model Serializers ==========
class UserSerializer(serializers.ModelSerializer):
    """Kullanıcı serializer'ı"""
    class Meta:
        model = CustomUser
        fields = ['id', 'email', 'first_name', 'last_name', 'role', 'is_verified', 'date_joined', 'last_login']
        read_only_fields = ['id', 'date_joined', 'last_login']

class VendorProfileSerializer(serializers.ModelSerializer):
    """Esnaf profili serializer'ı"""
    user_email = serializers.CharField(source='user.email', read_only=True)
    user_name = serializers.CharField(source='user.get_full_name', read_only=True)
    
    class Meta:
        model = VendorProfile
        fields = '__all__'
        read_only_fields = ['user', 'created_at', 'updated_at']

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

class SupportTicketSerializer(serializers.ModelSerializer):
    """Destek talebi serializer'ı"""
    user_email = serializers.CharField(source='user.email', read_only=True)
    user_name = serializers.CharField(source='user.get_full_name', read_only=True)
    
    class Meta:
        model = SupportTicket
        fields = '__all__'
        read_only_fields = ['user', 'created_at', 'updated_at']

class SupportMessageSerializer(serializers.ModelSerializer):
    """Destek mesaj serializer'ı"""
    user_email = serializers.CharField(source='user.email', read_only=True)
    user_name = serializers.CharField(source='user.get_full_name', read_only=True)
    
    class Meta:
        model = SupportMessage
        fields = '__all__'
        read_only_fields = ['user', 'created_at']

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