## Zorunlu Uyumluluk ve Güvenlik Gereklilikleri (KVKK/ETK Odaklı)

Bu proje kapsamındaki minimum (zorunlu) gerekliliklerin özeti aşağıdadır. Her başlık için dokümantasyon, uygulama ve kanıt niteliğinde log tutulması gerekir.

- Gizlilik/Aydınlatma Metni (KVKK)
  - Veri sorumlusu bilgileri
  - İşlenen kişisel veri kategorileri ve amaçları (üyelik, esnaf doğrulama, konumla en yakın usta bulma, sohbet vb.)
  - Hukuki sebepler (açık rıza, sözleşmenin ifası, meşru menfaat, kanuni yükümlülük)
  - Aktarılan alıcı grupları (barındırma, mesajlaşma, analitik hizmet sağlayıcıları vb.)
  - Saklama süreleri (kategori bazlı)
  - Yurt dışına aktarım varsa hukuki dayanak ve koruma önlemleri
  - İlgili kişi hakları (KVKK m.11) ve başvuru kanalları

- Çerez Politikası ve İzin Yönetimi (CMP)
  - Zorunlu/performans/pazarlama çerezlerinin ayrımı ve amacı
  - Açık rıza gerektiren çerezler için öncesinde set edilmemesi
  - Kullanıcı tercihlerini kayıt altına alma (versiyon, tarih/saat, IP/cihaz bilgisi)

- Ticari Elektronik İleti İzni (ETK)
  - E-posta/SMS/push için ayrı ve açık onay
  - Her iletide kolay vazgeçme (unsubscribe) imkânı
  - Onay/ret kayıtlarının (log) saklanması

- Kullanım Koşulları / Üyelik Sözleşmesi
  - Platform kullanım kuralları, yasaklı davranışlar
  - Sorumluluk sınırlamaları, uyuşmazlık çözümü
  - Esnaf/müşteri rollerine ilişkin özel hükümler

- Güvenli İletişim ve Kimlik Doğrulama
  - Tüm trafik için TLS 1.2+ (HSTS etkin)
  - Parola saklama: Argon2id veya güçlü bcrypt yapılandırması
  - Oturum/token yönetimi: kısa ömürlü erişim token’ı + refresh; refresh revoke listesi
  - Brute-force ve giriş denemelerinde hız kısıtlama (rate limit)

- Erişim Kontrolü ve Yetkilendirme
  - Rol/claim tabanlı yetkilendirme (müşteri, esnaf, admin)
  - Nesne/satır düzeyi erişim kontrolleri

- Sohbet ve İçerik Güvenliği
  - Transit’te şifreleme (TLS) zorunlu
  - At-rest şifreleme: disk/DB düzeyinde şifreleme zorunlu
  - Saklama süresi belirleme (örn. 12–24 ay) ve süre sonunda silme/anonimleştirme
  - Uygunsuz içerik bildirimi ve kaldırma prosedürü

- Konum Verisi
  - Hassas/precise konum için açık rıza
  - Minimum gereklilik ilkesi: mümkünse şehir/ilçe seviyesinde saklama

- Loglama ve Denetim İzleri
  - Erişim, kritik işlem ve rıza/tercih logları
  - PII minimizasyonu; log saklama süresi ve erişim kısıtları

- Yedekleme ve Felaket Kurtarma
  - Şifreli yedekler, periyodik kurtarma testleri
  - Yedek erişimlerinin kayıt altına alınması

- İhlal Bildirimi ve Süreçler
  - Kişisel veri ihlali prosedürü (tespit, sınıflandırma, bildirim)
  - Gerekli hallerde Kurum ve kullanıcı bildirimleri için akış

- VERBIS ve Veri Envanteri
  - VERBIS yükümlülüğü değerlendirmesi (eşiklere göre)
  - Kişisel veri işleme envanteri ve saklama süreleri kaydı

- Veri Tabanı Zorunlulukları (Asgari)
  - TDE/volume encryption veya eşdeğeri at-rest koruma
  - Parolalar için Argon2id/bcrypt
  - Silme/anonimleştirme fonksiyonları (hak başvurusu ve süre dolumu)

- Üçüncü Taraflarla Sözleşmeler (DPA)
  - Barındırma, analitik, e-posta/SMS sağlayıcıları ile veri işleme sözleşmeleri
  - Alt işleyenlerin listesi ve güncel tutulması

Not: Bu liste “asgari” gereklilikleri özetler. İş modeline göre ek yükümlülükler (e‑ticaret sözleşmeleri, faturalama, kimlik doğrulama seviyeleri) doğabilir.

