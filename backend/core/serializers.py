from rest_framework import serializers
from .models import CustomUser, Favorite, SupportTicket, SupportMessage, Vehicle, CarBrand
from admin_panel.models import BlogPost
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


class SupportTicketSerializer(serializers.ModelSerializer):
    class Meta:
        model = SupportTicket
        fields = (
            'id', 'public_id', 'user', 'role', 'requester_email', 'requester_name',
            'subject', 'category', 'message', 'attachment', 'status', 'priority',
            'created_at', 'updated_at'
        )
        read_only_fields = ('id', 'public_id', 'status', 'created_at', 'updated_at', 'user')


class SupportMessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = SupportMessage
        fields = ('id', 'ticket', 'sender_user', 'is_admin', 'content', 'created_at')
        read_only_fields = ('id', 'created_at', 'sender_user', 'is_admin')


class SupportTicketDetailSerializer(serializers.ModelSerializer):
    messages = SupportMessageSerializer(many=True, read_only=True)
    
    class Meta:
        model = SupportTicket
        fields = (
            'id', 'public_id', 'user', 'role', 'requester_email', 'requester_name',
            'subject', 'category', 'message', 'attachment', 'status', 'priority',
            'created_at', 'updated_at', 'messages'
        )
        read_only_fields = ('id', 'public_id', 'status', 'created_at', 'updated_at', 'user')


class VehicleSerializer(serializers.ModelSerializer):
    plate = serializers.CharField(write_only=True, required=False, allow_blank=True)
    engine_type_display = serializers.CharField(source='get_engine_type_display', read_only=True)
    periodic_due_date = serializers.DateField(format='%d-%m-%Y', input_formats=['%d-%m-%Y', '%Y-%m-%d'], required=False, allow_null=True)
    inspection_expiry = serializers.DateField(format='%d-%m-%Y', input_formats=['%d-%m-%Y', '%Y-%m-%d'], required=False, allow_null=True)
    exhaust_emission_date = serializers.DateField(format='%d-%m-%Y', input_formats=['%d-%m-%Y', '%Y-%m-%d'], required=False, allow_null=True)
    tire_change_date = serializers.DateField(format='%d-%m-%Y', input_formats=['%d-%m-%Y', '%Y-%m-%d'], required=False, allow_null=True)
    traffic_insurance_expiry = serializers.DateField(format='%d-%m-%Y', input_formats=['%d-%m-%Y', '%Y-%m-%d'], required=False, allow_null=True)
    casco_expiry = serializers.DateField(format='%d-%m-%Y', input_formats=['%d-%m-%Y', '%Y-%m-%d'], required=False, allow_null=True)
    # New FK field for brand selection
    brand_fk = serializers.PrimaryKeyRelatedField(queryset=CarBrand.objects.all(), required=False, allow_null=True)
    brand_name = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = Vehicle
        fields = (
            'id', 'brand', 'brand_fk', 'brand_name', 'model', 'year', 'plate', 'engine_type', 'kilometre',
            'periodic_due_km', 'periodic_due_date', 'last_maintenance_notes',
            'inspection_expiry', 'exhaust_emission_date',
            'tire_change_date', 'traffic_insurance_expiry', 'casco_expiry',
            'engine_type_display',
            'created_at', 'updated_at'
        )
        read_only_fields = ('id', 'created_at', 'updated_at', 'brand')

    def to_representation(self, instance):
        # Plate is sensitive: do not expose raw or masked by default.
        rep = super().to_representation(instance)
        if 'plate' in rep:
            rep.pop('plate', None)
        return rep

    def get_brand_name(self, obj):
        if getattr(obj, 'brand_fk', None):
            return obj.brand_fk.name
        return obj.brand or None

# ===== Public Blog Serializers =====
class PublicBlogPostListSerializer(serializers.ModelSerializer):
    cover_image = serializers.SerializerMethodField()
    category_name = serializers.SerializerMethodField()

    class Meta:
        model = BlogPost
        fields = (
            'id', 'title', 'slug', 'excerpt', 'cover_image', 'category_name', 'published_at'
        )

    def get_cover_image(self, obj):
        try:
            if obj.featured_image:
                request = self.context.get('request')
                url = obj.featured_image.url
                return request.build_absolute_uri(url) if request else url
        except Exception:
            pass
        return None

    def get_category_name(self, obj):
        try:
            return obj.category.name if obj.category else None
        except Exception:
            return None


class PublicBlogPostDetailSerializer(PublicBlogPostListSerializer):
    content = serializers.CharField()

    class Meta(PublicBlogPostListSerializer.Meta):
        fields = PublicBlogPostListSerializer.Meta.fields + (
            'content',
        )

# JWT Token'a role bilgisi eklemek için custom serializer
class CustomTokenObtainPairSerializer(serializers.Serializer):
    access = serializers.CharField()
    refresh = serializers.CharField()
    email = serializers.EmailField()
    role = serializers.CharField()
    is_verified = serializers.BooleanField()
    verification_status = serializers.CharField()
    has_vendor_profile = serializers.BooleanField() 