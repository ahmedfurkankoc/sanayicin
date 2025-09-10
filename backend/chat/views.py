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

from core.models import CustomUser

from .models import Conversation, Message
from .serializers import ConversationSerializer, MessageSerializer


class ConversationListCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        
        # Chat permission kontrolü
        if not user.can_chat():
            return Response({'detail': 'Chat yapmak için doğrulanmış hesap gerekli.'}, status=403)

        # Kullanıcının dahil olduğu tüm conversation'ları getir
        qs = Conversation.objects.filter(
            Q(user1=user) | Q(user2=user)
        )
        
        # User bilgilerini de çek
        qs = qs.select_related('user1', 'user2').order_by('-last_message_at', '-updated_at')
        data = ConversationSerializer(qs, many=True, context={'request': request}).data
        return Response(data)

    def post(self, request):
        user = request.user
        
        # Chat permission kontrolü
        if not user.can_chat():
            return Response({'detail': 'Chat yapmak için doğrulanmış hesap gerekli.'}, status=400)
        
        other_user_id = request.data.get('other_user_id')
        if not other_user_id:
            return Response({'detail': 'other_user_id is required'}, status=400)
        
        try:
            other_user = CustomUser.objects.get(id=other_user_id)
        except CustomUser.DoesNotExist:
            return Response({'detail': 'User not found'}, status=404)

        # Kullanıcı kendisine mesaj atamaz
        if other_user.id == user.id:
            return Response({'detail': 'You cannot send messages to yourself.'}, status=400)

        # Find or create conversation - user1 ve user2 sıralı olarak saklanır
        user1_id = min(user.id, other_user.id)
        user2_id = max(user.id, other_user.id)
        
        conv, created = Conversation.objects.get_or_create(
            user1_id=user1_id, 
            user2_id=user2_id
        )

        return Response(ConversationSerializer(conv, context={'request': request}).data, status=201)


class ConversationMessagesView(APIView):
    permission_classes = [IsAuthenticated]

    def has_access(self, conv: Conversation, user: CustomUser) -> bool:
        # Chat permission kontrolü
        if not user.can_chat():
            return False
            
        # Kullanıcı conversation'da var mı?
        return conv.user1_id == user.id or conv.user2_id == user.id

    def get(self, request, conversation_id: int):
        user = request.user
        
        # Chat permission kontrolü
        if not user.can_chat():
            return Response({'detail': 'Chat yapmak için doğrulanmış hesap gerekli.'}, status=403)

        try:
            conv = Conversation.objects.select_related('user1', 'user2').get(id=conversation_id)
        except Conversation.DoesNotExist:
            return Response({'detail': 'Conversation not found'}, status=404)

        if not self.has_access(conv, user):
            return Response({'detail': 'Forbidden'}, status=403)

        limit = int(request.query_params.get('limit', 20))  # Default 20 mesaj
        offset = int(request.query_params.get('offset', 0))
        
        # Performans için sadece gerekli field'ları çek
        msgs = conv.messages.select_related('sender_user').only(
            'id', 'content', 'sender_user', 'created_at'
        ).order_by('-created_at')[offset:offset + limit]
        
        # Toplam mesaj sayısını cache'le
        total_count = conv.messages.count()
        
        data = MessageSerializer(msgs, many=True).data
        return Response({
            'results': data, 
            'count': total_count,
            'has_more': (offset + limit) < total_count,
            'next_offset': offset + limit if (offset + limit) < total_count else None
        })

    def post(self, request, conversation_id: int):
        user = request.user
        
        # Chat permission kontrolü
        if not user.can_chat():
            return Response({'detail': 'Chat yapmak için doğrulanmış hesap gerekli.'}, status=403)

        try:
            conv = Conversation.objects.select_related('user1', 'user2').get(id=conversation_id)
        except Conversation.DoesNotExist:
            return Response({'detail': 'Conversation not found'}, status=404)

        if not self.has_access(conv, user):
            return Response({'detail': 'Forbidden'}, status=403)

        content = (request.data.get('content') or '').strip()
        if not content:
            return Response({'detail': 'content is required'}, status=400)

        # Mesaj oluştur
        msg = Message.objects.create(
            conversation=conv,
            sender_user=user,
            content=content,
        )

        # Update conversation denorm fields
        conv.last_message_text = content[:500]
        conv.last_message_at = msg.created_at
        
        # Unread count'u güncelle - karşı tarafın okumadığı mesaj sayısı
        conv.unread_count = (conv.unread_count or 0) + 1
            
        conv.save(update_fields=['last_message_text', 'last_message_at', 'unread_count'])

        # Realtime broadcast to WS group so other participant sees instantly (even if sender used REST)
        try:
            channel_layer = get_channel_layer()
            payload = {
                'id': msg.id,
                'conversation': conv.id,
                'content': msg.content,
                'sender_user': user.id,
                'created_at': msg.created_at.isoformat(),
            }
            if channel_layer is not None:
                async_to_sync(channel_layer.group_send)(f"conv_{conv.id}", { 'type': 'message.new', 'payload': payload })
        except Exception:
            # Realtime yayın başarısız olsa da REST cevabı dön
            pass

        return Response(MessageSerializer(msg).data, status=201)


class ConversationReadView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, conversation_id: int):
        user = request.user
        
        # Chat permission kontrolü
        if not user.can_chat():
            return Response({'detail': 'Chat yapmak için doğrulanmış hesap gerekli.'}, status=403)

        try:
            conv = Conversation.objects.get(id=conversation_id)
        except Conversation.DoesNotExist:
            return Response({'detail': 'Conversation not found'}, status=404)

        # Kullanıcı conversation'da var mı?
        if user and (conv.user1_id == user.id or conv.user2_id == user.id):
            # Hangi user olduğunu belirle ve last_read_at güncelle
            if conv.user1_id == user.id:
                conv.user1_last_read_at = timezone.now()
            else:
                conv.user2_last_read_at = timezone.now()
            
            # Unread count'u sıfırla
            conv.unread_count = 0
            conv.save(update_fields=['user1_last_read_at', 'user2_last_read_at', 'unread_count'])
            return Response({'detail': 'ok'})

        return Response({'detail': 'Forbidden'}, status=403)


