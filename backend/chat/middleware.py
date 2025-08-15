import jwt
from django.contrib.auth.models import AnonymousUser
from channels.middleware import BaseMiddleware
from channels.db import database_sync_to_async
from django.conf import settings
from core.models import CustomUser


class JWTAuthMiddleware(BaseMiddleware):
    async def __call__(self, scope, receive, send):
        # Query string'den token'ı al
        query_string = scope.get('query_string', b'').decode()
        query_params = dict(item.split('=') for item in query_string.split('&') if '=' in item)
        token = query_params.get('token', '')

        if token:
            try:
                # JWT token'ı decode et
                payload = jwt.decode(token, settings.SECRET_KEY, algorithms=['HS256'])
                user_id = payload.get('user_id')
                
                if user_id:
                    # User'ı database'den al
                    user = await self.get_user(user_id)
                    if user:
                        scope['user'] = user
                        return await super().__call__(scope, receive, send)
            except (jwt.InvalidTokenError, jwt.ExpiredSignatureError, jwt.DecodeError):
                pass

        # Token yoksa veya geçersizse anonymous user
        scope['user'] = AnonymousUser()
        return await super().__call__(scope, receive, send)

    @database_sync_to_async
    def get_user(self, user_id):
        try:
            return CustomUser.objects.get(id=user_id)
        except CustomUser.DoesNotExist:
            return None
