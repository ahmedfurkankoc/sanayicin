from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta
from core.models import EmailVerification

class Command(BaseCommand):
    help = 'Süresi dolmuş email verification token\'larını temizler'

    def add_arguments(self, parser):
        parser.add_argument(
            '--days',
            type=int,
            default=7,
            help='Kaç günden eski token\'lar silinecek (varsayılan: 7)'
        )

    def handle(self, *args, **options):
        days = options['days']
        cutoff_date = timezone.now() - timedelta(days=days)
        
        # Süresi dolmuş token'ları say
        expired_count = EmailVerification.objects.filter(
            expires_at__lt=cutoff_date
        ).count()
        
        # Süresi dolmuş token'ları sil
        deleted_count = EmailVerification.objects.filter(
            expires_at__lt=cutoff_date
        ).delete()[0]
        
        self.stdout.write(
            self.style.SUCCESS(
                f'{deleted_count} adet süresi dolmuş token silindi '
                f'({days} günden eski)'
            )
        ) 