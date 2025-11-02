"""
Güçlü şifre doğrulama fonksiyonu
"""
import re
from rest_framework import serializers


def validate_strong_password(password):
    """
    Güçlü şifre doğrulama fonksiyonu
    Şifre şu kuralları sağlamalı:
    - En az 8 karakter
    - En az bir büyük harf (A-Z)
    - En az bir küçük harf (a-z)
    - En az bir sayı (0-9)
    - En az bir sembol (!@#$%^&*()_+-=[]{}|;:,.<>?)
    """
    errors = []
    
    if len(password) < 8:
        errors.append("Şifre en az 8 karakter olmalıdır.")
    
    if not re.search(r'[A-Z]', password):
        errors.append("Şifre en az bir büyük harf (A-Z) içermelidir.")
    
    if not re.search(r'[a-z]', password):
        errors.append("Şifre en az bir küçük harf (a-z) içermelidir.")
    
    if not re.search(r'[0-9]', password):
        errors.append("Şifre en az bir sayı (0-9) içermelidir.")
    
    if not re.search(r'[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]', password):
        errors.append("Şifre en az bir özel karakter (!@#$%^&* vb.) içermelidir.")
    
    # Basit şifre kontrolü
    common_passwords = ['password', '123456', 'qwerty', 'abc123', 'password123', 'admin123', '12345678', 'letmein', 'welcome123', 'sanayicin123']
    if password.lower() in common_passwords:
        errors.append("Çok basit bir şifre seçtiniz. Lütfen daha güvenli bir şifre kullanın.")
    
    if errors:
        error_message = " ".join(errors)
        raise serializers.ValidationError(error_message)
    
    return password


def validate_strong_password_simple(password):
    """
    Güçlü şifre doğrulama fonksiyonu (serializer olmadan kullanım için)
    ValidationError yerine dict döner
    """
    errors = []
    
    if len(password) < 8:
        errors.append("Şifre en az 8 karakter olmalıdır.")
    
    if not re.search(r'[A-Z]', password):
        errors.append("Şifre en az bir büyük harf (A-Z) içermelidir.")
    
    if not re.search(r'[a-z]', password):
        errors.append("Şifre en az bir küçük harf (a-z) içermelidir.")
    
    if not re.search(r'[0-9]', password):
        errors.append("Şifre en az bir sayı (0-9) içermelidir.")
    
    if not re.search(r'[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]', password):
        errors.append("Şifre en az bir özel karakter (!@#$%^&* vb.) içermelidir.")
    
    # Basit şifre kontrolü
    common_passwords = ['password', '123456', 'qwerty', 'abc123', 'password123', 'admin123', '12345678', 'letmein', 'welcome123', 'sanayicin123']
    if password.lower() in common_passwords:
        errors.append("Çok basit bir şifre seçtiniz. Lütfen daha güvenli bir şifre kullanın.")
    
    return errors

