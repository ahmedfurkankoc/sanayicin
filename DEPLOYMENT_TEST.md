# 🚀 Test Domain Deployment Guide

## 📋 Gereksinimler

- Python 3.8+
- Node.js 18+
- Nginx (opsiyonel)
- Domain: `test.sanayicin.com`

## 🔧 Backend Deployment

### 1. Sunucuya Bağlan
```bash
ssh user@your-server
```

### 2. Projeyi Klonla
```bash
git clone https://github.com/your-repo/sanayicin.git
cd sanayicin/backend
```

### 3. Virtual Environment Oluştur
```bash
python -m venv venv
source venv/bin/activate
```

### 4. Dependencies Yükle
```bash
pip install -r requirements.txt
```

### 5. Environment Variables
```bash
# .env dosyası oluştur
echo "DJANGO_SETTINGS_MODULE=backend.settings_test" > .env
echo "SECRET_KEY=your-secret-key" >> .env
echo "RESEND_API_KEY=your-resend-key" >> .env
```

### 6. Database Setup
```bash
python manage.py makemigrations
python manage.py migrate
python manage.py collectstatic --noinput
```

### 7. Superuser Oluştur
```bash
python manage.py createsuperuser
```

### 8. Server Başlat
```bash
# Development
python manage.py runserver 0.0.0.0:8000

# Production (Gunicorn)
gunicorn --bind 0.0.0.0:8000 backend.wsgi:application
```

## 🔧 Frontend Deployment

### 1. Projeye Git
```bash
cd ../frontend
```

### 2. Dependencies Yükle
```bash
npm install
```

### 3. Environment Variables
```bash
# .env.local dosyası oluştur
echo "NEXT_PUBLIC_API_URL=https://test.sanayicin.com/api" > .env.local
```

### 4. Build ve Başlat
```bash
# Development
npm run dev

# Production
npm run build
npm start
```

## 🌐 Nginx Setup (Opsiyonel)

### 1. Nginx Config Kopyala
```bash
sudo cp nginx_test.conf /etc/nginx/sites-available/test.sanayicin.com
sudo ln -s /etc/nginx/sites-available/test.sanayicin.com /etc/nginx/sites-enabled/
```

### 2. Nginx Restart
```bash
sudo nginx -t
sudo systemctl restart nginx
```

## 🔍 Test Et

### 1. Backend API Test
```bash
curl https://test.sanayicin.com/api/
```

### 2. Frontend Test
```bash
curl https://test.sanayicin.com/
```

### 3. Email Test
- Kayıt ol sayfasından test email gönder
- Console'da verification code'u kontrol et

## 🐛 Troubleshooting

### Port 8000/3000 Açık Değil
```bash
sudo ufw allow 8000
sudo ufw allow 3000
```

### Permission Hatası
```bash
sudo chown -R $USER:$USER /path/to/project
chmod +x deploy_test.sh
```

### Database Hatası
```bash
python manage.py migrate --run-syncdb
```

## 📞 Destek

Sorun yaşarsanız:
1. Log dosyalarını kontrol et
2. Django debug mode açık mı kontrol et
3. CORS ayarlarını kontrol et
4. Environment variables doğru mu kontrol et

## 🎯 Sonraki Adımlar

1. SSL sertifikası ekle (Let's Encrypt)
2. Database'i PostgreSQL'e geçir
3. Redis cache ekle
4. Monitoring ekle
5. Backup sistemi kur 