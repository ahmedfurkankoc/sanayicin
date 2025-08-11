# Generated manually for data migration

from django.db import migrations

def migrate_both_roles_and_set_permissions(apps, schema_editor):
    """Mevcut 'both' role'leri 'vendor' yap ve permission'ları set et"""
    CustomUser = apps.get_model('core', 'CustomUser')
    
    # 'both' role'ü olan kullanıcıları 'vendor' yap
    both_users = CustomUser.objects.filter(role='both')
    for user in both_users:
        user.role = 'vendor'
        user.can_provide_services = True
        user.can_request_services = True
        user.save()
        print(f"User {user.email} role changed from 'both' to 'vendor'")
    
    # Tüm kullanıcılar için permission'ları set et
    for user in CustomUser.objects.all():
        if user.role == 'vendor':
            user.can_provide_services = True
            user.can_request_services = True
        elif user.role == 'client':
            user.can_provide_services = False
            user.can_request_services = True
        elif user.role == 'admin':
            user.can_provide_services = True
            user.can_request_services = True
        
        user.save()
        print(f"User {user.email} permissions set: provide={user.can_provide_services}, request={user.can_request_services}")

def reverse_migrate(apps, schema_editor):
    """Reverse migration - vendor'ları 'both' yap"""
    CustomUser = apps.get_model('core', 'CustomUser')
    
    vendor_users = CustomUser.objects.filter(role='vendor')
    for user in vendor_users:
        user.role = 'both'
        user.save()
        print(f"User {user.email} role changed from 'vendor' to 'both'")

class Migration(migrations.Migration):

    dependencies = [
        ('core', '0003_customuser_can_provide_services_and_more'),
    ]

    operations = [
        migrations.RunPython(
            migrate_both_roles_and_set_permissions,
            reverse_migrate
        ),
    ]
