#!/bin/bash

# Sanayicin Rollback Script
# Ubuntu Server'da projeyi database dahil rollback yapar

set -e  # Hata durumunda script'i durdur

echo "🔄 Sanayicin Rollback Başlatılıyor..."

# Değişkenler
PROJECT_DIR="/var/www/sanayicin"
BACKUP_DIR="/var/www/sanayicin/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# Backup dizini oluştur
mkdir -p $BACKUP_DIR

echo "📦 Mevcut durum yedekleniyor..."

# Mevcut durumu yedekle
sudo cp -r $PROJECT_DIR/backend $BACKUP_DIR/backend_backup_$TIMESTAMP
sudo cp -r $PROJECT_DIR/frontend $BACKUP_DIR/frontend_backup_$TIMESTAMP
sudo cp -r $PROJECT_DIR/media $BACKUP_DIR/media_backup_$TIMESTAMP
sudo cp $PROJECT_DIR/backend/db.sqlite3 $BACKUP_DIR/db_backup_before_rollback_$TIMESTAMP.sqlite3

echo "🛑 Servisler durduruluyor..."

# Servisleri durdur
sudo systemctl stop daphne || true
sudo systemctl stop gunicorn || true
sudo systemctl stop celery || true

echo "🗄️ Database rollback yapılıyor..."

# Database'i eski versiyona geri yükle
cd $PROJECT_DIR/backend
if [ -f "db_backup_20250806_171342.sqlite3" ]; then
    sudo cp db_backup_20250806_171342.sqlite3 db.sqlite3
    sudo chown www-data:www-data db.sqlite3
    sudo chmod 664 db.sqlite3
    echo "✅ Database rollback tamamlandı"
else
    echo "❌ Database backup dosyası bulunamadı!"
    exit 1
fi

echo "📝 Git rollback yapılıyor..."

# Git rollback
cd $PROJECT_DIR
if [ -n "$1" ]; then
    # Belirli bir commit'e geri dön
    git reset --hard $1
    echo "✅ Git rollback tamamlandı: $1"
else
    # Son commit'i geri al
    git reset --hard HEAD~1
    echo "✅ Git rollback tamamlandı: Son commit"
fi

echo "🔧 Frontend yeniden build ediliyor..."

# Frontend rebuild
cd $PROJECT_DIR/frontend
rm -rf node_modules package-lock.json
npm ci
NODE_ENV=production npm run build

echo "🐍 Backend yeniden kuruluyor..."

# Backend rebuild
cd $PROJECT_DIR/backend
rm -rf venv
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
python manage.py collectstatic --noinput

echo "🔐 İzinler düzeltiliyor..."

# İzinleri düzelt
sudo chown -R www-data:www-data $PROJECT_DIR/backend
sudo chmod -R 775 $PROJECT_DIR/backend

echo "🚀 Servisler başlatılıyor..."

# Servisleri başlat
sudo systemctl restart daphne
sudo systemctl restart gunicorn
sudo systemctl restart celery
sudo systemctl restart redis-server
sudo systemctl reload nginx

echo "✅ Rollback tamamlandı!"
echo "📊 Servis durumları kontrol ediliyor..."

# Servis durumlarını kontrol et
sudo systemctl status daphne --no-pager | head -5
sudo systemctl status gunicorn --no-pager | head -5
sudo systemctl status nginx --no-pager | head -5

echo ""
echo "🎯 Rollback tamamlandı!"
echo "📁 Yedekler: $BACKUP_DIR"
echo "🌐 Site: https://test.sanayicin.com"
echo ""
echo "🔍 Hata kontrolü için logları inceleyin:"
echo "sudo journalctl -u daphne -f"
echo "sudo journalctl -u gunicorn -f"
echo "pm2 logs frontend"
