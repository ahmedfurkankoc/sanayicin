from celery import shared_task
from typing import Dict, Any, Optional
import logging
from datetime import date

logger = logging.getLogger(__name__)

# Randevu email task'ları
@shared_task
def send_appointment_email(appointment_data: Dict[str, Any]) -> bool:
    """Randevu bildirimi email'i gönder"""
    try:
        from core.utils.email_service import EmailService
        
        subject = f"Yeni Randevu Talebi - {appointment_data['client_name']}"
        html_content = f"""
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: #f8f9fa; padding: 30px; border-radius: 10px;">
                <h2 style="color: #333; margin-bottom: 20px;">Yeni Randevu Talebiniz Var!</h2>
                <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
                            <p><strong>Müşteri:</strong> {appointment_data['client_name']}</p>
        <p><strong>Telefon:</strong> {appointment_data['client_phone']}</p>
        <p><strong>Email:</strong> {appointment_data['client_email']}</p>
                    <p><strong>Tarih:</strong> {appointment_data['appointment_date']}</p>
                    <p><strong>Saat:</strong> {appointment_data['appointment_time']}</p>
                    <p><strong>Hizmet:</strong> {appointment_data['service_description']}</p>
                </div>
                <div style="background: #ffd600; padding: 15px; border-radius: 8px; text-align: center;">
                    <a href="https://test.sanayicin.com/esnaf/randevularim" 
                       style="color: #111111; text-decoration: none; font-weight: bold;">
                        Randevularımı Görüntüle
                    </a>
                </div>
            </div>
        </div>
        """
        
        return EmailService.send_email(
            to_email=appointment_data['vendor_email'],
            subject=subject,
            html_content=html_content
        )
    except Exception as e:
        logger.error(f"Send appointment email task failed: {e}")
        return False

@shared_task(bind=True, max_retries=3, rate_limit='100/m')  # Dakikada max 100 SMS
def send_otp_sms_async(self, phone_number: str, code: str, purpose: str) -> bool:
    """
    OTP SMS gönderimi için async Celery task
    Rate limiting ve retry mekanizması ile
    
    Args:
        phone_number: Telefon numarası
        code: OTP kodu
        purpose: OTP amacı (registration, password_reset, etc.)
    
    Returns:
        bool: SMS gönderim başarı durumu
    """
    try:
        from core.utils.sms_service import IletiMerkeziSMS
        
        sms_service = IletiMerkeziSMS()
        success = sms_service.send_otp_code(phone_number, code, purpose)
        
        if not success:
            # Retry mekanizması - exponential backoff
            raise Exception(f"SMS gönderimi başarısız: {phone_number}")
        
        logger.info(f"OTP SMS sent successfully via Celery: {phone_number} ({purpose})")
        return True
        
    except Exception as e:
        logger.error(f"Send OTP SMS task failed: {e}, retrying...")
        # Exponential backoff ile retry
        raise self.retry(exc=e, countdown=2 ** self.request.retries)

@shared_task
def send_verification_code_sms(phone: str, code: str) -> bool:
    """Doğrulama kodu SMS gönderimi (eski API uyumluluğu için)"""
    try:
        from core.utils.sms_service import IletiMerkeziSMS
        
        sms_service = IletiMerkeziSMS()
        return sms_service.send_verification_code(phone, code)
    except Exception as e:
        logger.error(f"Send verification code SMS task failed: {e}")
        return False

# Email task'ları
@shared_task
def send_verification_email(email: str, verification_token: str, user_role: str = "client") -> bool:
    """Email doğrulama linki gönder"""
    try:
        from core.utils.email_service import EmailService
        return EmailService.send_verification_link_email(email, verification_token, user_role)
    except Exception as e:
        logger.error(f"Send verification email task failed: {e}")
        return False

@shared_task
def send_welcome_email(email: str, user_name: str, user_role: str = "client") -> bool:
    """Hoş geldin emaili gönder"""
    try:
        from core.utils.email_service import EmailService
        
        subject = f"Sanayicin'e Hoş Geldiniz!"
        html_content = f"""
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: #f8f9fa; padding: 30px; border-radius: 10px; text-align: center;">
                <h2 style="color: #333; margin-bottom: 20px;">Hoş Geldiniz, {user_name}!</h2>
                <p style="color: #666; margin-bottom: 30px;">
                    Sanayicin {user_role} hesabınıza başarıyla kaydoldunuz.
                    </p>
                <div style="background: #ffd600; padding: 20px; border-radius: 8px; margin: 25px 0;">
                    <a href="https://test.sanayicin.com" 
                       style="color: #111111; text-decoration: none; font-weight: bold; font-size: 18px;">
                        Hemen Başlayın
                    </a>
                </div>
            </div>
        </div>
        """
        
        return EmailService.send_email(
            to_emails=[email],
            subject=subject,
            html_content=html_content,
            category="welcome"
        )
    except Exception as e:
        logger.error(f"Send welcome email task failed: {e}")
        return False

@shared_task
def send_password_reset_email(email: str, user_name: str, reset_url: str) -> bool:
    """Şifre sıfırlama emaili gönder"""
    try:
        from core.utils.email_service import EmailService
        
        subject = "Şifre Sıfırlama - Sanayicin"
        html_content = f"""
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: #f8f9fa; padding: 30px; border-radius: 10px; text-align: center;">
                <h2 style="color: #333; margin-bottom: 20px;">Şifre Sıfırlama</h2>
                <p style="color: #666; margin-bottom: 30px;">
                    Merhaba {user_name},<br>
                    Şifrenizi sıfırlamak için aşağıdaki butona tıklayın:
                </p>
                <div style="background: #ffd600; padding: 20px; border-radius: 8px; margin: 25px 0;">
                    <a href="{reset_url}" 
                       style="color: #111111; text-decoration: none; font-weight: bold; font-size: 18px;">
                        Şifremi Sıfırla
                    </a>
                </div>
                <p style="color: #666; font-size: 14px;">
                    Bu link 24 saat geçerlidir.
                </p>
            </div>
        </div>
        """
        
        return EmailService.send_email(
            to_emails=[email],
            subject=subject,
            html_content=html_content,
            category="password_reset"
        )
    except Exception as e:
        logger.error(f"Send password reset email task failed: {e}")
        return False

@shared_task
def send_message_notification_email(recipient_email: str, sender_name: str, message_preview: str) -> bool:
    """Yeni mesaj bildirimi emaili gönder"""
    try:
        from core.utils.email_service import EmailService
        
        subject = f"Yeni Mesaj: {sender_name}"
        html_content = f"""
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: #f8f9fa; padding: 30px; border-radius: 10px;">
                <h2 style="color: #333; margin-bottom: 20px;">Yeni Mesajınız Var</h2>
                <p style="color: #666; margin-bottom: 20px;">
                    <strong>{sender_name}</strong> size bir mesaj gönderdi:
                </p>
                <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
                    <p style="color: #333;">{message_preview}</p>
                </div>
                <div style="background: #ffd600; padding: 15px; border-radius: 8px; text-align: center;">
                    <a href="https://test.sanayicin.com/mesajlar" 
                       style="color: #111111; text-decoration: none; font-weight: bold;">
                        Mesajları Görüntüle
                    </a>
                </div>
            </div>
        </div>
        """
        
        return EmailService.send_email(
            to_emails=[recipient_email],
            subject=subject,
            html_content=html_content,
            category="message_notification"
        )
    except Exception as e:
        logger.error(f"Send message notification email task failed: {e}")
        return False 

@shared_task
def send_confirmation_email(appointment_data: Dict[str, Any]) -> bool:
    """Randevu onay emaili gönder"""
    try:
        from core.utils.email_service import EmailService
        
        subject = f"Randevunuz Onaylandı - {appointment_data.get('service_description', 'Randevu')}"
        html_content = f"""
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: #f8f9fa; padding: 30px; border-radius: 10px;">
                <h2 style="color: #333; margin-bottom: 20px;">Randevunuz Onaylandı!</h2>
                <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
                    <p><strong>Tarih:</strong> {appointment_data.get('appointment_date', '')}</p>
                    <p><strong>Saat:</strong> {appointment_data.get('appointment_time', '')}</p>
                    <p><strong>Hizmet:</strong> {appointment_data.get('service_description', '')}</p>
                    <p><strong>Esnaf:</strong> {appointment_data.get('vendor_name', '')}</p>
                </div>
            </div>
        </div>
        """
        
        return EmailService.send_email(
            to_emails=[appointment_data.get('client_email', '')],
            subject=subject,
            html_content=html_content,
            category="appointment_confirmation"
        )
    except Exception as e:
        logger.error(f"Send confirmation email task failed: {e}")
        return False

@shared_task
def send_rejection_email(appointment_data: Dict[str, Any]) -> bool:
    """Randevu red emaili gönder"""
    try:
        from core.utils.email_service import EmailService
        
        subject = f"Randevu Talebiniz - {appointment_data.get('service_description', 'Randevu')}"
        html_content = f"""
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: #f8f9fa; padding: 30px; border-radius: 10px;">
                <h2 style="color: #333; margin-bottom: 20px;">Randevu Talebiniz</h2>
                <p style="color: #666; margin-bottom: 20px;">
                    Maalesef randevu talebiniz kabul edilemedi. Lütfen başka bir tarih seçin.
                </p>
            </div>
        </div>
        """
        
        return EmailService.send_email(
            to_emails=[appointment_data.get('client_email', '')],
            subject=subject,
            html_content=html_content,
            category="appointment_rejection"
        )
    except Exception as e:
        logger.error(f"Send rejection email task failed: {e}")
        return False

@shared_task
def send_cancellation_email(appointment_data: Dict[str, Any]) -> bool:
    """Randevu iptal emaili gönder"""
    try:
        from core.utils.email_service import EmailService
        
        subject = f"Randevu İptal Edildi - {appointment_data.get('service_description', 'Randevu')}"
        html_content = f"""
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: #f8f9fa; padding: 30px; border-radius: 10px;">
                <h2 style="color: #333; margin-bottom: 20px;">Randevu İptal Edildi</h2>
                <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
                    <p><strong>Tarih:</strong> {appointment_data.get('appointment_date', '')}</p>
                    <p><strong>Saat:</strong> {appointment_data.get('appointment_time', '')}</p>
                    <p><strong>Hizmet:</strong> {appointment_data.get('service_description', '')}</p>
                </div>
            </div>
        </div>
        """
        
        return EmailService.send_email(
            to_emails=[appointment_data.get('client_email', '')],
            subject=subject,
            html_content=html_content,
            category="appointment_cancellation"
        )
    except Exception as e:
        logger.error(f"Send cancellation email task failed: {e}")
        return False
