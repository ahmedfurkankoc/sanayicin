from rest_framework import serializers
from .models import VendorProfile, Appointment
from core.models import ServiceArea, Category, CarBrand


class ServiceAreaDetailSerializer(serializers.ModelSerializer):
    class Meta:
        model = ServiceArea
        fields = ('id', 'name', 'description')


class CategoryDetailSerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ('id', 'name', 'description', 'service_area')


class CarBrandDetailSerializer(serializers.ModelSerializer):
    class Meta:
        model = CarBrand
        fields = ('id', 'name', 'logo', 'description', 'is_active')


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
    profile_photo = serializers.ImageField(required=False, allow_null=True)
    phone = serializers.CharField()
    city = serializers.CharField()
    district = serializers.CharField()
    subdistrict = serializers.CharField()
    address = serializers.CharField()
    manager_name = serializers.CharField()
    manager_birthdate = serializers.DateField()
    manager_tc = serializers.CharField()
    manager_phone = serializers.CharField()

    class Meta:
        model = VendorProfile
        fields = (
            'email', 'password', 'password2', 'business_type', 'service_area', 'categories',
            'company_title', 'tax_office', 'tax_no', 'display_name', 'about', 'profile_photo',
            'phone', 'city', 'district', 'subdistrict', 'address',
            'manager_name', 'manager_birthdate', 'manager_tc', 'manager_phone'
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

    def validate_manager_phone(self, value):
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

    def validate_manager_name(self, value):
        # Yönetici adı güvenlik kontrolü
        import re
        dangerous_patterns = [
            r'<script.*?>.*?</script>',
            r'javascript:',
            r'on\w+\s*=',
            r'<iframe.*?>',
        ]
        
        for pattern in dangerous_patterns:
            if re.search(pattern, value, re.IGNORECASE):
                raise serializers.ValidationError("Yönetici adında geçersiz karakterler bulunuyor.")
        
        return value.strip()

    def validate(self, attrs):
        # Şifre kontrolü
        password = attrs.get('password')
        password2 = attrs.get('password2')
        
        if password != password2:
            raise serializers.ValidationError("Şifreler eşleşmiyor.")
        
        # Şifre güvenlik kontrolü
        if len(password) < 6:
            raise serializers.ValidationError("Şifre en az 6 karakter olmalıdır.")
        
        # Basit şifre kontrolü
        if password.lower() in ['password', '123456', 'qwerty']:
            raise serializers.ValidationError("Çok basit bir şifre seçtiniz.")
        
        return attrs

    def create(self, validated_data):
        # Email ve şifre alanlarını çıkar
        email = validated_data.pop('email')
        password = validated_data.pop('password')
        validated_data.pop('password2')  # password2'yi çıkar
        
        # Service area ve categories'i çıkar
        service_area = validated_data.pop('service_area')
        categories = validated_data.pop('categories')
        
        # Profile photo'yu çıkar (varsa)
        profile_photo = validated_data.pop('profile_photo', None)
        
        # Kullanıcı oluştur
        from core.models import CustomUser
        user = CustomUser.objects.create_user(
            username=email,
            email=email,
            password=password,
            role="vendor",
            email_verified=False  # Email verification sonrası true olacak
        )
        
        profile = VendorProfile.objects.create(user=user, **validated_data)
        profile.categories.set(categories)
        profile.service_areas.set([service_area])  # service_area'yı service_areas olarak set et
        
        # Profile photo varsa işle ve kaydet
        if profile_photo:
            try:
                profile.save_avatar(profile_photo)
                profile.save()
            except Exception as e:
                # Fotoğraf işlenemezse kullanıcıyı sil
                user.delete()
                raise serializers.ValidationError("Profil fotoğrafı işlenirken hata oluştu.")
        
        # Email verification gönder - başarısız olursa kullanıcı ve profili sil
        email_sent = user.send_verification_email()
        if not email_sent:
            # Email gönderilemezse kullanıcı ve profili sil
            user.delete()  # Bu VendorProfile'ı da silecek (CASCADE)
            raise serializers.ValidationError("Email doğrulama kodu gönderilemedi. Lütfen tekrar deneyin.")
        
        return profile


class VendorProfileSerializer(serializers.ModelSerializer):
    service_areas = ServiceAreaDetailSerializer(many=True, read_only=True)
    categories = CategoryDetailSerializer(many=True, read_only=True)
    car_brands = CarBrandDetailSerializer(many=True, read_only=True)
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
    
    class Meta:
        model = VendorProfile
        fields = (
            'id', 'slug', 'user', 'business_type', 'service_areas', 'categories', 'categories_ids', 
            'car_brands', 'car_brands_ids', 'company_title', 'tax_office', 'tax_no',
            'display_name', 'about', 'profile_photo', 'avatar', 'phone', 'city', 'district', 'subdistrict', 'address',
            'social_media', 'working_hours', 'unavailable_dates',
            'manager_name', 'manager_birthdate', 'manager_tc', 'manager_phone'
        )
        read_only_fields = ('id', 'slug')

    def get_user(self, obj):
        return {
            'id': obj.user.id,
            'email': obj.user.email,
            'username': obj.user.username,
            'is_staff': obj.user.is_staff,
            'is_superuser': obj.user.is_superuser,
            'role': obj.user.role,
            'email_verified': obj.user.email_verified,
            'avatar': obj.avatar.url if obj.avatar else None
        }

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
        
        return instance 


class AppointmentSerializer(serializers.ModelSerializer):
    vendor_display_name = serializers.CharField(source='vendor.display_name', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    
    class Meta:
        model = Appointment
        fields = [
            'id', 'vendor', 'vendor_display_name', 'customer_name', 'customer_phone', 
            'customer_email', 'service_description', 'appointment_date', 'appointment_time',
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
            'customer_name', 'customer_phone', 'customer_email', 'service_description',
            'appointment_date', 'appointment_time', 'notes'
        ] 