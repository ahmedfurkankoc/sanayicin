import axios from 'axios';

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api";

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

// Auth token'ı al
export const getAuthToken = (role: 'vendor' | 'client' = 'vendor'): string | null => {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(getTokenKey(role));
};

// Auth header'ı oluştur
export const getAuthHeaders = (role: 'vendor' | 'client' = 'vendor') => {
  const token = getAuthToken(role);
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// Token'ı kaydet
export const setAuthToken = (role: 'vendor' | 'client', token: string) => {
  if (typeof window === "undefined") return;
  localStorage.setItem(getTokenKey(role), token);
};

// Refresh token'ı kaydet
export const setRefreshToken = (role: 'vendor' | 'client', token: string) => {
  if (typeof window === "undefined") return;
  const refreshKey = role === 'vendor' ? 'esnaf_refresh_token' : 'client_refresh_token';
  localStorage.setItem(refreshKey, token);
};

// Email'i kaydet
export const setAuthEmail = (role: 'vendor' | 'client', email: string) => {
  if (typeof window === "undefined") return;
  localStorage.setItem(getEmailKey(role), email);
};

// Token'ları sil
export const clearAuthTokens = (role: 'vendor' | 'client') => {
  if (typeof window === "undefined") return;
  localStorage.removeItem(getTokenKey(role));
  localStorage.removeItem(getRefreshTokenKey(role));
  localStorage.removeItem(getEmailKey(role));
};

// Tüm auth verilerini sil
export const clearAllAuthData = () => {
  if (typeof window === "undefined") return;
  localStorage.removeItem('esnaf_access_token');
  localStorage.removeItem('esnaf_refresh_token');
  localStorage.removeItem('esnaf_email');
  localStorage.removeItem('client_access_token');
localStorage.removeItem('client_refresh_token');
localStorage.removeItem('client_email');
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

// API instance oluştur
export const apiClient = axios.create({
  baseURL: apiUrl,
});

// Request interceptor - her istekte token ekle
apiClient.interceptors.request.use((config) => {
  // Arama endpoint'leri herkese açık olmalı - token kontrolü yapma
  const isPublicEndpoint = config.url?.includes('/vendors/search/') || 
                          config.url?.includes('/vendors/') && config.url?.includes('/slug/') ||
                          config.url?.includes('/services/') ||
                          config.url?.includes('/categories/') ||
                          config.url?.includes('/vendors/car-brands/');
  
  if (isPublicEndpoint) {
    return config; // Token ekleme, herkese açık
  }
  
  // Role'ü URL'den ve mevcut sayfa yolundan tahmin et
  const isVendorUrl = config.url?.includes('/vendors/') || 
                      config.url?.includes('/esnaf/') || 
                      config.url?.includes('/avatar/upload/');
  
  // Chat endpoint'leri için özel logic
  const isChatEndpoint = config.url?.startsWith('/chat/');
  
  // Profile endpoint'i için özel logic
  const isProfileEndpoint = config.url?.includes('/profile/');
  
  // Esnaf panelinde isek chat çağrıları vendor rolüyle yapılmalı
  const isEsnafContext = typeof window !== 'undefined' && window.location?.pathname?.startsWith('/esnaf');
  
  let role: 'vendor' | 'client' = 'client'; // Default client
  
  if (isChatEndpoint) {
    // Chat endpoint'leri için: hem vendor hem client token'ları kontrol et
    const vendorToken = localStorage.getItem('esnaf_access_token');
    const clientToken = localStorage.getItem('client_access_token');
    
    if (vendorToken && !clientToken) {
      role = 'vendor';
    } else if (clientToken && !vendorToken) {
      role = 'client';
    } else if (vendorToken && clientToken) {
      // Her iki token da varsa, mevcut sayfadan karar ver
      role = isEsnafContext ? 'vendor' : 'client';
    } else {
      // Hiç token yoksa, mevcut sayfadan karar ver
      role = isEsnafContext ? 'vendor' : 'client';
    }
  } else if (isProfileEndpoint) {
    // Profile endpoint'i için: hem vendor hem client token'ları kontrol et
    const vendorToken = localStorage.getItem('esnaf_access_token');
    const clientToken = localStorage.getItem('client_access_token');
    
    if (vendorToken && !clientToken) {
      role = 'vendor';
    } else if (clientToken && !vendorToken) {
      role = 'client';
    } else if (vendorToken && clientToken) {
      // Her iki token da varsa, mevcut sayfadan karar ver
      role = isEsnafContext ? 'vendor' : 'client';
    } else {
      // Hiç token yoksa, mevcut sayfadan karar ver
      role = isEsnafContext ? 'vendor' : 'client';
    }
  } else {
    // Diğer endpoint'ler için eski logic
    role = isEsnafContext ? 'vendor' : (isVendorUrl ? 'vendor' : 'client');
  }
  
  const token = getAuthToken(role);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  // Chat endpoint'leri için artık guest token gerekmiyor - sadece authenticated user'lar
  return config;
});

// Response interceptor - 401 hatası durumunda logout
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Arama endpoint'leri herkese açık olmalı - logout yapma
      const isPublicEndpoint = error.config?.url?.includes('/vendors/search/') || 
                              error.config?.url?.includes('/vendors/') && error.config?.url?.includes('/slug/') ||
                              error.config?.url?.includes('/services/') ||
                              error.config?.url?.includes('/categories/') ||
                              error.config?.url?.includes('/vendors/car-brands/') ||
                              error.config?.url?.includes('/profile/')
      
      if (isPublicEndpoint) {
        return Promise.reject(error); // Logout yapma, sadece hatayı döndür
      }
      
      // Profile endpoint'i için de logout yapma - sadece hatayı döndür
      if (error.config?.url?.includes('/profile/')) {
        return Promise.reject(error);
      }
      
      // Token geçersiz, logout yap
      if (typeof window !== "undefined") {
        // Mevcut token'ları kontrol et - hangi role'ün token'ı varsa o role'ü kullan
        const vendorToken = localStorage.getItem('esnaf_access_token');
        const clientToken = localStorage.getItem('client_access_token');
        
        let role: 'vendor' | 'client' = 'vendor'; // Default vendor
        
        if (vendorToken && !clientToken) {
          role = 'vendor';
        } else if (clientToken && !vendorToken) {
          role = 'client';
        } else if (vendorToken && clientToken) {
          // Her iki token da varsa, URL'den tahmin et
          const isVendorUrl = error.config?.url?.includes('/vendors/') || 
                              error.config?.url?.includes('/esnaf/') || 
                              error.config?.url?.includes('/avatar/upload/');
          role = isVendorUrl ? 'vendor' : 'client';
        } else {
          // Hiç token yoksa, URL'den tahmin et
          const isVendorUrl = error.config?.url?.includes('/vendors/') || 
                              error.config?.url?.includes('/esnaf/') || 
                              error.config?.url?.includes('/avatar/upload/');
          role = isVendorUrl ? 'vendor' : 'client';
        }
        
        // Token'ları temizle
        localStorage.removeItem(getTokenKey(role));
        localStorage.removeItem(getRefreshTokenKey(role));
        localStorage.removeItem(getEmailKey(role));
        
        // Yönlendirme yapma - sadece logout yap
        // Kullanıcı isterse kendisi giriş yapar
        console.log('Token geçersiz, logout yapıldı. Yönlendirme yapılmadı.');
      }
    }
    return Promise.reject(error);
  }
);

// Ortak API fonksiyonları
export const api = {
  // Profil işlemleri - Role'e göre farklı endpoint'ler
  getProfile: (role: 'vendor' | 'client' = 'vendor') => 
    apiClient.get(role === 'vendor' ? '/vendors/profile/' : '/clients/profile/'),
  
  updateProfile: (data: FormData, role: 'vendor' | 'client' = 'vendor') => 
    apiClient.patch(role === 'vendor' ? '/vendors/profile/' : '/clients/profile/', data, {
      headers: { "Content-Type": "multipart/form-data" }
    }),
  
  // Hizmet alanları ve kategoriler (ortak)
  getServiceAreas: () => apiClient.get('/services/'),
  getCategories: () => apiClient.get('/categories/'),
  getCategoriesByServiceArea: (serviceAreaId: string) => 
    apiClient.get(`/categories/?service_area=${serviceAreaId}`),
  
  // Araba markaları
  getCarBrands: () => apiClient.get('/vendors/car-brands/'),
  
  // Vendor arama sonuçları
  searchVendors: (params: { city?: string; district?: string; service?: string; category?: string; carBrand?: string; page?: string; q?: string }) => 
    apiClient.get('/vendors/search/', { params }),
  
  // Vendor detay sayfası
  getVendorDetail: (slug: string) => 
    apiClient.get(`/vendors/${slug}/`),
  
  // Avatar upload - vendor ve client için ortak endpoint
  uploadAvatar: (data: FormData, role: 'vendor' | 'client' = 'vendor') => 
    apiClient.post('/avatar/upload/', data, {
      headers: { "Content-Type": "multipart/form-data" }
    }),
  
  // Auth işlemleri - Tek endpoint kullan
  login: (data: { email: string; password: string }) => 
    apiClient.post('/auth/login/', data),
  
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
  
  setPassword: (data: { email: string; password: string; password2: string }, role: 'vendor' | 'client' = 'vendor') => 
    apiClient.post(role === 'vendor' ? '/vendors/set-password/' : '/clients/set-password/', data),
  
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

  // Şifre sıfırlama işlemleri
  forgotPassword: (data: { email: string }) => 
    apiClient.post('/auth/forgot-password/', data),
  
  resetPassword: (data: { token: string; password: string; password2: string }) => 
    apiClient.post('/auth/reset-password/', data),

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
  
  // Favorites API
  getFavorites: () => apiClient.get('/favorites/'),
  addFavorite: (vendorId: number) => apiClient.post('/favorites/add/', { vendor_id: vendorId }),
  removeFavorite: (vendorId: number) => apiClient.delete(`/favorites/${vendorId}/`),
  checkFavorite: (vendorId: number) => apiClient.get(`/favorites/${vendorId}/check/`),
}; 