"""
Gerçek sunucu monitoring servisi - psutil kullanarak
"""
import psutil
import platform
import socket
import time
import os
from typing import Dict, List, Optional
from django.core.cache import cache
from django.utils import timezone
import logging

logger = logging.getLogger(__name__)

class RealServerMonitoringService:
    """Gerçek sunucu monitoring verilerini toplar"""
    
    def __init__(self):
        self.cache_duration = 10  # 10 saniye cache (çok kısa)
        self._network_start_time = None
        self._network_start_recv = None
        self._network_start_sent = None
    
    def get_current_server_info(self) -> Dict:
        """Mevcut sunucunun bilgilerini getir"""
        try:
            # Temel sistem bilgileri
            system_info = {
                'id': 'current_server',
                'name': socket.gethostname(),
                'os': f"{platform.system()} {platform.release()}",
                'os_version': platform.version(),
                'ip_address': self._get_public_ip(),
                'status': 'running',
                'region': 'Current Server',
                'created_at': timezone.now().isoformat(),
                'plan': 'Dedicated Server',
                'cpus': psutil.cpu_count(logical=False),  # Fiziksel CPU sayısı
                'memory_total': psutil.virtual_memory().total,
                'disk_total': psutil.disk_usage('/').total,
                'bandwidth_total': self._get_bandwidth_total(),  # Gerçek bandwidth total
            }
            
            # Gerçek performans verileri
            metrics = self._get_real_metrics()
            system_info.update(metrics)
            
            return system_info
            
        except Exception as e:
            logger.error(f"Server info error: {e}")
            return self._get_fallback_data()
    
    def _get_real_metrics(self) -> Dict:
        """Gerçek sistem metriklerini topla"""
        try:
            # CPU kullanımı
            cpu_percent = psutil.cpu_percent(interval=1)
            
            # Bellek kullanımı
            memory = psutil.virtual_memory()
            memory_percent = memory.percent
            memory_used = memory.used
            memory_total = memory.total
            
            # Disk kullanımı
            disk = psutil.disk_usage('/')
            disk_percent = (disk.used / disk.total) * 100
            disk_used = disk.used
            disk_total = disk.total
            
            # Network trafiği - gerçek zamanlı hız hesaplama (senin önerdiğin yöntem)
            network_in_rate, network_out_rate = self._get_network_speed()
            
            # Network toplam verileri
            network = psutil.net_io_counters()
            
            # Uptime
            boot_time = psutil.boot_time()
            uptime_seconds = time.time() - boot_time
            uptime_percent = min(99.9, (uptime_seconds / (30 * 24 * 3600)) * 100)  # 30 günlük uptime
            
            # Load average (Linux/Unix için)
            try:
                load_avg = os.getloadavg()
            except AttributeError:
                # Windows için alternatif
                load_avg = [cpu_percent / 100, cpu_percent / 100, cpu_percent / 100]
            
            # Bandwidth kullanımı - toplam transfer edilen veri
            bandwidth_used = network.bytes_recv + network.bytes_sent
            
            return {
                'cpu_usage': round(cpu_percent, 1),
                'memory_usage': round(memory_percent, 1),
                'memory_used': memory_used,
                'memory_total': memory_total,
                'disk_usage': round(disk_percent, 1),
                'disk_used': disk_used,
                'disk_total': disk_total,
                'network_in': network_in_rate,  # bytes per second
                'network_out': network_out_rate,  # bytes per second
                'network_in_total': network.bytes_recv,  # toplam gelen
                'network_out_total': network.bytes_sent,  # toplam giden
                'bandwidth_used': bandwidth_used,
                'bandwidth_total': self._get_bandwidth_total(),
                'uptime': round(uptime_percent, 1),
                'load_average': [round(load_avg[0], 2), round(load_avg[1], 2), round(load_avg[2], 2)],
            }
            
        except Exception as e:
            logger.error(f"Metrics error: {e}")
            return self._get_fallback_metrics()
    
    def _get_network_speed(self, interval=1) -> tuple:
        """Network hızını hesapla (senin önerdiğin yöntem)"""
        try:
            # İlk ölçüm
            old = psutil.net_io_counters()
            
            # Kısa bir süre bekle
            time.sleep(interval)
            
            # İkinci ölçüm
            new = psutil.net_io_counters()
            
            # Hız hesaplama (bytes per second)
            sent_speed = (new.bytes_sent - old.bytes_sent) / interval
            recv_speed = (new.bytes_recv - old.bytes_recv) / interval
            
            return recv_speed, sent_speed
            
        except Exception as e:
            logger.error(f"Network speed error: {e}")
            return 0, 0
    
    def _get_bandwidth_total(self) -> int:
        """Gerçek bandwidth total'ini hesapla (ethtool ile)"""
        try:
            # Önce ethtool ile gerçek interface hızını al
            interface_speed = self._get_interface_speed()
            if interface_speed:
                return interface_speed
            
            # Ethtool başarısız olursa psutil ile
            net_stats = psutil.net_if_stats()
            total_bandwidth = 0
            
            for interface, stats in net_stats.items():
                if stats.isup and not interface.startswith('lo'):  # Loopback hariç
                    if stats.speed > 0:
                        # Mbps'yi bytes'a çevir (1 Mbps = 125000 bytes/s)
                        total_bandwidth += stats.speed * 125000
            
            # Eğer hiç interface bulunamazsa varsayılan değer
            if total_bandwidth == 0:
                # Varsayılan olarak 1 Gbps (125 MB/s)
                total_bandwidth = 125 * 1024 * 1024
            
            return total_bandwidth
            
        except Exception as e:
            logger.error(f"Bandwidth total error: {e}")
            # Fallback: 1 Gbps
            return 125 * 1024 * 1024
    
    def _get_interface_speed(self) -> int:
        """ethtool ile interface hızını al (senin önerdiğin yöntem)"""
        try:
            import subprocess
            
            # Ana network interface'ini bul
            interfaces = ['eth0', 'ens3', 'enp0s3', 'wlan0']
            
            for interface in interfaces:
                try:
                    output = subprocess.check_output(['ethtool', interface], 
                                                   stderr=subprocess.DEVNULL).decode()
                    for line in output.splitlines():
                        if "Speed:" in line:
                            speed_str = line.split(":")[1].strip()
                            if "Mbps" in speed_str:
                                speed_mbps = int(speed_str.replace("Mbps", "").strip())
                                return speed_mbps * 125000  # Mbps to bytes/s
                            elif "Gbps" in speed_str:
                                speed_gbps = int(speed_str.replace("Gbps", "").strip())
                                return speed_gbps * 125000000  # Gbps to bytes/s
                except (subprocess.CalledProcessError, FileNotFoundError):
                    continue
            
            return None
            
        except Exception as e:
            logger.error(f"Interface speed error: {e}")
            return None
    
    def _get_public_ip(self) -> str:
        """Sunucunun public IP adresini al"""
        try:
            # Önce local IP'yi al
            hostname = socket.gethostname()
            local_ip = socket.gethostbyname(hostname)
            
            # Eğer local IP 127.0.0.1 ise, network interface'lerden al
            if local_ip == '127.0.0.1':
                for interface, addrs in psutil.net_if_addrs().items():
                    for addr in addrs:
                        if addr.family == socket.AF_INET and not addr.address.startswith('127.'):
                            return addr.address
            
            return local_ip
            
        except Exception as e:
            logger.error(f"IP detection error: {e}")
            return "Unknown"
    
    def _get_fallback_data(self) -> Dict:
        """Fallback veri (hata durumunda)"""
        return {
            'id': 'current_server',
            'name': 'Unknown Server',
            'os': 'Unknown OS',
            'os_version': '',
            'ip_address': 'Unknown',
            'status': 'unknown',
            'region': 'Unknown',
            'created_at': timezone.now().isoformat(),
            'plan': 'Unknown',
            'cpus': 0,
            'memory_total': 0,
            'disk_total': 0,
            'bandwidth_total': 0,
        }
    
    def _get_fallback_metrics(self) -> Dict:
        """Fallback metrikler"""
        return {
            'cpu_usage': 0.0,
            'memory_usage': 0.0,
            'memory_used': 0,
            'memory_total': 0,
            'disk_usage': 0.0,
            'disk_used': 0,
            'disk_total': 0,
            'network_in': 0,
            'network_out': 0,
            'network_in_total': 0,
            'network_out_total': 0,
            'bandwidth_used': 0,
            'bandwidth_total': 125 * 1024 * 1024,  # 1 Gbps fallback
            'uptime': 0.0,
            'load_average': [0.0, 0.0, 0.0],
        }
    
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
        """Tüm sunucuların özet bilgilerini getir (şu an sadece mevcut sunucu)"""
        # Cache'i tamamen kaldır - her zaman fresh data
        try:
            # Mevcut sunucunun verilerini al
            server_data = self.get_current_server_info()
            
            # Veriyi formatla
            formatted_server = {
                'id': server_data.get('id'),
                'name': server_data.get('name'),
                'os': f"{server_data.get('os')} {server_data.get('os_version')}",
                'ip_address': server_data.get('ip_address'),
                'status': server_data.get('status'),
                'region': server_data.get('region'),
                'created_at': server_data.get('created_at'),
                'metrics': {
                    'cpu_usage': self.format_percentage(server_data.get('cpu_usage', 0)),
                    'memory_usage': self.format_percentage(server_data.get('memory_usage', 0)),
                    'memory_used': self.format_bytes(server_data.get('memory_used', 0)),
                    'memory_total': self.format_bytes(server_data.get('memory_total', 0)),
                    'disk_usage': f"{self.format_bytes(server_data.get('disk_used', 0))} / {self.format_bytes(server_data.get('disk_total', 0))}",
                    'disk_percentage': self.format_percentage(server_data.get('disk_usage', 0)),
                    'network_in': self.format_bytes(server_data.get('network_in', 0)) + '/s',  # bytes per second
                    'network_out': self.format_bytes(server_data.get('network_out', 0)) + '/s',  # bytes per second
                    'network_in_total': self.format_bytes(server_data.get('network_in_total', 0)),
                    'network_out_total': self.format_bytes(server_data.get('network_out_total', 0)),
                    'bandwidth_usage': f"{self.format_bytes(server_data.get('bandwidth_used', 0))} / {self.format_bytes(server_data.get('bandwidth_total', 0))}",
                    'uptime': server_data.get('uptime', 0),
                    'load_average': server_data.get('load_average', [0, 0, 0]),
                }
            }
            
            servers_list = [formatted_server]
            
            return servers_list
            
        except Exception as e:
            logger.error(f"Server summary error: {e}")
            return []
    
    def get_server_detail(self, server_id: str) -> Optional[Dict]:
        """Belirli bir sunucunun detaylı bilgilerini getir"""
        if server_id == 'current_server':
            return self.get_current_server_info()
        return None
    
    def clear_cache(self):
        """Cache'i temizle"""
        cache.delete("real_server_monitoring_data")
