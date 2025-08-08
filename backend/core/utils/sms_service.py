import requests
import re
from typing import Optional
from django.conf import settings
import logging

logger = logging.getLogger(__name__)

class IletiMerkeziSMS:
    """İletiMerkezi SMS API entegrasyonu"""
    
    def __init__(self):
        self.api_name = "sanayicin"
        self.api_key = "711e51aeadb744a450ce26ce9818fb25"
        self.hash = "5d06d66f0bc1735de773131daec43808f34d5523a9ef56ecce64d6c19eab33af"
    
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
                        "sender": "APITEST",
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
                "https://api.iletimerkezi.com/v1/send-sms/json",
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
                        "sender": "APITEST",
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
                "https://api.iletimerkezi.com/v1/send-sms/json",
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
                        "sender": "APITEST",
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
                "https://api.iletimerkezi.com/v1/send-sms/json",
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
                "https://api.iletimerkezi.com/v1/get-balance/json",
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
                "api_name": self.api_name,
                "api_key": self.api_key,
                "hash": self.hash,
                "start_date": start_date,
                "end_date": end_date
            }
            
            response = requests.post(
                f"{self.base_url}/get-reports",
                json=payload,
                timeout=30
            )
            
            if response.status_code == 200:
                return response.json()
            else:
                return None
                
        except Exception as e:
            logger.error(f"Reports fetch failed: {str(e)}")
            return None 