#!/usr/bin/env python
import os
import django

# Django settings'i yükle
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from core.utils.email_service import EmailService

def test_real_email():
    print("🧪 Testing with real email address...")
    
    # Gerçek email adresini buraya yaz
    real_email = input("📧 Enter your real email address: ")
    
    try:
        result = EmailService.send_verification_email(real_email, '123456')
        print(f"✅ Email sent to {real_email}: {result}")
        print("📬 Check your email (including spam folder)")
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    test_real_email() 