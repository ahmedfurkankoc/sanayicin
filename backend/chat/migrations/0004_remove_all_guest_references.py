from django.db import migrations, models
import django.db.models.deletion


def remove_all_guest_references(apps, schema_editor):
    """
    Tüm guest referanslarını temizle
    """
    Conversation = apps.get_model('chat', 'Conversation')
    Message = apps.get_model('chat', 'Message')
    
    # Guest conversation'ları sil
    guest_conversations = Conversation.objects.filter(client_user__isnull=True)
    guest_conversations.delete()
    
    # Guest mesajları sil
    guest_messages = Message.objects.filter(sender_user__isnull=True)
    guest_messages.delete()


def reverse_remove_all_guest_references(apps, schema_editor):
    """
    Bu migration'ı geri almak mümkün değil
    """
    pass


class Migration(migrations.Migration):

    dependencies = [
        ('chat', '0003_remove_guest_support'),
    ]

    operations = [
        # Önce guest data'ları temizle
        migrations.RunPython(remove_all_guest_references, reverse_remove_all_guest_references),
        
        # Message model'inde sender_user'ı required yap
        migrations.AlterField(
            model_name='message',
            name='sender_user',
            field=models.ForeignKey(
                on_delete=django.db.models.deletion.CASCADE, 
                related_name='sent_messages', 
                to='core.customuser',
                null=False
            ),
        ),
        
        # Conversation model'inde client_user'ı required yap
        migrations.AlterField(
            model_name='conversation',
            name='client_user',
            field=models.ForeignKey(
                on_delete=django.db.models.deletion.CASCADE, 
                related_name='client_conversations', 
                to='core.customuser',
                null=False
            ),
        ),
    ]
