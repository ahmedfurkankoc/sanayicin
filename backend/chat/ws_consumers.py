from __future__ import annotations

import json
from typing import Optional

from channels.generic.websocket import AsyncJsonWebsocketConsumer
from django.contrib.auth.models import AnonymousUser
from django.conf import settings
import jwt

from .models import Conversation, Message


class ChatConsumer(AsyncJsonWebsocketConsumer):
    async def connect(self):
        self.conversation_id = self.scope['url_route']['kwargs']['conversation_id']

        # Auth: user required
        user = self.scope.get('user')
        if not user or isinstance(user, AnonymousUser) or not user.is_authenticated:
            await self.close(code=4401)  # unauthorized
            return

        # Check if user is verified
        if not user.is_verified_user:
            await self.close(code=4403)  # forbidden - not verified
            return

        # Permission check
        has_access = await self._has_access(user)
        if not has_access:
            await self.close(code=4403)  # forbidden
            return

        # Resolve side of this connection for typing events
        try:
            conv = await Conversation.objects.select_related('vendor', 'client_user').aget(id=self.conversation_id)
            self.is_vendor_side = (conv.vendor.user_id == user.id)
        except Exception:
            self.is_vendor_side = False

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
                        'sender_is_vendor': getattr(self, 'is_vendor_side', False),
                        'conversation': int(self.conversation_id),
                    },
                },
            )

    async def typing_event(self, event):
        await self.send_json({'event': 'typing', 'data': event['payload']})

    async def message_new(self, event):
        await self.send_json({'event': 'message.new', 'data': event['payload']})

    async def _has_access(self, user) -> bool:
        try:
            conv = await Conversation.objects.select_related('vendor', 'client_user').aget(id=self.conversation_id)
        except Conversation.DoesNotExist:
            return False
        return conv.client_user_id == user.id or conv.vendor.user_id == user.id

    async def _handle_send_message(self, content):
        payload = content.get('data') or {}
        text = (payload.get('content') or '').strip()
        if not text:
            return
        user = self.scope.get('user')

        conv = await Conversation.objects.aget(id=self.conversation_id)
        is_vendor = (conv.vendor.user_id == user.id)

        msg = await Message.objects.acreate(
            conversation=conv,
            sender_user=user,
            sender_is_vendor=is_vendor,
            content=text,
        )

        # Update conversation denorms (basic async-friendly update)
        conv.last_message_text = text[:500]
        conv.last_message_at = msg.created_at
        if is_vendor:
            conv.client_unread_count = (conv.client_unread_count or 0) + 1
        else:
            conv.vendor_unread_count = (conv.vendor_unread_count or 0) + 1
        await conv.asave(update_fields=['last_message_text', 'last_message_at', 'client_unread_count', 'vendor_unread_count'])

        await self.channel_layer.group_send(
            self.group_name,
            {
                'type': 'message.new',
                'payload': {
                    'id': msg.id,
                    'conversation': conv.id,
                    'content': msg.content,
                    'sender_user': user.id,
                    'sender_is_vendor': is_vendor,
                    'created_at': msg.created_at.isoformat(),
                },
            },
        )


