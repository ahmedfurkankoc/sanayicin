import base64
import hashlib
from typing import Optional

from cryptography.fernet import Fernet, InvalidToken
from django.conf import settings


def _get_fernet() -> Fernet:
    # Derive a stable 32-byte key from SECRET_KEY using SHA256 then urlsafe_b64encode
    secret = settings.SECRET_KEY.encode('utf-8')
    digest = hashlib.sha256(secret).digest()
    key = base64.urlsafe_b64encode(digest)
    return Fernet(key)


def encrypt_text(plaintext: str) -> str:
    if plaintext is None:
        return ''
    data = plaintext.encode('utf-8')
    token = _get_fernet().encrypt(data)
    return token.decode('utf-8')


def decrypt_text(token: str) -> Optional[str]:
    if not token:
        return ''
    try:
        data = _get_fernet().decrypt(token.encode('utf-8'))
        return data.decode('utf-8')
    except (InvalidToken, Exception):
        return ''


