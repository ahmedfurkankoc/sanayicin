from rest_framework import serializers
from .models import Conversation, Message
from core.serializers import CustomUserSerializer


class MessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = Message
        fields = [
            'id', 'conversation', 'sender_user', 'sender_is_vendor',
            'content', 'message_type', 'status', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'status', 'created_at', 'updated_at', 'sender_user', 'sender_is_vendor']


class ConversationSerializer(serializers.ModelSerializer):
    last_message = serializers.SerializerMethodField()
    vendor_display_name = serializers.SerializerMethodField()
    client_user = CustomUserSerializer(read_only=True)

    class Meta:
        model = Conversation
        fields = [
            'id', 'vendor', 'client_user',
            'last_message_text', 'last_message_at',
            'client_unread_count', 'vendor_unread_count',
            'created_at', 'updated_at', 'last_message', 'vendor_display_name',
        ]
        read_only_fields = [
            'id', 'client_user',
            'last_message_text', 'last_message_at',
            'client_unread_count', 'vendor_unread_count',
            'created_at', 'updated_at'
        ]

    def get_last_message(self, obj: Conversation):
        last_msg = obj.messages.order_by('-created_at').first()
        if not last_msg:
            return None
        return MessageSerializer(last_msg).data

    def get_vendor_display_name(self, obj: Conversation):
        try:
            return obj.vendor.display_name
        except Exception:
            return None


