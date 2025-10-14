import os
from celery import Celery

# Django settings modülünü ayarla
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'main.settings')

app = Celery('sanayicin')

# Celery konfigürasyonu
app.config_from_object('django.conf:settings', namespace='CELERY')

# Task'ları otomatik keşfet
app.autodiscover_tasks()

# Redis broker
app.conf.update(
    broker_url='redis://localhost:6379/0',
    result_backend='redis://localhost:6379/0',
    task_serializer='json',
    accept_content=['json'],
    result_serializer='json',
    timezone='Europe/Istanbul',
    enable_utc=True,
    task_track_started=True,
    task_time_limit=30 * 60,  # 30 dakika
    task_soft_time_limit=25 * 60,  # 25 dakika
    worker_prefetch_multiplier=1,
    worker_max_tasks_per_child=1000,
)

# Rate limiting
app.conf.update(
    task_annotations={
        'core.utils.email_service.send_appointment_notification_async': {
            'rate_limit': '10/m',  # Dakikada 10 email
        },
        'core.utils.email_service.send_confirmation_notification_async': {
            'rate_limit': '10/m',
        },
        'core.utils.email_service.send_rejection_notification_async': {
            'rate_limit': '10/m',
        },
        'core.utils.email_service.send_cancellation_notification_async': {
            'rate_limit': '10/m',
        },
    }
)

# Celery Beat periodic tasks
app.conf.beat_schedule = {
    'refresh-all-domains-daily-0001-tr': {
        'task': 'admin_panel.refresh_all_domains',
        'schedule': {
            'type': 'crontab',
            'minute': 1,
            'hour': 0,
        },
        'options': {
            'queue': 'default',
        },
    },
}

@app.task(bind=True)
def debug_task(self):
    print(f'Request: {self.request!r}') 