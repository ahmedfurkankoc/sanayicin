from rest_framework import serializers
from .models import CustomUser

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