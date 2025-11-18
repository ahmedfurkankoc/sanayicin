"""
Redis tabanlı OTP servisi
OTP kodları için Redis kullanır - performanslı ve maintainable
OTP kodları güvenlik için hash'lenerek saklanır
"""
import random
import json
import hashlib
from typing import Optional, Tuple
from django.core.cache import cache
from django.conf import settings
from django.utils import timezone
from datetime import timedelta
import logging

logger = logging.getLogger(__name__)


class OTPService:
    """Redis tabanlı OTP servisi"""
    
    # Redis key prefix
    KEY_PREFIX = 'otp'
    
    # Varsayılan ayarlar
    DEFAULT_EXPIRY_MINUTES = 5
    DEFAULT_MAX_ATTEMPTS = 3
    
    def __init__(self):
        self.expiry_minutes = getattr(settings, 'OTP_CODE_EXPIRY_MINUTES', self.DEFAULT_EXPIRY_MINUTES)
        self.max_attempts = getattr(settings, 'OTP_MAX_ATTEMPTS', self.DEFAULT_MAX_ATTEMPTS)
    
    def _get_key(self, phone_number: str, purpose: str) -> str:
        """Redis key oluştur"""
        return f"{self.KEY_PREFIX}:{purpose}:{phone_number}"
    
    def _get_attempts_key(self, phone_number: str, purpose: str) -> str:
        """Rate limiting için attempts key"""
        return f"{self.KEY_PREFIX}:attempts:{purpose}:{phone_number}"
    
    def generate_code(self) -> str:
        """6 haneli OTP kodu oluştur"""
        return ''.join([str(random.randint(0, 9)) for _ in range(6)])
    
    def _hash_code(self, code: str) -> str:
        """OTP kodunu hash'le (SHA256)"""
        return hashlib.sha256(code.encode('utf-8')).hexdigest()
    
    def send_otp(self, phone_number: str, purpose: str = 'login', user_id: Optional[int] = None) -> Tuple[bool, str, Optional[str]]:
        """
        OTP kodu oluştur ve Redis'e kaydet
        
        Returns:
            (success: bool, code: str, error_message: Optional[str])
        """
        try:
            # Rate limiting kontrolü (atomic operation için)
            attempts_key = self._get_attempts_key(phone_number, purpose)
            
            # Atomic increment kullan (race condition önleme)
            # Not: Django cache backend'i doğrudan INCR desteklemez
            # Bu yüzden get-or-set pattern kullanıyoruz
            # Yüksek trafikte küçük bir race condition riski var ama kabul edilebilir
            attempts = cache.get(attempts_key, 0)
            if attempts == 0:
                # İlk kez set ediliyor
                cache.set(attempts_key, 1, timeout=self.expiry_minutes * 60)
                attempts = 1
            else:
                # Mevcut değeri artır (race condition riski minimal)
                attempts += 1
                cache.set(attempts_key, attempts, timeout=self.expiry_minutes * 60)
            
            if attempts > self.max_attempts:
                logger.warning(f"OTP rate limit exceeded for {phone_number} ({purpose})")
                return False, '', f"Çok fazla deneme yapıldı. Lütfen {self.expiry_minutes} dakika sonra tekrar deneyin."
            
            # OTP kodu oluştur
            code = self.generate_code()
            
            # OTP kodunu hash'le (güvenlik için)
            code_hash = self._hash_code(code)
            
            # Redis'e kaydet (hash'lenmiş kod)
            otp_key = self._get_key(phone_number, purpose)
            otp_data = {
                'code_hash': code_hash,  # Hash'lenmiş kod
                'phone_number': phone_number,
                'purpose': purpose,
                'user_id': user_id,
                'created_at': timezone.now().isoformat(),
                'attempts': 0,  # Doğrulama denemeleri
            }
            
            # TTL ile kaydet (dakika -> saniye)
            cache.set(
                otp_key,
                json.dumps(otp_data),
                timeout=self.expiry_minutes * 60
            )
            
            logger.info(f"OTP code generated for {phone_number} ({purpose})")
            return True, code, None
            
        except Exception as e:
            logger.error(f"OTP generation failed: {str(e)}")
            return False, '', f"OTP oluşturulurken hata oluştu: {str(e)}"
    
    def verify_otp(self, phone_number: str, code: str, purpose: str = 'login', mark_used: bool = True) -> Tuple[bool, Optional[str]]:
        """
        OTP kodunu doğrula
        
        Args:
            phone_number: Telefon numarası
            code: Doğrulanacak kod
            purpose: OTP amacı
            mark_used: Doğrulandıktan sonra kullanıldı olarak işaretle
            
        Returns:
            (is_valid: bool, error_message: Optional[str])
        """
        try:
            otp_key = self._get_key(phone_number, purpose)
            otp_data_str = cache.get(otp_key)
            
            if not otp_data_str:
                logger.warning(f"OTP not found or expired for {phone_number} ({purpose})")
                return False, "OTP kodu bulunamadı veya süresi dolmuş. Lütfen yeni kod isteyin."
            
            # JSON parse
            try:
                otp_data = json.loads(otp_data_str)
            except json.JSONDecodeError:
                logger.error(f"Invalid OTP data format for {phone_number}")
                cache.delete(otp_key)
                return False, "Geçersiz OTP verisi. Lütfen yeni kod isteyin."
            
            # Attempts kontrolü (brute force koruması)
            max_verify_attempts = getattr(settings, 'OTP_MAX_VERIFY_ATTEMPTS', 5)
            if otp_data.get('attempts', 0) >= max_verify_attempts:
                logger.warning(f"OTP verify attempts exceeded for {phone_number}")
                cache.delete(otp_key)
                return False, "Çok fazla yanlış deneme yapıldı. Lütfen yeni kod isteyin."
            
            # Kod kontrolü (hash karşılaştırması)
            code_hash = self._hash_code(code)
            stored_hash = otp_data.get('code_hash')
            
            if not stored_hash or stored_hash != code_hash:
                # Attempts sayacını artır
                otp_data['attempts'] = otp_data.get('attempts', 0) + 1
                cache.set(otp_key, json.dumps(otp_data), timeout=cache.ttl(otp_key))
                
                logger.warning(f"Invalid OTP code for {phone_number} ({purpose})")
                return False, "Geçersiz OTP kodu."
            
            # Başarılı doğrulama
            if mark_used:
                # Kullanıldı olarak işaretle ve sil
                cache.delete(otp_key)
                logger.info(f"OTP verified and deleted for {phone_number} ({purpose})")
            else:
                # Sadece attempts sayacını sıfırla
                otp_data['attempts'] = 0
                cache.set(otp_key, json.dumps(otp_data), timeout=cache.ttl(otp_key))
            
            return True, None
            
        except Exception as e:
            logger.error(f"OTP verification failed: {str(e)}")
            return False, f"Doğrulama sırasında hata oluştu: {str(e)}"
    
    def delete_otp(self, phone_number: str, purpose: str = 'login') -> bool:
        """OTP kodunu sil"""
        try:
            otp_key = self._get_key(phone_number, purpose)
            cache.delete(otp_key)
            logger.info(f"OTP deleted for {phone_number} ({purpose})")
            return True
        except Exception as e:
            logger.error(f"OTP deletion failed: {str(e)}")
            return False
    
    def get_otp_info(self, phone_number: str, purpose: str = 'login') -> Optional[dict]:
        """OTP bilgilerini al (kod hash'i hariç - güvenlik için)"""
        try:
            otp_key = self._get_key(phone_number, purpose)
            otp_data_str = cache.get(otp_key)
            
            if not otp_data_str:
                return None
            
            otp_data = json.loads(otp_data_str)
            # Kod hash'ini çıkar (güvenlik için)
            otp_data.pop('code_hash', None)
            otp_data.pop('code', None)  # Eski format desteği
            return otp_data
        except Exception as e:
            logger.error(f"Get OTP info failed: {str(e)}")
            return None
    
    def clear_all_otps(self, phone_number: str) -> bool:
        """Bir telefon numarası için tüm OTP'leri temizle"""
        try:
            purposes = ['login', 'password_reset', 'two_factor']
            for purpose in purposes:
                otp_key = self._get_key(phone_number, purpose)
                attempts_key = self._get_attempts_key(phone_number, purpose)
                cache.delete(otp_key)
                cache.delete(attempts_key)
            logger.info(f"All OTPs cleared for {phone_number}")
            return True
        except Exception as e:
            logger.error(f"Clear OTPs failed: {str(e)}")
            return False

