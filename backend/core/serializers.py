from rest_framework import serializers
from .models import CustomUser, Favorite

class CustomUserSerializer(serializers.ModelSerializer):
    """CustomUser model serializer"""
    class Meta:
        model = CustomUser
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name', 
            'is_active', 'role', 'is_verified', 'verification_method',
            'phone_number', 'verification_status'
        ]
        read_only_fields = ['id', 'is_active', 'is_verified', 'verification_status']


class FavoriteSerializer(serializers.ModelSerializer):
    """Favorite model serializer"""
    vendor = serializers.SerializerMethodField()
    
    class Meta:
        model = Favorite
        fields = ['id', 'vendor', 'created_at']
        read_only_fields = ['id', 'created_at']
    
    def get_vendor(self, obj):
        """Vendor bilgilerini döndür"""
        from vendors.serializers import VendorProfileSerializer
        return VendorProfileSerializer(obj.vendor, context=self.context).data


class FavoriteCreateSerializer(serializers.ModelSerializer):
    """Favori oluşturma için serializer"""
    vendor_id = serializers.IntegerField()
    
    class Meta:
        model = Favorite
        fields = ['vendor_id']
    
    def create(self, validated_data):
        from vendors.models import VendorProfile
        
        # Vendor'ı kontrol et
        try:
            vendor = VendorProfile.objects.get(id=validated_data['vendor_id'])
        except VendorProfile.DoesNotExist:
            raise serializers.ValidationError({"vendor_id": "Geçersiz esnaf ID'si"})
        
        # Kullanıcıyı request'ten al
        user = self.context['request'].user
        
        # Favori oluştur
        favorite, created = Favorite.objects.get_or_create(
            user=user,
            vendor=vendor
        )
        
        if not created:
            raise serializers.ValidationError({"detail": "Bu esnaf zaten favorilerinizde"})
        
        return favorite 