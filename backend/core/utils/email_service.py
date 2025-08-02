import os
import ssl
from django.conf import settings
from django.core.mail import EmailMessage, get_connection
from django.template.loader import render_to_string
from typing import List, Dict, Any
import logging
from core.tasks import (
    send_appointment_email, send_confirmation_email, send_rejection_email, send_cancellation_email,
    send_verification_email, send_welcome_email, send_password_reset_email, send_message_notification_email
)

# SSL context for development
ssl._create_default_https_context = ssl._create_unverified_context

logger = logging.getLogger(__name__)

class EmailService:
    """Email gönderim servisi - Resend SMTP kullanarak"""
    
    @staticmethod
    def send_email(
        to_emails: List[str],
        subject: str,
        html_content: str,
        from_email: str = "Sanayicin <noreply@sanayicin.com>",  # Verify edilmiş domain
        category: str = "general"
    ) -> bool:
        """
        Email gönder
        
        Args:
            to_emails: Alıcı email listesi
            subject: Email konusu
            html_content: HTML içerik
            from_email: Gönderen email (noreply@sanayicin.com - verify edilmiş domain)
            category: Email kategorisi (analytics için)
            
        Returns:
            bool: Gönderim başarılı mı
        """
        try:
            print(f"=== SEND EMAIL DEBUG ===")
            print(f"To emails: {to_emails}")
            print(f"Subject: {subject}")
            print(f"From email: {from_email}")
            print(f"Category: {category}")
            
            with get_connection(
                host=settings.RESEND_SMTP_HOST,
                port=settings.RESEND_SMTP_PORT,
                username=settings.RESEND_SMTP_USERNAME,
                password=settings.RESEND_API_KEY,
                use_tls=False,  # Port 465 için SSL kullan, TLS değil
                use_ssl=True,
                fail_silently=False,
            ) as connection:
                email = EmailMessage(
                    subject=subject,
                    body=html_content,
                    from_email=from_email,
                    to=to_emails,
                    connection=connection
                )
                email.content_subtype = "html"  # HTML email
                result = email.send()
                
                print(f"Email send result: {result}")
                logger.info(f"Email sent successfully to {to_emails}: {subject}")
                return result
                
        except Exception as e:
            print(f"Email sending failed: {str(e)}")
            logger.error(f"Email sending failed: {str(e)}")
            return False
    
    @staticmethod
    def send_verification_link_email(email: str, verification_token: str) -> None:
        """Asenkron email doğrulama linki gönder"""
        try:
            send_verification_email.delay(email, verification_token)
        except Exception as e:
            logger.error(f"Async verification email task failed: {str(e)}")
    
    @staticmethod
    def send_welcome_email(email: str, user_name: str, user_role: str = "customer") -> None:
        """Asenkron hoş geldin emaili gönder"""
        try:
            send_welcome_email.delay(email, user_name, user_role)
        except Exception as e:
            logger.error(f"Async welcome email task failed: {str(e)}")

    @staticmethod
    def send_password_reset_email(email: str, user_name: str, reset_url: str) -> None:
        """Asenkron şifre sıfırlama emaili gönder"""
        try:
            send_password_reset_email.delay(email, user_name, reset_url)
        except Exception as e:
            logger.error(f"Async password reset email task failed: {str(e)}")
    
    @staticmethod
    def send_message_notification(recipient_email: str, sender_name: str, message_preview: str) -> None:
        """Asenkron yeni mesaj bildirimi gönder"""
        try:
            send_message_notification_email.delay(recipient_email, sender_name, message_preview)
        except Exception as e:
            logger.error(f"Async message notification email task failed: {str(e)}")

    # Yüksek trafik için asenkron email fonksiyonları
    @staticmethod
    def send_appointment_notification_async(appointment_data: Dict[str, Any]) -> None:
        """Asenkron randevu bildirimi gönder"""
        try:
            # Celery task'ı başlat
            send_appointment_email.delay(appointment_data)
            
        except Exception as e:
            logger.error(f"Async email task failed: {str(e)}")
    
    @staticmethod
    def send_confirmation_notification_async(appointment_data: Dict[str, Any]) -> None:
        """Asenkron randevu onay bildirimi gönder"""
        try:
            # Celery task'ı başlat
            send_confirmation_email.delay(appointment_data)
            
        except Exception as e:
            logger.error(f"Async confirmation email task failed: {str(e)}")
    
    @staticmethod
    def send_rejection_notification_async(appointment_data: Dict[str, Any]) -> None:
        """Asenkron randevu red bildirimi gönder"""
        try:
            # Celery task'ı başlat
            send_rejection_email.delay(appointment_data)
            
        except Exception as e:
            logger.error(f"Async rejection email task failed: {str(e)}")
    
    @staticmethod
    def send_cancellation_notification_async(appointment_data: Dict[str, Any]) -> None:
        """Asenkron randevu iptal bildirimi gönder"""
        try:
            # Celery task'ı başlat
            send_cancellation_email.delay(appointment_data)
            
        except Exception as e:
            logger.error(f"Async cancellation email task failed: {str(e)}") 