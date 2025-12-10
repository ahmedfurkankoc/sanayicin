from django.db import migrations, models
import django.utils.timezone


class Migration(migrations.Migration):

    initial = True

    dependencies = [
    ]

    operations = [
        migrations.CreateModel(
            name='AuditLog',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('user_id', models.IntegerField(blank=True, db_index=True, null=True, verbose_name='Kullanıcı ID')),
                ('username', models.CharField(blank=True, db_index=True, max_length=150, null=True, verbose_name='Kullanıcı Adı')),
                ('ip_address', models.GenericIPAddressField(blank=True, db_index=True, null=True, verbose_name='IP Adresi')),
                ('user_agent', models.TextField(blank=True, null=True, verbose_name='User Agent')),
                ('action', models.CharField(choices=[('login_success', 'Giriş Başarılı'), ('login_failed', 'Giriş Başarısız'), ('logout', 'Çıkış'), ('password_reset_request', 'Şifre Sıfırlama İsteği'), ('password_reset_success', 'Şifre Sıfırlama Başarılı'), ('email_verification_success', 'Email Doğrulama Başarılı'), ('email_verification_failed', 'Email Doğrulama Başarısız'), ('sms_verification_success', 'SMS Doğrulama Başarılı'), ('sms_verification_failed', 'SMS Doğrulama Başarısız'), ('user_registered', 'Kullanıcı Kaydı'), ('user_updated', 'Kullanıcı Güncellendi'), ('password_change', 'Şifre Değiştirildi'), ('email_change', 'Email Değiştirildi'), ('phone_change', 'Telefon Değiştirildi'), ('profile_updated', 'Profil Güncellendi'), ('avatar_uploaded', 'Avatar Yüklendi'), ('account_deleted', 'Hesap Silindi'), ('role_changed', 'Rol Değiştirildi'), ('vendor_upgraded', 'Vendor Yükseltildi'), ('permission_granted', 'Yetki Verildi'), ('permission_revoked', 'Yetki Kaldırıldı'), ('admin_access_granted', 'Admin Erişimi Verildi'), ('admin_access_revoked', 'Admin Erişimi Kaldırıldı'), ('suspicious_login', 'Şüpheli Giriş'), ('multiple_failed_logins', 'Çoklu Başarısız Giriş'), ('unusual_activity', 'Olağandışı Aktivite'), ('security_breach_attempt', 'Güvenlik İhlali Denemesi'), ('rate_limit_exceeded', 'Rate Limit Aşıldı'), ('csrf_failure', 'CSRF Hatası'), ('unauthorized_access_attempt', 'Yetkisiz Erişim Denemesi')], db_index=True, max_length=50, verbose_name='İşlem Türü')),
                ('timestamp', models.DateTimeField(db_index=True, default=django.utils.timezone.now, verbose_name='Tarih')),
                ('retention_until', models.DateField(blank=True, db_index=True, null=True, verbose_name='Saklama Bitiş Tarihi')),
                ('metadata', models.JSONField(blank=True, default=dict, verbose_name='Ek Detaylar')),
            ],
            options={
                'verbose_name': 'Audit Log',
                'verbose_name_plural': 'Audit Loglar',
                'db_table': 'audit_log',
                'ordering': ['-timestamp'],
            },
        ),
        migrations.AddIndex(
            model_name='auditlog',
            index=models.Index(fields=['user_id', '-timestamp'], name='audit_log_user_id_b41b02_idx'),
        ),
        migrations.AddIndex(
            model_name='auditlog',
            index=models.Index(fields=['action', '-timestamp'], name='audit_log_action_23c5f1_idx'),
        ),
        migrations.AddIndex(
            model_name='auditlog',
            index=models.Index(fields=['ip_address', '-timestamp'], name='audit_log_ip_addr_9ac2a1_idx'),
        ),
        migrations.AddIndex(
            model_name='auditlog',
            index=models.Index(fields=['retention_until', '-timestamp'], name='audit_log_retenti_f84c9c_idx'),
        ),
        migrations.AddIndex(
            model_name='auditlog',
            index=models.Index(fields=['-timestamp'], name='audit_log_timesta_9d0b56_idx'),
        ),
    ]

