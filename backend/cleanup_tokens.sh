#!/bin/bash

# Token temizleme script'i
# Bu script günlük olarak çalıştırılabilir

# Log dizini oluştur
LOG_DIR="/var/www/sanayicin/backend/logs"
mkdir -p $LOG_DIR

# Log dosyası
LOG_FILE="$LOG_DIR/cleanup_tokens.log"

cd /var/www/sanayicin/backend
source venv/bin/activate

# 7 günden eski token'ları temizle
python manage.py cleanup_tokens --days 7

echo "Token temizleme tamamlandı: $(date)" >> $LOG_FILE 