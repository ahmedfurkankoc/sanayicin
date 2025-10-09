### 🚀 Test Domain Deployment (test.sanayicin.com)

Bu doküman canlıda kurulu stack’i, kullanılan servis/paketleri ve yapılan yapılandırmaları özetler. Prod ortam Ubuntu + Nginx ile çalışmaktadır.

## 📦 Kullanılan Bileşenler (Server-Side)
- Nginx (reverse proxy)
- Django 5 (REST: DRF + SimpleJWT)
- ASGI: Daphne 4 (WebSocket)
- Channels 4 + channels-redis 4 (real‑time channel layer)
- Redis (Docker container: `sanayicin-redis`)
- WSGI (REST için): Gunicorn (unix socket: `/var/www/sanayicin/backend/backend.sock`)
- Veritabanı: SQLite (geçici; prod için Postgres önerilir)

## 🧱 Önemli Python Paketleri (requirements)
- djangorestframework==3.16.0
- djangorestframework_simplejwt==5.5.1
- channels==4.1.0, channels-redis==4.2.0, daphne==4.1.2
- redis==5.0.1
- django-cors-headers==4.7.0

## 🔧 Backend Yapılandırması (özet)
- `backend/backend/settings.py`
  - `INSTALLED_APPS += ['chat']`
  - `ASGI_APPLICATION = 'main.asgi.application'`
  - `CHANNEL_LAYERS` Redis’e ayarlı: `redis://127.0.0.1:6379`
  - CORS: `CORS_ALLOW_HEADERS` içine `x-guest-token` eklendi (guest chat için)
- `backend/backend/asgi.py`
  - Import sırası düzeltildi: `get_asgi_application()` çağırıldıktan sonra `ChatConsumer` import edilir
  - WS route: `ws/chat/<conversation_id>/`
- `backend/chat/`
  - REST: guest başlatma, konuşma oluşturma/listeme, mesaj listesi/gönderme, okundu
  - WS: `ChatConsumer` (message.new, typing, JWT/guest auth)
  - REST ile gönderilen mesajlar WS grubuna da publish edilir (anında görünür)

## ⚙️ Systemd: Daphne Servisi
`/etc/systemd/system/daphne.service`
```ini
[Unit]
Description=Daphne ASGI
After=network.target

[Service]
User=www-data
Group=www-data
WorkingDirectory=/var/www/sanayicin/backend
ExecStart=/var/www/sanayicin/backend/venv/bin/daphne -b 127.0.0.1 -p 8001 main.asgi:application
Restart=always

[Install]
WantedBy=multi-user.target
```
Komutlar:
```bash
sudo systemctl daemon-reload
sudo systemctl enable daphne
sudo systemctl restart daphne
sudo systemctl status daphne --no-pager
```

## 🌐 Nginx Konfigürasyonu (kritik bloklar)
`/etc/nginx/sites-available/test.sanayicin.com`
```nginx
map $http_upgrade $connection_upgrade { default upgrade; '' close; }

server {
  server_name test.sanayicin.com;

  # REST (Gunicorn, unix socket)
  location /api/ {
    proxy_pass http://unix:/var/www/sanayicin/backend/backend.sock;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }

  # WebSocket → Daphne
  location ^~ /ws/ {
    proxy_pass http://127.0.0.1:8001;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection $connection_upgrade;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_read_timeout 600s;
    proxy_send_timeout 600s;
    proxy_buffering off;
  }

  # Next.js
  location / {
    proxy_pass http://127.0.0.1:3000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection $connection_upgrade;
    proxy_set_header Host $host;
    proxy_cache_bypass $http_upgrade;
  }

  location /media/ {
    alias /var/www/sanayicin/media/;
    expires 30d;
    add_header Cache-Control "public, immutable";
  }
}
```

### Nginx Dosya Yolları ve Komutlar
- Site config: `/etc/nginx/sites-available/test.sanayicin.com`
- Etkin link: `/etc/nginx/sites-enabled/test.sanayicin.com`
- Test & reload:
```bash
sudo nginx -t && sudo systemctl reload nginx
sudo systemctl status nginx --no-pager
```
- Loglar:
```bash
sudo tail -f /var/log/nginx/access.log /var/log/nginx/error.log
```

## 🧩 Frontend Ortam Değişkenleri
`frontend/.env.production`
```env
NEXT_PUBLIC_API_URL=https://test.sanayicin.com/api
NEXT_PUBLIC_WS_URL=wss://test.sanayicin.com
```

## ▶️ Frontend Çalıştırma (PM2 / Production)
```bash
cd /var/www/sanayicin/frontend

# Bağımlılıklar (deploy sonrası)
NODE_ENV=production npm ci

# Build
NODE_ENV=production npm run build

# PM2 ile başlat (ilk sefer)
pm2 start npm --name "frontend" -- start

# PM2 yönetimi
pm2 status
pm2 logs frontend --lines 200
pm2 restart frontend
pm2 save
pm2 startup systemd   # Çıktıdaki komutu bir kez çalıştır
```

## 🧰 Redis (Ubuntu Servis)
- Kanal katmanı `settings.py` → `CHANNEL_LAYERS` Redis URL: `redis://127.0.0.1:6379`
- Durum kontrolü (daemon adı dağıtıma göre `redis-server` veya `redis` olabilir):
```bash
sudo systemctl status redis-server || sudo systemctl status redis
```
- Port ve proses kontrolü:
```bash
ss -ltnp | grep 6379
ps aux | grep redis-server
```
- Ping testi:
```bash
redis-cli -h 127.0.0.1 -p 6379 ping   # PONG beklenir
```
- Yeniden başlat / enable:
```bash
sudo systemctl restart redis-server
sudo systemctl enable redis-server
```
- Konfig dosyası (örn.): `/etc/redis/redis.conf`
- Kurulum (yüklü değilse):
```bash
sudo apt update && sudo apt install -y redis-server
```

## 🏃 Celery (Worker) Kurulumu

### Geçici / Hızlı Çalıştırma (mevcut kullanım)
```bash
cd /var/www/sanayicin/backend
nohup celery -A backend worker -l info > celery.log 2>&1 &
tail -f celery.log
```

### Önerilen Kalıcı Kurulum (systemd)
Broker ve backend olarak Redis kullanın; `.env` içine ekleyin:
```env
CELERY_BROKER_URL=redis://127.0.0.1:6379/0
CELERY_RESULT_BACKEND=redis://127.0.0.1:6379/1
```

Servis dosyaları (Ubuntu):
`/etc/systemd/system/celery.service`
```ini
[Unit]
Description=Celery Worker
After=network.target redis-server.service

[Service]
Type=simple
User=www-data
Group=www-data
WorkingDirectory=/var/www/sanayicin/backend
EnvironmentFile=-/var/www/sanayicin/backend/.env
ExecStart=/var/www/sanayicin/backend/venv/bin/celery -A backend worker -l info --concurrency=2 --queues=default
Restart=always

[Install]
WantedBy=multi-user.target
```

`/etc/systemd/system/celery-beat.service` (opsiyonel zamanlayıcı)
```ini
[Unit]
Description=Celery Beat Scheduler
After=network.target redis-server.service

[Service]
Type=simple
User=www-data
Group=www-data
WorkingDirectory=/var/www/sanayicin/backend
EnvironmentFile=-/var/www/sanayicin/backend/.env
ExecStart=/var/www/sanayicin/backend/venv/bin/celery -A backend beat -l info
Restart=always

[Install]
WantedBy=multi-user.target
```

Komutlar:
```bash
sudo systemctl daemon-reload
sudo systemctl enable celery celery-beat
sudo systemctl restart celery celery-beat
sudo systemctl status celery --no-pager
sudo journalctl -u celery -f
```

Notlar:
- Prod’da `backend/backend/settings.py` içindeki geçici Celery dev ayarlarını (memory broker) `.env` ile override edin.
- Log rotasyonu için systemd/journal veya `/etc/logrotate.d/celery` kuralı eklenebilir.
- Kaynaklara göre `--concurrency`/`--autoscale` ayarlanabilir (ör. `--autoscale=4,1`).

## 🗄️ Veritabanı Notu (SQLite → Postgres önerisi)
- SQLite geçici kullanım içindir. Daphne/gunicorn ile eşzamanlı yazımlarda izin/kilit sorunları yaşanabilir.
- En azından izinler düzeltilmelidir:
```bash
sudo chown -R www-data:www-data /var/www/sanayicin/backend
sudo chmod 775 /var/www/sanayicin/backend
sudo chmod 664 /var/www/sanayicin/backend/db.sqlite3
```
- Orta vadede Postgres’e geçiş önerilir (DATABASE_URL kullanımı).

## 🔎 Smoke Testler
REST (guest başlat → konuşma oluştur → mesaj gönder):
```bash
curl -s -X POST https://test.sanayicin.com/api/chat/guest/start -H 'Content-Type: application/json'
export GUEST=eyJ... # üstte dönen token
curl -s -X POST https://test.sanayicin.com/api/chat/conversations/ \
  -H "X-Guest-Token: $GUEST" -H 'Content-Type: application/json' \
  -d '{"vendor_id": 1}'
curl -s -X POST https://test.sanayicin.com/api/chat/conversations/1/messages \
  -H "X-Guest-Token: $GUEST" -H 'Content-Type: application/json' \
  -d '{"content":"merhaba"}'
```
WS (tarayıcı Network → WS):
- URL: `wss://test.sanayicin.com/ws/chat/<id>/?guest=<token>` veya `?token=<jwt>`
- Status: 101, Frames: `message.new`, `typing`

## ✅ Yapılan Başlıca Değişiklikler
- Chat uygulaması eklendi (REST + WebSocket, guest desteği)
- Django Channels/Daphne/Redis entegrasyonu (ASGI + channel layer)
- `asgi.py` import sırası düzeltildi (WS route yüklenmeme sorunu çözüldü)
- Nginx’e `/ws/` upgrade proxy eklendi
- CORS’a `X-Guest-Token` izni eklendi
- Frontend’e `ChatWSClient`, müşteri/esnaf chat sayfaları ve env değişkenleri eklendi
- Typing göstergesi ve REST→WS publish ile anlık görünürlük sağlandı

## 🧰 Troubleshooting Hızlı Rehber
- WS 1006 (bağlantı kapanıyor): Daphne çalışmıyor veya Nginx’te `/ws/` yok → systemd + Nginx conf kontrol.
- `No route found for path 'ws/chat/…'`: `backend/backend/asgi.py` WS pattern yüklenmemiş → dosyayı kontrol et, daphne’yi restart et.
- 500 `attempt to write a readonly database`: SQLite izinleri → `chown/chmod` uygula; Postgres’e geçiş planla.
- CORS preflight hatası (X-Guest-Token): `CORS_ALLOW_HEADERS` içinde `x-guest-token` olduğundan emin ol.

---
Bu dosya, test ortamında yapılan kurulumun kalıcı hafızasıdır; yeni değişikliklerde güncellenmelidir.