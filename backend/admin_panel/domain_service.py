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
            
            # URL prefix'lerini temizle
            if domain_name.startswith('http://'):
                domain_name = domain_name.replace('http://', '')
            elif domain_name.startswith('https://'):
                domain_name = domain_name.replace('https://', '')
            
            # www. prefix'ini temizle
            domain_name = domain_name.replace('www.', '')
            
            # Trailing slash'ı temizle
            domain_name = domain_name.rstrip('/')
            
            logger.info(f"WHOIS sorgusu başlatılıyor: {domain_name}")
            
            # WHOIS sorgusu - retry mekanizması ile
            domain_info = None
            last_error = None
            search_domains = [domain_name]  # İlk olarak orijinal domain
            
            # Eğer .tr uzantılı bir domain ise alternatif formatları dene
            if '.tr' in domain_name:
                # Örnek: sanayicin.com.tr -> sanayicin.com.tr, sanayicom.tr
                parts = domain_name.split('.')
                if len(parts) >= 3:
                    # Örneğin: sanayicin.com.tr -> sanayicin, com, tr
                    # Alternatif: sadece son iki kısmı kullan
                    alt_domain = '.'.join(parts[-2:])
                    if alt_domain not in search_domains:
                        search_domains.append(alt_domain)
            
            for search_domain in search_domains:
                for attempt in range(self.max_retries):
                    try:
                        logger.info(f"WHOIS sorgusu deneniyor: {search_domain}")
                        domain_info = whois.whois(search_domain)
                        # Eğer başarılı olduysa domain adını güncelle
                        if search_domain != domain_name:
                            logger.info(f"Alternatif domain başarılı: {search_domain}")
                        break
                    except Exception as e:
                        last_error = e
                        logger.warning(f"WHOIS sorgusu deneme {attempt + 1} başarısız ({search_domain}): {str(e)}")
                        if attempt < self.max_retries - 1:
                            import time
                            time.sleep(2)  # 2 saniye bekle
                
                # Eğer başarılı olduysa döngüden çık
                if domain_info is not None:
                    break
            
            if domain_info is None:
                raise Exception(f"WHOIS sorgusu {self.max_retries} deneme sonrası başarısız: {str(last_error)}")
            
            # Bilgileri parse et
            emails = getattr(domain_info, 'emails', None)
            admin_email = ''
            tech_email = ''
            
            if emails:
                if isinstance(emails, list) and len(emails) > 0:
                    if emails[0]:
                        try:
                            admin_email = str(emails[0])
                        except:
                            admin_email = ''
                    if len(emails) > 1 and emails[1]:
                        try:
                            tech_email = str(emails[1])
                        except:
                            tech_email = ''
                elif isinstance(emails, str):
                    admin_email = emails
            
            # Registrar bilgisini parse et
            registrar = ''
            try:
                registrar_value = getattr(domain_info, 'registrar', None)
                if registrar_value:
                    registrar = str(registrar_value)
            except:
                pass
            
            # Dates
            reg_date = None
            exp_date = None
            try:
                reg_date = self._parse_date(getattr(domain_info, 'creation_date', None))
            except:
                pass
            try:
                exp_date = self._parse_date(getattr(domain_info, 'expiration_date', None))
            except:
                pass
            
            result = {
                'name': domain_name,
                'registrar': registrar,
                'registration_date': reg_date,
                'expiration_date': exp_date,
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
