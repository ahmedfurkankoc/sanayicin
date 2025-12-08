import os
from dotenv import load_dotenv
from celery import Celery
from celery.schedules import crontab

# Load environment variables from .env file
load_dotenv()

# Django settings modülünü ayarla
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'main.settings')

app = Celery('sanayicin')

# Celery konfigürasyonu
app.config_from_object('django.conf:settings', namespace='CELERY')

# Task'ları otomatik keşfet
app.autodiscover_tasks()

# Redis broker - .env'den al
CELERY_BROKER_URL = os.environ.get('CELERY_BROKER_URL', 'redis://localhost:6379/0')
CELERY_RESULT_BACKEND = os.environ.get('CELERY_RESULT_BACKEND', 'redis://localhost:6379/0')

app.conf.update(
    broker_url=CELERY_BROKER_URL,
    result_backend=CELERY_RESULT_BACKEND,
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
        'core.tasks.send_otp_sms_async': {
            'rate_limit': '100/m',  # Dakikada max 100 OTP SMS (İletiMerkezi limit'ine göre ayarlanabilir)
        },
        'core.tasks.send_verification_code_sms': {
            'rate_limit': '100/m',
        },
    }
)

# Celery Beat periodic tasks
app.conf.beat_schedule = {
    'refresh-all-domains-daily-0001-tr': {
        'task': 'admin_panel.refresh_all_domains',
        'schedule': crontab(minute=1, hour=0),  # Her gün saat 00:01'de çalışır
        'options': {
            'queue': 'default',
        },
    },
}

@app.task(bind=True)
def debug_task(self):
    print(f'Request: {self.request!r}') 