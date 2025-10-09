## Kurulum (systemd servisleri) / Setup (systemd services)

```bash
# Kopyala / Copy unit files
sudo cp conf/backend.service /etc/systemd/system/backend.service
sudo cp conf/daphne.service  /etc/systemd/system/daphne.service
sudo cp conf/celery.service  /etc/systemd/system/celery.service
sudo cp conf/celery-beat.service /etc/systemd/system/celery-beat.service
sudo cp conf/sanayicin.target /etc/systemd/system/sanayicin.target
sudo cp conf/sanayicin.service /etc/systemd/system/sanayicin.service

# Nginx konfigini yerleştir / Place nginx config (örnek path)
sudo cp conf/nginx.conf /etc/nginx/sites-available/sanayicin.conf
sudo ln -sf /etc/nginx/sites-available/sanayicin.conf /etc/nginx/sites-enabled/sanayicin.conf

# Değişiklikleri okut / Reload systemd
sudo systemctl daemon-reload

# Otomatik başlat / Enable on boot
sudo systemctl enable backend.service daphne.service celery.service celery-beat.service sanayicin.target sanayicin.service

# Başlat / Start
sudo systemctl start backend.service daphne.service celery.service celery-beat.service
# veya tek komutla / or all at once
sudo systemctl start sanayicin

# Nginx test+reload
sudo nginx -t && sudo systemctl reload nginx
```

## Günlük İşlemler (başlat/durdur/yük durum) / Daily ops

```bash
# Tek komutla hepsi / All at once (preferred)
sudo systemctl restart sanayicin
sudo systemctl start   sanayicin
sudo systemctl stop    sanayicin
systemctl status sanayicin

# Ayrıntılı durum ve bağlı üniteler / Detailed status and linked units
systemctl list-units --type=service | grep -E "(sanayicin|backend|daphne|celery)"

# Tek tek / Individually
sudo systemctl restart backend.service
sudo systemctl restart daphne.service
sudo systemctl restart celery.service
sudo systemctl restart celery-beat.service

# Loglar / Logs (last 200 lines)
journalctl -u sanayicin -u backend.service -u daphne.service -u celery.service -u celery-beat.service -n 200 --no-pager

# Canlı log takibi / Live tail
journalctl -fu backend.service
journalctl -fu daphne.service
journalctl -fu celery.service
journalctl -fu celery-beat.service

# Nginx
sudo nginx -t && sudo systemctl reload nginx
```

## Celery venv ile manuel çalıştırma (servis yoksa) / Run Celery via venv (no service)

```bash
# Proje yolu / Project path
cd /var/www/sanayicin/backend

# Worker
./venv/bin/celery -A main worker -l info --concurrency=2

# Beat (ayrı terminal)
./venv/bin/celery -A main beat -l info

# django-celery-beat kullanıyorsan / if using django-celery-beat
# ./venv/bin/celery -A main beat -l info -S django_celery_beat.schedulers:DatabaseScheduler

# Arka planda tmux/screen ile
tmux new -s celery-w "cd /var/www/sanayicin/backend && ./venv/bin/celery -A main worker -l info --concurrency=2"
tmux new -s celery-b "cd /var/www/sanayicin/backend && ./venv/bin/celery -A main beat -l info"
```

## Celery (manuel) durdurma komutları / Stop Celery when running manually

```bash
# Hızlı durdurma (tüm celery prosesleri) / quick kill-all
pkill -f "celery -A main worker" || true
pkill -f "celery -A main beat"   || true

# PID bazlı durdurma / by PID
pgrep -a -f "celery.*worker" || true
pgrep -a -f "celery.*beat"   || true
# Ör: kill -TERM <PID>

# tmux ile başlattıysan / if started via tmux
tmux ls || true
tmux kill-session -t celery-w || true
tmux kill-session -t celery-b || true

# screen kullandıysan / if using screen
screen -ls || true
# screen -S <name|id> -X quit
```

## İzinler ve socket erişimi / Permissions and socket access

```bash
# Gunicorn socket dosyası nginx tarafından erişilebilir olmalı
sudo usermod -aG www-data sanayicin           # sanayicin kullanıcısını www-data grubuna ekle
sudo chgrp -R www-data /var/www/sanayicin/backend
sudo chmod -R 750 /var/www/sanayicin/backend

# Beklenen socket izinleri (gunicorn UMask=0007 ile 660 üretir)
ls -l /var/www/sanayicin/backend/backend.sock
```

## Ortam değişkenleri / Environment

```bash
# Backend systemd servisinde zaten setli:
# Environment="DJANGO_SETTINGS_MODULE=main.settings_production"
# PATH venv: Environment="PATH=/var/www/sanayicin/backend/venv/bin"

# İstersen env dosyası ile yönet / Optionally use EnvironmentFile
# /etc/systemd/system/backend.service içine ekleyebilirsin:
# EnvironmentFile=/var/www/sanayicin/backend/.env
```

## Redis ve sağlık kontrolleri / Redis and health checks

```bash
# Redis durumu / status
systemctl status redis-server || systemctl status redis
redis-cli ping

# HTTP sağlık
curl -sI https://test.sanayicin.com/ | grep -i x-robots-tag
curl -I  https://test.sanayicin.com/admin/
curl -I  https://test.sanayicin.com/api/
curl -s  https://test.sanayicin.com/robots.txt
```

## Eski Celery servislerini devre dışı bırakma (tek birleşik servis kullanıyorsan)

```bash
sudo systemctl disable --now celery.service celery-beat.service
# (opsiyonel) combined servis ekleyeceksen burada enable/start et
```

## Hızlı sağlık kontrolleri / Quick health checks

```bash
curl -sI https://test.sanayicin.com/ | grep -i x-robots-tag
curl -I  https://test.sanayicin.com/admin/
curl -I  https://test.sanayicin.com/api/
curl -s  https://test.sanayicin.com/robots.txt
```
