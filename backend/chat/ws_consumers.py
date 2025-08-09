from __future__ import annotations

import json
from typing import Optional

from channels.generic.websocket import AsyncJsonWebsocketConsumer
from django.contrib.auth.models import AnonymousUser
from django.conf import settings
import jwt

from .models import Conversation, Message
from .utils import decode_guest_token


class ChatConsumer(AsyncJsonWebsocketConsumer):
    async def connect(self):
        self.conversation_id = self.scope['url_route']['kwargs']['conversation_id']

        # Auth: user or guest
        user = self.scope.get('user')
        query_string = self.scope.get('query_string', b'').decode()
        guest_token = None
        jwt_token = None
        if 'guest=' in query_string:
            try:
                guest_token = query_string.split('guest=', 1)[1].split('&', 1)[0]
            except Exception:
                guest_token = None
        if 'token=' in query_string:
            try:
                jwt_token = query_string.split('token=', 1)[1].split('&', 1)[0]
            except Exception:
                jwt_token = None

        # Permission check
        has_access = await self._has_access(user, guest_token, jwt_token)
        if not has_access:
            await self.close(code=4403)  # forbidden
            return

        # Resolve side of this connection for typing events
        try:
            conv = await Conversation.objects.select_related('vendor', 'client_user').aget(id=self.conversation_id)
            self.is_vendor_side = False
            if user and user.is_authenticated:
                self.is_vendor_side = (conv.vendor.user_id == user.id)
            elif jwt_token:
                try:
                    payload = jwt.decode(jwt_token, settings.SECRET_KEY, algorithms=['HS256'])
                    uid = payload.get('user_id')
                    if uid is not None:
                        try:
                            uid_int = int(uid)
                        except (TypeError, ValueError):
                            uid_int = uid
                        self.is_vendor_side = (conv.vendor.user_id == uid_int)
                except Exception:
                    self.is_vendor_side = False
            else:
                # guest connection -> always client side
                self.is_vendor_side = False
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

    async def _has_access(self, user, guest_token: Optional[str], jwt_token: Optional[str]) -> bool:
        try:
            conv = await Conversation.objects.select_related('vendor', 'client_user').aget(id=self.conversation_id)
        except Conversation.DoesNotExist:
            return False
        if user and not isinstance(user, AnonymousUser) and user.is_authenticated:
            return conv.client_user_id == user.id or conv.vendor.user_id == user.id
        # JWT query auth (vendor/customer over token=...)
        if jwt_token:
            try:
                payload = jwt.decode(jwt_token, settings.SECRET_KEY, algorithms=['HS256'])
                uid = payload.get('user_id')
                if uid is not None:
                    try:
                        uid_int = int(uid)
                    except (TypeError, ValueError):
                        uid_int = uid
                    return conv.client_user_id == uid_int or conv.vendor.user_id == uid_int
            except Exception:
                pass
        if guest_token and conv.guest_id:
            gid = decode_guest_token(guest_token)
            return gid is not None and str(gid) == str(conv.guest_id)
        return False

    async def _handle_send_message(self, content):
        payload = content.get('data') or {}
        text = (payload.get('content') or '').strip()
        if not text:
            return
        user = self.scope.get('user')

        conv = await Conversation.objects.aget(id=self.conversation_id)
        is_vendor = False
        sender_user = None
        guest_id = None
        if user and user.is_authenticated:
            sender_user = user
            is_vendor = (conv.vendor.user_id == user.id)
        else:
            # guest path via query param
            query = self.scope.get('query_string', b'').decode()
            token = None
            jwt_token = None
            if 'guest=' in query:
                token = query.split('guest=', 1)[1].split('&', 1)[0]
            if 'token=' in query:
                jwt_token = query.split('token=', 1)[1].split('&', 1)[0]
            gid = decode_guest_token(token) if token else None
            guest_id = str(gid) if gid else None
            # if jwt token present, resolve user id lazily
            if jwt_token and not sender_user:
                try:
                    payload = jwt.decode(jwt_token, settings.SECRET_KEY, algorithms=['HS256'])
                    uid = payload.get('user_id')
                    if uid is not None:
                        try:
                            uid_int = int(uid)
                        except (TypeError, ValueError):
                            uid_int = uid
                        from core.models import CustomUser
                        sender_user = await CustomUser.objects.aget(id=uid_int)
                        is_vendor = (conv.vendor.user_id == uid_int)
                        guest_id = None
                except Exception:
                    sender_user = None

        msg = await Message.objects.acreate(
            conversation=conv,
            sender_user=sender_user,
            sender_is_vendor=is_vendor,
            guest_id=guest_id,
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
                    'sender_user': sender_user.id if sender_user else None,
                    'sender_is_vendor': is_vendor,
                    'guest_id': guest_id,
                    'created_at': msg.created_at.isoformat(),
                },
            },
        )


