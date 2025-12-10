# API Versiyonlama Yapılandırması

## Genel Bakış

API artık **v1** versiyonlaması ile çalışıyor. Production'da `api.sanayicin.com` subdomain'i kullanılıyor.

## URL Yapısı

### Development
- **Backend**: `http://localhost:8000/api/v1/`
- **Frontend**: `http://localhost:8000/api/v1`

### Production
- **Backend**: `https://api.sanayicin.com/api/v1/`
- **Frontend**: `https://api.sanayicin.com/api/v1`

## Backend Yapılandırması

### Django URLs (`backend/main/urls.py`)
```python
urlpatterns = [
    path('admin/', admin.site.urls),
    # API v1 - Versioned API endpoints
    path('api/v1/', include('core.urls')),
    path('api/v1/vendors/', include('vendors.urls')),
    path('api/v1/chat/', include('chat.urls')),
    path('api/v1/admin/', include('admin_panel.urls')),
]
```

### Environment Variables (Backend)
```bash
# .env dosyasında
DJANGO_SECRET_KEY=your-secret-key
DEBUG=False
ALLOWED_HOSTS=api.sanayicin.com,sanayicin.com,www.sanayicin.com
```

## Frontend Yapılandırması

### Environment Variables (Frontend)
```bash
# .env.local veya .env.production
NEXT_PUBLIC_API_URL=https://api.sanayicin.com/api/v1
NEXT_PUBLIC_BASE_URL=https://api.sanayicin.com
NEXT_PUBLIC_WS_URL=wss://api.sanayicin.com
```

### Otomatik URL Yapılandırması
Frontend otomatik olarak `/v1` ekler:
- Eğer `NEXT_PUBLIC_API_URL` içinde `/v1` yoksa, otomatik eklenir
- Development'ta: `http://localhost:8000/api/v1`
- Production'da: `https://api.sanayicin.com/api/v1`

## Nginx Yapılandırması (Ubuntu Server)

### API Subdomain için Nginx Config
```nginx
# /etc/nginx/sites-available/api.sanayicin.com

server {
    listen 80;
    server_name api.sanayicin.com;
    
    # HTTP'den HTTPS'e yönlendir
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name api.sanayicin.com;

    # SSL Sertifikaları (Let's Encrypt)
    ssl_certificate /etc/letsencrypt/live/api.sanayicin.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.sanayicin.com/privkey.pem;
    
    # SSL Ayarları
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # Security Headers
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # Client body size limit (file uploads için)
    client_max_body_size 10M;

    # Static files (media)
    location /media/ {
        alias /path/to/backend/media/;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    # Static files (admin static)
    location /static/ {
        alias /path/to/backend/static/;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    # Django API - Gunicorn'a proxy
    location / {
        proxy_pass http://127.0.0.1:8000;  # Gunicorn port
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Host $server_name;
        
        # WebSocket support (chat için)
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
}
```

### Nginx'i Aktif Etme
```bash
# Config dosyasını aktif et
sudo ln -s /etc/nginx/sites-available/api.sanayicin.com /etc/nginx/sites-enabled/

# Nginx config test
sudo nginx -t

# Nginx'i yeniden başlat
sudo systemctl reload nginx
```

## SSL Sertifikası (Let's Encrypt)

```bash
# Certbot ile SSL sertifikası al
sudo certbot --nginx -d api.sanayicin.com

# Otomatik yenileme kontrolü
sudo certbot renew --dry-run
```

## Gunicorn Yapılandırması

### Systemd Service (`/etc/systemd/system/sanayicin-api.service`)
```ini
[Unit]
Description=Sanayicin API Gunicorn daemon
After=network.target

[Service]
User=www-data
Group=www-data
WorkingDirectory=/path/to/backend
Environment="PATH=/path/to/backend/venv/bin"
ExecStart=/path/to/backend/venv/bin/gunicorn \
    --workers 4 \
    --bind 127.0.0.1:8000 \
    --timeout 120 \
    --access-logfile /var/log/gunicorn/api-access.log \
    --error-logfile /var/log/gunicorn/api-error.log \
    main.wsgi:application

[Install]
WantedBy=multi-user.target
```

### Gunicorn'u Başlatma
```bash
# Service'i aktif et
sudo systemctl enable sanayicin-api
sudo systemctl start sanayicin-api

# Durum kontrolü
sudo systemctl status sanayicin-api

# Logları görüntüle
sudo journalctl -u sanayicin-api -f
```

## CORS Ayarları

### Production Settings (`backend/main/settings_production.py`)
```python
CORS_ALLOWED_ORIGINS = [
    "https://admin.sanayicin.com",
    "https://sanayicin.com",
    "https://www.sanayicin.com",
    "https://esnaf.sanayicin.com",
    # api.sanayicin.com CORS'a eklenmez (aynı origin)
]
```

## Test

### API Endpoint Test
```bash
# Health check
curl https://api.sanayicin.com/api/v1/auth/csrf/

# Login test
curl -X POST https://api.sanayicin.com/api/v1/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123"}'
```

## Gelecek Versiyonlar

v2 versiyonu eklenirken:
1. `backend/main/urls.py`'de `path('api/v2/', ...)` ekle
2. Frontend'de `NEXT_PUBLIC_API_VERSION=v2` environment variable ekle
3. v1 ve v2 paralel çalışabilir

## Notlar

- **Backward Compatibility**: Şu an için eski `/api/` endpoint'leri kaldırıldı
- **Media Files**: `/media/` endpoint'i versiyonlamadan bağımsız çalışır
- **Admin Panel**: `/admin/` endpoint'i versiyonlamadan bağımsız çalışır

