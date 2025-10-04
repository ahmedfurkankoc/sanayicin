from django.http import Http404
from django.conf import settings
import re

class CORSBlockingMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        # Origin kontrolü
        origin = request.META.get('HTTP_ORIGIN')
        referer = request.META.get('HTTP_REFERER')
        
        # API endpointlerini kontrol et
        if request.path.startswith('/api/'):
            # Admin paneli için özel kontrol
            if request.path.startswith('/api/admin/'):
                response = self.get_response(request)
                return response
            
            # Origin kontrolü
            if origin:
                # CORS_ALLOWED_ORIGINS'den kontrol et
                if origin not in settings.CORS_ALLOWED_ORIGINS:
                    raise Http404("Not Found")
            
            # Referer kontrolü (ek güvenlik)
            elif referer:
                # Referer'dan domain çıkar
                import urllib.parse
                try:
                    parsed_referer = urllib.parse.urlparse(referer)
                    referer_domain = f"{parsed_referer.scheme}://{parsed_referer.netloc}"
                    
                    if referer_domain not in settings.CORS_ALLOWED_ORIGINS:
                        raise Http404("Not Found")
                except:
                    raise Http404("Not Found")
            
            # Hem origin hem referer yoksa (API test araçları vs)
            elif not origin and not referer:
                # User-Agent kontrolü (browser değilse izin ver)
                user_agent = request.META.get('HTTP_USER_AGENT', '')
                if user_agent and ('Mozilla' in user_agent or 'Chrome' in user_agent or 'Safari' in user_agent):
                    raise Http404("Not Found")

        response = self.get_response(request)
        return response 