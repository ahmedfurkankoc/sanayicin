from __future__ import annotations

from celery import shared_task
from django.utils import timezone
from .models import Domain
from .domain_service import DomainService
import logging


logger = logging.getLogger(__name__)


@shared_task(name='admin_panel.refresh_all_domains')
def refresh_all_domains() -> dict:
    """Refresh WHOIS/domain information for all domains.

    Runs daily via Celery Beat (Europe/Istanbul 00:01). Returns a small summary
    to help monitoring in logs.
    """
    started_at = timezone.now()
    service = DomainService()
    total = 0
    updated = 0
    errors: list[dict] = []

    for domain in Domain.objects.all().order_by('name'):
        total += 1
        try:
            info = service.get_domain_info(domain.name)
            domain.registrar = info['registrar']
            domain.registration_date = info['registration_date']
            domain.expiration_date = info['expiration_date']
            domain.nameservers = info['nameservers']
            domain.admin_email = info['admin_email']
            domain.tech_email = info['tech_email']
            domain.status = info['status']
            domain.save(update_fields=[
                'registrar',
                'registration_date',
                'expiration_date',
                'nameservers',
                'admin_email',
                'tech_email',
                'status',
                'updated_at',
            ])
            updated += 1
        except Exception as exc:  # noqa: BLE001
            logger.exception("Domain refresh failed for %s", domain.name)
            errors.append({'domain': domain.name, 'error': str(exc)})

    finished_at = timezone.now()
    summary = {
        'started_at': started_at.isoformat(),
        'finished_at': finished_at.isoformat(),
        'total': total,
        'updated': updated,
        'errors': errors,
    }
    logger.info("[domains] daily refresh completed: %s", summary)
    return summary


