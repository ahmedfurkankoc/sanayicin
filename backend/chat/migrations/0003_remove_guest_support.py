from django.db import migrations, models
import django.db.models.deletion


def remove_guest_conversations(apps, schema_editor):
    """
    Guest conversation'ları ve mesajları temizle
    """
    Conversation = apps.get_model('chat', 'Conversation')
    Message = apps.get_model('chat', 'Message')
    
    # Guest conversation'ları sil
    guest_conversations = Conversation.objects.filter(guest_id__isnull=False)
    guest_conversations.delete()
    
    # Guest mesajları sil
    guest_messages = Message.objects.filter(guest_id__isnull=False)
    guest_messages.delete()


def reverse_remove_guest_conversations(apps, schema_editor):
    """
    Bu migration'ı geri almak mümkün değil
    """
    pass


class Migration(migrations.Migration):

    dependencies = [
        ('chat', '0002_rename_chat_messag_convers_0f1a53_idx_chat_messag_convers_3154fc_idx'),
    ]

    operations = [
        # Önce guest data'ları temizle
        migrations.RunPython(remove_guest_conversations, reverse_remove_guest_conversations),
        
        # Önce eski constraint'leri kaldır
        migrations.RemoveConstraint(
            model_name='conversation',
            name='uniq_vendor_client_conversation',
        ),
        migrations.RemoveConstraint(
            model_name='conversation',
            name='uniq_vendor_guest_conversation',
        ),
        
        # Message model'ini güncelle
        migrations.RemoveField(
            model_name='message',
            name='guest_id',
        ),
        migrations.AlterField(
            model_name='message',
            name='sender_user',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='sent_messages', to='core.customuser'),
        ),
        
        # Conversation model'ini güncelle
        migrations.RemoveField(
            model_name='conversation',
            name='guest_id',
        ),
        migrations.AlterField(
            model_name='conversation',
            name='client_user',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='client_conversations', to='core.customuser'),
        ),
        
        # Yeni constraint ekle
        migrations.AddConstraint(
            model_name='conversation',
            constraint=models.UniqueConstraint(fields=('vendor', 'client_user'), name='uniq_vendor_client_conversation'),
        ),
    ]
