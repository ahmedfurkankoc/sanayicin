from __future__ import annotations

from django.db import models
from django.db.models import Q
from django.utils import timezone

from core.models import CustomUser


class Conversation(models.Model):
    """
    1-1 sohbet. İki CustomUser arası mesajlaşma.
    Sadece authenticated ve verified kullanıcılar için.
    """

    id = models.BigAutoField(primary_key=True)
    user1 = models.ForeignKey(
        CustomUser,
        on_delete=models.CASCADE,
        related_name='conversations_as_user1',
    )
    user2 = models.ForeignKey(
        CustomUser,
        on_delete=models.CASCADE,
        related_name='conversations_as_user2',
    )

    # Denormalized metadata
    last_message_text = models.TextField(blank=True, default='')
    last_message_at = models.DateTimeField(null=True, blank=True)

    # Read tracking - her kullanıcı için ayrı
    user1_last_read_at = models.DateTimeField(null=True, blank=True)
    user2_last_read_at = models.DateTimeField(null=True, blank=True)
    
    # Tek unread count - karşı tarafın okumadığı mesaj sayısı
    unread_count = models.PositiveIntegerField(default=0)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'Conversation'
        constraints = [
            # Aynı iki kullanıcı arasında tek konuşma
            # user1 ve user2 sıralı olarak saklanır (küçük ID önce)
            models.UniqueConstraint(
                fields=['user1', 'user2'],
                name='uniq_user1_user2_conversation',
            ),
        ]
        ordering = ['-updated_at']

    def __str__(self) -> str:
        return f"{self.user1.email} ↔ {self.user2.email}"
    
    def get_other_user(self, current_user):
        """Verilen kullanıcının karşı tarafını döndür"""
        if current_user == self.user1:
            return self.user2
        elif current_user == self.user2:
            return self.user1
        return None
    
    def get_unread_count_for_user(self, user):
        """Verilen kullanıcı için unread count döndür"""
        if user == self.user1:
            # user1 için user2'nin gönderdiği okunmamış mesajlar
            if self.user1_last_read_at:
                last_read = self.user1_last_read_at
            else:
                # Eğer hiç okunmamışsa, 1 yıl öncesinden itibaren say
                last_read = timezone.now() - timezone.timedelta(days=365)
            
            return self.messages.filter(
                sender_user=self.user2,
                created_at__gt=last_read
            ).count()
        elif user == self.user2:
            # user2 için user1'in gönderdiği okunmamış mesajlar
            if self.user2_last_read_at:
                last_read = self.user2_last_read_at
            else:
                # Eğer hiç okunmamışsa, 1 yıl öncesinden itibaren say
                last_read = timezone.now() - timezone.timedelta(days=365)
            
            return self.messages.filter(
                sender_user=self.user1,
                created_at__gt=last_read
            ).count()
        return 0


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
        on_delete=models.CASCADE,
        related_name='sent_messages',
    )
    # sender_is_vendor kaldırıldı - artık gerekli değil

    content = models.TextField()
    message_type = models.CharField(max_length=16, default='text')
    status = models.CharField(max_length=16, choices=MESSAGE_STATUS_CHOICES, default='sent')

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'Message'
        indexes = [
            models.Index(fields=['conversation', 'created_at']),
        ]
        ordering = ['-created_at']

    def __str__(self) -> str:
        return f"Msg:{self.id} conv:{self.conversation_id}"




