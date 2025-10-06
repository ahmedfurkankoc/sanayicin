from django.core.management.base import BaseCommand
from django.db import transaction
from core.models import Vehicle, CarBrand


def normalize(value: str) -> str:
    try:
        import unicodedata
        s = (value or '').strip().lower()
        s = unicodedata.normalize('NFD', s)
        s = ''.join(ch for ch in s if unicodedata.category(ch) != 'Mn')
        return s
    except Exception:
        return (value or '').strip().lower()


class Command(BaseCommand):
    help = "Backfill Vehicle.brand (FK) from legacy string values by matching CarBrand.name"

    def add_arguments(self, parser):
        parser.add_argument('--dry-run', action='store_true', help='Do not write changes, only report')

    def handle(self, *args, **options):
        dry_run = bool(options.get('dry_run'))

        brands = list(CarBrand.objects.all())
        name_to_brand = {normalize(cb.name): cb for cb in brands}

        updated = 0
        missing = []

        qs = Vehicle.objects.all()
        # Only rows without FK set or with legacy string-like values
        qs = qs.filter(brand__isnull=True) | qs.filter(brand__id__isnull=True)

        if dry_run:
            self.stdout.write(self.style.WARNING('Running in DRY-RUN mode'))

        with transaction.atomic():
            for v in qs.select_for_update():
                # Try to read legacy raw value from model dict if present
                raw = None
                try:
                    raw = v.__dict__.get('brand', None)  # legacy string in same field before FK migration
                    if hasattr(raw, 'id'):
                        continue
                except Exception:
                    raw = None

                key = normalize(raw) if isinstance(raw, str) else ''
                cb = name_to_brand.get(key)
                if cb:
                    if not dry_run:
                        v.brand = cb
                        v.save(update_fields=['brand'])
                    updated += 1
                else:
                    missing.append((v.id, raw))

            if dry_run:
                transaction.set_rollback(True)

        self.stdout.write(self.style.SUCCESS(f'Updated (backfilled) vehicles: {updated}'))
        if missing:
            self.stdout.write(self.style.WARNING(f'Missing matches: {len(missing)}'))
            preview = '\n'.join([f'- id={vid}, raw_brand={repr(val)}' for vid, val in missing[:20]])
            if preview:
                self.stdout.write(preview)
            self.stdout.write('Tip: Add missing CarBrand rows (names), then re-run the command.')


