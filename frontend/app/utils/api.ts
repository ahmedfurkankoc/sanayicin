import axios from 'axios';

// API URL'i .env'den al, yoksa next.config.ts'den, yoksa localhost
// API v1 versiyonlaması: /api/v1/ yapısı kullanılıyor
let apiUrl = process.env.NEXT_PUBLIC_API_URL;
if (!apiUrl) {
  // Development için localhost (v1 versiyonu)
  apiUrl = "http://localhost:8000/api/v1";
} else {
  // API URL'inde /v1/ var mı kontrol et
  if (!apiUrl.includes('/v1')) {
    // /v1/ yoksa ekle (hem /api hem /v1 kontrolü)
  const baseUrl = apiUrl.replace(/\/$/, ''); // Trailing slash'i kaldır
    if (baseUrl.includes('/api')) {
      // /api varsa /v1 ekle: /api -> /api/v1
      apiUrl = baseUrl.replace(/\/api\/?$/, '/api/v1');
    } else {
      // /api yoksa hem /api hem /v1 ekle
      apiUrl = `${baseUrl}/api/v1`;
    }
  }
}

// Production'da HTTPS kontrolü (güvenlik)
if (typeof window !== 'undefined' && window.location.protocol === 'https:') {
  // Frontend HTTPS üzerindeyse, API de HTTPS olmalı
  if (apiUrl.startsWith('http://') && !apiUrl.includes('localhost')) {
    // Production'da console'a yazma (güvenlik)
    if (process.env.NODE_ENV === 'development') {
      console.warn('⚠️ Güvenlik Uyarısı: Frontend HTTPS üzerinde ama API HTTP kullanıyor!');
    }
    // Production'da HTTP'yi HTTPS'ye çevir
    apiUrl = apiUrl.replace('http://', 'https://');
  }
}

// Media base URL (strip trailing /api/v1 for static/media files)
export const mediaBaseUrl = (() => {
  try {
    // /api/v1 veya /api kısmını kaldır
    return apiUrl.replace(/\/api\/v1\/?$/, '').replace(/\/api\/?$/, '');
  } catch {
    return apiUrl;
  }
})();

// Normalize media URLs coming from backend (relative or absolute)
export const resolveMediaUrl = (path?: string | null): string => {
  if (!path || path.trim().length === 0) {
    return '/images/vendor-default.jpg';
  }
  const p = path.trim();
  // Absolute URL ise olduğu gibi döndür
  if (/^https?:\/\//i.test(p)) return p;
  // /media/ ile başlıyorsa Next.js rewrite kullan (relative path bırak)
  if (p.startsWith('/media/')) return p;
  // Diğer / ile başlayan path'ler için mediaBaseUrl ekle
  if (p.startsWith('/')) return `${mediaBaseUrl}${p}`;
  // Relative path için mediaBaseUrl ekle
  return `${mediaBaseUrl}/${p}`;
};

// Role'e göre token key'leri
const getTokenKey = (role: 'vendor' | 'client' = 'vendor') => {
  return role === 'vendor' ? 'esnaf_access_token' : 'client_access_token';
};

const getRefreshTokenKey = (role: 'vendor' | 'client' = 'vendor') => {
  return role === 'vendor' ? 'esnaf_refresh_token' : 'client_refresh_token';
};

const getEmailKey = (role: 'vendor' | 'client' = 'vendor') => {
  return role === 'vendor' ? 'esnaf_email' : 'client_email';
};

// Token'dan role bilgisini al (XSS korumalı)
export const getTokenRole = (token: string): string | null => {
  try {
    // Token format kontrolü
    if (!token || typeof token !== 'string') {
      return null;
    }
    
    const tokenParts = token.split('.');
    if (tokenParts.length !== 3) {
      return null;
    }
    
    // Base64 decode (güvenli)
      const payload = JSON.parse(atob(tokenParts[1]));
    
    // Role validation (sadece geçerli roller)
    const validRoles = ['vendor', 'client', 'admin'];
    const role = payload.role;
    
    if (role && validRoles.includes(role)) {
      return role;
    }
    
    return null;
  } catch (e) {
    // Hata durumunda loglama (production'da console.error kullanmayın)
    if (process.env.NODE_ENV === 'development') {
    console.error('Token decode error:', e);
  }
  return null;
  }
};

// Token'ın geçerli role için olup olmadığını kontrol et
export const isTokenValidForRole = (token: string, expectedRole: 'vendor' | 'client'): boolean => {
  const tokenRole = getTokenRole(token);
  if (!tokenRole) return false;
  
  // Admin her iki role için de geçerli
  if (tokenRole === 'admin') return true;
  
  return tokenRole === expectedRole;
};

// Auth token kontrolü - Session Authentication'da HttpOnly cookie'ler JavaScript ile okunamaz
// Bu fonksiyonlar geriye uyumluluk için bırakıldı ama her zaman null/false döner
// Session durumunu kontrol etmek için context veya API çağrısı kullanın

export const getAuthToken = (role: 'vendor' | 'client' = 'vendor'): string | null => {
  // Session Authentication: HttpOnly cookie'ler JavaScript ile okunamaz
  // Bu fonksiyon geriye uyumluluk için bırakıldı
  // Session durumunu kontrol etmek için context veya API çağrısı kullanın
  return null;
};

export const hasAuthToken = (role: 'vendor' | 'client' = 'vendor'): boolean => {
  // Session Authentication: HttpOnly cookie'ler JavaScript ile okunamaz
  // Bu fonksiyon geriye uyumluluk için bırakıldı
  // Session durumunu kontrol etmek için context veya API çağrısı kullanın
  return false;
};

// Auth header oluşturma artık gerekli değil
// Backend CookieJWTAuthentication cookie'den token'ı okuyacak
export const getAuthHeaders = (role: 'vendor' | 'client' = 'vendor') => {
  // HttpOnly cookie'ler otomatik gönderilir (withCredentials: true sayesinde)
  // Manuel header eklemeye gerek yok
  return {};
};

// Token kaydetme artık gerekli değil
// Backend login/refresh endpoint'leri token'ı HttpOnly cookie'ye yazıyor
export const setAuthToken = (role: 'vendor' | 'client', token: string) => {
  // Artık token'ı frontend'de saklamıyoruz
  // Backend HttpOnly cookie'ye yazıyor
  // Bu fonksiyon geriye uyumluluk için boş bırakıldı
  if (process.env.NODE_ENV === 'development') {
    console.warn('setAuthToken is deprecated - tokens are now stored in HttpOnly cookies by backend');
  }
};

// Refresh token'ı kaydet - sadece cookie'ye
// Refresh token'ı JS tarafında saklamıyoruz (HttpOnly cookie server set edecek)

// Email'i kaydet - localStorage'a (cookie'ye hassas bilgi yazmıyoruz)
export const setAuthEmail = (role: 'vendor' | 'client', email: string) => {
  if (typeof window === "undefined") return;
  
  // Email'i localStorage'a kaydet (cookie'ye hassas bilgi yazmıyoruz)
  const storageKey = role === 'vendor' ? 'esnaf_email' : 'client_email';
  try {
    localStorage.setItem(storageKey, email);
  } catch (e) {
    // localStorage kullanılamıyorsa sessizce geç
  }
};

// Token'ları sil - sadece cookie'den
export const clearAuthTokens = (role: 'vendor' | 'client') => {
  if (typeof window === "undefined") return;
  
  // Cookie'lerden sil
  const tokenCookieName = role === 'vendor' ? 'vendor_token' : 'client_token';
  const emailCookieName = role === 'vendor' ? 'esnaf_email' : 'client_email';
  
  document.cookie = `${tokenCookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
  document.cookie = `${emailCookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
};

// Tüm auth verilerini sil - sadece cookie'den
export const clearAllAuthData = () => {
  if (typeof window === "undefined") return;
  
  // Cookie'lerden sil
  document.cookie = 'vendor_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
  document.cookie = 'client_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
  document.cookie = 'esnaf_email=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
  document.cookie = 'client_email=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
};

// Güvenlik: Input sanitization fonksiyonları
const sanitizeString = (str: string): string => {
  return str.trim().replace(/[<>"']/g, '');
};

const validateEmail = (email: string): boolean => {
  return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email);
};

const validateTC = (tc: string): boolean => {
  return /^\d{11}$/.test(tc);
};

const validatePhone = (phone: string): boolean => {
  return /^[\d\s\-\+\(\)]{10,15}$/.test(phone);
};

const validateTaxNo = (taxNo: string): boolean => {
  return /^\d{10}$/.test(taxNo);
};

// Güvenlik: Register data validation
const validateRegisterData = (data: any, role: 'vendor' | 'client' = 'vendor'): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  // Email kontrolü
  if (!data.email || !validateEmail(data.email)) {
    errors.push("Geçersiz e-posta adresi");
  }

  // Şifre kontrolü
  if (!data.password || data.password.length < 6) {
    errors.push("Şifre en az 6 karakter olmalı");
  }

  if (data.password !== data.password2) {
    errors.push("Şifreler eşleşmiyor");
  }

  // Role'e göre farklı validasyonlar
  if (role === 'vendor') {
    // Vendor için ek validasyonlar
    const validBusinessTypes = ["sahis", "limited", "anonim", "esnaf"];
    if (!data.business_type || !validBusinessTypes.includes(data.business_type)) {
      errors.push("Geçersiz işletme türü");
    }

    // TC kontrolü
    if (!data.manager_tc || !validateTC(data.manager_tc)) {
      errors.push("Geçersiz TC kimlik numarası");
    }

    // Telefon kontrolü
    if (!data.manager_phone || !validatePhone(data.manager_phone)) {
      errors.push("Geçersiz telefon numarası");
    }

    // Vergi numarası kontrolü - işletme türüne göre
    const isIndividualBusiness = data.business_type === "sahis" || data.business_type === "esnaf";
    if (isIndividualBusiness) {
      // Şahıs/Esnaf için TC kimlik numarası (11 haneli)
      if (!data.tax_no || !validateTC(data.tax_no)) {
        errors.push("Geçersiz TC kimlik numarası");
      }
    } else {
      // Şirket için vergi numarası (10 haneli)
      if (!data.tax_no || !validateTaxNo(data.tax_no)) {
        errors.push("Geçersiz vergi numarası");
      }
    }


  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

// API instance oluştur - Session Authentication için
export const apiClient = axios.create({
  baseURL: apiUrl,
  withCredentials: true, // Session cookie gönderilsin (HttpOnly, Secure)
  headers: {
    'Content-Type': 'application/json',
  },
});

// CSRF token yönetimi - Django CSRF token'ı al
let csrfToken: string | null = null;
let csrfTokenTimestamp: number = 0;
const CSRF_TOKEN_CACHE_DURATION = 30 * 60 * 1000; // 30 dakika cache (CSRF token genelde uzun süre geçerli)

export const getCsrfToken = async (): Promise<string | null> => {
  // Cache'deki token hala geçerliyse kullan
  const now = Date.now();
  if (csrfToken && (now - csrfTokenTimestamp) < CSRF_TOKEN_CACHE_DURATION) {
    return csrfToken;
  }
  
  try {
    // CSRF token'ı backend'den al
    const response = await axios.get(`${apiUrl}/auth/csrf/`, { withCredentials: true });
    if (response.data.csrf_token) {
      csrfToken = response.data.csrf_token;
      csrfTokenTimestamp = now;
      return csrfToken;
    }
  } catch (e) {
    // CSRF token alınamadı - rate limit veya network hatası
    // Cache'deki eski token'ı kullan (eğer varsa)
    if (csrfToken) {
      return csrfToken;
    }
  }
  return null;
};

// CSRF token'ı set et (login response'undan)
export const setCsrfToken = (token: string | null) => {
  csrfToken = token;
  csrfTokenTimestamp = token ? Date.now() : 0; // Token set edildiğinde timestamp'i güncelle
};

// Request interceptor - CSRF token ve HttpOnly cookie'ler
apiClient.interceptors.request.use(async (config) => {
  // withCredentials: true zaten apiClient'da set edildi
  // Bu sayede HttpOnly cookie'ler otomatik gönderilir
  
  // Public endpoint'ler için CSRF token gerekli değil (login, register, analytics gibi)
  const publicEndpoints = [
    '/auth/login/', 
    '/auth/register/', 
    '/auth/logout/', 
    '/clients/register/', 
    '/vendors/register/',
    '/analytics/view/',
    '/analytics/call/'
  ];
  const isPublicEndpoint = publicEndpoints.some(endpoint => config.url?.includes(endpoint));
  
  // Public endpoint değilse CSRF token ekle (GET dahil - Django REST Framework Session Auth için gerekli olabilir)
  if (!isPublicEndpoint) {
    // CSRF token yoksa veya cache süresi dolmuşsa al
    const now = Date.now();
    if (!csrfToken || (now - csrfTokenTimestamp) >= CSRF_TOKEN_CACHE_DURATION) {
      csrfToken = await getCsrfToken();
  }
  
    // CSRF token'ı header'a ekle (GET istekleri için de - Django REST Framework Session Auth için)
    if (csrfToken) {
      config.headers['X-CSRFToken'] = csrfToken;
    }
  }

  return config;
});

// Response interceptor - 401 hatası durumunda logout
// Session Authentication'da refresh token yok, session otomatik yenilenir
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const status = error.response?.status;
    
    // 401/403 hataları normal (session yok) - sessizce handle et
    // Sadece authenticated istekler için 401 durumunda logout yap
    if (status === 401 && !originalRequest._retry) {
      // Public endpoint'ler için 401 normal - sessizce reject et
      const publicEndpoints = ['/auth/login/', '/auth/register/', '/auth/logout/', '/clients/register/', '/vendors/register/'];
      const isPublicEndpoint = publicEndpoints.some(endpoint => originalRequest.url?.includes(endpoint));
      
      if (!isPublicEndpoint) {
      originalRequest._retry = true;
        // Session Authentication'da 401 hatası = session süresi dolmuş veya geçersiz
        // Logout yap ve login sayfasına yönlendir
        try {
          await axios.post(`${apiUrl}/auth/logout/`, {}, { withCredentials: true });
        } catch (logoutError) {
          // Logout hatası önemsiz - sessizce handle et
        }
        // Frontend'de sayfayı yenile veya login sayfasına yönlendir
        if (typeof window !== 'undefined') {
          window.location.href = '/esnaf/giris';
        }
      }
    }
    
    // 429 hatası - Rate limit aşıldı
    if (status === 429) {
      // Retry-After header'ından bekleme süresini al (saniye cinsinden)
      // Header case-insensitive olabilir, bu yüzden hem küçük hem büyük harf kontrol et
      const retryAfterHeader = error.response?.headers?.['retry-after'] 
        || error.response?.headers?.['Retry-After']
        || error.response?.headers?.get?.('retry-after');
      
      const retryAfter = retryAfterHeader 
        ? parseInt(String(retryAfterHeader), 10) 
        : 3600; // Varsayılan: 1 saat (3600 saniye)
      
      // Rate limit error sayfasına yönlendir
      if (typeof window !== 'undefined') {
        // URL'e retry-after parametresi ekle (saniye cinsinden)
        window.location.href = `/hata/rate-limit?retry=${retryAfter}`;
        return Promise.reject(error);
      }
    }
    
    // 403 hatası normal (session yok veya yetki yok) - sessizce reject et
    // Production'da console'a yazma
    if (status === 403 && process.env.NODE_ENV === 'development') {
      // Sadece development'ta log (debug için)
      // Production'da sessizce handle et
    }
    
    return Promise.reject(error);
  }
);

// Ortak API fonksiyonları
export const api = {
  // Blog - public
  listBlogPosts: (params?: { page?: number; page_size?: number; search?: string; category?: string; ordering?: string }) =>
    apiClient.get('/blog/posts/', { params }),
  listBlogPostsByCategory: (categorySlug: string, params?: { page?: number; page_size?: number; ordering?: string }) =>
    apiClient.get('/blog/posts/', { params: { ...params, category: categorySlug } }),
  listBlogCategories: () => apiClient.get('/blog/categories/'),
  getBlogPost: (slug: string) => apiClient.get(`/blog/posts/${slug}/`),
  getRelatedBlogPosts: (slug: string) => apiClient.get(`/blog/posts/${slug}/related/`),
  // Profil işlemleri - Role'e göre farklı endpoint'ler
  getProfile: (role: 'vendor' | 'client' = 'vendor') => 
    apiClient.get(role === 'vendor' ? '/vendors/profile/' : '/clients/profile/'),
  
  updateProfile: (data: FormData, role: 'vendor' | 'client' = 'vendor', encryptedToken?: string, smsCode?: string) => {
    // OTP ile güncelleme için token ve sms_code ekle (backend'de token field'ı bekleniyor)
    if (encryptedToken && smsCode) {
      data.append('token', encryptedToken);
      data.append('sms_code', smsCode);
    }
    return apiClient.patch(role === 'vendor' ? '/vendors/profile/' : '/clients/profile/', data, {
      headers: { "Content-Type": "multipart/form-data" }
    });
  },
  
  // Hizmet alanları ve kategoriler (ortak)
  getServiceAreas: () => apiClient.get('/services/'),
  getCategories: () => apiClient.get('/categories/'),
  getCategoriesByServiceArea: (serviceAreaId: string) => 
    apiClient.get(`/categories/?service_area=${serviceAreaId}`),
  
  // Araç markaları
  getCarBrands: () => apiClient.get('/car-brands/'),
  
  // Vendor arama sonuçları
  searchVendors: (params: { city?: string; district?: string; service?: string; category?: string; carBrand?: string; page?: string; page_size?: number; q?: string; ordering?: string }) => 
    apiClient.get('/vendors/search/', { params }),
  
  // Vendor detay sayfası
  getVendorDetail: (slug: string) => 
    apiClient.get(`/vendors/${slug}/`),
  // Analytics & Summary
  vendorTrackView: (slug: string) => apiClient.post(`/vendors/${slug}/analytics/view/`, {}),
  vendorTrackCall: (slug: string, phone: string) => apiClient.post(`/vendors/${slug}/analytics/call/`, { phone }),
  getVendorDashboardSummary: () => apiClient.get(`/vendors/dashboard/summary/`),
  
  // Avatar upload - vendor ve client için ortak endpoint
  uploadAvatar: (data: FormData, role: 'vendor' | 'client' = 'vendor') => 
    apiClient.post('/avatar/upload/', data, {
      headers: { "Content-Type": "multipart/form-data" }
    }),
  
  // Vendor görsel yönetimi
  getVendorImages: () => apiClient.get('/vendors/profile/images/'),
  uploadVendorImage: (data: FormData) => 
    apiClient.post('/vendors/profile/images/', data, {
      headers: { "Content-Type": "multipart/form-data" }
    }),
  updateVendorImage: (id: number, data: FormData) => 
    apiClient.patch(`/vendors/profile/images/${id}/`, data, {
      headers: { "Content-Type": "multipart/form-data" }
    }),
  deleteVendorImage: (id: number) => 
    apiClient.delete(`/vendors/profile/images/${id}/`),
  
  // Auth işlemleri - Tek endpoint kullan
  login: (data: { email: string; password: string }) => 
    apiClient.post('/auth/login/', data),

  // Access refresh - HttpOnly cookie kullanır
  refreshAccessToken: () => axios.post(`${apiUrl}/auth/token/refresh/`, {}, { withCredentials: true }),

  // Logout - refresh cookie server tarafında temizlenir
  logout: () => apiClient.post('/auth/logout/', {}),
  
  // Register - Role'e göre farklı endpoint'ler
  register: (data: any, role: 'vendor' | 'client' = 'vendor') => {
    // FormData kontrolü
    if (data instanceof FormData) {
      // FormData için validation yapmaya gerek yok, backend'de yapılacak
      const endpoint = role === 'vendor' ? '/vendors/register/' : '/clients/register/';
      return apiClient.post(endpoint, data, {
        headers: { "Content-Type": "multipart/form-data" }
      });
    }

    // Normal data için input sanitization
    const sanitizedData = {
      ...data,
      email: data.email ? data.email.trim() : '',
      company_title: data.company_title ? sanitizeString(data.company_title) : '',
      display_name: data.display_name ? sanitizeString(data.display_name) : '',
      manager_name: data.manager_name ? sanitizeString(data.manager_name) : '',
      tax_office: data.tax_office ? sanitizeString(data.tax_office) : '',
      city: data.city ? sanitizeString(data.city) : '',
      district: data.district ? sanitizeString(data.district) : '',
      subdistrict: data.subdistrict ? sanitizeString(data.subdistrict) : '',
      address: data.address ? sanitizeString(data.address) : '',
      phone_number: data.phone_number ? data.phone_number.trim() : '',
    };

    // Validation
    const validation = validateRegisterData(sanitizedData, role);
    if (!validation.isValid) {
      return Promise.reject({
        response: {
          status: 400,
          data: { detail: validation.errors.join(', ') }
        }
      });
    }

    const endpoint = role === 'vendor' ? '/vendors/register/' : '/clients/register/';
    return apiClient.post(endpoint, sanitizedData);
  },
  
  
  // Email verification işlemleri (ortak)
  sendVerificationEmail: (data: { email: string }) => 
    apiClient.post('/auth/send-verification/', data),
  
  verifyEmail: (data: { token: string }) => 
    apiClient.post('/auth/verify-email/', data),
  
  resendVerificationEmail: (data: { email: string }) => 
    apiClient.post('/auth/resend-verification/', data),

  // SMS verification işlemleri (ortak)
  sendSMSVerification: (data: { email: string; phone_number: string }) => 
    apiClient.post('/auth/send-sms-verification/', data),
  
  verifySMSCode: (data: { email: string; code: string }) => 
    apiClient.post('/auth/verify-sms-code/', data),
  
  checkVerificationStatus: () => 
    apiClient.get('/auth/check-verification-status/'),

  // Kayıt OTP doğrulama
  verifyRegistrationOTP: (data: { token: string; sms_code: string }) => 
    apiClient.post('/clients/verify-registration-otp/', data),

  // Şifre sıfırlama işlemleri
  forgotPassword: (data: { email: string }) => 
    apiClient.post('/auth/forgot-password/', data),
  
  resetPassword: (data: { uidb64?: string; token?: string; new_password: string; encrypted_token?: string; sms_code?: string }) => 
    apiClient.post('/auth/reset-password/', data),
  
  // Şifre belirleme/değiştirme (OTP ile)
  setPassword: (data: { email: string; password: string; password2: string; encrypted_token?: string; sms_code?: string }, role: 'vendor' | 'client' = 'vendor') => 
    apiClient.post(role === 'vendor' ? '/vendors/set-password/' : '/clients/set-password/', data),

  // Appointment işlemleri
  getVendorAppointments: () => 
    apiClient.get('/vendors/appointments/'),
  
  updateAppointmentStatus: (appointmentId: number, action: string) => 
    apiClient.post(`/vendors/appointments/${appointmentId}/${action}/`),
  
  createAppointment: (data: {
    client_name: string;
    client_phone: string;
    client_email: string;
    service_description: string;
    appointment_date: string;
    appointment_time: string;
    notes?: string;
  }, vendorSlug: string) => 
    apiClient.post(`/vendors/${vendorSlug}/appointments/`, data),
  
  // Client appointment işlemleri
  getClientAppointments: (email: string) => 
    apiClient.get('/vendors/client/appointments/', { params: { email } }),
  
  // Chat API
  chatCreateConversation: (otherUserId: number) => 
    apiClient.post('/chat/conversations/', { other_user_id: otherUserId }),
  chatListConversations: () => apiClient.get('/chat/conversations/'),
  chatGetMessages: (conversationId: number, params?: { offset?: number; limit?: number }) =>
    apiClient.get(`/chat/conversations/${conversationId}/messages`, { params }),
  chatSendMessageREST: (conversationId: number, content: string) =>
    apiClient.post(`/chat/conversations/${conversationId}/messages`, { content }),
  chatMarkRead: (conversationId: number) =>
    apiClient.post(`/chat/conversations/${conversationId}/read`, {}),
  chatDeleteConversation: (conversationId: number) =>
    apiClient.delete(`/chat/conversations/${conversationId}/messages`),

  // Notifications API
  clearNotifications: (messageIds: number[] = []) =>
    apiClient.post('/notifications/clear/', { message_ids: messageIds }),
  
  // Support Center API
  createSupportTicket: (data: FormData | {
    role?: 'vendor' | 'client' | 'unknown';
    requester_email: string;
    requester_name?: string;
    subject: string;
    category?: string;
    message: string;
    priority?: 'low' | 'normal' | 'high' | 'urgent';
    attachment?: File;
  }) => apiClient.post('/support/tickets/', data, {
    headers: (data instanceof FormData) ? { 'Content-Type': 'multipart/form-data' } : undefined
  }),
  getSupportTicketStatus: (publicId: string) => apiClient.get(`/support/tickets/${publicId}/`),
  getSupportTicketDetails: (ticketId: string) => apiClient.get(`/support/tickets/${ticketId}/details/`),
  sendSupportMessage: (ticketId: string, message: string) => apiClient.post(`/support/tickets/${ticketId}/reply/`, { message }),
  getMySupportTickets: () => apiClient.get('/support/my-tickets/'),
  
  // Favorites API
  getFavorites: () => apiClient.get('/favorites/'),
  addFavorite: (vendorId: number) => apiClient.post('/favorites/add/', { vendor: vendorId }),
  removeFavorite: (vendorId: number) => apiClient.delete(`/favorites/${vendorId}/`),
  checkFavorite: (vendorId: number) => apiClient.get(`/favorites/${vendorId}/check/`),

  // Reviews API
  getVendorReviews: (vendorSlug: string) => apiClient.get(`/vendors/${vendorSlug}/reviews/`),
  createReview: (vendorSlug: string, data: {
    service: number;
    rating: number;
    comment: string;
    service_date: string;
  }) => apiClient.post(`/vendors/${vendorSlug}/reviews/`, data),
  getUnreadReviewCount: () => apiClient.get('/vendors/reviews/unread_count/'),
  markReviewAsRead: (reviewId: number) => apiClient.post(`/vendors/reviews/${reviewId}/mark_as_read/`),

  // Client to Vendor Upgrade
  clientToVendorUpgrade: (data: FormData) => 
    apiClient.post('/vendors/client-upgrade/', data, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }),

  // Service Requests (Teklif/Talep)
  createServiceRequest: (
    vendorSlug: string,
    data: { service?: number; title: string; description: string; request_type?: 'appointment' | 'quote' | 'emergency' | 'part'; vehicle_info?: string }
  ) => apiClient.post(`/vendors/${vendorSlug}/service-requests/`, data),
  listVendorServiceRequests: (params?: { status?: 'pending' | 'responded' | 'completed' | 'cancelled' | 'closed'; last_days?: number; only_pending?: boolean; only_quotes?: boolean }) =>
    apiClient.get('/vendors/service-requests/', { params }),
  getServiceRequestDetails: (id: number, role: 'vendor' | 'client' = 'vendor') =>
    apiClient.get(role === 'vendor' ? '/vendors/service-requests/' : '/vendors/client/service-requests/', { params: { id } }),
  getVendorServiceRequestsUnreadCount: () =>
    apiClient.get('/vendors/service-requests/unread_count/'),
  vendorReplyServiceRequest: (id: number, data: { message: string; phone?: string; price?: number; days?: number }) =>
    apiClient.post(`/vendors/service-requests/${id}/reply/`, data),
  vendorMarkServiceRequestRead: (id: number) =>
    apiClient.post(`/vendors/service-requests/${id}/mark_read/`, {}),
  vendorUpdateServiceRequestStatus: (id: number, status: 'pending' | 'responded' | 'completed' | 'cancelled', cancellationReason?: string) => {
    const payload: any = { status };
    if (status === 'cancelled' && cancellationReason) {
      payload.cancellation_reason = cancellationReason;
    }
    return apiClient.post(`/vendors/service-requests/${id}/status/`, payload);
  },
  // Client-side requests
  listClientServiceRequests: (params?: { status?: 'pending' | 'responded' | 'completed' | 'cancelled' | 'closed'; last_days?: number }) =>
    apiClient.get('/vendors/client/service-requests/', { params }),
  clientReplyServiceRequest: (id: number, data: { message: string }) =>
    apiClient.post(`/vendors/client/service-requests/${id}/reply/`, data),

  // Vehicles (client)
  listVehicles: () => apiClient.get('/vehicles/'),
  createVehicle: (data: {
    brand: string;
    model: string;
    year?: number | string;
    plate?: string;
    engine_type?: 'benzin' | 'dizel' | 'hibrit' | 'elektrik' | '';
    kilometre?: number | string;
    periodic_due_km?: number | string;
    periodic_due_date?: string;
    last_maintenance_notes?: string;
    inspection_expiry?: string;
    exhaust_emission_date?: string;
    tire_change_date?: string;
    traffic_insurance_expiry?: string;
    casco_expiry?: string;
  }) => apiClient.post('/vehicles/', data),
  updateVehicle: (id: number, data: Partial<{
    brand: string;
    model: string;
    year: number | string;
    plate: string;
    engine_type: 'benzin' | 'dizel' | 'hibrit' | 'elektrik' | '';
    kilometre: number | string;
    periodic_due_km: number | string;
    periodic_due_date: string;
    last_maintenance_notes: string;
    inspection_expiry: string;
    exhaust_emission_date: string;
    tire_change_date: string;
    traffic_insurance_expiry: string;
    casco_expiry: string;
  }>) => apiClient.patch(`/vehicles/${id}/`, data),
  deleteVehicle: (id: number) => apiClient.delete(`/vehicles/${id}/`),

  // Location APIs
  updateVendorLocation: (data: { latitude: number; longitude: number }) =>
    apiClient.post('/vendors/location/update/', data),
  getVendorLocation: (slug: string) =>
    apiClient.get(`/vendors/${slug}/location/`),
  getNearbyVendors: (params: { latitude: number; longitude: number; radius?: number }) =>
    apiClient.get('/vendors/nearby/', { params }),
}; 