from rest_framework import serializers
from .models import VendorProfile, Appointment, Review, ServiceRequest, VendorImage
from core.models import ServiceArea, Category, CarBrand
from core.utils.password_validator import validate_strong_password


class ServiceAreaDetailSerializer(serializers.ModelSerializer):
    class Meta:
        model = ServiceArea
        fields = ('id', 'name', 'description')


class CategoryDetailSerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ('id', 'name', 'description', 'service_area')


class CarBrandDetailSerializer(serializers.ModelSerializer):
    logo_url = serializers.SerializerMethodField()
    
    class Meta:
        model = CarBrand
        fields = ('id', 'name', 'logo', 'logo_url', 'description', 'is_active')
    
    def get_logo_url(self, obj):
        """Logo URL'ini absolute URL olarak döndür"""
        if obj.logo:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.logo.url)
            # Fallback: relative URL
            return obj.logo.url
        return None


class VendorRegisterSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(write_only=True)
    password = serializers.CharField(write_only=True, min_length=6)
    password2 = serializers.CharField(write_only=True)
    business_type = serializers.ChoiceField(choices=VendorProfile.BUSINESS_TYPE_CHOICES)
    service_area = serializers.PrimaryKeyRelatedField(queryset=ServiceArea.objects.all())
    categories = serializers.PrimaryKeyRelatedField(queryset=Category.objects.all(), many=True)

    company_title = serializers.CharField()
    tax_office = serializers.CharField()
    tax_no = serializers.CharField()
    display_name = serializers.CharField()
    about = serializers.CharField(allow_blank=True, required=False)
    avatar = serializers.ImageField(required=False, allow_null=True)
    business_phone = serializers.CharField(required=True)  # İşyeri telefon numarası
    city = serializers.CharField()
    district = serializers.CharField()
    subdistrict = serializers.CharField()
    address = serializers.CharField()
    latitude = serializers.DecimalField(max_digits=9, decimal_places=6, required=False, allow_null=True)
    longitude = serializers.DecimalField(max_digits=9, decimal_places=6, required=False, allow_null=True)
    first_name = serializers.CharField()  # CustomUser'a kaydedilecek
    last_name = serializers.CharField()   # CustomUser'a kaydedilecek
    manager_birthdate = serializers.DateField()
    manager_tc = serializers.CharField()
    phone_number = serializers.CharField()  # CustomUser'a kaydedilecek

    class Meta:
        model = VendorProfile
        fields = (
            'email', 'password', 'password2', 'business_type', 'service_area', 'categories',
            'company_title', 'tax_office', 'tax_no', 'display_name', 'about', 'avatar',
            'business_phone', 'city', 'district', 'subdistrict', 'address',
            'latitude', 'longitude',
            'first_name', 'last_name', 'manager_birthdate', 'manager_tc', 'phone_number'
        )

    def validate_email(self, value):
        # Email format kontrolü
        if not value or '@' not in value:
            raise serializers.ValidationError("Geçerli bir email adresi giriniz.")
        
        # Email benzersizlik kontrolü
        from core.models import CustomUser
        if CustomUser.objects.filter(email=value).exists():
            raise serializers.ValidationError("Bu email adresi zaten kullanılıyor.")
        
        return value

    def validate_manager_tc(self, value):
        # TC kimlik numarası kontrolü (11 haneli, sadece rakam)
        if not value.isdigit() or len(value) != 11:
            raise serializers.ValidationError("TC kimlik numarası 11 haneli olmalıdır.")
        return value

    def validate_phone_number(self, value):
        # Telefon numarası kontrolü
        import re
        phone_pattern = re.compile(r'^\+?[0-9\s\-\(\)]{10,15}$')
        if not phone_pattern.match(value):
            raise serializers.ValidationError("Geçerli bir telefon numarası giriniz.")
        return value

    def validate_business_type(self, value):
        # Business type whitelist kontrolü
        valid_types = [choice[0] for choice in VendorProfile.BUSINESS_TYPE_CHOICES]
        if value not in valid_types:
            raise serializers.ValidationError("Geçersiz işletme türü.")
        return value

    def validate_service_area(self, value):
        # Service area varlık kontrolü
        if not ServiceArea.objects.filter(id=value.id).exists():
            raise serializers.ValidationError("Geçersiz hizmet alanı seçildi.")
        return value

    def validate_categories(self, value):
        # Categories varlık kontrolü
        for category in value:
            if not Category.objects.filter(id=category.id).exists():
                raise serializers.ValidationError("Geçersiz kategori seçildi.")
        return value

    def validate_company_title(self, value):
        # Şirket adı güvenlik kontrolü (XSS ve injection koruması)
        import re
        dangerous_patterns = [
            r'<script.*?>.*?</script>',  # Script tag'leri
            r'javascript:',  # JavaScript protocol
            r'on\w+\s*=',  # Event handler'lar
            r'<iframe.*?>',  # Iframe tag'leri
        ]
        
        for pattern in dangerous_patterns:
            if re.search(pattern, value, re.IGNORECASE):
                raise serializers.ValidationError("Şirket adında geçersiz karakterler bulunuyor.")
        
        return value.strip()

    def validate_display_name(self, value):
        # Görünen ad güvenlik kontrolü
        import re
        dangerous_patterns = [
            r'<script.*?>.*?</script>',
            r'javascript:',
            r'on\w+\s*=',
            r'<iframe.*?>',
        ]
        
        for pattern in dangerous_patterns:
            if re.search(pattern, value, re.IGNORECASE):
                raise serializers.ValidationError("Görünen adda geçersiz karakterler bulunuyor.")
        
        return value.strip()



    def validate(self, attrs):
        # Şifre kontrolü
        password = attrs.get('password')
        password2 = attrs.get('password2')
        
        if password != password2:
            raise serializers.ValidationError("Şifreler eşleşmiyor.")
        
        # Güçlü şifre doğrulaması
        validate_strong_password(password)
        
        return attrs

    def create(self, validated_data):
        # Email ve şifre alanlarını çıkar
        email = validated_data.pop('email')
        password = validated_data.pop('password')
        validated_data.pop('password2')  # password2'yi çıkar
        
        # Service area ve categories'i çıkar
        service_area = validated_data.pop('service_area')
        categories = validated_data.pop('categories')
        
        # Avatar'ı çıkar (varsa)
        avatar = validated_data.pop('avatar', None)
        
        # Phone number'ı çıkar (CustomUser'a kaydedilecek)
        phone_number = validated_data.pop('phone_number', None)
        
        # Kullanıcı oluştur
        from core.models import CustomUser
        user = CustomUser.objects.create_user(
            username=email,
            email=email,
            password=password,
            role="vendor",
            phone_number=phone_number,  # Telefon numarasını kaydet
            is_verified=False  # Verification sonrası true olacak
        )
        
        # CustomUser'a profil bilgilerini kaydet
        first_name = validated_data.pop('first_name', '')
        last_name = validated_data.pop('last_name', '')
        
        user.first_name = first_name
        user.last_name = last_name
        if avatar:
            user.avatar = avatar
        user.save()
        
        profile = VendorProfile.objects.create(user=user, **validated_data)
        profile.categories.set(categories)
        profile.service_areas.set([service_area])  # service_area'yı service_areas olarak set et
        
        # Activity log
        from admin_panel.activity_logger import log_vendor_activity
        log_vendor_activity(
            f'Yeni esnaf profili oluşturuldu: {profile.display_name}',
            {
                'vendor_id': profile.id,
                'display_name': profile.display_name,
                'city': profile.city,
                'business_type': profile.business_type,
                'user_email': user.email
            }
        )
        
        # Not: Mağaza logosu kaldırıldı. Avatar CustomUser.avatar olarak kaydedilir.
        
        return profile


class VendorImageSerializer(serializers.ModelSerializer):
    """Vendor görsel serializer'ı"""
    image_url = serializers.SerializerMethodField()
    
    class Meta:
        model = VendorImage
        fields = ('id', 'image', 'image_url', 'description', 'order', 'created_at', 'updated_at')
        read_only_fields = ('id', 'created_at', 'updated_at')
    
    def get_image_url(self, obj):
        """Görsel URL'ini döndür"""
        if obj.image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.image.url)
            return obj.image.url
        return None


class VendorProfileSerializer(serializers.ModelSerializer):
    service_areas = ServiceAreaDetailSerializer(many=True, read_only=True)
    categories = CategoryDetailSerializer(many=True, read_only=True)
    car_brands = CarBrandDetailSerializer(many=True, read_only=True)
    gallery_images = VendorImageSerializer(many=True, read_only=True)
    service_areas_ids = serializers.PrimaryKeyRelatedField(
        source='service_areas',
        queryset=ServiceArea.objects.all(),
        many=True,
        required=False,
        write_only=True
    )
    categories_ids = serializers.PrimaryKeyRelatedField(
        source='categories',
        queryset=Category.objects.all(),
        many=True,
        required=False,
        write_only=True
    )
    car_brands_ids = serializers.PrimaryKeyRelatedField(
        source='car_brands',
        queryset=CarBrand.objects.filter(is_active=True),
        many=True,
        required=False,
        write_only=True
    )
    user = serializers.SerializerMethodField()
    vendor_profile = serializers.SerializerMethodField()
    rating = serializers.SerializerMethodField()
    review_count = serializers.SerializerMethodField()
    
    class Meta:
        model = VendorProfile
        fields = (
            'id', 'slug', 'user', 'vendor_profile', 'business_type', 'service_areas', 'service_areas_ids', 'categories', 'categories_ids', 
            'car_brands', 'car_brands_ids', 'company_title', 'tax_office', 'tax_no',
            'display_name', 'about', 'business_phone', 'city', 'district', 'subdistrict', 'address',
            'latitude', 'longitude',
            'social_media', 'working_hours', 'unavailable_dates', 'manager_birthdate', 'manager_tc',
            'rating', 'review_count', 'gallery_images'
        )
        read_only_fields = ('id', 'slug')

    def get_user(self, obj):
        return {
            'id': obj.user.id,
            'email': obj.user.email,
            'username': obj.user.username,
            'first_name': obj.user.first_name,
            'last_name': obj.user.last_name,
            'is_staff': obj.user.is_staff,
            'is_superuser': obj.user.is_superuser,
            'role': obj.user.role,
            'is_verified': obj.user.is_verified,
            'verification_status': obj.user.verification_status,
            'avatar': obj.user.avatar.url if obj.user.avatar else None
        }
    
    def get_vendor_profile(self, obj):
        data = {
            'id': obj.id,
            'slug': obj.slug,
            'business_type': obj.business_type,
            'company_title': obj.company_title,
            'tax_office': obj.tax_office,
            'tax_no': obj.tax_no,
            'display_name': obj.display_name,
            'about': obj.about,
            'business_phone': obj.business_phone,
            'city': obj.city,
            'district': obj.district,
            'subdistrict': obj.subdistrict,
            'address': obj.address,
            'manager_birthdate': obj.manager_birthdate,
            'manager_tc': obj.manager_tc,
        }
        return data
    
    def get_rating(self, obj):
        """Vendor'ın ortalama puanını hesapla"""
        from django.db.models import Avg
        avg_rating = obj.reviews.aggregate(avg_rating=Avg('rating'))['avg_rating']
        return round(avg_rating, 1) if avg_rating else 0.0
    
    def get_review_count(self, obj):
        """Vendor'ın toplam değerlendirme sayısını döndür"""
        return obj.reviews.count()

    def validate_business_type(self, value):
        # Business type whitelist kontrolü
        valid_types = [choice[0] for choice in VendorProfile.BUSINESS_TYPE_CHOICES]
        if value not in valid_types:
            raise serializers.ValidationError("Geçersiz işletme türü.")
        return value

    def validate_service_areas(self, value):
        # Service areas varlık kontrolü
        if value:
            area_ids = [area.id for area in value]
            valid_areas = ServiceArea.objects.filter(id__in=area_ids)
            if len(valid_areas) != len(area_ids):
                raise serializers.ValidationError("Geçersiz hizmet alanları seçildi.")
        return value

    def validate_categories(self, value):
        # Categories varlık kontrolü
        if value:
            category_ids = [cat.id for cat in value]
            valid_categories = Category.objects.filter(id__in=category_ids)
            if len(valid_categories) != len(category_ids):
                raise serializers.ValidationError("Geçersiz kategoriler seçildi.")
        return value

    def update(self, instance, validated_data):
        # Many-to-many alanları için özel işlem
        service_areas = validated_data.pop('service_areas', None)
        categories = validated_data.pop('categories', None)
        car_brands = validated_data.pop('car_brands', None)
        # store_logo kaldırıldı
        
        # Ana alanları güncelle
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        
        # Many-to-many alanları güncelle
        if service_areas is not None:
            instance.service_areas.set(service_areas)
        
        if categories is not None:
            instance.categories.set(categories)
        
        if car_brands is not None:
            instance.car_brands.set(car_brands)
        
        # Mağaza logosu kaldırıldı, işlem yok
        
        return instance 


class AppointmentSerializer(serializers.ModelSerializer):
    vendor_display_name = serializers.CharField(source='vendor.display_name', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    
    class Meta:
        model = Appointment
        fields = [
            'id', 'vendor', 'vendor_display_name', 'client_name', 'client_phone',
            'client_email', 'service_description', 'appointment_date', 'appointment_time',
            'status', 'status_display', 'notes', 'created_at', 'updated_at'
        ]
        read_only_fields = ['vendor', 'created_at', 'updated_at']
    
    def create(self, validated_data):
        # Vendor'ı otomatik olarak set et
        request = self.context.get('request')
        if request and hasattr(request, 'user'):
            vendor_profile = request.user.vendor_profile
            validated_data['vendor'] = vendor_profile
        return super().create(validated_data)

class AppointmentCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Appointment
        fields = [
            'client_name', 'client_phone', 'client_email', 'service_description',
            'appointment_date', 'appointment_time', 'notes'
        ]


class ReviewSerializer(serializers.ModelSerializer):
    """Değerlendirme serializer'ı"""
    user = serializers.SerializerMethodField()
    service_name = serializers.CharField(source='service.name', read_only=True)
    service_date_display = serializers.SerializerMethodField()
    
    class Meta:
        model = Review
        fields = [
            'id', 'user', 'service', 'service_name', 'rating',
            'comment', 'service_date', 'service_date_display',
            'is_read', 'created_at'
        ]
        read_only_fields = ['user', 'is_read', 'created_at']
    
    def get_user(self, obj):
        """Kullanıcı bilgilerini döndür"""
        return {
            'id': obj.user.id,
            'name': obj.user.full_name,
            'avatar': obj.user.avatar.url if obj.user.avatar else None
        }
    
    def get_service_date_display(self, obj):
        """Hizmet tarihini Türkçe formatta döndür"""
        months = [
            'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
            'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
        ]
        return f"{obj.service_date.day} {months[obj.service_date.month - 1]} {obj.service_date.year}"
    
    def create(self, validated_data):
        """Yeni değerlendirme oluştur"""
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            raise serializers.ValidationError("Değerlendirme yapmak için giriş yapmalısınız.")
        
        validated_data['user'] = request.user
        validated_data['is_read'] = False
        return super().create(validated_data)


class ServiceRequestSerializer(serializers.ModelSerializer):
    user = serializers.SerializerMethodField(read_only=True)
    service_name = serializers.CharField(source='service.name', read_only=True)
    vendor_info = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = ServiceRequest
        fields = [
            'id', 'vendor', 'vendor_info', 'user', 'service', 'service_name',
            'request_type', 'vehicle_info', 'title', 'description', 'client_phone',
            'attachments', 'messages', 'last_offered_price', 'last_offered_days', 'unread_for_vendor', 'status', 'cancellation_reason', 'created_at', 'updated_at'
        ]
        read_only_fields = ['vendor', 'user', 'messages', 'unread_for_vendor', 'status', 'created_at', 'updated_at']

    def get_user(self, obj):
        return {
            'id': obj.user.id,
            'name': obj.user.full_name,
            'email': obj.user.email,
        }

    def get_vendor_info(self, obj):
        return {
            'id': obj.vendor.id,
            'slug': obj.vendor.slug,
            'display_name': obj.vendor.display_name,
            'business_phone': obj.vendor.business_phone,
            'city': obj.vendor.city,
            'district': obj.vendor.district,
        }

    def create(self, validated_data):
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            raise serializers.ValidationError("Talep oluşturmak için giriş yapmalısınız.")
        validated_data['user'] = request.user
        # vendor, view içinde set edilecek
        return super().create(validated_data)