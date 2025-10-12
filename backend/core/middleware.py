"""
Custom middleware for the core app.
"""

from django.utils.deprecation import MiddlewareMixin


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