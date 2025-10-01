from celery import shared_task
from typing import Dict, Any
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
            to_emails=[appointment_data['vendor_email']],
            subject=subject,
            html_content=html_content,
            category="appointment_notification"
        )
    except Exception as e:
        logger.error(f"Appointment email task failed: {str(e)}")
        return False

@shared_task
def send_confirmation_email(appointment_data: Dict[str, Any]) -> bool:
    """Randevu onay bildirimi email'i gönder"""
    try:
        from core.utils.email_service import EmailService
        
        subject = f"Randevunuz Onaylandı - {appointment_data['vendor_name']}"
        html_content = f"""
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: #f8f9fa; padding: 30px; border-radius: 10px;">
                <h2 style="color: #333; margin-bottom: 20px;">Randevunuz Onaylandı!</h2>
                <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
                    <p><strong>Esnaf:</strong> {appointment_data['vendor_name']}</p>
                    <p><strong>Tarih:</strong> {appointment_data['appointment_date']}</p>
                    <p><strong>Saat:</strong> {appointment_data['appointment_time']}</p>
                    <p><strong>Hizmet:</strong> {appointment_data['service_description']}</p>
                    <p><strong>İletişim:</strong> {appointment_data['vendor_phone']}</p>
                </div>
            </div>
        </div>
        """
        
        return EmailService.send_email(
            to_emails=[appointment_data['client_email']],
            subject=subject,
            html_content=html_content,
            category="appointment_confirmation"
        )
    except Exception as e:
        logger.error(f"Confirmation email task failed: {str(e)}")
        return False

@shared_task
def send_rejection_email(appointment_data: Dict[str, Any]) -> bool:
    """Randevu red bildirimi email'i gönder"""
    try:
        from core.utils.email_service import EmailService
        
        subject = f"Randevu Talebiniz Reddedildi - {appointment_data['vendor_name']}"
        html_content = f"""
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: #f8f9fa; padding: 30px; border-radius: 10px;">
                <h2 style="color: #333; margin-bottom: 20px;">Randevu Talebiniz Reddedildi</h2>
                <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
                    <p><strong>Esnaf:</strong> {appointment_data['vendor_name']}</p>
                    <p><strong>Tarih:</strong> {appointment_data['appointment_date']}</p>
                    <p><strong>Saat:</strong> {appointment_data['appointment_time']}</p>
                </div>
                <p style="color: #666; font-size: 14px;">
                    Başka bir esnaf ile iletişime geçebilirsiniz.
                </p>
            </div>
        </div>
        """
        
        return EmailService.send_email(
            to_emails=[appointment_data['client_email']],
            subject=subject,
            html_content=html_content,
            category="appointment_rejection"
        )
    except Exception as e:
        logger.error(f"Rejection email task failed: {str(e)}")
        return False

@shared_task
def send_cancellation_email(appointment_data: Dict[str, Any]) -> bool:
    """Randevu iptal bildirimi email'i gönder"""
    try:
        from core.utils.email_service import EmailService
        
        subject = f"Randevu İptal Edildi - {appointment_data['vendor_name']}"
        html_content = f"""
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: #f8f9fa; padding: 30px; border-radius: 10px;">
                <h2 style="color: #333; margin-bottom: 20px;">Randevunuz İptal Edildi</h2>
                <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
                    <p><strong>Esnaf:</strong> {appointment_data['vendor_name']}</p>
                    <p><strong>Tarih:</strong> {appointment_data['appointment_date']}</p>
                    <p><strong>Saat:</strong> {appointment_data['appointment_time']}</p>
                </div>
                <p style="color: #666; font-size: 14px;">
                    Yeni bir randevu oluşturabilirsiniz.
                </p>
            </div>
        </div>
        """
        
        return EmailService.send_email(
            to_emails=[appointment_data['client_email']],
            subject=subject,
            html_content=html_content,
            category="appointment_cancellation"
        )
    except Exception as e:
        logger.error(f"Cancellation email task failed: {str(e)}")
        return False

@shared_task
def send_auto_cancellation_email(appointment_data: Dict[str, Any]) -> bool:
    """Otomatik iptal edilen randevu bildirimi email'i gönder"""
    try:
        from core.utils.email_service import EmailService
        
        subject = f"Randevu Otomatik İptal Edildi - {appointment_data['vendor_name']}"
        html_content = f"""
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: #f8f9fa; padding: 30px; border-radius: 10px;">
                <h2 style="color: #ef4444; margin-bottom: 20px;">Randevunuz Otomatik İptal Edildi</h2>
                <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ef4444;">
                    <p><strong>Esnaf:</strong> {appointment_data['vendor_name']}</p>
                    <p><strong>Tarih:</strong> {appointment_data['appointment_date']}</p>
                    <p><strong>Saat:</strong> {appointment_data['appointment_time']}</p>
                    <p><strong>Hizmet:</strong> {appointment_data['service_description']}</p>
                </div>
                <div style="background: #fef2f2; padding: 15px; border-radius: 8px; margin: 20px 0; border: 1px solid #fecaca;">
                    <p style="color: #991b1b; margin: 0; font-weight: 500;">
                        ⚠️ Bu randevu, tarihi geçtiği için sistem tarafından otomatik olarak iptal edilmiştir.
                    </p>
                </div>
                <p style="color: #666; font-size: 14px; margin-bottom: 20px;">
                    Randevu talebiniz onaylanmamış ve tarihi geçmiş olduğu için otomatik olarak iptal edildi. 
                    Yeni bir randevu oluşturabilirsiniz.
                </p>
                <div style="background: #ffd600; padding: 15px; border-radius: 8px; text-align: center;">
                    <a href="https://test.sanayicin.com" 
                       style="color: #111111; text-decoration: none; font-weight: bold;">
                        Yeni Randevu Oluştur
                    </a>
                </div>
            </div>
        </div>
        """
        
        return EmailService.send_email(
            to_emails=[appointment_data['client_email']],
            subject=subject,
            html_content=html_content,
            category="appointment_auto_cancellation"
        )
    except Exception as e:
        logger.error(f"Auto cancellation email task failed: {str(e)}")
        return False

@shared_task
def auto_cancel_expired_appointments() -> dict:
    """Geçmiş tarihli pending randevuları otomatik iptal et"""
    try:
        from vendors.models import Appointment
        from django.utils import timezone
        from datetime import datetime
        
        # Geçmiş tarihli pending randevuları bul
        now = timezone.now()
        current_date = now.date()
        current_time = now.time()
        
        expired_appointments = Appointment.objects.filter(
            status='pending'
        ).filter(
            # Bugünden önceki tarihlerde olanlar
            appointment_date__lt=current_date
        ) | Appointment.objects.filter(
            status='pending',
            appointment_date=current_date,
            # Bugün ama saati geçmiş olanlar
            appointment_time__lt=current_time
        )
        
        cancelled_count = 0
        for appointment in expired_appointments:
            if appointment.auto_cancel_if_expired():
                cancelled_count += 1
        
        logger.info(f"Auto-cancelled {cancelled_count} expired appointments")
        
        return {
            'success': True,
            'cancelled_count': cancelled_count,
            'message': f'{cancelled_count} expired appointment(s) auto-cancelled'
        }
        
    except Exception as e:
        logger.error(f"Auto cancel expired appointments task failed: {str(e)}")
        return {
            'success': False,
            'error': str(e),
            'cancelled_count': 0
        }

# Genel email task'ları
@shared_task
def send_verification_email(email: str, verification_token: str, user_role: str = "client") -> bool:
    """Email doğrulama linki gönder"""
    try:
        from core.utils.email_service import EmailService
        
        subject = "Email Adresinizi Doğrulayın - Sanayicin"
        
        # Kullanıcı rolüne göre doğrulama URL'i belirle
        if user_role == "vendor":
            verification_url = f"https://test.sanayicin.com/esnaf/email-dogrula?token={verification_token}"
            role_text = "esnaf"
        else:  # client veya diğer roller için
            verification_url = f"https://test.sanayicin.com/musteri/email-dogrula?token={verification_token}"
            role_text = "müşteri"
        
        html_content = f"""
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: #f8f9fa; padding: 30px; border-radius: 10px; text-align: center;">
                <h2 style="color: #333; margin-bottom: 20px;">Email Doğrulama</h2>
                <p style="color: #666; margin-bottom: 30px;">
                    Sanayicin {role_text} hesabınızı doğrulamak için aşağıdaki butona tıklayın:
                </p>
                <div style="background: #ffd600; padding: 20px; border-radius: 8px; margin: 25px 0;">
                    <a href="{verification_url}" 
                       style="color: #111111; text-decoration: none; font-weight: bold; font-size: 18px;">
                        Email Adresimi Doğrula
                    </a>
                </div>
                <p style="color: #666; font-size: 14px;">
                    Bu link 24 saat geçerlidir.
                </p>
                <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
                <p style="color: #999; font-size: 12px;">
                    Eğer bu işlemi siz yapmadıysanız, bu emaili görmezden gelebilirsiniz.
                </p>
            </div>
        </div>
        """
        
        return EmailService.send_email(
            to_emails=[email],
            subject=subject,
            html_content=html_content,
            category="email_verification"
        )
    except Exception as e:
        logger.error(f"Verification email task failed: {str(e)}")
        return False

@shared_task
def send_welcome_email(email: str, user_name: str, user_role: str = "client") -> bool:
    """Hoş geldin email'i gönder"""
    try:
        from core.utils.email_service import EmailService
        
        subject = f"Sanayicin'e Hoş Geldiniz, {user_name}!"
        
        role_text = "müşteri" if user_role == "client" else "esnaf"
        
        html_content = f"""
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: #f8f9fa; padding: 30px; border-radius: 10px; text-align: center;">
                <h2 style="color: #333; margin-bottom: 20px;">Hoş Geldiniz!</h2>
                <p style="color: #666; margin-bottom: 20px;">
                    Merhaba {user_name},
                </p>
                <p style="color: #666; margin-bottom: 30px;">
                    Sanayicin'e {role_text} olarak kayıt olduğunuz için teşekkür ederiz!
                </p>
                <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
                    <h3 style="color: #333; margin-bottom: 15px;">Hesabınız Hazır</h3>
                    <p style="color: #666; margin-bottom: 10px;">
                        Artık platformumuzu kullanmaya başlayabilirsiniz.
                    </p>
                    <p style="color: #666;">
                        Herhangi bir sorunuz olursa bizimle iletişime geçebilirsiniz.
                    </p>
                </div>
                <div style="background: #ffd600; padding: 15px; border-radius: 8px; margin: 25px 0;">
                    <a href="https://test.sanayicin.com" 
                       style="color: #111111; text-decoration: none; font-weight: bold;">
                        Platforma Git
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
        logger.error(f"Welcome email task failed: {str(e)}")
        return False

@shared_task
def send_password_reset_email(email: str, user_name: str, reset_url: str) -> bool:
    """Şifre sıfırlama email'i gönder"""
    try:
        from core.utils.email_service import EmailService
        
        subject = "Şifrenizi Sıfırlayın - Sanayicin"
        
        html_content = f"""
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: #f8f9fa; padding: 30px; border-radius: 10px; text-align: center;">
                <h2 style="color: #333; margin-bottom: 20px;">Şifre Sıfırlama</h2>
                <p style="color: #666; margin-bottom: 30px;">
                    Merhaba {user_name},
                </p>
                <p style="color: #666; margin-bottom: 30px;">
                    Şifrenizi sıfırlamak için aşağıdaki butona tıklayın:
                </p>
                <div style="background: #ffd600; padding: 20px; border-radius: 8px; margin: 25px 0;">
                    <a href="{reset_url}" 
                       style="color: #111111; text-decoration: none; font-weight: bold; font-size: 18px;">
                        Şifremi Sıfırla
                    </a>
                </div>
                <p style="color: #666; font-size: 14px;">
                    Bu link 1 saat geçerlidir.
                </p>
                <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
                <p style="color: #999; font-size: 12px;">
                    Eğer bu işlemi siz yapmadıysanız, bu emaili görmezden gelebilirsiniz.
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
        logger.error(f"Password reset email task failed: {str(e)}")
        return False

@shared_task
def send_message_notification_email(recipient_email: str, sender_name: str, message_preview: str) -> bool:
    """Mesaj bildirimi email'i gönder"""
    try:
        from core.utils.email_service import EmailService
        
        subject = f"Yeni Mesajınız Var - {sender_name}"
        
        html_content = f"""
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: #f8f9fa; padding: 30px; border-radius: 10px;">
                <h2 style="color: #333; margin-bottom: 20px;">Yeni Mesajınız Var</h2>
                <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
                    <p><strong>Gönderen:</strong> {sender_name}</p>
                    <p><strong>Mesaj:</strong> {message_preview}</p>
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
        logger.error(f"Message notification email task failed: {str(e)}")
        return False 


# ===== Vehicle reminder emails (email-only for now; SMS later) =====
@shared_task
def send_vehicle_maintenance_reminder(user_email: str, vehicle_label: str, due_km: int | None, due_date: str | None) -> bool:
    try:
        from core.utils.email_service import EmailService
        subject = "Bakım Hatırlatması - Sanayicin"
        details = []
        if due_km:
            details.append(f"Planlanan KM: {due_km}")
        if due_date:
            details.append(f"Tarih: {due_date}")
        details_text = " | ".join(details) or ""
        html_content = f"""
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: #f8f9fa; padding: 30px; border-radius: 10px;">
                <h2 style="color: #333; margin-bottom: 20px;">Bakım Hatırlatması</h2>
                <p><strong>Araç:</strong> {vehicle_label}</p>
                <p>{details_text}</p>
                <p style="color:#666;">Dilerseniz size en yakın ustalardan randevu alabilirsiniz.</p>
            </div>
        </div>
        """
        return EmailService.send_email(
            to_emails=[user_email], subject=subject, html_content=html_content, category="vehicle_maintenance_reminder"
        )
    except Exception as e:
        logger.error(f"Vehicle maintenance reminder email failed: {str(e)}")
        return False


@shared_task
def send_vehicle_inspection_reminder(user_email: str, vehicle_label: str, inspection_expiry: str) -> bool:
    try:
        from core.utils.email_service import EmailService
        subject = "Muayene Hatırlatması - Sanayicin"
        html_content = f"""
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: #f8f9fa; padding: 30px; border-radius: 10px;">
                <h2 style="color: #333; margin-bottom: 20px;">Muayene Hatırlatması</h2>
                <p><strong>Araç:</strong> {vehicle_label}</p>
                <p><strong>Muayene Geçerlilik:</strong> {inspection_expiry}</p>
            </div>
        </div>
        """
        return EmailService.send_email(
            to_emails=[user_email], subject=subject, html_content=html_content, category="vehicle_inspection_reminder"
        )
    except Exception as e:
        logger.error(f"Vehicle inspection reminder email failed: {str(e)}")
        return False


@shared_task
def send_vehicle_insurance_reminder(user_email: str, vehicle_label: str, traffic_expiry: str | None, casco_expiry: str | None) -> bool:
    try:
        from core.utils.email_service import EmailService
        subject = "Sigorta Hatırlatması - Sanayicin"
        parts = []
        if traffic_expiry:
            parts.append(f"Trafik Sigortası Bitiş: {traffic_expiry}")
        if casco_expiry:
            parts.append(f"Kasko Bitiş: {casco_expiry}")
        info = " | ".join(parts) or ""
        html_content = f"""
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: #f8f9fa; padding: 30px; border-radius: 10px;">
                <h2 style="color: #333; margin-bottom: 20px;">Sigorta Hatırlatması</h2>
                <p><strong>Araç:</strong> {vehicle_label}</p>
                <p>{info}</p>
            </div>
        </div>
        """
        return EmailService.send_email(
            to_emails=[user_email], subject=subject, html_content=html_content, category="vehicle_insurance_reminder"
        )
    except Exception as e:
        logger.error(f"Vehicle insurance reminder email failed: {str(e)}")
        return False