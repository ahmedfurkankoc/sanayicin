from django.core.management.base import BaseCommand
from django.core.cache import cache

class Command(BaseCommand):
    help = 'Clear admin token cache'

    def handle(self, *args, **options):
        # Admin token cache'ini temizle
        cache.delete_many([key for key in cache._cache.keys() if key.startswith('admin_token_')])
        self.stdout.write(self.style.SUCCESS('Admin token cache cleared'))
