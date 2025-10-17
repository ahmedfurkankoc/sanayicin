import logging
from django.utils import timezone
from admin_panel.models import SystemLog


class ActivityLogHandler(logging.Handler):
    """Logger handler that saves logs to SystemLog model"""
    
    def emit(self, record):
        """Log record'u SystemLog'a kaydet"""
        try:
            message = record.getMessage()
            
            # Mesaj içeriğine göre activity type belirle
            if 'blog' in message.lower() or 'yazısı' in message.lower():
                activity_type = 'blog_published'
            elif 'destek' in message.lower() or 'talebi' in message.lower():
                activity_type = 'support_ticket'
            elif 'esnaf' in message.lower() or 'profil' in message.lower():
                activity_type = 'vendor_created'
            elif 'kullanıcı' in message.lower() or 'kaydoldu' in message.lower():
                activity_type = 'user_registered'
            elif 'doğrulandı' in message.lower():
                if 'esnaf' in message.lower():
                    activity_type = 'vendor_verified'
                else:
                    activity_type = 'user_verified'
            else:
                activity_type = 'system'
            
            # Log level'ı küçük harfe çevir
            level_map = {
                'DEBUG': 'debug',
                'INFO': 'info',
                'WARNING': 'warning',
                'ERROR': 'error',
                'CRITICAL': 'critical',
            }
            level = level_map.get(record.levelname, 'info')
            
            # Extra data varsa al
            extra_data = {}
            if hasattr(record, 'extra_data'):
                extra_data = record.extra_data
            
            # SystemLog oluştur
            SystemLog.objects.create(
                level=level,
                message=message,
                module='admin_panel',
                activity_type=activity_type,
                activity_data=extra_data,
                created_at=timezone.now()
            )
            
        except Exception as e:
            # Handler hatası durumunda console'a yaz
            print(f"ActivityLogHandler error: {e}")


# Custom logger oluştur
def get_activity_logger(name='admin_activities'):
    """ActivityLog'a kaydeden logger döndür"""
    logger = logging.getLogger(name)
    
    # Handler zaten ekli mi kontrol et
    if not any(isinstance(h, ActivityLogHandler) for h in logger.handlers):
        handler = ActivityLogHandler()
        handler.setLevel(logging.INFO)
        logger.addHandler(handler)
        logger.setLevel(logging.INFO)
    
    return logger


# Kolay kullanım için fonksiyonlar
def log_user_activity(message, extra_data=None):
    """Kullanıcı aktivitesi logla"""
    logger = get_activity_logger()
    logger.info(message, extra={'extra_data': extra_data or {}})


def log_vendor_activity(message, extra_data=None):
    """Esnaf aktivitesi logla"""
    logger = get_activity_logger()
    logger.info(message, extra={'extra_data': extra_data or {}})


def log_support_activity(message, extra_data=None):
    """Destek aktivitesi logla"""
    logger = get_activity_logger()
    logger.warning(message, extra={'extra_data': extra_data or {}})


def log_blog_activity(message, extra_data=None):
    """Blog aktivitesi logla"""
    logger = get_activity_logger()
    logger.info(message, extra={'extra_data': extra_data or {}})
