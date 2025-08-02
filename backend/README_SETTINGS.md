# Django Settings Kullanımı

Bu proje 2 farklı settings dosyası kullanıyor: `settings.py` (development) ve `settings_production.py` (production).

## Settings Dosyaları

### Development Settings (`settings.py`)
- ✅ Debug açık
- ✅ SQLite database
- ✅ LocMemCache
- ✅ Console logging
- ✅ SMTP email
- ✅ Yüksek rate limits
- ✅ Uzun JWT süreleri
- ✅ SSL/HTTPS kapalı

### Production Settings (`settings_production.py`)
- ❌ Debug kapalı
- ✅ PostgreSQL database
- ✅ Redis cache
- ✅ File logging
- ✅ SMTP email
- ✅ Düşük rate limits
- ✅ Kısa JWT süreleri
- ✅ SSL/HTTPS zorunlu

## Environment Değişkenleri

### Development (varsayılan)
```bash
# Gerekli değil, varsayılan değerler kullanılır
export DJANGO_SECRET_KEY=your_secure_key  # Opsiyonel
export RESEND_API_KEY=your_api_key        # Opsiyonel
```

### Production
```bash
# Zorunlu
export DJANGO_SECRET_KEY=your_secure_secret_key_here
export RESEND_API_KEY=your_resend_api_key_here

# Database
export DB_NAME=sanayicin_db
export DB_USER=sanayicin_user
export DB_PASSWORD=your_secure_password_here
export DB_HOST=localhost
export DB_PORT=5432

# Cache
export REDIS_URL=redis://127.0.0.1:6379/1
```

## Kullanım Örnekleri

### Development
```bash
# Varsayılan olarak settings.py kullanılır
python manage.py runserver
```

### Production
```bash
# Production settings kullan
export DJANGO_SETTINGS_MODULE=backend.settings_production
export DJANGO_SECRET_KEY=your_secure_key
export DB_PASSWORD=your_db_password
export RESEND_API_KEY=your_api_key
python manage.py runserver
```

## Settings Karşılaştırması

| Özellik | Development | Production |
|---------|-------------|------------|
| **Debug** | ✅ `True` | ❌ `False` |
| **Database** | SQLite | PostgreSQL |
| **Cache** | LocMemCache | Redis |
| **Logging** | Console | File |
| **Rate Limits** | 1000/hour | 100/hour |
| **JWT Access** | 1 saat | 15 dakika |
| **JWT Refresh** | 30 gün | 7 gün |
| **SSL/HTTPS** | ❌ Kapalı | ✅ Zorunlu |
| **Secret Key** | Fallback | Environment |

## Dosya Yapısı

```
backend/
├── backend/
│   ├── settings.py              # ✅ Development settings
│   ├── settings_production.py   # ✅ Production settings
│   ├── wsgi.py                  # ✅ WSGI config
│   ├── asgi.py                  # ✅ ASGI config
│   └── urls.py                  # ✅ URL config
├── manage.py                    # ✅ Django management
└── README_SETTINGS.md           # ✅ Bu dosya
```

## Önemli Notlar

1. **Development**: Varsayılan olarak `settings.py` kullanılır
2. **Production**: `DJANGO_SETTINGS_MODULE=backend.settings_production` gerekli
3. **Environment değişkenleri**: Production'da zorunlu
4. **Güvenlik**: Production'da mutlaka güvenli secret key kullanın
5. **Database**: Production'da PostgreSQL kullanın

## Test Etmek

### Development
```bash
cd backend
source venv/bin/activate
python manage.py runserver
```

### Production
```bash
cd backend
source venv/bin/activate
export DJANGO_SETTINGS_MODULE=backend.settings_production
export DJANGO_SECRET_KEY=your_secure_key
export DB_PASSWORD=your_db_password
export RESEND_API_KEY=your_api_key
python manage.py runserver
```

Artık 2 temiz settings dosyası var! 🎉 