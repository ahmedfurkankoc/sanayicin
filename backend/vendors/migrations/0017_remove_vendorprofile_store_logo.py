from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('vendors', '0009_review'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='vendorprofile',
            name='store_logo',
        ),
    ]


