from __future__ import annotations

import uuid
from django.db import models
from django.db.models import Q

from core.models import CustomUser
from vendors.models import VendorProfile


class Conversation(models.Model):
    """
    1-1 sohbet. Ya authenticated client_user ile ya da guest_id ile bağlanır.
    """

    id = models.BigAutoField(primary_key=True)
    vendor = models.ForeignKey(
        VendorProfile,
        on_delete=models.CASCADE,
        related_name='conversations',
    )
    client_user = models.ForeignKey(
        CustomUser,
        on_delete=models.CASCADE,
        related_name='client_conversations',
        null=True,
        blank=True,
    )
    guest_id = models.UUIDField(null=True, blank=True, db_index=True)

    # Denormalized metadata
    last_message_text = models.TextField(blank=True, default='')
    last_message_at = models.DateTimeField(null=True, blank=True)

    # Read tracking
    client_last_read_at = models.DateTimeField(null=True, blank=True)
    vendor_last_read_at = models.DateTimeField(null=True, blank=True)
    client_unread_count = models.PositiveIntegerField(default=0)
    vendor_unread_count = models.PositiveIntegerField(default=0)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        constraints = [
            # Aynı vendor + client_user için tek konuşma (guest null iken)
            models.UniqueConstraint(
                fields=['vendor', 'client_user'],
                condition=Q(guest_id__isnull=True) & Q(client_user__isnull=False),
                name='uniq_vendor_client_conversation',
            ),
            # Aynı vendor + guest_id için tek konuşma (client_user null iken)
            models.UniqueConstraint(
                fields=['vendor', 'guest_id'],
                condition=Q(client_user__isnull=True) & Q(guest_id__isnull=False),
                name='uniq_vendor_guest_conversation',
            ),
        ]

    def __str__(self) -> str:
        owner = self.client_user.email if self.client_user_id else f"guest:{self.guest_id}"
        return f"{owner} ↔ {self.vendor.display_name}"


class Message(models.Model):
    MESSAGE_STATUS_CHOICES = [
        ('sent', 'Sent'),
        ('delivered', 'Delivered'),
        ('read', 'Read'),
    ]

    id = models.BigAutoField(primary_key=True)
    conversation = models.ForeignKey(
        Conversation,
        on_delete=models.CASCADE,
        related_name='messages',
    )
    sender_user = models.ForeignKey(
        CustomUser,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='sent_messages',
    )
    sender_is_vendor = models.BooleanField(default=False)
    guest_id = models.UUIDField(null=True, blank=True, db_index=True)

    content = models.TextField()
    message_type = models.CharField(max_length=16, default='text')
    status = models.CharField(max_length=16, choices=MESSAGE_STATUS_CHOICES, default='sent')

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        indexes = [
            models.Index(fields=['conversation', 'created_at']),
        ]
        ordering = ['-created_at']

    def __str__(self) -> str:
        return f"Msg:{self.id} conv:{self.conversation_id}"




