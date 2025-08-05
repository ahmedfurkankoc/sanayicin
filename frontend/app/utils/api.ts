import axios from 'axios';

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api";

// Role'e göre token key'leri
const getTokenKey = (role: 'vendor' | 'customer' = 'vendor') => {
  return role === 'vendor' ? 'esnaf_access_token' : 'customer_access_token';
};

const getRefreshTokenKey = (role: 'vendor' | 'customer' = 'vendor') => {
  return role === 'vendor' ? 'esnaf_refresh_token' : 'customer_refresh_token';
};

const getEmailKey = (role: 'vendor' | 'customer' = 'vendor') => {
  return role === 'vendor' ? 'esnaf_email' : 'customer_email';
};

// Auth token'ı al
export const getAuthToken = (role: 'vendor' | 'customer' = 'vendor'): string | null => {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(getTokenKey(role));
};

// Auth header'ı oluştur
export const getAuthHeaders = (role: 'vendor' | 'customer' = 'vendor') => {
  const token = getAuthToken(role);
  return token ? { Authorization: `Bearer ${token}` } : {};
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
const validateRegisterData = (data: any, role: 'vendor' | 'customer' = 'vendor'): { isValid: boolean; errors: string[] } => {
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
                          config.url?.includes('/categories/');
  
  if (isPublicEndpoint) {
    return config; // Token ekleme, herkese açık
  }
  
  // Role'ü URL'den tahmin et - avatar upload için özel kontrol
  const isVendor = config.url?.includes('/vendors/') || 
                   config.url?.includes('/esnaf/') || 
                   config.url?.includes('/avatar/upload/'); // Avatar upload vendor için
  const role: 'vendor' | 'customer' = isVendor ? 'vendor' : 'customer';
  
  const token = getAuthToken(role);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
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
                              error.config?.url?.includes('/categories/');
      
      if (isPublicEndpoint) {
        return Promise.reject(error); // Logout yapma, sadece hatayı döndür
      }
      
      // Token geçersiz, logout yap
      if (typeof window !== "undefined") {
        // Role'ü URL'den tahmin et - avatar upload için özel kontrol
        const isVendor = error.config?.url?.includes('/vendors/') || 
                        error.config?.url?.includes('/esnaf/') || 
                        error.config?.url?.includes('/avatar/upload/'); // Avatar upload vendor için
        const role: 'vendor' | 'customer' = isVendor ? 'vendor' : 'customer';
        
        localStorage.removeItem(getTokenKey(role));
        localStorage.removeItem(getRefreshTokenKey(role));
        localStorage.removeItem(getEmailKey(role));
        
        // Role'e göre yönlendirme
        const redirectUrl = role === 'vendor' ? '/esnaf/giris' : '/musteri/giris';
        window.location.href = redirectUrl;
      }
    }
    return Promise.reject(error);
  }
);

// Ortak API fonksiyonları
export const api = {
  // Profil işlemleri - Role'e göre farklı endpoint'ler
  getProfile: (role: 'vendor' | 'customer' = 'vendor') => 
    apiClient.get(role === 'vendor' ? '/vendors/profile/' : '/customers/profile/'),
  
  updateProfile: (data: FormData, role: 'vendor' | 'customer' = 'vendor') => 
    apiClient.patch(role === 'vendor' ? '/vendors/profile/' : '/customers/profile/', data, {
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
  searchVendors: (params: { city?: string; district?: string; service?: string; category?: string }) => 
    apiClient.get('/vendors/search/', { params }),
  
  // Vendor detay sayfası
  getVendorDetail: (slug: string) => 
    apiClient.get(`/vendors/${slug}/`),
  
  // Avatar upload - vendor ve customer için ortak endpoint
  uploadAvatar: (data: FormData, role: 'vendor' | 'customer' = 'vendor') => 
    apiClient.post('/avatar/upload/', data, {
      headers: { "Content-Type": "multipart/form-data" }
    }),
  
  // Auth işlemleri - Role'e göre farklı endpoint'ler
  login: (data: { email: string; password: string }, role: 'vendor' | 'customer' = 'vendor') => 
    apiClient.post(role === 'vendor' ? '/auth/login/' : '/customers/login/', data),
  
  // Register - Role'e göre farklı endpoint'ler
  register: (data: any, role: 'vendor' | 'customer' = 'vendor') => {
    // FormData kontrolü
    if (data instanceof FormData) {
      // FormData için validation yapmaya gerek yok, backend'de yapılacak
      const endpoint = role === 'vendor' ? '/vendors/register/' : '/customers/register/';
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

    const endpoint = role === 'vendor' ? '/vendors/register/' : '/customers/register/';
    return apiClient.post(endpoint, sanitizedData);
  },
  
  setPassword: (data: { email: string; password: string; password2: string }, role: 'vendor' | 'customer' = 'vendor') => 
    apiClient.post(role === 'vendor' ? '/vendors/set-password/' : '/customers/set-password/', data),
  
  // Email verification işlemleri (ortak)
  sendVerificationEmail: (data: { email: string }) => 
    apiClient.post('/auth/send-verification/', data),
  
  verifyEmail: (data: { token: string }) => 
    apiClient.post('/auth/verify-email/', data),
  
  resendVerificationEmail: (data: { email: string }) => 
    apiClient.post('/auth/resend-verification/', data),

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
    customer_name: string;
    customer_phone: string;
    customer_email: string;
    service_description: string;
    appointment_date: string;
    appointment_time: string;
    notes?: string;
  }, vendorSlug: string) => 
    apiClient.post(`/vendors/${vendorSlug}/appointments/`, data),
}; 