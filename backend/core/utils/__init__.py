# Utils package
from .avatar import avatar_upload_path

try:
    from .email_service import EmailService  # noqa: F401
except Exception:
    EmailService = None  # type: ignore

try:
    from .sms_service import IletiMerkeziSMS  # noqa: F401
except Exception:
    IletiMerkeziSMS = None  # type: ignore

try:
    from .crypto import encrypt_text, decrypt_text  # noqa: F401
except Exception:
    encrypt_text = decrypt_text = None  # type: ignore

__all__ = ['avatar_upload_path']