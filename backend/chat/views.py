from typing import Optional

from django.utils import timezone
from django.db.models import Q
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.generics import ListAPIView
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync

from vendors.models import VendorProfile
from core.models import CustomUser

from .models import Conversation, Message
from .serializers import ConversationSerializer, MessageSerializer


class ConversationListCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        if not user.is_verified_user:
            return Response({'detail': 'Only verified users can access chat.'}, status=403)

        qs = Conversation.objects.all()
        qs = qs.filter(Q(client_user=user) | Q(vendor__user=user))
        qs = qs.select_related('vendor', 'client_user').order_by('-last_message_at', '-updated_at')
        data = ConversationSerializer(qs, many=True).data
        return Response(data)

    def post(self, request):
        user = request.user
        if not user.is_verified_user:
            return Response({'detail': 'Only verified users can access chat.'}, status=403)

        vendor_id = request.data.get('vendor_id')
        if not vendor_id:
            return Response({'detail': 'vendor_id is required'}, status=400)
        
        try:
            vendor = VendorProfile.objects.get(id=vendor_id)
        except VendorProfile.DoesNotExist:
            return Response({'detail': 'Vendor not found'}, status=404)

        # Kullanıcı kendisine mesaj atamaz
        if vendor.user_id == user.id:
            return Response({'detail': 'You cannot send messages to yourself.'}, status=400)

        # Find or create conversation
        conv, created = Conversation.objects.get_or_create(vendor=vendor, client_user=user)

        return Response(ConversationSerializer(conv).data, status=201)


class ConversationMessagesView(APIView):
    permission_classes = [IsAuthenticated]

    def has_access(self, conv: Conversation, user: CustomUser) -> bool:
        return conv.client_user_id == user.id or conv.vendor.user_id == user.id

    def get(self, request, conversation_id: int):
        user = request.user
        if not user.is_verified_user:
            return Response({'detail': 'Only verified users can access chat.'}, status=403)

        try:
            conv = Conversation.objects.select_related('vendor', 'client_user').get(id=conversation_id)
        except Conversation.DoesNotExist:
            return Response({'detail': 'Conversation not found'}, status=404)

        if not self.has_access(conv, user):
            return Response({'detail': 'Forbidden'}, status=403)

        limit = int(request.query_params.get('limit', 30))
        offset = int(request.query_params.get('offset', 0))
        msgs = conv.messages.all().order_by('-created_at')[offset:offset + limit]
        data = MessageSerializer(msgs, many=True).data
        return Response({'results': data, 'count': conv.messages.count()})

    def post(self, request, conversation_id: int):
        user = request.user
        if not user.is_verified_user:
            return Response({'detail': 'Only verified users can access chat.'}, status=403)

        try:
            conv = Conversation.objects.select_related('vendor', 'client_user').get(id=conversation_id)
        except Conversation.DoesNotExist:
            return Response({'detail': 'Conversation not found'}, status=404)

        if not self.has_access(conv, user):
            return Response({'detail': 'Forbidden'}, status=403)

        content = (request.data.get('content') or '').strip()
        if not content:
            return Response({'detail': 'content is required'}, status=400)

        # Determine sender side
        is_vendor = (conv.vendor.user_id == user.id)

        msg = Message.objects.create(
            conversation=conv,
            sender_user=user,
            sender_is_vendor=is_vendor,
            content=content,
        )

        # Update conversation denorm fields
        conv.last_message_text = content[:500]
        conv.last_message_at = msg.created_at
        if is_vendor:
            conv.client_unread_count = (conv.client_unread_count or 0) + 1
        else:
            conv.vendor_unread_count = (conv.vendor_unread_count or 0) + 1
        conv.save(update_fields=['last_message_text', 'last_message_at', 'client_unread_count', 'vendor_unread_count'])

        # Realtime broadcast to WS group so other participant sees instantly (even if sender used REST)
        channel_layer = get_channel_layer()
        payload = {
            'id': msg.id,
            'conversation': conv.id,
            'content': msg.content,
            'sender_user': user.id,
            'sender_is_vendor': is_vendor,
            'created_at': msg.created_at.isoformat(),
        }
        async_to_sync(channel_layer.group_send)(f"conv_{conv.id}", { 'type': 'message.new', 'payload': payload })

        return Response(MessageSerializer(msg).data, status=201)


class ConversationReadView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, conversation_id: int):
        user = request.user
        if not user.is_verified_user:
            return Response({'detail': 'Only verified users can access chat.'}, status=403)

        try:
            conv = Conversation.objects.get(id=conversation_id)
        except Conversation.DoesNotExist:
            return Response({'detail': 'Conversation not found'}, status=404)

        if user and (conv.client_user_id == user.id or conv.vendor.user_id == user.id):
            if conv.vendor.user_id == user.id:
                conv.vendor_last_read_at = timezone.now()
                conv.vendor_unread_count = 0
            else:
                conv.client_last_read_at = timezone.now()
                conv.client_unread_count = 0
            conv.save(update_fields=['vendor_last_read_at', 'client_last_read_at', 'vendor_unread_count', 'client_unread_count'])
            return Response({'detail': 'ok'})

        return Response({'detail': 'Forbidden'}, status=403)


