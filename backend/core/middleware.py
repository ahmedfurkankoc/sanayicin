"""
Custom middleware for the core app.
"""

from django.utils.deprecation import MiddlewareMixin
from django.conf import settings


class CORSBlockingMiddleware(MiddlewareMixin):
    """
    CORS blocking middleware to prevent unauthorized cross-origin requests.
    """
    def process_request(self, request):
        # CORS blocking logic can be added here if needed
        pass


class RealIPMiddleware(MiddlewareMixin):
    """
    Middleware to get real IP address from reverse proxy headers.
    """
    def process_request(self, request):
        # Get real IP from various proxy headers
        real_ip = None
        
        # Check X-Forwarded-For header (most common)
        forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if forwarded_for:
            # X-Forwarded-For can contain multiple IPs, take the first one
            real_ip = forwarded_for.split(',')[0].strip()
        
        # Check X-Real-IP header (nginx)
        if not real_ip:
            real_ip = request.META.get('HTTP_X_REAL_IP')
        
        # Check X-Client-IP header
        if not real_ip:
            real_ip = request.META.get('HTTP_X_CLIENT_IP')
        
        # Check CF-Connecting-IP header (Cloudflare)
        if not real_ip:
            real_ip = request.META.get('HTTP_CF_CONNECTING_IP')
        
        # If we found a real IP, use it
        if real_ip:
            request.META['REMOTE_ADDR'] = real_ip
        
        return None


class SecurityHeadersMiddleware(MiddlewareMixin):
    """
    Middleware to add additional security headers to responses.
    """
    def process_response(self, request, response):
        # Referrer-Policy header
        if hasattr(settings, 'SECURE_REFERRER_POLICY'):
            response['Referrer-Policy'] = settings.SECURE_REFERRER_POLICY
        
        # Permissions-Policy header (Feature-Policy yerine)
        response['Permissions-Policy'] = (
            'geolocation=(), '
            'microphone=(), '
            'camera=(), '
            'payment=(), '
            'usb=()'
        )
        
        # X-Content-Type-Options (zaten SECURE_CONTENT_TYPE_NOSNIFF var ama explicit ekleyelim)
        response['X-Content-Type-Options'] = 'nosniff'
        
        # X-XSS-Protection (modern tarayıcılarda deprecated ama eski tarayıcılar için)
        response['X-XSS-Protection'] = '1; mode=block'
        
        # Content Security Policy (CSP) - esnek ama güvenli
        # Development için daha esnek (localhost portları için), Production için daha sıkı
        is_development = getattr(settings, 'DEBUG', False)
        
        if request.path.startswith('/api/'):
            # API endpoint'leri için daha esnek CSP (CORS için)
            if is_development:
                # Development: localhost portlarına izin ver
                csp_policy = (
                    "default-src 'self' http://localhost:* http://127.0.0.1:*; "
                    "script-src 'self' 'unsafe-inline' 'unsafe-eval' http://localhost:* http://127.0.0.1:*; "
                    "style-src 'self' 'unsafe-inline' http://localhost:* http://127.0.0.1:*; "
                    "img-src 'self' data: https: http:; "
                    "font-src 'self' data: http://localhost:* http://127.0.0.1:*; "
                    "connect-src 'self' https: wss: ws: http://localhost:* http://127.0.0.1:*; "
                    "frame-ancestors 'none'; "
                    "base-uri 'self'; "
                    "form-action 'self';"
                )
            else:
                # Production: daha sıkı
                csp_policy = (
                    "default-src 'self'; "
                    "script-src 'self' 'unsafe-inline' 'unsafe-eval'; "
                    "style-src 'self' 'unsafe-inline'; "
                    "img-src 'self' data: https:; "
                    "font-src 'self' data:; "
                    "connect-src 'self' https: wss: ws:; "
                    "frame-ancestors 'none'; "
                    "base-uri 'self'; "
                    "form-action 'self';"
                )
        else:
            # HTML sayfaları için CSP
            if is_development:
                # Development: localhost portlarına izin ver
                csp_policy = (
                    "default-src 'self' http://localhost:* http://127.0.0.1:*; "
                    "script-src 'self' 'unsafe-inline' 'unsafe-eval' http://localhost:* http://127.0.0.1:*; "
                    "style-src 'self' 'unsafe-inline' http://localhost:* http://127.0.0.1:*; "
                    "img-src 'self' data: https: http:; "
                    "font-src 'self' data: http://localhost:* http://127.0.0.1:*; "
                    "connect-src 'self' https: wss: ws: http://localhost:* http://127.0.0.1:*; "
                    "frame-ancestors 'none'; "
                    "base-uri 'self'; "
                    "form-action 'self';"
                )
            else:
                # Production: daha sıkı
                csp_policy = (
                    "default-src 'self'; "
                    "script-src 'self' 'unsafe-inline' 'unsafe-eval'; "
                    "style-src 'self' 'unsafe-inline'; "
                    "img-src 'self' data: https:; "
                    "font-src 'self' data:; "
                    "connect-src 'self' https: wss: ws:; "
                    "frame-ancestors 'none'; "
                    "base-uri 'self'; "
                    "form-action 'self';"
                )
        
        response['Content-Security-Policy'] = csp_policy
        
        return response