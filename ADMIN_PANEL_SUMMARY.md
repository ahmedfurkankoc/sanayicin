# Sanayicin Admin Panel - Backend & Frontend

## 📋 Tamamlanan İşlemler

### ✅ Frontend (admin/)
- **Next.js 15** projesi kuruldu
- **Temel layout** ve sidebar hazır
- **Dashboard** sayfası oluşturuldu
- **Users** sayfası oluşturuldu
- **Vendors** sayfası oluşturuldu
- **Tailwind CSS** ile responsive tasarım

### ✅ Backend (backend/admin_panel/)
- **admin_panel** app'i oluşturuldu
- **Modeller** oluşturuldu:
  - `BlogCategory` - Blog kategorileri
  - `BlogPost` - Blog yazıları
  - `SystemLog` - Sistem logları
  - `AnalyticsData` - Analitik veriler
  - `AdminNotification` - Admin bildirimleri
  - `AdminSettings` - Admin ayarları
- **Serializers** oluşturuldu (admin_panel/serializers.py)
- **Views** oluşturuldu (admin_panel/views.py)
- **URLs** yapılandırıldı (admin_panel/urls.py)
- Ana urls.py'ye `/api/admin/` endpoint'i eklendi

## 🎯 Mevcut Modeller (Backend)

### Core App (Zaten Var)
- `CustomUser` - Kullanıcılar
- `ServiceArea` - Hizmet alanları  
- `Category` - Kategoriler
- `CarBrand` - Araba markaları
- `SupportTicket` - Destek talepleri
- `SupportMessage` - Destek mesajları
- `Vehicle` - Araçlar
- `Favorite` - Favoriler

### Vendors App (Zaten Var)
- `VendorProfile` - Esnaf profilleri
- `Review` - Yorumlar
- `ServiceRequest` - Hizmet talepleri

### Admin Panel App (Yeni)
- `BlogCategory` - Blog kategorileri
- `BlogPost` - Blog yazıları
- `SystemLog` - Sistem logları
- `AnalyticsData` - Analitik veriler
- `AdminNotification` - Admin bildirimleri
- `AdminSettings` - Admin ayarları

## 🔗 API Endpoints (/api/admin/)

### Dashboard
- `GET /api/admin/dashboard/stats/` - Dashboard istatistikleri

### User Management
- `GET /api/admin/users/` - Kullanıcı listesi
- `GET/PUT/DELETE /api/admin/users/{id}/` - Kullanıcı detay

### Vendor Management
- `GET /api/admin/vendors/` - Esnaf listesi
- `GET/PUT/DELETE /api/admin/vendors/{id}/` - Esnaf detay
- `POST /api/admin/vendors/{id}/approve/` - Esnaf onaylama

### Support Management
- `GET /api/admin/support/tickets/` - Destek talepleri listesi
- `GET/PUT /api/admin/support/tickets/{id}/` - Destek talebi detay
- `POST /api/admin/support/tickets/{id}/reply/` - Destek talebine yanıt

### Blog Management
- `GET/POST /api/admin/blog/categories/` - Blog kategorileri
- `GET/PUT/DELETE /api/admin/blog/categories/{id}/` - Blog kategorisi detay
- `GET/POST /api/admin/blog/posts/` - Blog yazıları
- `GET/PUT/DELETE /api/admin/blog/posts/{id}/` - Blog yazısı detay

### Content Management
- `GET/POST /api/admin/service-areas/` - Hizmet alanları
- `GET/PUT/DELETE /api/admin/service-areas/{id}/` - Hizmet alanı detay
- `GET/POST /api/admin/categories/` - Kategoriler
- `GET/PUT/DELETE /api/admin/categories/{id}/` - Kategori detay
- `GET/POST /api/admin/car-brands/` - Araba markaları
- `GET/PUT/DELETE /api/admin/car-brands/{id}/` - Araba markası detay

### System Management
- `GET /api/admin/logs/` - Sistem logları
- `GET /api/admin/notifications/` - Admin bildirimleri
- `POST /api/admin/notifications/{id}/read/` - Bildirimi okundu işaretle

## 🔒 Authentication

Tüm admin endpoint'leri `IsAdminUser` permission'ı ile korunmuş:
- Kullanıcı giriş yapmış olmalı
- Kullanıcının role'ü 'admin' olmalı

## 📊 Dashboard Özellikleri

Dashboard'da gösterilen istatistikler:
- Toplam kullanıcı sayısı
- Toplam esnaf sayısı
- Aktif esnaf sayısı
- Bekleyen esnaf sayısı
- Toplam destek talebi sayısı
- Açık destek talebi sayısı
- Toplam blog yazısı sayısı
- Yayınlanmış blog yazısı sayısı
- Hizmet alanı sayısı
- Kategori sayısı
- Araba markası sayısı

## 🚀 Sonraki Adımlar

1. **Migration Çalıştır**:
   ```bash
   cd backend
   python manage.py makemigrations admin_panel
   python manage.py migrate
   ```

2. **Admin Frontend'i Tamamla**:
   - Support/Destek sayfası
   - Blog sayfası
   - Service/Hizmet yönetimi sayfası
   - Analytics sayfası
   - Settings sayfası

3. **API Entegrasyonu**:
   - Admin frontend'de API client oluştur
   - Authentication sistemi ekle
   - CRUD işlemlerini entegre et

4. **Subdomain Ayarları**:
   - `admin.sanayicin.com` için nginx ayarları
   - CORS ayarları güncelle

5. **Monitoring Ekle**:
   - Real-time monitoring
   - Error tracking
   - Performance metrics

## 📝 Notlar

- Admin paneli tamamen ayrı bir frontend projesi
- Backend'i main frontend ile paylaşıyor
- Tüm API endpoint'leri admin yetkisi gerektiriyor
- Blog, ServiceArea, Category, CarBrand gibi modeller zaten mevcut (core app'te)
- Admin paneli için sadece yeni özellikler eklendi (Blog, SystemLog, AnalyticsData, vb.)


## 📋 Tamamlanan İşlemler

### ✅ Frontend (admin/)
- **Next.js 15** projesi kuruldu
- **Temel layout** ve sidebar hazır
- **Dashboard** sayfası oluşturuldu
- **Users** sayfası oluşturuldu
- **Vendors** sayfası oluşturuldu
- **Tailwind CSS** ile responsive tasarım

### ✅ Backend (backend/admin_panel/)
- **admin_panel** app'i oluşturuldu
- **Modeller** oluşturuldu:
  - `BlogCategory` - Blog kategorileri
  - `BlogPost` - Blog yazıları
  - `SystemLog` - Sistem logları
  - `AnalyticsData` - Analitik veriler
  - `AdminNotification` - Admin bildirimleri
  - `AdminSettings` - Admin ayarları
- **Serializers** oluşturuldu (admin_panel/serializers.py)
- **Views** oluşturuldu (admin_panel/views.py)
- **URLs** yapılandırıldı (admin_panel/urls.py)
- Ana urls.py'ye `/api/admin/` endpoint'i eklendi

## 🎯 Mevcut Modeller (Backend)

### Core App (Zaten Var)
- `CustomUser` - Kullanıcılar
- `ServiceArea` - Hizmet alanları  
- `Category` - Kategoriler
- `CarBrand` - Araba markaları
- `SupportTicket` - Destek talepleri
- `SupportMessage` - Destek mesajları
- `Vehicle` - Araçlar
- `Favorite` - Favoriler

### Vendors App (Zaten Var)
- `VendorProfile` - Esnaf profilleri
- `Review` - Yorumlar
- `ServiceRequest` - Hizmet talepleri

### Admin Panel App (Yeni)
- `BlogCategory` - Blog kategorileri
- `BlogPost` - Blog yazıları
- `SystemLog` - Sistem logları
- `AnalyticsData` - Analitik veriler
- `AdminNotification` - Admin bildirimleri
- `AdminSettings` - Admin ayarları

## 🔗 API Endpoints (/api/admin/)

### Dashboard
- `GET /api/admin/dashboard/stats/` - Dashboard istatistikleri

### User Management
- `GET /api/admin/users/` - Kullanıcı listesi
- `GET/PUT/DELETE /api/admin/users/{id}/` - Kullanıcı detay

### Vendor Management
- `GET /api/admin/vendors/` - Esnaf listesi
- `GET/PUT/DELETE /api/admin/vendors/{id}/` - Esnaf detay
- `POST /api/admin/vendors/{id}/approve/` - Esnaf onaylama

### Support Management
- `GET /api/admin/support/tickets/` - Destek talepleri listesi
- `GET/PUT /api/admin/support/tickets/{id}/` - Destek talebi detay
- `POST /api/admin/support/tickets/{id}/reply/` - Destek talebine yanıt

### Blog Management
- `GET/POST /api/admin/blog/categories/` - Blog kategorileri
- `GET/PUT/DELETE /api/admin/blog/categories/{id}/` - Blog kategorisi detay
- `GET/POST /api/admin/blog/posts/` - Blog yazıları
- `GET/PUT/DELETE /api/admin/blog/posts/{id}/` - Blog yazısı detay

### Content Management
- `GET/POST /api/admin/service-areas/` - Hizmet alanları
- `GET/PUT/DELETE /api/admin/service-areas/{id}/` - Hizmet alanı detay
- `GET/POST /api/admin/categories/` - Kategoriler
- `GET/PUT/DELETE /api/admin/categories/{id}/` - Kategori detay
- `GET/POST /api/admin/car-brands/` - Araba markaları
- `GET/PUT/DELETE /api/admin/car-brands/{id}/` - Araba markası detay

### System Management
- `GET /api/admin/logs/` - Sistem logları
- `GET /api/admin/notifications/` - Admin bildirimleri
- `POST /api/admin/notifications/{id}/read/` - Bildirimi okundu işaretle

## 🔒 Authentication

Tüm admin endpoint'leri `IsAdminUser` permission'ı ile korunmuş:
- Kullanıcı giriş yapmış olmalı
- Kullanıcının role'ü 'admin' olmalı

## 📊 Dashboard Özellikleri

Dashboard'da gösterilen istatistikler:
- Toplam kullanıcı sayısı
- Toplam esnaf sayısı
- Aktif esnaf sayısı
- Bekleyen esnaf sayısı
- Toplam destek talebi sayısı
- Açık destek talebi sayısı
- Toplam blog yazısı sayısı
- Yayınlanmış blog yazısı sayısı
- Hizmet alanı sayısı
- Kategori sayısı
- Araba markası sayısı

## 🚀 Sonraki Adımlar

1. **Migration Çalıştır**:
   ```bash
   cd backend
   python manage.py makemigrations admin_panel
   python manage.py migrate
   ```

2. **Admin Frontend'i Tamamla**:
   - Support/Destek sayfası
   - Blog sayfası
   - Service/Hizmet yönetimi sayfası
   - Analytics sayfası
   - Settings sayfası

3. **API Entegrasyonu**:
   - Admin frontend'de API client oluştur
   - Authentication sistemi ekle
   - CRUD işlemlerini entegre et

4. **Subdomain Ayarları**:
   - `admin.sanayicin.com` için nginx ayarları
   - CORS ayarları güncelle

5. **Monitoring Ekle**:
   - Real-time monitoring
   - Error tracking
   - Performance metrics

## 📝 Notlar

- Admin paneli tamamen ayrı bir frontend projesi
- Backend'i main frontend ile paylaşıyor
- Tüm API endpoint'leri admin yetkisi gerektiriyor
- Blog, ServiceArea, Category, CarBrand gibi modeller zaten mevcut (core app'te)
- Admin paneli için sadece yeni özellikler eklendi (Blog, SystemLog, AnalyticsData, vb.)


## 📋 Tamamlanan İşlemler

### ✅ Frontend (admin/)
- **Next.js 15** projesi kuruldu
- **Temel layout** ve sidebar hazır
- **Dashboard** sayfası oluşturuldu
- **Users** sayfası oluşturuldu
- **Vendors** sayfası oluşturuldu
- **Tailwind CSS** ile responsive tasarım

### ✅ Backend (backend/admin_panel/)
- **admin_panel** app'i oluşturuldu
- **Modeller** oluşturuldu:
  - `BlogCategory` - Blog kategorileri
  - `BlogPost` - Blog yazıları
  - `SystemLog` - Sistem logları
  - `AnalyticsData` - Analitik veriler
  - `AdminNotification` - Admin bildirimleri
  - `AdminSettings` - Admin ayarları
- **Serializers** oluşturuldu (admin_panel/serializers.py)
- **Views** oluşturuldu (admin_panel/views.py)
- **URLs** yapılandırıldı (admin_panel/urls.py)
- Ana urls.py'ye `/api/admin/` endpoint'i eklendi

## 🎯 Mevcut Modeller (Backend)

### Core App (Zaten Var)
- `CustomUser` - Kullanıcılar
- `ServiceArea` - Hizmet alanları  
- `Category` - Kategoriler
- `CarBrand` - Araba markaları
- `SupportTicket` - Destek talepleri
- `SupportMessage` - Destek mesajları
- `Vehicle` - Araçlar
- `Favorite` - Favoriler

### Vendors App (Zaten Var)
- `VendorProfile` - Esnaf profilleri
- `Review` - Yorumlar
- `ServiceRequest` - Hizmet talepleri

### Admin Panel App (Yeni)
- `BlogCategory` - Blog kategorileri
- `BlogPost` - Blog yazıları
- `SystemLog` - Sistem logları
- `AnalyticsData` - Analitik veriler
- `AdminNotification` - Admin bildirimleri
- `AdminSettings` - Admin ayarları

## 🔗 API Endpoints (/api/admin/)

### Dashboard
- `GET /api/admin/dashboard/stats/` - Dashboard istatistikleri

### User Management
- `GET /api/admin/users/` - Kullanıcı listesi
- `GET/PUT/DELETE /api/admin/users/{id}/` - Kullanıcı detay

### Vendor Management
- `GET /api/admin/vendors/` - Esnaf listesi
- `GET/PUT/DELETE /api/admin/vendors/{id}/` - Esnaf detay
- `POST /api/admin/vendors/{id}/approve/` - Esnaf onaylama

### Support Management
- `GET /api/admin/support/tickets/` - Destek talepleri listesi
- `GET/PUT /api/admin/support/tickets/{id}/` - Destek talebi detay
- `POST /api/admin/support/tickets/{id}/reply/` - Destek talebine yanıt

### Blog Management
- `GET/POST /api/admin/blog/categories/` - Blog kategorileri
- `GET/PUT/DELETE /api/admin/blog/categories/{id}/` - Blog kategorisi detay
- `GET/POST /api/admin/blog/posts/` - Blog yazıları
- `GET/PUT/DELETE /api/admin/blog/posts/{id}/` - Blog yazısı detay

### Content Management
- `GET/POST /api/admin/service-areas/` - Hizmet alanları
- `GET/PUT/DELETE /api/admin/service-areas/{id}/` - Hizmet alanı detay
- `GET/POST /api/admin/categories/` - Kategoriler
- `GET/PUT/DELETE /api/admin/categories/{id}/` - Kategori detay
- `GET/POST /api/admin/car-brands/` - Araba markaları
- `GET/PUT/DELETE /api/admin/car-brands/{id}/` - Araba markası detay

### System Management
- `GET /api/admin/logs/` - Sistem logları
- `GET /api/admin/notifications/` - Admin bildirimleri
- `POST /api/admin/notifications/{id}/read/` - Bildirimi okundu işaretle

## 🔒 Authentication

Tüm admin endpoint'leri `IsAdminUser` permission'ı ile korunmuş:
- Kullanıcı giriş yapmış olmalı
- Kullanıcının role'ü 'admin' olmalı

## 📊 Dashboard Özellikleri

Dashboard'da gösterilen istatistikler:
- Toplam kullanıcı sayısı
- Toplam esnaf sayısı
- Aktif esnaf sayısı
- Bekleyen esnaf sayısı
- Toplam destek talebi sayısı
- Açık destek talebi sayısı
- Toplam blog yazısı sayısı
- Yayınlanmış blog yazısı sayısı
- Hizmet alanı sayısı
- Kategori sayısı
- Araba markası sayısı

## 🚀 Sonraki Adımlar

1. **Migration Çalıştır**:
   ```bash
   cd backend
   python manage.py makemigrations admin_panel
   python manage.py migrate
   ```

2. **Admin Frontend'i Tamamla**:
   - Support/Destek sayfası
   - Blog sayfası
   - Service/Hizmet yönetimi sayfası
   - Analytics sayfası
   - Settings sayfası

3. **API Entegrasyonu**:
   - Admin frontend'de API client oluştur
   - Authentication sistemi ekle
   - CRUD işlemlerini entegre et

4. **Subdomain Ayarları**:
   - `admin.sanayicin.com` için nginx ayarları
   - CORS ayarları güncelle

5. **Monitoring Ekle**:
   - Real-time monitoring
   - Error tracking
   - Performance metrics

## 📝 Notlar

- Admin paneli tamamen ayrı bir frontend projesi
- Backend'i main frontend ile paylaşıyor
- Tüm API endpoint'leri admin yetkisi gerektiriyor
- Blog, ServiceArea, Category, CarBrand gibi modeller zaten mevcut (core app'te)
- Admin paneli için sadece yeni özellikler eklendi (Blog, SystemLog, AnalyticsData, vb.)


## 📋 Tamamlanan İşlemler

### ✅ Frontend (admin/)
- **Next.js 15** projesi kuruldu
- **Temel layout** ve sidebar hazır
- **Dashboard** sayfası oluşturuldu
- **Users** sayfası oluşturuldu
- **Vendors** sayfası oluşturuldu
- **Tailwind CSS** ile responsive tasarım

### ✅ Backend (backend/admin_panel/)
- **admin_panel** app'i oluşturuldu
- **Modeller** oluşturuldu:
  - `BlogCategory` - Blog kategorileri
  - `BlogPost` - Blog yazıları
  - `SystemLog` - Sistem logları
  - `AnalyticsData` - Analitik veriler
  - `AdminNotification` - Admin bildirimleri
  - `AdminSettings` - Admin ayarları
- **Serializers** oluşturuldu (admin_panel/serializers.py)
- **Views** oluşturuldu (admin_panel/views.py)
- **URLs** yapılandırıldı (admin_panel/urls.py)
- Ana urls.py'ye `/api/admin/` endpoint'i eklendi

## 🎯 Mevcut Modeller (Backend)

### Core App (Zaten Var)
- `CustomUser` - Kullanıcılar
- `ServiceArea` - Hizmet alanları  
- `Category` - Kategoriler
- `CarBrand` - Araba markaları
- `SupportTicket` - Destek talepleri
- `SupportMessage` - Destek mesajları
- `Vehicle` - Araçlar
- `Favorite` - Favoriler

### Vendors App (Zaten Var)
- `VendorProfile` - Esnaf profilleri
- `Review` - Yorumlar
- `ServiceRequest` - Hizmet talepleri

### Admin Panel App (Yeni)
- `BlogCategory` - Blog kategorileri
- `BlogPost` - Blog yazıları
- `SystemLog` - Sistem logları
- `AnalyticsData` - Analitik veriler
- `AdminNotification` - Admin bildirimleri
- `AdminSettings` - Admin ayarları

## 🔗 API Endpoints (/api/admin/)

### Dashboard
- `GET /api/admin/dashboard/stats/` - Dashboard istatistikleri

### User Management
- `GET /api/admin/users/` - Kullanıcı listesi
- `GET/PUT/DELETE /api/admin/users/{id}/` - Kullanıcı detay

### Vendor Management
- `GET /api/admin/vendors/` - Esnaf listesi
- `GET/PUT/DELETE /api/admin/vendors/{id}/` - Esnaf detay
- `POST /api/admin/vendors/{id}/approve/` - Esnaf onaylama

### Support Management
- `GET /api/admin/support/tickets/` - Destek talepleri listesi
- `GET/PUT /api/admin/support/tickets/{id}/` - Destek talebi detay
- `POST /api/admin/support/tickets/{id}/reply/` - Destek talebine yanıt

### Blog Management
- `GET/POST /api/admin/blog/categories/` - Blog kategorileri
- `GET/PUT/DELETE /api/admin/blog/categories/{id}/` - Blog kategorisi detay
- `GET/POST /api/admin/blog/posts/` - Blog yazıları
- `GET/PUT/DELETE /api/admin/blog/posts/{id}/` - Blog yazısı detay

### Content Management
- `GET/POST /api/admin/service-areas/` - Hizmet alanları
- `GET/PUT/DELETE /api/admin/service-areas/{id}/` - Hizmet alanı detay
- `GET/POST /api/admin/categories/` - Kategoriler
- `GET/PUT/DELETE /api/admin/categories/{id}/` - Kategori detay
- `GET/POST /api/admin/car-brands/` - Araba markaları
- `GET/PUT/DELETE /api/admin/car-brands/{id}/` - Araba markası detay

### System Management
- `GET /api/admin/logs/` - Sistem logları
- `GET /api/admin/notifications/` - Admin bildirimleri
- `POST /api/admin/notifications/{id}/read/` - Bildirimi okundu işaretle

## 🔒 Authentication

Tüm admin endpoint'leri `IsAdminUser` permission'ı ile korunmuş:
- Kullanıcı giriş yapmış olmalı
- Kullanıcının role'ü 'admin' olmalı

## 📊 Dashboard Özellikleri

Dashboard'da gösterilen istatistikler:
- Toplam kullanıcı sayısı
- Toplam esnaf sayısı
- Aktif esnaf sayısı
- Bekleyen esnaf sayısı
- Toplam destek talebi sayısı
- Açık destek talebi sayısı
- Toplam blog yazısı sayısı
- Yayınlanmış blog yazısı sayısı
- Hizmet alanı sayısı
- Kategori sayısı
- Araba markası sayısı

## 🚀 Sonraki Adımlar

1. **Migration Çalıştır**:
   ```bash
   cd backend
   python manage.py makemigrations admin_panel
   python manage.py migrate
   ```

2. **Admin Frontend'i Tamamla**:
   - Support/Destek sayfası
   - Blog sayfası
   - Service/Hizmet yönetimi sayfası
   - Analytics sayfası
   - Settings sayfası

3. **API Entegrasyonu**:
   - Admin frontend'de API client oluştur
   - Authentication sistemi ekle
   - CRUD işlemlerini entegre et

4. **Subdomain Ayarları**:
   - `admin.sanayicin.com` için nginx ayarları
   - CORS ayarları güncelle

5. **Monitoring Ekle**:
   - Real-time monitoring
   - Error tracking
   - Performance metrics

## 📝 Notlar

- Admin paneli tamamen ayrı bir frontend projesi
- Backend'i main frontend ile paylaşıyor
- Tüm API endpoint'leri admin yetkisi gerektiriyor
- Blog, ServiceArea, Category, CarBrand gibi modeller zaten mevcut (core app'te)
- Admin paneli için sadece yeni özellikler eklendi (Blog, SystemLog, AnalyticsData, vb.)
