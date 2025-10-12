# Hostinger API Integration for Sanayicin Admin Panel

## Hostinger API Endpoints

### Server Monitoring
- `GET /api/v1/servers/{server_id}/stats` - Sunucu istatistikleri
- `GET /api/v1/servers/{server_id}/status` - Sunucu durumu
- `GET /api/v1/servers/{server_id}/resources` - Kaynak kullanımı

### Website Analytics
- `GET /api/v1/websites/{website_id}/stats` - Website trafiği
- `GET /api/v1/websites/{website_id}/bandwidth` - Bandwidth kullanımı

## Implementation Plan

1. **Backend Service**: Django service oluştur
2. **API Client**: Hostinger API ile iletişim
3. **Caching**: Redis ile cache'leme
4. **Admin Panel**: Dashboard'a monitoring ekle
5. **Alerts**: Kritik durumlar için bildirimler

## Örnek Kullanım

```python
# backend/core/services/hostinger_api.py
class HostingerAPIService:
    def __init__(self):
        self.api_key = settings.HOSTINGER_API_KEY
        self.base_url = "https://api.hostinger.com/v1"
    
    def get_server_stats(self, server_id):
        # CPU, RAM, Disk kullanımı
        pass
    
    def get_website_traffic(self, website_id):
        # Bandwidth, requests, errors
        pass
```

## Admin Panel Dashboard'a Ekleme

- Sunucu durumu widget'ı
- Trafik grafikleri
- Kaynak kullanımı göstergeleri
- Alert sistemi
