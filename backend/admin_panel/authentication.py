from typing import Optional, Tuple
from datetime import datetime

from django.core.cache import cache
from rest_framework.authentication import BaseAuthentication
from rest_framework.exceptions import AuthenticationFailed
from .models import AdminUser


class AdminTokenAuthentication(BaseAuthentication):
    """Authenticate admin requests via HttpOnly 'admin_token' cookie or Authorization header.

    Looks up the token in cache (key: admin_token_{token}) and returns the associated user.
    """

    def authenticate(self, request) -> Optional[Tuple[object, None]]:
        token = request.COOKIES.get('admin_token')
        if not token:
            auth_header = request.headers.get('Authorization', '')
            if auth_header.startswith('Bearer '):
                token = auth_header.replace('Bearer ', '')

        if not token:
            return None

        cache_key = f"admin_token_{token}"
        token_data = cache.get(cache_key)
        if not token_data:
            raise AuthenticationFailed('Invalid admin token')

        if datetime.utcnow() > token_data.get('expires_at'):
            cache.delete(cache_key)
            raise AuthenticationFailed('Admin token expired')

        try:
            user = AdminUser.objects.get(id=token_data['user_id'])
        except AdminUser.DoesNotExist:
            raise AuthenticationFailed('User not found')

        return (user, None)


