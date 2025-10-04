# Sanayicin Admin Panel

Sanayicin projesi için ayrı admin paneli frontend uygulaması.

## 🚀 Özellikler

### ✅ Tamamlanan
- **Next.js 15** ile modern admin paneli
- **Tailwind CSS** ile responsive tasarım
- **TypeScript** ile tip güvenliği
- **Lucide React** ile modern ikonlar
- **Dashboard** - Genel bakış ve istatistikler
- **Kullanıcı Yönetimi** - Tüm kullanıcıları listeleme ve yönetme
- **Esnaf Yönetimi** - Esnaf onayları ve yönetimi
- **Responsive Sidebar** - Mobil uyumlu navigasyon

### 🔄 Geliştirilecek
- **Authentication** - Admin giriş sistemi
- **Destek Talepleri** - Müşteri destek yönetimi
- **Blog Yönetimi** - CMS blog sistemi
- **Hizmet Yönetimi** - Hizmet başlıkları ekleme/düzenleme
- **İstatistikler** - Detaylı analitik ve raporlar
- **API Entegrasyonu** - Backend ile bağlantı

## 🛠️ Teknolojiler

- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **HTTP Client**: Axios
- **Backend**: Django REST API (mevcut)

## 📁 Proje Yapısı

```
admin/
├── src/
│   ├── app/
│   │   ├── (dashboard)/          # Dashboard layout grubu
│   │   │   ├── layout.tsx        # Admin layout
│   │   │   ├── page.tsx          # Dashboard ana sayfa
│   │   │   ├── users/            # Kullanıcı yönetimi
│   │   │   ├── vendors/          # Esnaf yönetimi
│   │   │   ├── support/          # Destek talepleri
│   │   │   ├── blog/             # Blog yönetimi
│   │   │   ├── services/         # Hizmet yönetimi
│   │   │   └── analytics/        # İstatistikler
│   │   ├── layout.tsx            # Root layout
│   │   └── page.tsx              # Ana sayfa
│   └── components/               # Ortak componentler
├── public/                       # Statik dosyalar
└── package.json
```

## 🚀 Kurulum ve Çalıştırma

```bash
# Bağımlılıkları yükle
npm install

# Geliştirme sunucusunu başlat
npm run dev

# Production build
npm run build

# Production sunucusunu başlat
npm start
```

## 🌐 Erişim

- **Geliştirme**: http://localhost:3000
- **Production**: admin.sanayicin.com (planlanan)

## 🔗 Backend Entegrasyonu

Admin paneli mevcut Django backend'i ile entegre edilecek:

- **API Base URL**: `http://localhost:8000/api` (dev) / `https://api.sanayicin.com` (prod)
- **Authentication**: JWT token tabanlı
- **Endpoints**: 
  - `/admin/users/` - Kullanıcı yönetimi
  - `/admin/vendors/` - Esnaf yönetimi
  - `/admin/support/` - Destek talepleri
  - `/admin/blog/` - Blog yönetimi
  - `/admin/services/` - Hizmet yönetimi

## 📱 Responsive Tasarım

- **Desktop**: Tam sidebar ile geniş layout
- **Tablet**: Daraltılabilir sidebar
- **Mobile**: Hamburger menü ile overlay sidebar

## 🎨 Tasarım Sistemi

- **Renkler**: Tailwind CSS default palette
- **Tipografi**: Inter font family
- **Spacing**: Tailwind spacing scale
- **Components**: Custom admin components
- **Icons**: Lucide React icon set

## 🔐 Güvenlik

- **Authentication**: JWT token tabanlı
- **Authorization**: Role-based access control
- **CSRF**: Next.js built-in protection
- **XSS**: React built-in protection

## 📈 Performans

- **Next.js 15**: App Router ile optimize edilmiş routing
- **Turbopack**: Hızlı development build
- **Image Optimization**: Next.js Image component
- **Code Splitting**: Otomatik sayfa bazlı splitting

## 🚀 Deployment

### Vercel (Önerilen)
```bash
# Vercel CLI ile deploy
npx vercel

# Environment variables
NEXT_PUBLIC_API_URL=https://api.sanayicin.com
```

### Docker
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

## 📝 Geliştirme Notları

- Admin paneli tamamen ayrı bir frontend projesi
- Ana frontend ile backend'i paylaşır
- Subdomain ile erişim sağlanacak
- CMS özellikleri için genişletilebilir yapı
- Monitoring ve analytics entegrasyonu planlanıyor

## 🤝 Katkıda Bulunma

1. Feature branch oluştur
2. Değişiklikleri commit et
3. Pull request aç
4. Code review bekle

## 📄 Lisans

Bu proje Sanayicin projesinin bir parçasıdır.
│   ├── app/
│   │   ├── (dashboard)/          # Dashboard layout grubu
│   │   │   ├── layout.tsx        # Admin layout
│   │   │   ├── page.tsx          # Dashboard ana sayfa
│   │   │   ├── users/            # Kullanıcı yönetimi
│   │   │   ├── vendors/          # Esnaf yönetimi
│   │   │   ├── support/          # Destek talepleri
│   │   │   ├── blog/             # Blog yönetimi
│   │   │   ├── services/         # Hizmet yönetimi
│   │   │   └── analytics/        # İstatistikler
│   │   ├── layout.tsx            # Root layout
│   │   └── page.tsx              # Ana sayfa
│   └── components/               # Ortak componentler
├── public/                       # Statik dosyalar
└── package.json
```

## 🚀 Kurulum ve Çalıştırma

```bash
# Bağımlılıkları yükle
npm install

# Geliştirme sunucusunu başlat
npm run dev

# Production build
npm run build

# Production sunucusunu başlat
npm start
```

## 🌐 Erişim

- **Geliştirme**: http://localhost:3000
- **Production**: admin.sanayicin.com (planlanan)

## 🔗 Backend Entegrasyonu

Admin paneli mevcut Django backend'i ile entegre edilecek:

- **API Base URL**: `http://localhost:8000/api` (dev) / `https://api.sanayicin.com` (prod)
- **Authentication**: JWT token tabanlı
- **Endpoints**: 
  - `/admin/users/` - Kullanıcı yönetimi
  - `/admin/vendors/` - Esnaf yönetimi
  - `/admin/support/` - Destek talepleri
  - `/admin/blog/` - Blog yönetimi
  - `/admin/services/` - Hizmet yönetimi

## 📱 Responsive Tasarım

- **Desktop**: Tam sidebar ile geniş layout
- **Tablet**: Daraltılabilir sidebar
- **Mobile**: Hamburger menü ile overlay sidebar

## 🎨 Tasarım Sistemi

- **Renkler**: Tailwind CSS default palette
- **Tipografi**: Inter font family
- **Spacing**: Tailwind spacing scale
- **Components**: Custom admin components
- **Icons**: Lucide React icon set

## 🔐 Güvenlik

- **Authentication**: JWT token tabanlı
- **Authorization**: Role-based access control
- **CSRF**: Next.js built-in protection
- **XSS**: React built-in protection

## 📈 Performans

- **Next.js 15**: App Router ile optimize edilmiş routing
- **Turbopack**: Hızlı development build
- **Image Optimization**: Next.js Image component
- **Code Splitting**: Otomatik sayfa bazlı splitting

## 🚀 Deployment

### Vercel (Önerilen)
```bash
# Vercel CLI ile deploy
npx vercel

# Environment variables
NEXT_PUBLIC_API_URL=https://api.sanayicin.com
```

### Docker
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

## 📝 Geliştirme Notları

- Admin paneli tamamen ayrı bir frontend projesi
- Ana frontend ile backend'i paylaşır
- Subdomain ile erişim sağlanacak
- CMS özellikleri için genişletilebilir yapı
- Monitoring ve analytics entegrasyonu planlanıyor

## 🤝 Katkıda Bulunma

1. Feature branch oluştur
2. Değişiklikleri commit et
3. Pull request aç
4. Code review bekle

## 📄 Lisans

Bu proje Sanayicin projesinin bir parçasıdır.
│   ├── app/
│   │   ├── (dashboard)/          # Dashboard layout grubu
│   │   │   ├── layout.tsx        # Admin layout
│   │   │   ├── page.tsx          # Dashboard ana sayfa
│   │   │   ├── users/            # Kullanıcı yönetimi
│   │   │   ├── vendors/          # Esnaf yönetimi
│   │   │   ├── support/          # Destek talepleri
│   │   │   ├── blog/             # Blog yönetimi
│   │   │   ├── services/         # Hizmet yönetimi
│   │   │   └── analytics/        # İstatistikler
│   │   ├── layout.tsx            # Root layout
│   │   └── page.tsx              # Ana sayfa
│   └── components/               # Ortak componentler
├── public/                       # Statik dosyalar
└── package.json
```

## 🚀 Kurulum ve Çalıştırma

```bash
# Bağımlılıkları yükle
npm install

# Geliştirme sunucusunu başlat
npm run dev

# Production build
npm run build

# Production sunucusunu başlat
npm start
```

## 🌐 Erişim

- **Geliştirme**: http://localhost:3000
- **Production**: admin.sanayicin.com (planlanan)

## 🔗 Backend Entegrasyonu

Admin paneli mevcut Django backend'i ile entegre edilecek:

- **API Base URL**: `http://localhost:8000/api` (dev) / `https://api.sanayicin.com` (prod)
- **Authentication**: JWT token tabanlı
- **Endpoints**: 
  - `/admin/users/` - Kullanıcı yönetimi
  - `/admin/vendors/` - Esnaf yönetimi
  - `/admin/support/` - Destek talepleri
  - `/admin/blog/` - Blog yönetimi
  - `/admin/services/` - Hizmet yönetimi

## 📱 Responsive Tasarım

- **Desktop**: Tam sidebar ile geniş layout
- **Tablet**: Daraltılabilir sidebar
- **Mobile**: Hamburger menü ile overlay sidebar

## 🎨 Tasarım Sistemi

- **Renkler**: Tailwind CSS default palette
- **Tipografi**: Inter font family
- **Spacing**: Tailwind spacing scale
- **Components**: Custom admin components
- **Icons**: Lucide React icon set

## 🔐 Güvenlik

- **Authentication**: JWT token tabanlı
- **Authorization**: Role-based access control
- **CSRF**: Next.js built-in protection
- **XSS**: React built-in protection

## 📈 Performans

- **Next.js 15**: App Router ile optimize edilmiş routing
- **Turbopack**: Hızlı development build
- **Image Optimization**: Next.js Image component
- **Code Splitting**: Otomatik sayfa bazlı splitting

## 🚀 Deployment

### Vercel (Önerilen)
```bash
# Vercel CLI ile deploy
npx vercel

# Environment variables
NEXT_PUBLIC_API_URL=https://api.sanayicin.com
```

### Docker
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

## 📝 Geliştirme Notları

- Admin paneli tamamen ayrı bir frontend projesi
- Ana frontend ile backend'i paylaşır
- Subdomain ile erişim sağlanacak
- CMS özellikleri için genişletilebilir yapı
- Monitoring ve analytics entegrasyonu planlanıyor

## 🤝 Katkıda Bulunma

1. Feature branch oluştur
2. Değişiklikleri commit et
3. Pull request aç
4. Code review bekle

## 📄 Lisans

Bu proje Sanayicin projesinin bir parçasıdır.
│   ├── app/
│   │   ├── (dashboard)/          # Dashboard layout grubu
│   │   │   ├── layout.tsx        # Admin layout
│   │   │   ├── page.tsx          # Dashboard ana sayfa
│   │   │   ├── users/            # Kullanıcı yönetimi
│   │   │   ├── vendors/          # Esnaf yönetimi
│   │   │   ├── support/          # Destek talepleri
│   │   │   ├── blog/             # Blog yönetimi
│   │   │   ├── services/         # Hizmet yönetimi
│   │   │   └── analytics/        # İstatistikler
│   │   ├── layout.tsx            # Root layout
│   │   └── page.tsx              # Ana sayfa
│   └── components/               # Ortak componentler
├── public/                       # Statik dosyalar
└── package.json
```

## 🚀 Kurulum ve Çalıştırma

```bash
# Bağımlılıkları yükle
npm install

# Geliştirme sunucusunu başlat
npm run dev

# Production build
npm run build

# Production sunucusunu başlat
npm start
```

## 🌐 Erişim

- **Geliştirme**: http://localhost:3000
- **Production**: admin.sanayicin.com (planlanan)

## 🔗 Backend Entegrasyonu

Admin paneli mevcut Django backend'i ile entegre edilecek:

- **API Base URL**: `http://localhost:8000/api` (dev) / `https://api.sanayicin.com` (prod)
- **Authentication**: JWT token tabanlı
- **Endpoints**: 
  - `/admin/users/` - Kullanıcı yönetimi
  - `/admin/vendors/` - Esnaf yönetimi
  - `/admin/support/` - Destek talepleri
  - `/admin/blog/` - Blog yönetimi
  - `/admin/services/` - Hizmet yönetimi

## 📱 Responsive Tasarım

- **Desktop**: Tam sidebar ile geniş layout
- **Tablet**: Daraltılabilir sidebar
- **Mobile**: Hamburger menü ile overlay sidebar

## 🎨 Tasarım Sistemi

- **Renkler**: Tailwind CSS default palette
- **Tipografi**: Inter font family
- **Spacing**: Tailwind spacing scale
- **Components**: Custom admin components
- **Icons**: Lucide React icon set

## 🔐 Güvenlik

- **Authentication**: JWT token tabanlı
- **Authorization**: Role-based access control
- **CSRF**: Next.js built-in protection
- **XSS**: React built-in protection

## 📈 Performans

- **Next.js 15**: App Router ile optimize edilmiş routing
- **Turbopack**: Hızlı development build
- **Image Optimization**: Next.js Image component
- **Code Splitting**: Otomatik sayfa bazlı splitting

## 🚀 Deployment

### Vercel (Önerilen)
```bash
# Vercel CLI ile deploy
npx vercel

# Environment variables
NEXT_PUBLIC_API_URL=https://api.sanayicin.com
```

### Docker
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

## 📝 Geliştirme Notları

- Admin paneli tamamen ayrı bir frontend projesi
- Ana frontend ile backend'i paylaşır
- Subdomain ile erişim sağlanacak
- CMS özellikleri için genişletilebilir yapı
- Monitoring ve analytics entegrasyonu planlanıyor

## 🤝 Katkıda Bulunma

1. Feature branch oluştur
2. Değişiklikleri commit et
3. Pull request aç
4. Code review bekle

## 📄 Lisans

Bu proje Sanayicin projesinin bir parçasıdır.