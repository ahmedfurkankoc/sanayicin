from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta
from core.models import EmailVerification, CustomUser

class Command(BaseCommand):
    help = 'Süresi dolmuş email verification token\'larını ve orphan kayıtları temizler'

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
        
        # Süresi dolmuş token'ları say ve sil
        expired_count = EmailVerification.objects.filter(
            expires_at__lt=cutoff_date
        ).count()
        
        deleted_count = EmailVerification.objects.filter(
            expires_at__lt=cutoff_date
        ).delete()[0]
        
        self.stdout.write(
            self.style.SUCCESS(
                f'{deleted_count} adet süresi dolmuş token silindi '
                f'({days} günden eski)'
            )
        )
        
        # Orphan email verification kayıtlarını temizle
        orphaned_count = 0
        for verification in EmailVerification.objects.all():
            try:
                user = verification.user
            except CustomUser.DoesNotExist:
                verification.delete()
                orphaned_count += 1
        
        if orphaned_count > 0:
            self.stdout.write(
                self.style.SUCCESS(
                    f'{orphaned_count} adet orphan verification kaydı silindi'
                )
            )
        
        # Aktif token sayısını göster
        active_count = EmailVerification.objects.filter(
            expires_at__gt=timezone.now(),
            is_used=False
        ).count()
        
        self.stdout.write(
            self.style.SUCCESS(
                f'Aktif verification token sayısı: {active_count}'
            )
        ) 