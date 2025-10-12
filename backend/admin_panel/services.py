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
        """Sunucu monitoring verilerini birleştir"""
        vm_details = self.get_vm_details(vm_id)
        
        if not vm_details:
            return {}
        
        # Temel sunucu bilgileri
        server_data = {
            'id': vm_details.get('id'),
            'name': vm_details.get('hostname', 'Unknown'),
            'os': vm_details.get('template', {}).get('name', 'Unknown'),
            'os_version': '',
            'ip_address': vm_details.get('ipv4', [{}])[0].get('address', 'Unknown'),
            'status': vm_details.get('state', 'unknown'),
            'created_at': vm_details.get('created_at'),
            'region': f"Data Center {vm_details.get('data_center_id', 'Unknown')}",
            'plan': vm_details.get('plan', 'Unknown'),
            'cpus': vm_details.get('cpus', 0),
            'memory_total': vm_details.get('memory', 0) * 1024 * 1024,  # MB to bytes
            'disk_total': vm_details.get('disk', 0) * 1024 * 1024,  # MB to bytes
            'bandwidth_total': vm_details.get('bandwidth', 0) * 1024 * 1024,  # MB to bytes
        }
        
        # Mock performans verileri (gerçek API'de bu endpoint'ler yok)
        # Bu verileri gerçek monitoring sistemi ile değiştirebilirsiniz
        server_data.update({
            'cpu_usage': 15.5,  # Mock CPU kullanımı
            'memory_usage': 18.2,  # Mock RAM kullanımı
            'memory_used': int(server_data['memory_total'] * 0.182),
            'disk_usage': 6.0,  # Mock disk kullanımı
            'disk_used': int(server_data['disk_total'] * 0.06),
            'network_in': 1024 * 1024 * 0.5,  # Mock network in (0.5MB)
            'network_out': 1024 * 1024 * 0.5,  # Mock network out (0.5MB)
            'bandwidth_used': 1024 * 1024 * 0.001,  # Mock bandwidth (0.001TB)
            'uptime': 99.9,  # Mock uptime
            'load_average': [0.15, 0.12, 0.08],  # Mock load average
        })
        
        return server_data
    
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
        """Tüm sunucuların özet bilgilerini getir"""
        cache_key = "hostinger_all_servers_summary"
        cached_data = cache.get(cache_key)
        
        # Cache varsa ve 1 saatten eski değilse, cache'den döndür
        if cached_data:
            return cached_data
        
        try:
            vms = self.get_virtual_machines()
            servers_summary = []
            
            for vm in vms:
                vm_id = vm.get('id')
                if vm_id:
                    server_data = self.get_server_monitoring_data(vm_id)
                    if server_data:
                        servers_summary.append(server_data)
            
            # Başarılı ise cache'e kaydet
            if servers_summary:
                cache.set(cache_key, servers_summary, 3600)  # 1 saat cache
            
            return servers_summary
            
        except Exception as e:
            logger.error(f"Error getting servers summary: {e}")
            # Hata durumunda cache'den eski veriyi döndür
            return cached_data if cached_data else []
