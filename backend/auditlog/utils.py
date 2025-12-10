"""
Audit Log Helper Functions
Kullanıcı ve güvenlik odaklı loglar için yardımcı fonksiyonlar
"""
from django.utils import timezone
from django.contrib.auth import get_user_model
from .models import AuditLog
import logging
import re
from datetime import timedelta

User = get_user_model()
logger = logging.getLogger(__name__)

# Metadata allowlist (GDPR/KVKK uyumu - hassas veriyi tutma)
ALLOWED_METADATA_KEYS = {
    'endpoint', 'method', 'query_params', 'reason',
    'role', 'has_vendor_profile', 'is_verified',
    'old_role', 'new_role', 'resource',
    'status_code', 'response_time_ms',
}


def mask_value(val: str) -> str:
    """Hassas veriyi maskele (email, telefon, TC vb.)."""
    if not isinstance(val, str):
        return val
    # Email mask
    if re.match(r'[^@]+@[^@]+\\.[^@]+', val):
        parts = val.split('@')
        local = parts[0]
        masked_local = (local[0] + '***' + local[-1]) if len(local) > 2 else '***'
        return masked_local + '@' + parts[1]
    # Telefon mask (en az 7 haneli sayısal)
    digits = re.sub(r'\\D', '', val)
    if len(digits) >= 7:
        return '*' * (len(digits) - 2) + digits[-2:]
    # TC kimlik / 11 hane
    if re.match(r'^\\d{11}$', val):
        return '*******' + val[-4:]
    return val


def sanitize_metadata(metadata: dict | None) -> dict:
    """Metadata'yı allowlist ile filtrele ve hassas veriyi maskele."""
    if not metadata or not isinstance(metadata, dict):
        return {}
    sanitized = {}
    for key, value in metadata.items():
        if key not in ALLOWED_METADATA_KEYS:
            continue
        if isinstance(value, str):
            sanitized[key] = mask_value(value)
        elif isinstance(value, dict):
            # Shallow mask for nested dict
            sanitized[key] = {k: mask_value(v) if isinstance(v, str) else v for k, v in value.items()}
        else:
            sanitized[key] = value
    return sanitized


def get_client_ip(request):
    """Request'ten gerçek IP adresini al"""
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        ip = x_forwarded_for.split(',')[0]
    else:
        ip = request.META.get('REMOTE_ADDR')
    return ip


def get_user_agent(request):
    """Request'ten user agent'ı al"""
    return request.META.get('HTTP_USER_AGENT', '')


def log_audit_event(
    action: str,
    request=None,
    user=None,
    user_id=None,
    username=None,
    ip_address=None,
    user_agent=None,
    metadata=None
):
    """
    Audit log kaydı oluştur
    
    Args:
        action: İşlem türü (AuditLog.ACTION_CHOICES'den biri)
        request: Django request objesi (opsiyonel)
        user: User objesi (opsiyonel)
        user_id: User ID (opsiyonel)
        username: Username (opsiyonel)
        ip_address: IP adresi (opsiyonel, request'ten alınır)
        user_agent: User agent (opsiyonel, request'ten alınır)
        metadata: Ek detaylar (dict, opsiyonel)
    """
    try:
        # User bilgilerini topla
        if user:
            user_id = user.id if not user_id else user_id
            username = user.username if not username else username
        elif user_id and not username:
            try:
                user_obj = User.objects.get(id=user_id)
                username = user_obj.username
            except User.DoesNotExist:
                pass
        
        # Request bilgilerini topla
        if request:
            if not ip_address:
                ip_address = get_client_ip(request)
            if not user_agent:
                user_agent = get_user_agent(request)
        
        # Metadata'yı hazırla
        metadata = sanitize_metadata(metadata)

        # Saklama süresi (varsayılan 5 yıl)
        retention_until = timezone.now().date() + timedelta(days=365 * 5)
        
        # Audit log oluştur
        audit_log = AuditLog.objects.create(
            user_id=user_id,
            username=username,
            ip_address=ip_address,
            user_agent=user_agent,
            action=action,
            timestamp=timezone.now(),
            retention_until=retention_until,
            metadata=metadata
        )
        
        return audit_log
        
    except Exception as e:
        # Audit log oluşturulamazsa teknik log'a yaz
        logger.error(f"Audit log oluşturulamadı: {e}", exc_info=True)
        return None


# Kolay kullanım için özel fonksiyonlar

def log_login_success(request, user, metadata=None):
    """Başarılı giriş logla"""
    return log_audit_event(
        action='login_success',
        request=request,
        user=user,
        metadata=metadata or {}
    )


def log_login_failed(request, email=None, metadata=None):
    """Başarısız giriş logla"""
    meta = metadata or {}
    if email:
        meta['email'] = email
    return log_audit_event(
        action='login_failed',
        request=request,
        metadata=meta
    )


def log_logout(request, user, metadata=None):
    """Çıkış logla"""
    return log_audit_event(
        action='logout',
        request=request,
        user=user,
        metadata=metadata or {}
    )


def log_password_change(request, user, metadata=None):
    """Şifre değişikliği logla"""
    return log_audit_event(
        action='password_change',
        request=request,
        user=user,
        metadata=metadata or {}
    )


def log_role_change(request, user, old_role, new_role, metadata=None):
    """Rol değişikliği logla"""
    meta = metadata or {}
    meta['old_role'] = old_role
    meta['new_role'] = new_role
    return log_audit_event(
        action='role_changed',
        request=request,
        user=user,
        metadata=meta
    )


def log_vendor_upgrade(request, user, metadata=None):
    """Vendor yükseltme logla"""
    return log_audit_event(
        action='vendor_upgraded',
        request=request,
        user=user,
        metadata=metadata or {}
    )


def log_suspicious_activity(request, user=None, reason=None, metadata=None):
    """Şüpheli aktivite logla"""
    meta = metadata or {}
    if reason:
        meta['reason'] = reason
    return log_audit_event(
        action='suspicious_activity',
        request=request,
        user=user,
        metadata=meta
    )


def log_security_breach_attempt(request, user=None, reason=None, metadata=None):
    """Güvenlik ihlali denemesi logla"""
    meta = metadata or {}
    if reason:
        meta['reason'] = reason
    return log_audit_event(
        action='security_breach_attempt',
        request=request,
        user=user,
        metadata=meta
    )


def log_unauthorized_access_attempt(request, user=None, resource=None, metadata=None):
    """Yetkisiz erişim denemesi logla"""
    meta = metadata or {}
    if resource:
        meta['resource'] = resource
    return log_audit_event(
        action='unauthorized_access_attempt',
        request=request,
        user=user,
        metadata=meta
    )

