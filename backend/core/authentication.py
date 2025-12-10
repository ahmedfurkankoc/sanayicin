"""
Custom JWT Authentication that supports both Authorization header and HttpOnly cookies.
"""
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from rest_framework_simplejwt.tokens import UntypedToken
from django.contrib.auth import get_user_model
from typing import Optional, Tuple

User = get_user_model()


class CookieJWTAuthentication(JWTAuthentication):
    """
    JWT Authentication that reads tokens from:
    1. HttpOnly cookies (access_token_{role} or access_token)
    2. Authorization header (Bearer token) - fallback
    
    This allows secure token storage in HttpOnly cookies while maintaining
    backward compatibility with Authorization header.
    """
    
    def authenticate(self, request) -> Optional[Tuple[User, None]]:
        # Önce cookie'den token'ı al
        token = None
        
        # Role'e göre cookie isimlerini dene
        # Önce access_token_{role} formatını dene (vendor, client, admin)
        for role in ['vendor', 'client', 'admin']:
            cookie_name = f'access_token_{role}'
            token = request.COOKIES.get(cookie_name)
            if token:
                break
        
        # Eğer role-specific cookie bulunamadıysa, genel access_token cookie'sini dene
        if not token:
            token = request.COOKIES.get('access_token')
        
        # Cookie'de token yoksa, Authorization header'dan al (fallback)
        if not token:
            header = self.get_header(request)
            if header is None:
                return None
            
            raw_token = self.get_raw_token(header)
            if raw_token is None:
                return None
            
            token = raw_token.decode('utf-8')
        
        # Token'ı validate et
        try:
            validated_token = self.get_validated_token(token)
        except (InvalidToken, TokenError) as e:
            return None
        
        # User'ı al
        user = self.get_user(validated_token)
        return (user, None)
    
    def get_validated_token(self, raw_token: str):
        """
        Validate and return a token.
        """
        try:
            untyped_token = UntypedToken(raw_token)
        except Exception as e:
            raise InvalidToken(f"Token is invalid or expired: {str(e)}")
        
        return untyped_token

