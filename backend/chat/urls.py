from django.urls import path
from .views import (
    ConversationListCreateView,
    ConversationMessagesView,
    ConversationReadView,
)


urlpatterns = [
    path('conversations/', ConversationListCreateView.as_view()),
    path('conversations/<int:conversation_id>/messages', ConversationMessagesView.as_view()),
    path('conversations/<int:conversation_id>/read', ConversationReadView.as_view()),
]




