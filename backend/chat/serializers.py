from rest_framework import serializers
from .models import Conversation, Message
from core.serializers import CustomUserSerializer


class MessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = Message
        fields = [
            'id', 'conversation', 'sender_user',
            'content', 'message_type', 'status', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'status', 'created_at', 'updated_at', 'sender_user']


class ConversationSerializer(serializers.ModelSerializer):
    last_message = serializers.SerializerMethodField()
    user1 = CustomUserSerializer(read_only=True)
    user2 = CustomUserSerializer(read_only=True)
    other_user = serializers.SerializerMethodField()  # Karşı tarafı göster
    unread_count_for_current_user = serializers.SerializerMethodField()  # Mevcut kullanıcı için unread count

    class Meta:
        model = Conversation
        fields = [
            'id', 'user1', 'user2', 'other_user', 'unread_count_for_current_user',
            'last_message_text', 'last_message_at', 'unread_count',
            'created_at', 'updated_at', 'last_message',
        ]
        read_only_fields = [
            'id', 'user1', 'user2', 'other_user', 'unread_count_for_current_user',
            'last_message_text', 'last_message_at', 'unread_count',
            'created_at', 'updated_at'
        ]

    def get_last_message(self, obj: Conversation):
        last_msg = obj.messages.order_by('-created_at').first()
        if not last_msg:
            return None
        return MessageSerializer(last_msg).data

    def get_other_user(self, obj: Conversation):
        """Karşı tarafı döndür - request.user'a göre"""
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            other_user = obj.get_other_user(request.user)
            if other_user:
                return {
                    'id': other_user.id,
                    'email': other_user.email,
                    'username': other_user.username,
                    'first_name': other_user.first_name,
                    'last_name': other_user.last_name,
                    'role': other_user.role,
                    'avatar': other_user.avatar.url if other_user.avatar else None
                }
        return None

    def get_unread_count_for_current_user(self, obj: Conversation):
        """Mevcut kullanıcı için unread count döndür"""
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.get_unread_count_for_user(request.user)
        return 0


