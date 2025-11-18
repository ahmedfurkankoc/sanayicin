from rest_framework.views import exception_handler
from rest_framework.exceptions import AuthenticationFailed, NotAuthenticated


def custom_exception_handler(exc, context):
    """Custom exception handler to customize error messages"""
    # DRF'nin standart exception handler'ını çağır
    response = exception_handler(exc, context)
    
    if response is not None:
        # Authentication hatalarını özelleştir
        if isinstance(exc, (NotAuthenticated, AuthenticationFailed)):
            # "Giriş bilgileri verilmedi" yerine "nope" yaz
            response.data = {'detail': 'nope'}
        
        # Diğer hatalar için de detail mesajını kontrol et
        elif isinstance(response.data, dict) and 'detail' in response.data:
            detail = response.data['detail']
            detail_str = ''
            
            # Detail string veya list olabilir
            if isinstance(detail, str):
                detail_str = detail.lower()
            elif isinstance(detail, list) and len(detail) > 0:
                detail_str = str(detail[0]).lower()
            
            # Authentication ile ilgili mesajları kontrol et
            if detail_str:
                auth_keywords = [
                    'giriş bilgileri verilmedi',
                    'authentication credentials were not provided',
                    'authentication credentials',
                    'given token not valid',
                    'token is invalid',
                    'token is expired',
                    'token not provided'
                ]
                
                if any(keyword in detail_str for keyword in auth_keywords):
                    response.data['detail'] = 'nope'
    
    return response
