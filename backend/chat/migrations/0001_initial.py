from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ('vendors', '0004_vendorprofile_business_phone'),
        ('core', '0002_customuser_is_verified_customuser_phone_number_and_more'),
    ]

    operations = [
        migrations.CreateModel(
            name='Conversation',
            fields=[
                ('id', models.BigAutoField(primary_key=True, serialize=False)),
                ('guest_id', models.UUIDField(blank=True, null=True, db_index=True)),
                ('last_message_text', models.TextField(blank=True, default='')),
                ('last_message_at', models.DateTimeField(blank=True, null=True)),
                ('client_last_read_at', models.DateTimeField(blank=True, null=True)),
                ('vendor_last_read_at', models.DateTimeField(blank=True, null=True)),
                ('client_unread_count', models.PositiveIntegerField(default=0)),
                ('vendor_unread_count', models.PositiveIntegerField(default=0)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('client_user', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name='client_conversations', to='core.customuser')),
                ('vendor', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='conversations', to='vendors.vendorprofile')),
            ],
        ),
        migrations.CreateModel(
            name='Message',
            fields=[
                ('id', models.BigAutoField(primary_key=True, serialize=False)),
                ('sender_is_vendor', models.BooleanField(default=False)),
                ('guest_id', models.UUIDField(blank=True, null=True, db_index=True)),
                ('content', models.TextField()),
                ('message_type', models.CharField(max_length=16, default='text')),
                ('status', models.CharField(max_length=16, choices=[('sent', 'Sent'), ('delivered', 'Delivered'), ('read', 'Read')], default='sent')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('conversation', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='messages', to='chat.conversation')),
                ('sender_user', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='sent_messages', to='core.customuser')),
            ],
            options={'ordering': ['-created_at']},
        ),
        migrations.AddIndex(
            model_name='message',
            index=models.Index(fields=['conversation', 'created_at'], name='chat_messag_convers_0f1a53_idx'),
        ),
        migrations.AddConstraint(
            model_name='conversation',
            constraint=models.UniqueConstraint(fields=('vendor', 'client_user'), condition=models.Q(('guest_id__isnull', True), ('client_user__isnull', False)), name='uniq_vendor_client_conversation'),
        ),
        migrations.AddConstraint(
            model_name='conversation',
            constraint=models.UniqueConstraint(fields=('vendor', 'guest_id'), condition=models.Q(('client_user__isnull', True), ('guest_id__isnull', False)), name='uniq_vendor_guest_conversation'),
        ),
    ]




