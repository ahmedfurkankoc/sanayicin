from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from core.models import CustomUser
from core.models import ServiceArea, Category, CarBrand
from core.utils import avatar_upload_path
import uuid
from django.utils import timezone
from datetime import datetime, timedelta
from django.contrib.auth import get_user_model

class VendorProfile(models.Model):
	BUSINESS_TYPE_CHOICES = [
		("sahis", "Şahıs Şirketi"),
		("limited", "Limited Şirketi"),
		("anonim", "Anonim Şirketi"),
		("esnaf", "Esnaf"),
	]
	user = models.OneToOneField(CustomUser, on_delete=models.CASCADE, related_name="vendor_profile")
	slug = models.CharField(max_length=50, unique=True, blank=True)
	business_type = models.CharField(max_length=16, choices=BUSINESS_TYPE_CHOICES)
	service_areas = models.ManyToManyField(ServiceArea, blank=True)
	categories = models.ManyToManyField(Category, blank=True)
	car_brands = models.ManyToManyField(CarBrand, verbose_name="Hizmet Verilen Araba Markaları", blank=True)
	company_title = models.CharField(max_length=150)
	tax_office = models.CharField(max_length=100)
	tax_no = models.CharField(max_length=20)
	display_name = models.CharField(max_length=100)
	about = models.TextField(blank=True)
	# Mağaza logosu (kullanıcı avatarından bağımsız)
	# Kaldırıldı: store_logo. Avatar artık CustomUser'dan alınır.
	business_phone = models.CharField(max_length=20)  # İşyeri telefon numarası
	address = models.CharField(max_length=255)
	city = models.CharField(max_length=64)
	district = models.CharField(max_length=64)
	subdistrict = models.CharField(max_length=128)
	# Konum bilgileri (harita için)
	latitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True, help_text="Enlem")
	longitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True, help_text="Boylam")
	# Sosyal medya
	social_media = models.JSONField(default=dict, blank=True)
	# Çalışma saatleri
	working_hours = models.JSONField(default=dict, blank=True)
	# Müsait olmayan tarihler (tatil günleri)
	unavailable_dates = models.JSONField(default=list, blank=True)
	# Yetkili kişi bilgileri (manager_name artık CustomUser'dan alınıyor)
	manager_birthdate = models.DateField()
	manager_tc = models.CharField(max_length=11)
	# manager_phone kaldırıldı - CustomUser'dan alınacak
	created_at = models.DateTimeField(auto_now_add=True)
	updated_at = models.DateTimeField(auto_now=True)

	def __str__(self):
		return f"{self.display_name} ({self.user.email})"
	
	@property
	def phone_number(self):
		"""CustomUser'dan telefon numarasını al"""
		return self.user.phone_number
	
	@property
	def manager_phone(self):
		"""Geriye uyumluluk için property"""
		return self.user.phone_number
	
	@property
	def manager_name(self):
		"""CustomUser'dan manager_name al"""
		return self.user.full_name

	# Kaldırıldı: save_store_logo. Avatar yönetimi CustomUser.avatar üzerinden yapılır.

	def save(self, *args, **kwargs):
		if not self.slug:
			# Benzersiz slug oluştur
			base_slug = f"{self.display_name.lower().replace(' ', '-')}-{str(uuid.uuid4())[:8]}"
			# Türkçe karakterleri değiştir
			base_slug = base_slug.replace('ç', 'c').replace('ğ', 'g').replace('ı', 'i').replace('ö', 'o').replace('ş', 's').replace('ü', 'u')
			# Sadece alfanumerik karakterler ve tire
			import re
			base_slug = re.sub(r'[^a-z0-9-]', '', base_slug)
			self.slug = base_slug
		super().save(*args, **kwargs)


class Appointment(models.Model):
	STATUS_CHOICES = [
		('pending', 'Beklemede'),
		('confirmed', 'Onaylandı'),
		('completed', 'Tamamlandı'),
		('cancelled', 'İptal Edildi'),
		('rejected', 'Reddedildi'),
	]
	
	vendor = models.ForeignKey(VendorProfile, on_delete=models.CASCADE, related_name='appointments')
	client_name = models.CharField(max_length=100)
	client_phone = models.CharField(max_length=20)
	client_email = models.EmailField()
	service_description = models.TextField()
	appointment_date = models.DateField()
	appointment_time = models.TimeField()
	status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
	notes = models.TextField(blank=True)
	created_at = models.DateTimeField(auto_now_add=True)
	updated_at = models.DateTimeField(auto_now=True)
	
	class Meta:
		ordering = ['-created_at']
	
	def __str__(self):
		return f"{self.client_name} - {self.vendor.display_name} - {self.appointment_date}"
	
	@property
	def is_pending(self):
		return self.status == 'pending'
	
	@property
	def is_confirmed(self):
		return self.status == 'confirmed'
	
	@property
	def is_completed(self):
		return self.status == 'completed'
	
	@property
	def is_cancelled(self):
		return self.status in ['cancelled', 'rejected']
	
	@property
	def is_expired(self):
		"""Randevu tarihi geçmiş mi kontrol et"""
		appointment_datetime = datetime.combine(
			self.appointment_date,
			self.appointment_time
		)
		now = timezone.now()
		current_datetime = datetime.combine(now.date(), now.time())
		return appointment_datetime < current_datetime
	
	def auto_cancel_if_expired(self):
			"""Eğer randevu tarihi geçmişse ve pending durumda ise otomatik iptal et"""
			if self.status == 'pending' and self.is_expired:
				self.status = 'cancelled'
				self.save()
				
				# Otomatik iptal bildirim emaili gönder
				try:
					from core.tasks import send_auto_cancellation_email
					appointment_data = {
						'client_name': self.client_name,
						'client_email': self.client_email,
						'vendor_name': self.vendor.display_name,
						'appointment_date': self.appointment_date.strftime('%d.%m.%Y'),
						'appointment_time': self.appointment_time.strftime('%H:%M'),
						'service_description': self.service_description,
					}
					send_auto_cancellation_email.delay(appointment_data)
				except Exception:
					pass  # Email gönderim hatası randevu iptalini etkilememeli
				
				return True
			return False


class Review(models.Model):
	"""Müşteri değerlendirmeleri"""
	vendor = models.ForeignKey(VendorProfile, on_delete=models.CASCADE, related_name='reviews')
	user = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='reviews')
	service = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True, blank=True)
	rating = models.IntegerField(
		validators=[
			MinValueValidator(1, message="Puan en az 1 olmalıdır"),
			MaxValueValidator(5, message="Puan en fazla 5 olabilir")
		],
		help_text="1-5 arası puanlama"
	)
	comment = models.TextField()
	service_date = models.DateField()  # Hizmetin alındığı tarih
	is_read = models.BooleanField(default=False)  # Esnaf tarafından okundu mu?
	created_at = models.DateTimeField(auto_now_add=True)
	updated_at = models.DateTimeField(auto_now=True)

	class Meta:
		ordering = ['-created_at']
		indexes = [
			models.Index(fields=['vendor', 'is_read']),  # Okunmamış yorumları hızlı bulmak için
			models.Index(fields=['vendor', 'created_at']),  # Tarih sıralaması için
		]

	def __str__(self):
		return f"{self.user.full_name} -> {self.vendor.display_name} ({self.rating}★)"


class ServiceRequest(models.Model):
	"""Müşterilerin esnaflardan teklif/talep oluşturduğu kayıt"""
	vendor = models.ForeignKey(VendorProfile, on_delete=models.CASCADE, related_name='service_requests')
	user = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='service_requests')
	service = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True, blank=True)
	REQUEST_TYPE_CHOICES = [
		('appointment', 'Randevu'),
		('quote', 'Fiyat Teklifi'),
		('emergency', 'Acil Yardım'),
		('part', 'Parça Talebi'),
	]
	request_type = models.CharField(max_length=20, choices=REQUEST_TYPE_CHOICES, default='quote')
	vehicle_info = models.CharField(max_length=200, blank=True)
	title = models.CharField(max_length=150)
	description = models.TextField()
	client_phone = models.CharField(max_length=20, blank=True)
	messages = models.JSONField(default=list, blank=True)
	# örn: teklif fiyatı ve gün sayısı (opsiyonel, son mesajda da taşıyacağız)
	last_offered_price = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
	last_offered_days = models.IntegerField(null=True, blank=True)
	attachments = models.JSONField(default=list, blank=True)
	unread_for_vendor = models.BooleanField(default=True)
	status = models.CharField(max_length=20, default='pending', choices=[
		('pending', 'Beklemede'),
		('responded', 'Yanıtlandı'),
		('completed', 'Tamamlandı'),
		('cancelled', 'İptal Edildi'),
		('closed', 'Kapatıldı'),  # legacy/support
	])
	created_at = models.DateTimeField(auto_now_add=True)
	updated_at = models.DateTimeField(auto_now=True)


# ========== Analytics Models ==========
class VendorView(models.Model):
    """Vendor profil görüntüleme kayıtları (owner hariç)."""
    vendor = models.ForeignKey(VendorProfile, on_delete=models.CASCADE, related_name='views')
    viewer = models.ForeignKey(get_user_model(), on_delete=models.SET_NULL, null=True, blank=True, related_name='vendor_views')
    ip_hash = models.CharField(max_length=64, blank=True)
    ua_hash = models.CharField(max_length=64, blank=True)
    month_bucket = models.CharField(max_length=7, help_text="YYYY-MM")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        indexes = [
            models.Index(fields=['vendor', 'month_bucket']),
            models.Index(fields=['vendor', 'created_at']),
        ]
        constraints = [
            models.UniqueConstraint(fields=['vendor', 'ip_hash', 'ua_hash', 'month_bucket'], name='uniq_view_vendor_ip_ua_month')
        ]


class VendorCall(models.Model):
    """Müşteri sayfasından telefon araması tıklamaları."""
    vendor = models.ForeignKey(VendorProfile, on_delete=models.CASCADE, related_name='calls')
    viewer = models.ForeignKey(get_user_model(), on_delete=models.SET_NULL, null=True, blank=True, related_name='vendor_calls')
    phone = models.CharField(max_length=32, blank=True)
    ip_hash = models.CharField(max_length=64, blank=True)
    month_bucket = models.CharField(max_length=7, help_text="YYYY-MM")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        indexes = [
            models.Index(fields=['vendor', 'month_bucket']),
            models.Index(fields=['vendor', 'created_at']),
        ]
        constraints = [
            models.UniqueConstraint(fields=['vendor', 'ip_hash', 'month_bucket'], name='uniq_call_vendor_ip_month')
        ]

 