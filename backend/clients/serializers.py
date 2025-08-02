from rest_framework import serializers
from core.models import CustomUser
from .models import ClientProfile
import re

class ClientRegisterSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(write_only=True)
    password = serializers.CharField(write_only=True, min_length=6)
    password2 = serializers.CharField(write_only=True)
    first_name = serializers.CharField()
    last_name = serializers.CharField()
    phone = serializers.CharField()
    city = serializers.CharField()
    district = serializers.CharField()
    address = serializers.CharField()
    profile_photo = serializers.ImageField(required=False, allow_null=True)
    about = serializers.CharField(allow_blank=True, required=False)

    class Meta:
        model = ClientProfile
        fields = (
            "email", "password", "password2", "first_name", "last_name", 
            "phone", "city", "district", "address", "profile_photo", "about"
        )

    def validate_email(self, value):
        # Email format kontrolü
        if not re.match(r'^[^@\s]+@[^@\s]+\.[^@\s]+$', value):
            raise serializers.ValidationError("Geçersiz e-posta formatı.")
        
        # Email zaten var mı kontrol et
        if CustomUser.objects.filter(email=value).exists():
            user = CustomUser.objects.get(email=value)
            # Eğer kullanıcı zaten client ise hata ver
            if user.role == 'client':
                raise serializers.ValidationError("Bu e-posta ile zaten bir müşteri hesabı var.")
            # Eğer vendor ise role'ü 'both' yap
            elif user.role == 'vendor':
                # Vendor zaten varsa, role'ü 'both' yap
                pass
        return value

    def validate_phone(self, value):
        # Telefon numarası kontrolü
        if not re.match(r'^[\d\s\-\+\(\)]{10,15}$', value):
            raise serializers.ValidationError("Geçersiz telefon numarası formatı.")
        return value

    def validate(self, attrs):
        # Şifre kontrolü
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError("Şifreler eşleşmiyor.")
        
        # Şifre güvenlik kontrolü
        password = attrs['password']
        if len(password) < 6:
            raise serializers.ValidationError("Şifre en az 6 karakter olmalı.")
        
        return attrs

    def create(self, validated_data):
        email = validated_data.pop("email")
        password = validated_data.pop("password")
        password2 = validated_data.pop("password2")
        
        # Kullanıcı zaten var mı kontrol et
        if CustomUser.objects.filter(email=email).exists():
            user = CustomUser.objects.get(email=email)
            # Eğer vendor ise role'ü 'both' yap
            if user.role == 'vendor':
                user.role = 'both'
                user.save()
            # Eğer zaten 'both' ise hata ver
            elif user.role == 'both':
                raise serializers.ValidationError("Bu e-posta ile zaten hem esnaf hem müşteri hesabı var.")
        else:
            # Yeni kullanıcı oluştur
            user = CustomUser.objects.create_user(
                username=email,
                email=email,
                password=password,
                role="client",
                email_verified=False
            )
        
        # ClientProfile oluştur
        profile = ClientProfile.objects.create(user=user, **validated_data)
        
        # Email verification gönder
        email_sent = user.send_verification_email()
        if not email_sent:
            # Email gönderilemezse kullanıcı ve profili sil
            user.delete()
            raise serializers.ValidationError("Email doğrulama kodu gönderilemedi. Lütfen tekrar deneyin.")
        
        return profile

class ClientProfileSerializer(serializers.ModelSerializer):
    user = serializers.SerializerMethodField()
    
    class Meta:
        model = ClientProfile
        fields = (
            'id', 'user', 'first_name', 'last_name', 'phone', 'city', 
            'district', 'address', 'profile_photo', 'about', 'created_at', 'updated_at'
        )
        read_only_fields = ('id', 'created_at', 'updated_at')

    def get_user(self, obj):
        return {
            'id': obj.user.id,
            'email': obj.user.email,
            'username': obj.user.username,
            'role': obj.user.role,
            'email_verified': obj.user.email_verified
        }

    def validate_phone(self, value):
        # Telefon numarası kontrolü
        if not re.match(r'^[\d\s\-\+\(\)]{10,15}$', value):
            raise serializers.ValidationError("Geçersiz telefon numarası formatı.")
        return value

    def update(self, instance, validated_data):
        # Ana alanları güncelle
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        
        return instance 