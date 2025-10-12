import whois
from datetime import datetime, timezone
from django.conf import settings
from typing import Dict, Any, Optional
import logging

logger = logging.getLogger(__name__)

class DomainService:
    """Domain bilgilerini WHOIS ile sorgulama servisi"""
    
    def __init__(self):
        self.timeout = 30  # WHOIS timeout süresi
        self.max_retries = 2  # Maksimum deneme sayısı
    
    def get_domain_info(self, domain_name: str) -> Dict[str, Any]:
        """
        Domain bilgilerini WHOIS ile sorgula
        
        Args:
            domain_name: Domain adı (örn: example.com)
            
        Returns:
            Dict: Domain bilgileri
        """
        try:
            # Domain adını temizle
            domain_name = domain_name.strip().lower()
            if not domain_name.startswith('http'):
                domain_name = domain_name.replace('www.', '')
            
            logger.info(f"WHOIS sorgusu başlatılıyor: {domain_name}")
            
            # WHOIS sorgusu - retry mekanizması ile
            domain_info = None
            last_error = None
            
            for attempt in range(self.max_retries):
                try:
                    domain_info = whois.whois(domain_name)
                    break
                except Exception as e:
                    last_error = e
                    logger.warning(f"WHOIS sorgusu deneme {attempt + 1} başarısız ({domain_name}): {str(e)}")
                    if attempt < self.max_retries - 1:
                        import time
                        time.sleep(2)  # 2 saniye bekle
            
            if domain_info is None:
                raise Exception(f"WHOIS sorgusu {self.max_retries} deneme sonrası başarısız: {str(last_error)}")
            
            # Bilgileri parse et
            emails = getattr(domain_info, 'emails', None)
            admin_email = ''
            tech_email = ''
            
            if emails and isinstance(emails, list) and len(emails) > 0:
                admin_email = str(emails[0]) if emails[0] else ''
                tech_email = str(emails[1]) if len(emails) > 1 and emails[1] else ''
            
            result = {
                'name': domain_name,
                'registrar': getattr(domain_info, 'registrar', '') or '',
                'registration_date': self._parse_date(getattr(domain_info, 'creation_date', None)),
                'expiration_date': self._parse_date(getattr(domain_info, 'expiration_date', None)),
                'nameservers': self._parse_nameservers(getattr(domain_info, 'name_servers', None)),
                'admin_email': admin_email,
                'tech_email': tech_email,
                'status': 'active',
                'last_checked': datetime.now(timezone.utc),
                'error': None
            }
            
            # Bitiş tarihine göre durum belirle
            if result['expiration_date']:
                days_left = (result['expiration_date'] - datetime.now(timezone.utc)).days
                result['days_until_expiry'] = days_left
                
                if days_left < 0:
                    result['status'] = 'expired'
                elif days_left <= 30:
                    result['status'] = 'expiring_soon'
                else:
                    result['status'] = 'active'
            
            logger.info(f"WHOIS sorgusu başarılı: {domain_name}")
            return result
            
        except Exception as e:
            logger.error(f"WHOIS sorgusu hatası ({domain_name}): {str(e)}")
            return {
                'name': domain_name,
                'registrar': '',
                'registration_date': None,
                'expiration_date': None,
                'nameservers': [],
                'admin_email': '',
                'tech_email': '',
                'status': 'error',
                'days_until_expiry': None,
                'last_checked': datetime.now(timezone.utc),
                'error': str(e)
            }
    
    def _parse_date(self, date_value) -> Optional[datetime]:
        """Tarih değerini parse et"""
        if not date_value:
            return None
            
        try:
            # Liste ise ilk elemanı al
            if isinstance(date_value, list):
                date_value = date_value[0]
            
            # Zaten datetime ise döndür
            if isinstance(date_value, datetime):
                return date_value.replace(tzinfo=timezone.utc)
            
            # String ise parse et
            if isinstance(date_value, str):
                # Farklı formatları dene
                formats = [
                    '%Y-%m-%d %H:%M:%S',
                    '%Y-%m-%d',
                    '%d-%m-%Y',
                    '%Y-%m-%dT%H:%M:%S',
                    '%Y-%m-%dT%H:%M:%SZ',
                ]
                
                for fmt in formats:
                    try:
                        return datetime.strptime(date_value, fmt).replace(tzinfo=timezone.utc)
                    except ValueError:
                        continue
                
                # Son çare olarak dateutil kullan
                from dateutil import parser
                return parser.parse(date_value).replace(tzinfo=timezone.utc)
            
            return None
            
        except Exception as e:
            logger.warning(f"Tarih parse hatası: {str(e)}")
            return None
    
    def _parse_nameservers(self, nameservers) -> list:
        """Name server listesini parse et"""
        if not nameservers:
            return []
        
        try:
            # None kontrolü ekle
            if nameservers is None:
                return []
            
            # Liste ise direkt döndür
            if isinstance(nameservers, list):
                return [str(ns).strip() for ns in nameservers if ns]
            
            # String ise split et
            if isinstance(nameservers, str):
                return [ns.strip() for ns in nameservers.split(',') if ns.strip()]
            
            return []
            
        except Exception as e:
            logger.warning(f"Name server parse hatası: {str(e)}")
            return []
    
    def check_multiple_domains(self, domain_names: list) -> Dict[str, Dict[str, Any]]:
        """
        Birden fazla domain'i kontrol et
        
        Args:
            domain_names: Domain adları listesi
            
        Returns:
            Dict: Domain adı -> bilgiler mapping'i
        """
        results = {}
        
        for domain_name in domain_names:
            try:
                results[domain_name] = self.get_domain_info(domain_name)
            except Exception as e:
                logger.error(f"Domain kontrol hatası ({domain_name}): {str(e)}")
                results[domain_name] = {
                    'name': domain_name,
                    'status': 'error',
                    'error': str(e)
                }
        
        return results
    
    def get_expiring_domains(self, days_threshold: int = 30) -> list:
        """
        Yakında dolacak domainleri getir
        
        Args:
            days_threshold: Kaç gün içinde dolacak domainler
            
        Returns:
            List: Yakında dolacak domainler
        """
        from .models import Domain
        
        threshold_date = datetime.now(timezone.utc) + timedelta(days=days_threshold)
        
        return Domain.objects.filter(
            expiration_date__lte=threshold_date,
            expiration_date__gt=datetime.now(timezone.utc)
        ).order_by('expiration_date')
