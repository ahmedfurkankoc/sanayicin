# Docker Deployment Guide - Sanayicin

Bu dokümantasyon, Sanayicin projesini Docker ile sıfır bir Ubuntu sunucusuna kurmak için gereken tüm adımları içerir.

## 📋 Gereksinimler

- Ubuntu 20.04+ (sıfır kurulum)
- Root olmayan bir kullanıcı (sudo yetkisi ile)
- 2 CPU çekirdeği
- 8 GB RAM
- 100 GB disk alanı

## 🚀 Hızlı Başlangıç

### 0. Private Repository'den Projeyi Çekme

**Otomatik Kurulum:**
```bash
# Git setup script'ini çalıştırın
bash scripts/setup-git.sh
```

**Manuel Kurulum:**
```bash
# Token'ı environment variable olarak ayarlayın
# Token'ı environment variable olarak ayarlayın
export GITHUB_TOKEN=your-github-token-here

# Repository'yi klonlayın
git clone https://${GITHUB_TOKEN}@github.com/username/sanayicin.git
cd sanayicin
```

**Not:** `setup-git.sh` script'i token'ı otomatik olarak yapılandırır.

### 1. Sunucu Kurulumu

Sunucuya SSH ile bağlanın ve aşağıdaki komutu çalıştırın:

```bash
# Eğer henüz klonlamadıysanız, yukarıdaki adımları takip edin
# Proje dizinine gidin
cd sanayicin

# Sunucu kurulumunu başlatın
bash scripts/setup-server.sh
```

Bu script şunları yapar:
- Sistem güncellemeleri
- Docker ve Docker Compose kurulumu
- fail2ban ve UFW güvenlik kurulumu
- Gerekli dizinlerin oluşturulması

**ÖNEMLİ:** Script tamamlandıktan sonra, Docker grubuna eklendiyseniz:
```bash
newgrp docker
# veya oturumu kapatıp tekrar açın
```

### 2. Secret Dosyalarını Hazırlayın

Secret dosyalarını manuel olarak oluşturmanız gerekmektedir. `docker/secrets/` dizininde aşağıdaki dosyaları oluşturun:

```bash
# Secrets dizinine gidin
cd docker/secrets

# Her bir secret dosyasını oluşturun ve doldurun
nano django_secret_key.txt          # backend/.env'den DJANGO_SECRET_KEY
nano postgres_db.txt                # Veritabanı adı (örn: sanayicin_db)
nano postgres_user.txt              # PostgreSQL kullanıcı adı (örn: sanayicin_user)
nano postgres_password.txt          # PostgreSQL şifresi (güvenli bir şifre)
nano redis_password.txt             # Redis şifresi (güvenli bir şifre)
nano resend_api_key.txt             # backend/.env'den RESEND_API_KEY
nano hostinger_api_key.txt          # backend/.env'den HOSTINGER_API_KEY
nano iletimerkezi_api_key.txt       # backend/.env'den ILETIMERKEZI_API_KEY
nano iletimerkezi_api_hash.txt      # backend/.env'den ILETIMERKEZI_API_HASH

# İzinleri ayarlayın
chmod 600 *.txt
```

**Örnek değerler:**
- `django_secret_key.txt`: `backend/.env` dosyasındaki `DJANGO_SECRET_KEY` değeri
- `postgres_db.txt`: `sanayicin_db`
- `postgres_user.txt`: `sanayicin_user`
- `postgres_password.txt`: Güvenli bir şifre (minimum 20 karakter)
- `redis_password.txt`: Güvenli bir şifre (minimum 20 karakter)
- `resend_api_key.txt`: `backend/.env` dosyasındaki `RESEND_API_KEY` değeri
- `hostinger_api_key.txt`: `backend/.env` dosyasındaki `HOSTINGER_API_KEY` değeri
- `iletimerkezi_api_key.txt`: `backend/.env` dosyasındaki `ILETIMERKEZI_API_KEY` değeri
- `iletimerkezi_api_hash.txt`: `backend/.env` dosyasındaki `ILETIMERKEZI_API_HASH` değeri

**Not:** Eğer `.env` dosyalarınız yoksa, `env.example` dosyalarını kopyalayıp doldurun:
```bash
cp backend/env.example backend/.env
cp frontend/env.example frontend/.env
cp admin/env.example admin/.env
# Her dosyayı düzenleyip gerçek değerlerle doldurun
```

### 3. Deployment

```bash
# Proje dizinine dönün
cd ../..

# Tek komutla deployment
bash scripts/deploy.sh
```

Bu script şunları yapar:
- Docker imajlarını oluşturur
- Konteynerleri başlatır
- Veritabanı migration'larını çalıştırır
- Static dosyaları toplar

### 4. Superuser Oluşturma

```bash
docker compose exec backend python manage.py createsuperuser
```

## 🔒 Güvenlik Özellikleri

### Non-Root Kullanıcılar

Tüm konteynerler non-root kullanıcılar ile çalışır:
- **Backend**: `appuser` (UID 1000)
- **Frontend/Admin**: `nextjs` (UID 1001)
- **Nginx**: `nginx` (UID 101)
- **PostgreSQL**: `postgres` (UID 999)
- **Redis**: `redis` (UID 999)

### Network İzolasyonu

- **backend_network**: Backend servisleri (PostgreSQL, Redis, Django, Celery)
- **default**: Frontend servisleri (Frontend, Admin, Nginx)
- Nginx hem default hem de backend_network'e bağlıdır

### Docker Secrets

Tüm hassas bilgiler Docker secrets kullanılarak yönetilir:
- Django SECRET_KEY

**⚠️ ÖNEMLİ GÜVENLİK NOTLARI:**
- Secret dosyaları **SİLİNMEZ** - Docker Compose bunları kullanır
- Dosya izinleri `600` olmalı (sadece sahibi okuyabilir)
- Bu dosyalar `.gitignore` ile korunmaktadır
- **ASLA** git'e commit etmeyin!
- Sunucu güvenliği kritik öneme sahiptir
- Detaylar için: `docker/secrets/.security.md`
- PostgreSQL credentials
- Redis password
- API keys

### Güvenlik Önlemleri

- `no-new-privileges: true` - Konteynerlerin yeni yetkiler kazanmasını engeller
- `read_only: true` - Dosya sistemi salt okunur (gerekli yerler tmpfs ile)
- fail2ban - Brute force saldırılarına karşı koruma
- UFW - Firewall yapılandırması
- Rate limiting - NGINX seviyesinde

## 📊 Servisler

### Backend (Django)
- Port: 8000 (sadece backend_network içinde)
- Health check: `http://backend:8000/api/health/`

### Frontend (Next.js)
- Port: 3000 (sadece default network içinde)
- Public URL: `https://test.sanayicin.com`

### Admin Panel (Next.js)
- Port: 3001 (sadece default network içinde)
- Public URL: `https://admin.sanayicin.com`

### Nginx
- Port: 80, 443 (public)
- Reverse proxy ve SSL termination

### PostgreSQL
- Port: 5432 (sadece backend_network içinde)
- Database: `sanayicin_db`

### Redis
- Port: 6379 (sadece backend_network içinde)
- Password protected

### Celery
- Worker ve Beat servisleri
- Redis broker kullanır

## 🔧 Yönetim Komutları

### Logları Görüntüleme

```bash
# Tüm servisler
docker compose logs -f

# Belirli bir servis
docker compose logs -f backend
docker compose logs -f nginx
```

### Servisleri Durdurma/Başlatma

```bash
# Durdur
docker compose down

# Başlat
docker compose up -d

# Yeniden başlat
docker compose restart backend
```

### Veritabanı İşlemleri

```bash
# Migration çalıştırma
docker compose exec backend python manage.py migrate

# Superuser oluşturma
docker compose exec backend python manage.py createsuperuser

# Shell erişimi
docker compose exec backend python manage.py shell
```

### Backup

```bash
# PostgreSQL backup
docker compose exec postgres pg_dump -U sanayicin_user sanayicin_db > backup.sql

# Restore
docker compose exec -T postgres psql -U sanayicin_user sanayicin_db < backup.sql
```

## 🐛 Sorun Giderme

### Konteynerler Başlamıyor

```bash
# Logları kontrol edin
docker compose logs

# Konteyner durumunu kontrol edin
docker compose ps

# Secret dosyalarını kontrol edin
ls -la docker/secrets/
```

### Veritabanı Bağlantı Hatası

```bash
# PostgreSQL'in çalıştığını kontrol edin
docker compose exec postgres pg_isready

# Bağlantıyı test edin
docker compose exec backend python manage.py dbshell
```

### Permission Hataları

```bash
# Secret dosya izinlerini kontrol edin
chmod 600 docker/secrets/*.txt

# Volume izinlerini kontrol edin
docker compose exec backend ls -la /app
```

## 📝 CI/CD

Github Actions pipeline otomatik olarak şunları kontrol eder:
- Dockerfile güvenlik kontrolleri
- Non-root kullanıcı kullanımı
- Next.js CVE-2025-55182 versiyon kontrolü
- Güvenlik açığı taraması (Trivy)

Pipeline her push ve PR'da çalışır, ayrıca günlük olarak schedule edilir.

## 🔄 Güncelleme

```bash
# En son kodu çekin
git pull

# Eğer private repo ise ve SSH key kullanıyorsanız, sorun yok
# Eğer token kullanıyorsanız ve hata alırsanız:
# git config credential.helper store
# git pull (token'ı tekrar girin)

# İmajları yeniden oluşturun
docker compose build --no-cache

# Servisleri yeniden başlatın
docker compose up -d

# Migration'ları çalıştırın
docker compose exec backend python manage.py migrate
```

### Git Credential Sorunları

Eğer `git pull` sırasında authentication hatası alırsanız:

**Token ile güncelleme:**
```bash
# Remote URL'i kontrol edin
git remote -v

# Token ile güncelleyin
git remote set-url origin https://${GITHUB_TOKEN}@github.com/username/sanayicin.git
```

## 📞 Destek

Sorun yaşarsanız:
1. Logları kontrol edin: `docker compose logs`
2. Konteyner durumunu kontrol edin: `docker compose ps`
3. Health check endpoint'lerini test edin
4. Secret dosyalarını kontrol edin

