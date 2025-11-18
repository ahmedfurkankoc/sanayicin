# Generated manually - Remove OTPCode model (moved to Redis)

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0022_otpcode'),
    ]

    operations = [
        migrations.DeleteModel(
            name='OTPCode',
        ),
    ]

