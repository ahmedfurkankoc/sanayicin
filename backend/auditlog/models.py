"""
Audit Log Model - Kullanıcı ve güvenlik odaklı loglar
DB'de tutulur, admin panelde gösterilir, asla silinmez
"""
from django.db import models
from django.contrib.auth import get_user_model
from django.utils import timezone
import json

User = get_user_model()


class AuditLog(models.Model):
    """
    Audit Log - Kullanıcı ve güvenlik odaklı loglar
    DB'de tutulur, admin panelde gösterilir, asla silinmez
    """
    
    # Action türleri
    ACTION_CHOICES = [
        # A) Kimlik doğrulama olayları
        ('login_success', 'Giriş Başarılı'),
        ('login_failed', 'Giriş Başarısız'),
        ('logout', 'Çıkış'),
        ('password_reset_request', 'Şifre Sıfırlama İsteği'),
        ('password_reset_success', 'Şifre Sıfırlama Başarılı'),
        ('email_verification_success', 'Email Doğrulama Başarılı'),
        ('email_verification_failed', 'Email Doğrulama Başarısız'),
        ('sms_verification_success', 'SMS Doğrulama Başarılı'),
        ('sms_verification_failed', 'SMS Doğrulama Başarısız'),
        
        # B) Kullanıcı hesap işlemleri
        ('user_registered', 'Kullanıcı Kaydı'),
        ('user_updated', 'Kullanıcı Güncellendi'),
        ('password_change', 'Şifre Değiştirildi'),
        ('email_change', 'Email Değiştirildi'),
        ('phone_change', 'Telefon Değiştirildi'),
        ('profile_updated', 'Profil Güncellendi'),
        ('avatar_uploaded', 'Avatar Yüklendi'),
        ('account_deleted', 'Hesap Silindi'),
        
        # C) Yetki / Rol değişiklikleri
        ('role_changed', 'Rol Değiştirildi'),
        ('vendor_upgraded', 'Vendor Yükseltildi'),
        ('permission_granted', 'Yetki Verildi'),
        ('permission_revoked', 'Yetki Kaldırıldı'),
        ('admin_access_granted', 'Admin Erişimi Verildi'),
        ('admin_access_revoked', 'Admin Erişimi Kaldırıldı'),
        
        # D) Güvenlik şüpheli olayları
        ('suspicious_login', 'Şüpheli Giriş'),
        ('multiple_failed_logins', 'Çoklu Başarısız Giriş'),
        ('unusual_activity', 'Olağandışı Aktivite'),
        ('security_breach_attempt', 'Güvenlik İhlali Denemesi'),
        ('rate_limit_exceeded', 'Rate Limit Aşıldı'),
        ('csrf_failure', 'CSRF Hatası'),
        ('unauthorized_access_attempt', 'Yetkisiz Erişim Denemesi'),
    ]
    
    # Zorunlu alanlar
    user_id = models.IntegerField(null=True, blank=True, db_index=True, verbose_name="Kullanıcı ID")
    username = models.CharField(max_length=150, blank=True, null=True, db_index=True, verbose_name="Kullanıcı Adı")
    ip_address = models.GenericIPAddressField(null=True, blank=True, db_index=True, verbose_name="IP Adresi")
    user_agent = models.TextField(blank=True, null=True, verbose_name="User Agent")
    action = models.CharField(max_length=50, choices=ACTION_CHOICES, db_index=True, verbose_name="İşlem Türü")
    timestamp = models.DateTimeField(default=timezone.now, db_index=True, verbose_name="Tarih")
    # GDPR/KVKK uyumu için saklama süresi sonu
    retention_until = models.DateField(null=True, blank=True, db_index=True, verbose_name="Saklama Bitiş Tarihi")
    metadata = models.JSONField(default=dict, blank=True, verbose_name="Ek Detaylar")
    
    class Meta:
        db_table = 'AuditLog'
        verbose_name = "Audit Log"
        verbose_name_plural = "Audit Loglar"
        ordering = ['-timestamp']
        indexes = [
            models.Index(fields=['user_id', '-timestamp']),
            models.Index(fields=['action', '-timestamp']),
            models.Index(fields=['ip_address', '-timestamp']),
            models.Index(fields=['retention_until', '-timestamp']),
            models.Index(fields=['-timestamp']),
        ]
    
    def __str__(self):
        return f"{self.get_action_display()} - {self.username or 'Anonymous'} - {self.timestamp.strftime('%Y-%m-%d %H:%M:%S')}"
    
    def get_metadata_display(self):
        """Metadata'yı okunabilir formatta döndür"""
        if not self.metadata:
            return {}
        return self.metadata

