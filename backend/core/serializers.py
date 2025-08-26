from rest_framework import serializers
from .models import CustomUser, Favorite
from vendors.models import VendorProfile

class CustomUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser
        fields = ('id', 'email', 'username', 'first_name', 'last_name', 'role', 'is_verified', 'phone_number', 'avatar', 'can_provide_services', 'can_request_services', 'verification_method', 'about')
        read_only_fields = ('id', 'is_verified', 'can_provide_services', 'can_request_services')

class FavoriteSerializer(serializers.ModelSerializer):
    vendor = serializers.SerializerMethodField()
    
    class Meta:
        model = Favorite
        fields = ('id', 'vendor', 'created_at')
    
    def get_vendor(self, obj):
        vendor = obj.vendor
        # Build minimal nested user info
        user_data = None
        if getattr(vendor, 'user', None):
            user_data = {
                'email': vendor.user.email,
                'is_verified': getattr(vendor.user, 'is_verified', False),
                'avatar': (vendor.user.avatar.url if getattr(vendor.user, 'avatar', None) else None),
            }

        # Map M2M fields to simple id-name lists
        try:
            service_areas = [
                { 'id': sa.id, 'name': sa.name }
                for sa in vendor.service_areas.all()
            ]
        except Exception:
            service_areas = []

        try:
            categories = [
                { 'id': c.id, 'name': c.name }
                for c in vendor.categories.all()
            ]
        except Exception:
            categories = []

        return {
            'id': vendor.id,
            'slug': getattr(vendor, 'slug', None),
            'display_name': vendor.display_name,
            'company_title': getattr(vendor, 'company_title', ''),
            'business_type': getattr(vendor, 'business_type', ''),
            'about': getattr(vendor, 'about', ''),
            'city': vendor.city,
            'district': vendor.district,
            'subdistrict': vendor.subdistrict,
            'service_areas': service_areas,
            'categories': categories,
            'user': user_data,
        }

class FavoriteCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Favorite
        fields = ('vendor',)

# JWT Token'a role bilgisi eklemek için custom serializer
class CustomTokenObtainPairSerializer(serializers.Serializer):
    access = serializers.CharField()
    refresh = serializers.CharField()
    email = serializers.EmailField()
    role = serializers.CharField()
    is_verified = serializers.BooleanField()
    verification_status = serializers.CharField()
    has_vendor_profile = serializers.BooleanField() 