import uuid
import jwt
from django.conf import settings
from typing import Optional, Tuple
from django.http import HttpRequest


GUEST_HEADER = 'HTTP_X_GUEST_TOKEN'


def create_guest_token(guest_id: Optional[uuid.UUID] = None) -> Tuple[str, uuid.UUID]:
    if guest_id is None:
        guest_id = uuid.uuid4()
    payload = {
        'guest_id': str(guest_id),
        'type': 'guest',
    }
    token = jwt.encode(payload, settings.SECRET_KEY, algorithm='HS256')
    return token, guest_id


def decode_guest_token(token: str) -> Optional[uuid.UUID]:
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=['HS256'])
        if payload.get('type') != 'guest':
            return None
        return uuid.UUID(payload['guest_id'])
    except Exception:
        return None


def get_guest_id_from_request(request: HttpRequest) -> Optional[uuid.UUID]:
    token = None
    header = request.META.get(GUEST_HEADER)
    if header:
        token = header.strip()
    else:
        auth = request.META.get('HTTP_AUTHORIZATION')
        if auth and auth.lower().startswith('guest '):
            token = auth.split(' ', 1)[1]
    if not token:
        return None
    return decode_guest_token(token)




