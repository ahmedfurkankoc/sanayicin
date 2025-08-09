import os
from django.core.asgi import get_asgi_application
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.auth import AuthMiddlewareStack
from django.urls import re_path

# Django ayarlarını importlardan önce set et
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "backend.settings")

# Django'yu başlat
django_asgi_app = get_asgi_application()

# Django başlatıldıktan sonra import et (app registry hazır)
from chat.ws_consumers import ChatConsumer  # noqa: E402

websocket_urlpatterns = [
    re_path(r"ws/chat/(?P<conversation_id>\d+)/$", ChatConsumer.as_asgi()),
]

application = ProtocolTypeRouter({
    "http": django_asgi_app,
    "websocket": AuthMiddlewareStack(URLRouter(websocket_urlpatterns)),
})