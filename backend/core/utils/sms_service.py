import requests
import re
from typing import Optional
from django.conf import settings
import logging

logger = logging.getLogger(__name__)

class IletiMerkeziSMS:
    """İletiMerkezi SMS API entegrasyonu"""
    
    def __init__(self):
        self.api_name = getattr(settings, 'ILETIMERKEZI_API_NAME', 'sanayicin')
        self.api_key = getattr(settings, 'ILETIMERKEZI_API_KEY', None)
        self.hash = getattr(settings, 'ILETIMERKEZI_API_HASH', None)
        self.sender = getattr(settings, 'ILETIMERKEZI_SENDER', 'Sanayicin')
        self.base_url = "https://api.iletimerkezi.com/v1"
        
        if not self.api_key or not self.hash:
            logger.warning("İletiMerkezi API key veya hash tanımlı değil. SMS gönderimi çalışmayabilir.")
    
    def format_phone_number(self, phone: str) -> str:
        """Telefon numarasını formatla"""
        # Sadece rakamları al
        digits = re.sub(r'[^\d]', '', phone)
        
        # Türkiye numarası kontrolü
        if digits.startswith('0'):
            digits = '90' + digits[1:]
        elif digits.startswith('5'):
            digits = '90' + digits
        elif not digits.startswith('90'):
            digits = '90' + digits
            
        return digits
    
    def validate_phone_number(self, phone: str) -> bool:
        """Telefon numarası geçerliliğini kontrol et"""
        formatted = self.format_phone_number(phone)
        # Türkiye mobil numarası: 90 + 5xx + 7 haneli
        pattern = r'^905[0-9]{9}$'
        return bool(re.match(pattern, formatted))
    
    def send_verification_code(self, phone: str, code: str) -> bool:
        """Doğrulama kodu gönder"""
        try:
            formatted_phone = self.format_phone_number(phone)
            
            if not self.validate_phone_number(formatted_phone):
                logger.error(f"Invalid phone number: {phone}")
                return False
            
            message = f"Sanayicin doğrulama kodunuz: {code}"
            
            # İletiMerkezi API v1 JSON formatı
            payload = {
                "request": {
                    "authentication": {
                        "key": self.api_key,
                        "hash": self.hash
                    },
                    "order": {
                        "sender": self.sender,
                        "iys": "1",
                        "iysList": "BIREYSEL",
                        "message": {
                            "text": message,
                            "receipents": {
                                "number": [formatted_phone]
                            }
                        }
                    }
                }
            }
            
            logger.info(f"Sending SMS to {formatted_phone} with payload: {payload}")
            
            response = requests.post(
                f"{self.base_url}/send-sms/json",
                json=payload,
                timeout=30
            )
            
            logger.info(f"SMS API response status: {response.status_code}")
            logger.info(f"SMS API response content: {response.text}")
            
            if response.status_code == 200:
                result = response.json()
                if result.get('response', {}).get('status', {}).get('code') == '200':
                    logger.info(f"SMS sent successfully to {formatted_phone}")
                    return True
                else:
                    logger.error(f"SMS API error: {result}")
                    return False
            else:
                logger.error(f"SMS API HTTP error: {response.status_code}")
                logger.error(f"SMS API response: {response.text}")
                return False
                
        except Exception as e:
            logger.error(f"SMS sending failed: {str(e)}")
            return False
    
    def send_welcome_message(self, phone: str, user_name: str) -> bool:
        """Hoş geldin mesajı gönder"""
        try:
            formatted_phone = self.format_phone_number(phone)
            message = f"Merhaba {user_name}, Sanayicin'e hoş geldiniz!"
            
            payload = {
                "request": {
                    "authentication": {
                        "key": self.api_key,
                        "hash": self.hash
                    },
                    "order": {
                        "sender": self.sender,
                        "iys": "1",
                        "iysList": "BIREYSEL",
                        "message": {
                            "text": message,
                            "receipents": {
                                "number": [formatted_phone]
                            }
                        }
                    }
                }
            }
            
            response = requests.post(
                f"{self.base_url}/send-sms/json",
                json=payload,
                timeout=30
            )
            
            if response.status_code == 200:
                result = response.json()
                return result.get('response', {}).get('status', {}).get('code') == '200'
            else:
                return False
            
        except Exception as e:
            logger.error(f"Welcome SMS failed: {str(e)}")
            return False
    
    def send_appointment_reminder(self, phone: str, appointment_date: str, vendor_name: str) -> bool:
        """Randevu hatırlatması gönder"""
        try:
            formatted_phone = self.format_phone_number(phone)
            message = f"Yarın {appointment_date} tarihinde {vendor_name} ile randevunuz var."
            
            payload = {
                "request": {
                    "authentication": {
                        "key": self.api_key,
                        "hash": self.hash
                    },
                    "order": {
                        "sender": self.sender,
                        "iys": "1",
                        "iysList": "BIREYSEL",
                        "message": {
                            "text": message,
                            "receipents": {
                                "number": [formatted_phone]
                            }
                        }
                    }
                }
            }
            
            response = requests.post(
                f"{self.base_url}/send-sms/json",
                json=payload,
                timeout=30
            )
            
            if response.status_code == 200:
                result = response.json()
                return result.get('response', {}).get('status', {}).get('code') == '200'
            else:
                return False
            
        except Exception as e:
            logger.error(f"Appointment reminder SMS failed: {str(e)}")
            return False
    
    def check_balance(self) -> Optional[int]:
        """SMS bakiyesini kontrol et"""
        try:
            payload = {
                "request": {
                    "authentication": {
                        "key": self.api_key,
                        "hash": self.hash
                    }
                }
            }
            
            response = requests.post(
                f"{self.base_url}/get-balance/json",
                json=payload,
                timeout=30
            )
            
            if response.status_code == 200:
                result = response.json()
                return result.get('response', {}).get('balance', 0)
            else:
                return None
                
        except Exception as e:
            logger.error(f"Balance check failed: {str(e)}")
            return None
    
    def get_reports(self, start_date: str, end_date: str) -> Optional[dict]:
        """SMS raporlarını al"""
        try:
            payload = {
                "request": {
                    "authentication": {
                        "key": self.api_key,
                        "hash": self.hash
                    },
                "start_date": start_date,
                "end_date": end_date
                }
            }
            
            response = requests.post(
                f"{self.base_url}/get-reports/json",
                json=payload,
                timeout=30
            )
            
            if response.status_code == 200:
                result = response.json()
                if result.get('response', {}).get('status', {}).get('code') == '200':
                    return result
                else:
                    logger.error(f"SMS reports API error: {result}")
                    return None
            else:
                logger.error(f"SMS reports HTTP error: {response.status_code}")
                return None
                
        except Exception as e:
            logger.error(f"Reports fetch failed: {str(e)}")
            return None 
    
    def send_otp_code(self, phone: str, code: str, purpose: str = "verification") -> bool:
        """OTP kodu gönder (login, password reset, two_factor vb. için)"""
        try:
            formatted_phone = self.format_phone_number(phone)
            
            if not self.validate_phone_number(formatted_phone):
                logger.error(f"Invalid phone number: {phone}")
                return False
            
            # Purpose'a göre mesaj belirle
            messages = {
                # Admin paneli
                "two_factor": f"Sanayicin admin paneli giriş kodunuz: {code}",
                
                # Kullanıcı kayıt ve doğrulama
                "registration": f"Sanayicin:\nHesabını doğrulamak için kodun: {code}",
                "verification": f"Sanayicin:\nHesabını doğrulamak için kodun: {code}",
                
                # Kullanıcı giriş ve şifre
                "login": f"Sanayicin giriş kodunuz: {code}",
                "password_reset": f"Sanayicin şifre sıfırlama kodunuz: {code}",
                
                # Bilgi güncelleme onayları
                "phone_update": f"Telefon numarası değişikliğini onaylamak için kodun: {code}",
                "email_update": f"E-posta adresi değişikliğini onaylamak için kodun: {code}",
                "password_update": f"Şifre değişikliğini onaylamak için kodun: {code}",
                "profile_update": f"Bilgilerinizi güncellemek için kodun: {code}",
            }
            
            message = messages.get(purpose, f"Sanayicin kodunuz: {code}")
            
            payload = {
                "request": {
                    "authentication": {
                        "key": self.api_key,
                        "hash": self.hash
                    },
                    "order": {
                        "sender": self.sender,
                        "iys": "1",
                        "iysList": "BIREYSEL",
                        "message": {
                            "text": message,
                            "receipents": {
                                "number": [formatted_phone]
                            }
                        }
                    }
                }
            }
            
            logger.info(f"Sending OTP SMS to {formatted_phone} for purpose: {purpose}")
            
            response = requests.post(
                f"{self.base_url}/send-sms/json",
                json=payload,
                timeout=30
            )
            
            logger.info(f"SMS API response status: {response.status_code}")
            logger.info(f"SMS API response content: {response.text}")
            
            if response.status_code == 200:
                result = response.json()
                status_code = result.get('response', {}).get('status', {}).get('code')
                status_message = result.get('response', {}).get('status', {}).get('message', '')
                
                # Status code'u string'e çevir ve kontrol et (hem '200' hem 200 için çalışır)
                status_code_str = str(status_code)
                if status_code_str == '200':
                    logger.info(f"OTP SMS sent successfully to {formatted_phone}")
                    return True
                else:
                    logger.error(f"SMS API error - Code: {status_code}, Message: {status_message}, Full response: {result}")
                    # Özel hata mesajları
                    if status_code_str == '401' or '401' in status_code_str:
                        logger.error("İletiMerkezi API: Üyelik bilgileri hatalı veya API kullanım izni verilmemiş. Lütfen panel.iletimerkezi.com'da 'API kullanımına izin ver' seçeneğini aktifleştirin.")
                    elif status_code_str == '450' or '450' in status_code_str:
                        logger.error(f"İletiMerkezi API: Gönderilen başlık ({self.sender}) kullanıma uygun değil. Lütfen İletiMerkezi panelinde bu başlığın onaylandığından ve doğru yazıldığından emin olun.")
                    return False
            else:
                logger.error(f"SMS API HTTP error: {response.status_code}")
                logger.error(f"SMS API response: {response.text}")
                # Özel hata mesajları
                if response.status_code == 401:
                    logger.error("İletiMerkezi API: 401 Unauthorized - API key/hash hatalı veya API kullanım izni verilmemiş.")
                elif response.status_code == 450:
                    logger.error(f"İletiMerkezi API: 450 - Gönderilen başlık ({self.sender}) kullanıma uygun değil. Lütfen İletiMerkezi panelinde bu başlığın onaylandığından emin olun.")
                return False
                
        except Exception as e:
            logger.error(f"OTP SMS sending failed: {str(e)}")
            return False 