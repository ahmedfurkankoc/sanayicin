# Sanayicin - Yüksek Trafik Planı

## Proje Hedefi
Bu proje, binlerce eş zamanlı kullanıcının anlık mesajlaşma yapabileceği, yüksek trafikli bir esnaf-müşteri platformu olarak tasarlanmıştır.

## Mevcut Durum Analizi
- **Frontend**: Next.js (React) - Statik sayfa üretimi ve API rotaları
- **Backend**: Django + Django Channels (WebSocket desteği)
- **Veritabanı**: SQLite (geliştirme)
- **Cache**: Yerel bellek cache (geliştirme)
- **Message Queue**: Celery + bellek broker (geliştirme)
- **WebSocket**: Django Channels + Redis channel layer

## Gerekli Değişiklikler

### 1. Veritabanı
- **SQLite → PostgreSQL**: Eş zamanlı bağlantı desteği
- **Connection Pooling**: pgBouncer ile bağlantı yönetimi
- **Indexing**: Mesaj ve konuşma tabloları için optimize edilmiş indeksler

### 2. Redis
- **Cache Backend**: Django cache için Redis
- **Channel Layer**: WebSocket için Redis
- **Session Storage**: Kullanıcı oturumları için Redis
- **Rate Limiting**: API rate limiting için Redis

### 3. WebSocket
- **Load Balancing**: Birden fazla Django instance arasında WebSocket dağıtımı
- **Connection Management**: Bağlantı sayısı ve bellek optimizasyonu
- **Message Persistence**: Redis'te mesaj geçici saklama

### 4. Message Queue
- **Celery**: Redis broker ile
- **Worker Scaling**: Birden fazla Celery worker
- **Task Monitoring**: Flower ile Celery izleme

### 5. Monitoring & Logging
- **Prometheus + Grafana**: Sistem metrikleri
- **ELK Stack**: Log analizi
- **Health Checks**: Sistem sağlık kontrolleri

## Teknik Uygulama Aşamaları

### Faz 1: Altyapı Kurulumu (Ubuntu)
1. PostgreSQL kurulumu ve konfigürasyonu
2. Redis kurulumu ve konfigürasyonu
3. Nginx kurulumu ve load balancer konfigürasyonu
4. Systemd servisleri kurulumu

### Faz 2: Django Optimizasyonu
1. Production settings konfigürasyonu
2. Database connection pooling
3. Redis cache entegrasyonu
4. Celery worker konfigürasyonu

### Faz 3: WebSocket Scaling
1. Django Channels Redis entegrasyonu
2. Load balancer WebSocket konfigürasyonu
3. Connection limitleri ve timeout ayarları

### Faz 4: Monitoring & Testing
1. Prometheus + Grafana kurulumu
2. Load testing (Apache Bench, wrk)
3. Performance tuning

## Dosya Yapısı
```
sanayicin/
├── backend/
│   ├── settings_production.py
│   ├── celery.py
│   └── requirements_production.txt
├── systemd/
│   ├── sanayicin-backend.service
│   ├── sanayicin-celery.service
│   └── sanayicin-celerybeat.service
├── nginx/
│   └── sanayicin.conf
├── monitoring/
│   ├── prometheus.yml
│   └── grafana/
└── scripts/
    ├── deploy.sh
    └── backup.sh
```

## Sistem Kurulumu (Ubuntu)

### PostgreSQL Kurulumu (Ubuntu 22.04+)
```bash
# Sistem güncellemesi
sudo apt update && sudo apt upgrade -y

# PostgreSQL kurulumu
sudo apt install postgresql postgresql-contrib postgresql-client -y

# PostgreSQL servisini başlat
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Veritabanı ve kullanıcı oluştur
sudo -u postgres psql -c "CREATE DATABASE sanayicin;"
sudo -u postgres psql -c "CREATE USER sanayicin WITH PASSWORD 'your_secure_password';"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE sanayicin TO sanayicin;"
sudo -u postgres psql -c "ALTER USER sanayicin CREATEDB;"

# pgBouncer kurulumu (connection pooling için)
sudo apt install pgbouncer -y

# pgBouncer konfigürasyonu
sudo nano /etc/pgbouncer/pgbouncer.ini
```

pgBouncer konfigürasyonu:
```ini
[databases]
sanayicin = host=127.0.0.1 port=5432 dbname=sanayicin

[pgbouncer]
listen_port = 6432
listen_addr = 127.0.0.1
auth_type = md5
auth_file = /etc/pgbouncer/userlist.txt
pool_mode = transaction
max_client_conn = 1000
default_pool_size = 20
```

### Redis Kurulumu (Ubuntu)
```bash
# Redis kurulumu
sudo apt install redis-server -y

# Redis konfigürasyonu
sudo nano /etc/redis/redis.conf
```

Redis konfigürasyonu:
```conf
# Güvenlik
bind 127.0.0.1
protected-mode yes
requirepass your_redis_password

# Performans
maxmemory 512mb
maxmemory-policy allkeys-lru
save 900 1
save 300 10
save 60 10000

# Persistence
appendonly yes
appendfsync everysec
```

```bash
# Redis servisini yeniden başlat
sudo systemctl restart redis-server
sudo systemctl enable redis-server

# Redis test
redis-cli -a your_redis_password ping
```

### Nginx Kurulumu (Ubuntu)
```bash
# Nginx kurulumu
sudo apt install nginx -y

# Nginx konfigürasyonu
sudo nano /etc/nginx/sites-available/sanayicin
```

Nginx konfigürasyonu:
```nginx
upstream backend {
    server 127.0.0.1:8000;
    server 127.0.0.1:8001;
    server 127.0.0.1:8002;
    sticky;
}

upstream websocket {
    server 127.0.0.1:8000;
    server 127.0.0.1:8001;
    server 127.0.0.1:8002;
    sticky;
}

server {
    listen 80;
    server_name sanayicin.com;
    
    # Gzip sıkıştırma
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;
    
    location / {
        proxy_pass http://backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Timeout ayarları
        proxy_connect_timeout 30s;
        proxy_send_timeout 30s;
        proxy_read_timeout 30s;
    }
    
    location /ws/ {
        proxy_pass http://websocket;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # WebSocket timeout ayarları
        proxy_read_timeout 86400;
        proxy_send_timeout 86400;
    }
    
    # Static dosyalar için
    location /static/ {
        alias /var/www/sanayicin/static/;
        expires 1y;
        add_header Cache-Control "public, immutable";
        add_header X-Content-Type-Options nosniff;
    }
    
    # Media dosyalar için
    location /media/ {
        alias /var/www/sanayicin/media/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
}
```

```bash
# Site'ı etkinleştir
sudo ln -s /etc/nginx/sites-available/sanayicin /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default

# Nginx syntax kontrolü
sudo nginx -t

# Nginx servisini yeniden başlat
sudo systemctl restart nginx
sudo systemctl enable nginx
```

### Systemd Servisleri

#### Django Backend Servisi
```bash
sudo nano /etc/systemd/system/sanayicin-backend.service
```

```ini
[Unit]
Description=Sanayicin Django Backend
After=network.target postgresql.service redis.service
Wants=postgresql.service redis.service

[Service]
Type=simple
User=www-data
Group=www-data
WorkingDirectory=/var/www/sanayicin/backend
Environment=PATH=/var/www/sanayicin/backend/venv/bin
Environment=DJANGO_SETTINGS_MODULE=backend.settings_production
Environment=PYTHONPATH=/var/www/sanayicin/backend
ExecStart=/var/www/sanayicin/backend/venv/bin/gunicorn --workers 3 --bind 0.0.0.0:8000 --worker-class gevent --worker-connections 1000 backend.asgi:application
ExecReload=/bin/kill -s HUP $MAINPID
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal
SyslogIdentifier=sanayicin-backend

# Resource limits
LimitNOFILE=65536
LimitNPROC=4096

[Install]
WantedBy=multi-user.target
```

#### Celery Worker Servisi
```bash
sudo nano /etc/systemd/system/sanayicin-celery.service
```

```ini
[Unit]
Description=Sanayicin Celery Worker
After=network.target redis.service
Wants=redis.service

[Service]
Type=simple
User=www-data
Group=www-data
WorkingDirectory=/var/www/sanayicin/backend
Environment=PATH=/var/www/sanayicin/backend/venv/bin
Environment=DJANGO_SETTINGS_MODULE=backend.settings_production
Environment=C_FORCE_ROOT=true
ExecStart=/var/www/sanayicin/backend/venv/bin/celery -A backend worker --loglevel=info --concurrency=4 --max-tasks-per-child=1000
ExecReload=/bin/kill -s HUP $MAINPID
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal
SyslogIdentifier=sanayicin-celery

# Resource limits
LimitNOFILE=65536
LimitNPROC=4096

[Install]
WantedBy=multi-user.target
```

#### Celery Beat Servisi
```bash
sudo nano /etc/systemd/system/sanayicin-celerybeat.service
```

```ini
[Unit]
Description=Sanayicin Celery Beat
After=network.target redis.service
Wants=redis.service

[Service]
Type=simple
User=www-data
Group=www-data
WorkingDirectory=/var/www/sanayicin/backend
Environment=PATH=/var/www/sanayicin/backend/venv/bin
Environment=DJANGO_SETTINGS_MODULE=backend.settings_production
Environment=C_FORCE_ROOT=true
ExecStart=/var/www/sanayicin/backend/venv/bin/celery -A backend beat --loglevel=info
ExecReload=/bin/kill -s HUP $MAINPID
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal
SyslogIdentifier=sanayicin-celerybeat

[Install]
WantedBy=multi-user.target
```

### Servisleri Etkinleştirme
```bash
# Systemd reload
sudo systemctl daemon-reload

# Servisleri etkinleştir
sudo systemctl enable sanayicin-backend
sudo systemctl enable sanayicin-celery
sudo systemctl enable sanayicin-celerybeat

# Servisleri başlat
sudo systemctl start sanayicin-backend
sudo systemctl start sanayicin-celery
sudo systemctl start sanayicin-celerybeat

# Servis durumlarını kontrol et
sudo systemctl status sanayicin-backend
sudo systemctl status sanayicin-celery
sudo systemctl status sanayicin-celerybeat
```

### Gunicorn Kurulumu (Opsiyonel)
```bash
# Gunicorn kurulumu
sudo apt install python3-pip -y
sudo pip3 install gunicorn gevent

# Gunicorn konfigürasyonu
sudo nano /etc/systemd/system/sanayicin-gunicorn.service
```

## RAM Optimizasyonu

### PostgreSQL Memory Settings
```bash
sudo nano /etc/postgresql/15/main/postgresql.conf
```

```conf
# Memory Settings (8GB RAM için)
shared_buffers = 2GB                    # Total RAM'in %25'i
effective_cache_size = 6GB              # Total RAM'in %75'i
work_mem = 16MB                         # Her connection için
maintenance_work_mem = 256MB            # Maintenance işlemleri için
max_connections = 200                   # Maksimum bağlantı sayısı
checkpoint_completion_target = 0.9      # Checkpoint performansı
wal_buffers = 16MB                      # WAL buffer boyutu
random_page_cost = 1.1                  # SSD için optimize
effective_io_concurrency = 200          # SSD için optimize

# Connection pooling
max_prepared_transactions = 0           # pgBouncer kullanıyorsak
```

### Redis Memory Settings
```bash
sudo nano /etc/redis/redis.conf
```

```conf
# Memory Settings
maxmemory 2gb                           # Total RAM'in %25'i
maxmemory-policy allkeys-lru            # LRU eviction
maxmemory-samples 10                    # Eviction sample sayısı

# Persistence
save 900 1                              # 15 dakikada 1 değişiklik
save 300 10                             # 5 dakikada 10 değişiklik
save 60 10000                           # 1 dakikada 10000 değişiklik

# Network
tcp-keepalive 300                       # Keep-alive süresi
timeout 0                               # Client timeout
```

### Django Memory Settings
```python
# settings_production.py
CACHES = {
    'default': {
        'BACKEND': 'django.core.cache.backends.redis.RedisCache',
        'LOCATION': 'redis://127.0.0.1:6379/1',
        'OPTIONS': {
            'CLIENT_CLASS': 'django_redis.client.DefaultClient',
            'CONNECTION_POOL_KWARGS': {
                'max_connections': 50,
                'retry_on_timeout': True,
            }
        },
        'KEY_PREFIX': 'sanayicin',
        'TIMEOUT': 300,  # 5 dakika
    }
}

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': 'sanayicin',
        'USER': 'sanayicin',
        'PASSWORD': 'your_password',
        'HOST': '127.0.0.1',
        'PORT': '5432',
        'OPTIONS': {
            'MAX_CONNS': 20,  # Maksimum connection sayısı
            'MIN_CONNS': 5,   # Minimum connection sayısı
        }
    }
}

# Celery Settings
CELERY_BROKER_URL = 'redis://:your_redis_password@127.0.0.1:6379/0'
CELERY_RESULT_BACKEND = 'redis://:your_redis_password@127.0.0.1:6379/0'
CELERY_WORKER_CONCURRENCY = 4
CELERY_MAX_TASKS_PER_CHILD = 1000
CELERY_TASK_TIME_LIMIT = 30 * 60  # 30 dakika
CELERY_TASK_SOFT_TIME_LIMIT = 25 * 60  # 25 dakika

# Channels Settings
CHANNEL_LAYERS = {
    'default': {
        'BACKEND': 'channels_redis.core.RedisChannelLayer',
        'CONFIG': {
            "hosts": [('127.0.0.1', 6379)],
            "password": "your_redis_password",
            "capacity": 1500,  # Channel capacity
            "expiry": 10,      # Message expiry
        },
    },
}
```

## Performans Hedefleri
- **Response Time**: < 200ms (95th percentile)
- **WebSocket Latency**: < 100ms
- **Database Queries**: < 50ms
- **Concurrent Users**: 10,000+ eş zamanlı
- **Message Throughput**: 1000+ mesaj/saniye

## Kritik Noktalar
1. **WebSocket Connection Limits**: Her worker için maksimum bağlantı sayısı
2. **Database Connection Pooling**: pgBouncer ile bağlantı yönetimi
3. **Redis Memory Management**: LRU eviction ve memory limits
4. **Load Balancer Sticky Sessions**: WebSocket için session persistence
5. **Rate Limiting**: API ve WebSocket için rate limiting

## Test Senaryoları
1. **Load Testing**: Apache Bench, wrk ile HTTP endpoint testleri
2. **WebSocket Testing**: WebSocket load testing araçları
3. **Database Testing**: Connection pool ve query performance testleri
4. **Memory Testing**: Memory leak ve garbage collection testleri

## Gerekli Paketler (Ubuntu)
```bash
# Sistem paketleri
sudo apt install -y postgresql postgresql-contrib postgresql-client pgbouncer redis-server nginx python3-pip python3-venv monit

# Python paketleri (requirements_production.txt)
django==4.2.7
channels==4.0.0
channels-redis==4.1.0
celery==5.3.4
redis==5.0.1
psycopg2-binary==2.9.7
gunicorn==21.2.0
gevent==23.9.1
daphne==4.0.0
django-redis==5.4.0
```

## Tahmini Süre
- **Faz 1 (Altyapı)**: 2-3 gün
- **Faz 2 (Django)**: 1-2 gün
- **Faz 3 (WebSocket)**: 2-3 gün
- **Faz 4 (Testing)**: 1-2 gün
- **Toplam**: 6-10 gün

## Monitoring Kurulumu (Monit)

### Monit Kurulumu
```bash
sudo apt install monit -y
sudo systemctl start monit
sudo systemctl enable monit
```

### Monit Konfigürasyonu
```bash
sudo nano /etc/monit/monitrc
```

Monit konfigürasyonu:
```bash
# Monit ana konfigürasyonu
set daemon 30            # 30 saniyede bir kontrol
set logfile /var/log/monit.log
set idfile /var/lib/monit/id
set statefile /var/lib/monit/state

# Web arayüzü (opsiyonel)
set httpd port 2812
    allow admin:monit

# PostgreSQL kontrolü
check process postgresql with pidfile /var/run/postgresql/15-main.pid
    start program = "/usr/bin/systemctl start postgresql"
    stop program = "/usr/bin/systemctl stop postgresql"
    if failed host 127.0.0.1 port 5432 then restart
    if 5 restarts within 5 cycles then timeout

# Redis kontrolü
check process redis with pidfile /var/run/redis/redis-server.pid
    start program = "/usr/bin/systemctl start redis-server"
    stop program = "/usr/bin/systemctl stop redis-server"
    if failed host 127.0.0.1 port 6379 then restart
    if 5 restarts within 5 cycles then timeout

# Nginx kontrolü
check process nginx with pidfile /var/run/nginx.pid
    start program = "/usr/bin/systemctl start nginx"
    stop program = "/usr/bin/systemctl stop nginx"
    if failed host 127.0.0.1 port 80 then restart
    if 5 restarts within 5 cycles then timeout

# Django Backend kontrolü
check process sanayicin-backend with pidfile /var/run/sanayicin-backend.pid
    start program = "/usr/bin/systemctl start sanayicin-backend"
    stop program = "/usr/bin/systemctl stop sanayicin-backend"
    if failed host 127.0.0.1 port 8000 then restart
    if 5 restarts within 5 cycles then timeout

# Celery Worker kontrolü
check process sanayicin-celery with pidfile /var/run/sanayicin-celery.pid
    start program = "/usr/bin/systemctl start sanayicin-celery"
    stop program = "/usr/bin/systemctl stop sanayicin-celery"
    if 5 restarts within 5 cycles then timeout

# Celery Beat kontrolü
check process sanayicin-celerybeat with pidfile /var/run/sanayicin-celerybeat.pid
    start program = "/usr/bin/systemctl start sanayicin-celerybeat"
    stop program = "/usr/bin/systemctl stop sanayicin-celerybeat"
    if 5 restarts within 5 cycles then timeout

# Disk kullanımı kontrolü
check device rootfs with path /
    if space usage > 80% then alert

# RAM kullanımı kontrolü
check system $HOSTNAME
    if memory usage > 80% then alert
    if cpu usage > 90% then alert
```

Monit'i yeniden başlat:
```bash
sudo monit reload
sudo systemctl restart monit
```

### Monit Web Arayüzü
Monit web arayüzüne erişmek için:
```bash
# Güvenlik duvarında port aç
sudo ufw allow 2812

# Web arayüzüne erişim
http://sunucu_ip:2812
Kullanıcı adı: admin
Şifre: monit
```

## Backup ve Recovery
```bash
# PostgreSQL backup script
#!/bin/bash
BACKUP_DIR="/var/backups/postgresql"
DATE=$(date +%Y%m%d_%H%M%S)
DB_NAME="sanayicin"

mkdir -p $BACKUP_DIR
pg_dump -h localhost -U sanayicin $DB_NAME > $BACKUP_DIR/${DB_NAME}_${DATE}.sql

# 7 günden eski backup'ları sil
find $BACKUP_DIR -name "*.sql" -mtime +7 -delete
```

## Güvenlik Önlemleri
1. **Firewall**: UFW ile port kısıtlamaları
2. **SSL/TLS**: Let's Encrypt ile HTTPS
3. **Rate Limiting**: Nginx ve Django ile rate limiting
4. **Input Validation**: Django form ve serializer validation
5. **SQL Injection**: Django ORM kullanımı
6. **XSS Protection**: Content Security Policy headers
