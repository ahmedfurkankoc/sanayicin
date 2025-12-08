import os
from django.core.asgi import get_asgi_application
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.auth import AuthMiddlewareStack
from django.urls import re_path

# Django ayarlarını importlardan önce set et
# Production'da environment variable'dan alınır, yoksa settings kullanılır
os.environ.setdefault("DJANGO_SETTINGS_MODULE", os.environ.get("DJANGO_SETTINGS_MODULE", "main.settings"))

# Django'yu başlat
django_asgi_app = get_asgi_application()

# Django başlatıldıktan sonra import et (app registry hazır)
from chat.ws_consumers import ChatConsumer, GlobalChatConsumer  # noqa: E402
from chat.middleware import JWTAuthMiddleware  # noqa: E402

websocket_urlpatterns = [
    re_path(r"ws/chat/(?P<conversation_id>\d+)/$", ChatConsumer.as_asgi()),
    re_path(r"ws/chat/global/$", GlobalChatConsumer.as_asgi()),
]

application = ProtocolTypeRouter({
    "http": django_asgi_app,
    "websocket": JWTAuthMiddleware(AuthMiddlewareStack(URLRouter(websocket_urlpatterns))),
})