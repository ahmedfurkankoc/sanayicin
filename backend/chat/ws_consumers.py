from __future__ import annotations

import json
from typing import Optional

from channels.generic.websocket import AsyncJsonWebsocketConsumer
from django.contrib.auth.models import AnonymousUser
from django.conf import settings
from channels.db import database_sync_to_async
import jwt
from django.core.cache import cache

from .models import Conversation, Message


class GlobalChatConsumer(AsyncJsonWebsocketConsumer):
    """Global chat consumer - tüm kullanıcılar için mesaj dinleme"""
    
    async def connect(self):
        # Auth: user required
        user = self.scope.get('user')
        if not user or isinstance(user, AnonymousUser) or not user.is_authenticated:
            await self.close(code=4401)  # unauthorized
            return

        # Check if user can chat
        if not user.can_chat():
            await self.close(code=4403)  # forbidden - cannot chat
            return

        # Global group'a ekle
        self.group_name = f"user_{user.id}"
        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()
        
        print(f"DEBUG Global WS: User {user.id} connected to global chat")

    async def disconnect(self, close_code):
        if hasattr(self, 'group_name'):
            await self.channel_layer.group_discard(self.group_name, self.channel_name)

    async def receive_json(self, content, **kwargs):
        # Global consumer sadece mesaj alır, göndermez
        pass

    async def message_new(self, event):
        """Yeni mesaj geldiğinde kullanıcıya bildir"""
        await self.send_json({
            'event': 'message.new', 
            'data': event['payload']
        })

    async def conversation_update(self, event):
        """Conversation güncellendiğinde kullanıcıya bildir"""
        await self.send_json({
            'event': 'conversation.update', 
            'data': event['payload']
        })

    async def notification_new(self, event):
        """Yeni push notification iletimi"""
        await self.send_json({
            'event': 'notification.new',
            'data': event['payload']
        })


class ChatConsumer(AsyncJsonWebsocketConsumer):
    async def connect(self):
        self.conversation_id = self.scope['url_route']['kwargs']['conversation_id']

        # Auth: user required
        user = self.scope.get('user')
        if not user or isinstance(user, AnonymousUser) or not user.is_authenticated:
            await self.close(code=4401)  # unauthorized
            return

        # Check if user can chat
        if not user.can_chat():
            await self.close(code=4403)  # forbidden - cannot chat
            return

        # Permission check
        has_access = await self._has_access(user)
        if not has_access:
            await self.close(code=4403)  # forbidden
            return

        # Kullanıcının conversation'daki pozisyonunu belirle
        try:
            conv = await self._get_conversation()
            # Kullanıcı conversation'da user1 mi user2 mi?
            if conv.user1_id == user.id:
                self.user_position = 'user1'
            elif conv.user2_id == user.id:
                self.user_position = 'user2'
            else:
                self.user_position = None
        except Exception:
            self.user_position = None

        self.group_name = f"conv_{self.conversation_id}"
        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()

    async def disconnect(self, close_code):
        if hasattr(self, 'group_name'):
            await self.channel_layer.group_discard(self.group_name, self.channel_name)

    async def receive_json(self, content, **kwargs):
        event = content.get('event')
        if event == 'message.send':
            await self._handle_send_message(content)
        elif event == 'typing.start' or event == 'typing.stop':
            await self.channel_layer.group_send(
                self.group_name,
                {
                    'type': 'typing.event',
                    'payload': {
                        'user_id': getattr(self.scope.get('user'), 'id', None),
                        'is_typing': event == 'typing.start',
                        'conversation': int(self.conversation_id),
                        # Typing event'ini gönderen kullanıcının ID'si
                        'typing_user_id': getattr(self.scope.get('user'), 'id', None),
                    },
                },
            )

    async def typing_event(self, event):
        await self.send_json({'event': 'typing', 'data': event['payload']})

    async def message_new(self, event):
        await self.send_json({'event': 'message.new', 'data': event['payload']})
        
        # Global consumer'lara da bildir
        user = self.scope.get('user')
        if user:
            # Karşı tarafa bildir
            other_user_id = event['payload'].get('other_user_id')
            if other_user_id:
                # Eğer karşı kullanıcı bu mesaj ID'sini cleared olarak işaretlediyse global bildirimi atla
                try:
                    cleared = set(cache.get(f"notifications_cleared:{other_user_id}", []))
                    if int(event['payload'].get('id')) not in cleared:
                        await self.channel_layer.group_send(
                            f"user_{other_user_id}",
                            {
                                'type': 'message_new',
                                'payload': event['payload']
                            }
                        )
                except Exception:
                    # Hata durumunda yine de mesajı iletmeye çalış
                    await self.channel_layer.group_send(
                        f"user_{other_user_id}",
                        {
                            'type': 'message_new',
                            'payload': event['payload']
                        }
                    )
                
                # Conversation update'i de gönder
                await self.channel_layer.group_send(
                    f"user_{other_user_id}",
                    {
                        'type': 'conversation_update',
                        'payload': {
                            'conversation_id': self.conversation_id,
                            'last_message_text': event['payload'].get('content', ''),
                            'unread_count': 1
                        }
                    }
                )

    @database_sync_to_async
    def _get_conversation(self):
        return Conversation.objects.select_related('user1', 'user2').get(id=self.conversation_id)

    async def _has_access(self, user) -> bool:
        try:
            conv = await self._get_conversation()
        except Conversation.DoesNotExist:
            return False
        # Kullanıcı conversation'da var mı?
        return conv.user1_id == user.id or conv.user2_id == user.id

    async def _handle_send_message(self, content):
        payload = content.get('data') or {}
        text = (payload.get('content') or '').strip()
        if not text:
            return
        user = self.scope.get('user')

        conv = await self._get_conversation()
        
        # Kullanıcı conversation'da var mı?
        if not (conv.user1_id == user.id or conv.user2_id == user.id):
            return
            
        # Debug için log ekle
        print(f"DEBUG WS: User ID: {user.id}, Role: {user.role}")
        print(f"DEBUG WS: Conv user1 ID: {conv.user1_id}, Conv user2 ID: {conv.user2_id}")

        msg = await self._create_message(conv, user, text)
        await self._update_conversation(conv, text)

        # Karşı tarafın ID'sini bul
        other_user_id = conv.user2_id if conv.user1_id == user.id else conv.user1_id

        await self.channel_layer.group_send(
            self.group_name,
            {
                'type': 'message.new',
                'payload': {
                    'id': msg.id,
                    'conversation': conv.id,
                    'content': msg.content,
                    'sender_user': user.id,
                    'other_user_id': other_user_id,
                    'created_at': msg.created_at.isoformat(),
                },
            },
        )

    @database_sync_to_async
    def _create_message(self, conv, user, text):
        return Message.objects.create(
            conversation=conv,
            sender_user=user,
            content=text,
        )

    @database_sync_to_async
    def _update_conversation(self, conv, text):
        conv.last_message_text = text[:500]
        conv.last_message_at = conv.messages.last().created_at
        
        # Unread count'u güncelle - karşı tarafın okumadığı mesaj sayısı
        conv.unread_count = (conv.unread_count or 0) + 1
            
        conv.save(update_fields=['last_message_text', 'last_message_at', 'unread_count'])


