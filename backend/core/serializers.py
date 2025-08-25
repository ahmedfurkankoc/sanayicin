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
        return {
            'id': vendor.id,
            'display_name': vendor.display_name,
            'city': vendor.city,
            'district': vendor.district,
            'subdistrict': vendor.subdistrict,
            'avatar': vendor.avatar.url if vendor.avatar else None,
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