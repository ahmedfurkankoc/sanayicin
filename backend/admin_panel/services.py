import requests
import logging
from django.conf import settings
from django.core.cache import cache
from typing import Dict, List, Optional
import json

logger = logging.getLogger('admin_panel.hostinger')

class HostingerAPIService:
    """Hostinger API ile sunucu monitoring servisi"""
    
    def __init__(self):
        self.api_key = getattr(settings, 'HOSTINGER_API_KEY')
        if not self.api_key:
            raise ValueError("HOSTINGER_API_KEY environment variable is required")
        self.base_url = "https://developers.hostinger.com/api/vps/v1"
        self.headers = {
            'Authorization': f'Bearer {self.api_key}',
            'Content-Type': 'application/json'
        }
    
    def _make_request(self, endpoint: str, method: str = 'GET', data: Optional[Dict] = None) -> Optional[Dict]:
        """API isteği yap"""
        try:
            url = f"{self.base_url}/{endpoint}"
            response = requests.request(method, url, headers=self.headers, json=data, timeout=10)
            
            if response.status_code == 200:
                return response.json()
            else:
                logger.error(f"Hostinger API error: {response.status_code} - {response.text}")
                return None
                
        except requests.exceptions.RequestException as e:
            logger.error(f"Hostinger API request failed: {e}")
            return None
    
    def get_virtual_machines(self) -> List[Dict]:
        """Tüm virtual machine'leri getir"""
        cache_key = "hostinger_vms"
        cached_data = cache.get(cache_key)
        
        if cached_data:
            return cached_data
        
        data = self._make_request("virtual-machines")
        if data:
            cache.set(cache_key, data, 1800)  # 30 dakika cache
            return data
        return []
    
    def get_vm_details(self, vm_id: str) -> Optional[Dict]:
        """Belirli bir VM'in detaylarını getir"""
        cache_key = f"hostinger_vm_{vm_id}"
        cached_data = cache.get(cache_key)
        
        if cached_data:
            return cached_data
        
        data = self._make_request(f"virtual-machines/{vm_id}")
        if data:
            cache.set(cache_key, data, 1800)  # 30 dakika cache
            return data
        return None
    
    def restart_vm(self, vm_id: str) -> bool:
        """VM'i yeniden başlat"""
        data = self._make_request(f"virtual-machines/{vm_id}/restart", method='POST')
        if data:
            # Cache'i temizle
            cache.delete(f"hostinger_vm_{vm_id}")
            return True
        return False
    
    def get_server_monitoring_data(self, vm_id: str) -> Dict:
        """Sunucu monitoring verilerini birleştir - Gerçek veri kullanımı için RealServerMonitoringService'e yönlendir"""
        # Hostinger API'sinde monitoring verisi olmadığı için gerçek monitoring servisini kullan
        from .server_monitoring import RealServerMonitoringService
        
        real_monitoring = RealServerMonitoringService()
        return real_monitoring.get_current_server_info()
    
    def format_bytes(self, bytes_value: int) -> str:
        """Bytes'ı okunabilir formata çevir"""
        if bytes_value == 0:
            return "0 B"
        
        size_names = ["B", "KB", "MB", "GB", "TB"]
        i = 0
        while bytes_value >= 1024 and i < len(size_names) - 1:
            bytes_value /= 1024.0
            i += 1
        
        return f"{bytes_value:.1f} {size_names[i]}"
    
    def format_percentage(self, value: float) -> str:
        """Yüzde formatı"""
        return f"{value:.1f}%"
    
    def get_all_servers_summary(self) -> List[Dict]:
        """Tüm sunucuların özet bilgilerini getir - Gerçek monitoring servisini kullan"""
        # Hostinger API'sinde monitoring verisi olmadığı için gerçek monitoring servisini kullan
        from .server_monitoring import RealServerMonitoringService
        
        real_monitoring = RealServerMonitoringService()
        return real_monitoring.get_all_servers_summary()
    
    def get_subscriptions(self) -> List[Dict]:
        """Hostinger subscriptions listesini getir"""
        cache_key = "hostinger_subscriptions"
        cached_data = cache.get(cache_key)
        
        if cached_data:
            return cached_data
        
        # Billing API için farklı base URL kullan
        billing_base_url = "https://developers.hostinger.com/api"
        url = f"{billing_base_url}/billing/v1/subscriptions"
        
        try:
            response = requests.get(url, headers=self.headers, timeout=10)
            if response.status_code == 200:
                data = response.json()
                cache.set(cache_key, data, 3600)  # 1 saat cache
                return data
            else:
                logger.error(f"Billing API error: {response.status_code} - {response.text}")
                return []
        except requests.exceptions.RequestException as e:
            logger.error(f"Billing API request failed: {e}")
            return []
    
    def get_subscription_details(self, subscription_id: str) -> Optional[Dict]:
        """Belirli bir subscription'ın detaylarını getir"""
        cache_key = f"hostinger_subscription_{subscription_id}"
        cached_data = cache.get(cache_key)
        
        if cached_data:
            return cached_data
        
        # Billing API için farklı base URL kullan
        billing_base_url = "https://developers.hostinger.com/api"
        url = f"{billing_base_url}/billing/v1/subscriptions/{subscription_id}"
        
        try:
            response = requests.get(url, headers=self.headers, timeout=10)
            if response.status_code == 200:
                data = response.json()
                cache.set(cache_key, data, 3600)  # 1 saat cache
                return data
            else:
                logger.error(f"Billing API error: {response.status_code} - {response.text}")
                return None
        except requests.exceptions.RequestException as e:
            logger.error(f"Billing API request failed: {e}")
            return None
