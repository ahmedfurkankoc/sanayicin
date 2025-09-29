'use client';

import React, { useEffect, useState, Suspense, useCallback, useMemo, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { api, getAuthToken } from "@/app/utils/api";
import { useTurkeyData } from "@/app/hooks/useTurkeyData";
import { useCarBrands } from "@/app/hooks/useCarBrands";
import { useServices } from "@/app/hooks/useServices";
import { iconMapping } from "@/app/utils/iconMapping";
import AuthModal from "@/app/components/AuthModal";
import { useFavorites } from "../context/FavoritesContext";
import { useMusteri } from "../context/MusteriContext";

// Güvenlik: Input sanitization fonksiyonları
const sanitizeInput = (input: string): string => {
  if (!input) return '';
  // HTML tag'ları, script'leri ve tehlikeli karakterleri temizle
  return input
    .replace(/[<>]/g, '') // < > karakterlerini kaldır
    .replace(/javascript:/gi, '') // javascript: protokolünü kaldır
    .replace(/on\w+=/gi, '') // on* event handler'ları kaldır
    .trim();
};

// Case-insensitive arama için input'u normalize et
const normalizeSearchInput = (input: string): string => {
  if (!input) return '';
  // Türkçe karakter desteği için normalize et
  return input
    .toLowerCase()
    .trim()
    .normalize('NFD') // Unicode normalization
    .replace(/[\u0300-\u036f]/g, ''); // Accent'ları kaldır
};

const validateSearchParams = (params: any): boolean => {
  // Sadece string ve number değerleri kabul et
  const allowedTypes = ['string', 'number'];
  return Object.values(params).every(value => 
    value === null || value === undefined || allowedTypes.includes(typeof value)
  );
};

interface Vendor {
  id: number;
  user: {
    email: string;
    is_verified: boolean;
    avatar?: string; // user.avatar ekledim
  };
  business_type: string;
  company_title: string;
  display_name: string;
  phone: string;
  city: string;
  district: string;
  subdistrict: string;
  address: string;
  about?: string;
  service_areas?: any[];
  categories?: any[];
  slug: string;
}

interface SearchResponse {
  count: number;
  results: Vendor[];
  next?: string;
  previous?: string;
}

// Debounce hook
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

// Memoized vendor card component
const VendorCard = React.memo(({ vendor }: { vendor: Vendor }) => {
  const router = useRouter();
  const { isAuthenticated } = useMusteri();
  const { isFavorite, toggleFavorite } = useFavorites();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [favoriteLoading, setFavoriteLoading] = useState(false);
  
  const handleVendorClick = () => {
    // Hem vendor hem client token'ları kontrol et
    const vendorToken = getAuthToken('vendor');
    const clientToken = getAuthToken('client');
    
    // Herhangi bir token varsa authenticated kabul et
    const isAuthenticated = vendorToken || clientToken;
    
    if (!isAuthenticated) {
      setShowAuthModal(true);
      return;
    }
    
    // Giriş yapılmışsa esnaf profil sayfasına yönlendir
    router.push(`/musteri/esnaf/${vendor.slug}`);
  };

  const handleFavoriteClick = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Parent click'i engelle
    
    if (!isAuthenticated) {
      setShowAuthModal(true);
      return;
    }

    try {
      setFavoriteLoading(true);
      await toggleFavorite(vendor.id);
    } catch (error) {
      console.error('Favori işlemi başarısız:', error);
    } finally {
      setFavoriteLoading(false);
    }
  };
  
  return (
    <>
      <div 
        onClick={handleVendorClick}
        className="musteri-vendor-card"
        style={{ position: 'relative' }}
      >
        {/* Favori Butonu */}
        <button
          onClick={handleFavoriteClick}
          disabled={favoriteLoading}
          style={{
            position: 'absolute',
            top: '12px',
            right: '12px',
            background: 'rgba(255, 255, 255, 0.9)',
            border: 'none',
            borderRadius: '50%',
            width: '32px',
            height: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: favoriteLoading ? 'not-allowed' : 'pointer',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            transition: 'all 0.2s ease',
            opacity: favoriteLoading ? 0.6 : 1,
            zIndex: 10
          }}
          title={isFavorite(vendor.id) ? 'Favorilerden çıkar' : 'Favorilere ekle'}
        >
          {favoriteLoading ? (
            <div style={{ 
              width: '12px', 
              height: '12px', 
              border: '2px solid #ccc',
              borderTop: '2px solid var(--yellow)',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite'
            }} />
          ) : (
            React.createElement(iconMapping.heart, { 
              size: 16, 
              fill: isFavorite(vendor.id) ? 'var(--yellow)' : 'none',
              color: isFavorite(vendor.id) ? 'var(--yellow)' : '#666'
            })
          )}
        </button>

        {/* Avatar */}
        <div className="musteri-vendor-avatar">
          {vendor.user.avatar ? (
            <img src={vendor.user.avatar} alt={vendor.display_name} />
          ) : (
            vendor.display_name.charAt(0).toUpperCase()
          )}
        </div>

        {/* Content */}
        <div className="musteri-vendor-info">
          <h3 className="musteri-vendor-name">
            {vendor.display_name}
          </h3>
          
          <p style={{
            fontSize: '14px',
            color: '#666',
            margin: '0 0 12px 0'
          }}>
            {vendor.business_type}
          </p>

          <p className="musteri-vendor-location">
            {vendor.district}, {vendor.city}
          </p>

          {vendor.service_areas && vendor.service_areas.length > 0 && (
            <div className="musteri-vendor-services">
              {vendor.service_areas.slice(0, 3).map((service) => (
                <span key={service.id} className="musteri-service-tag">
                  {service.name}
                </span>
              ))}
              {vendor.service_areas.length > 3 && (
                <span className="musteri-service-tag">
                  +{vendor.service_areas.length - 3} daha
                </span>
              )}
            </div>
          )}

          {vendor.about && (
            <p style={{
              fontSize: '14px',
              color: '#444',
              margin: '12px 0 0 0',
              lineHeight: '1.4',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden'
            }}>
              {vendor.about}
            </p>
          )}
        </div>
      </div>

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        title="Giriş Gerekli"
        message="Esnaf profilini görüntülemek için giriş yapmanız veya hesap oluşturmanız gerekiyor."
      />
    </>
  );
});

VendorCard.displayName = 'VendorCard';

// Memoized filter components
const FilterSelect = React.memo(({ 
  label, 
  value, 
  onChange, 
  options, 
  disabled = false,
  placeholder 
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  disabled?: boolean;
  placeholder?: string;
}) => (
  <div style={{ marginBottom: '20px' }}>
    <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
      {label}
    </label>
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      style={{
        width: '100%',
        padding: '8px 12px',
        border: '1px solid #ddd',
        borderRadius: '4px',
        backgroundColor: disabled ? '#f5f5f5' : 'white'
      }}
    >
      <option value="">{placeholder || `Tüm ${label}ler`}</option>
      {options.map(option => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  </div>
));

FilterSelect.displayName = 'FilterSelect';

function AramaSonuclariContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { cities, loadTurkeyData, getDistricts } = useTurkeyData();
  const { carBrands, loadCarBrands } = useCarBrands();
  const { services, categories, getCategoriesByService } = useServices();
  const abortControllerRef = useRef<AbortController | null>(null);
  
  const city = searchParams.get("city") || "";
  const district = searchParams.get("district") || "";
  const service = searchParams.get("service") || "";
  const category = searchParams.get("category") || "";
  const page = searchParams.get("page") || "1";
  const searchQuery = searchParams.get("q") || "";  // Text search parametresi
  
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedService, setSelectedService] = useState(service);
  const [selectedCategory, setSelectedCategory] = useState(category);
  const [selectedCity, setSelectedCity] = useState(city);
  const [selectedDistrict, setSelectedDistrict] = useState(district);
  const [selectedCarBrand, setSelectedCarBrand] = useState(searchParams.get("carBrand") || "");
  const [districts, setDistricts] = useState<string[]>([]);
  const [showFiltersMobileModal, setShowFiltersMobileModal] = useState(false);
  const [sortOption, setSortOption] = useState<string>(""); // name_asc | name_desc | city_asc | reviews_asc | reviews_desc
  const [isSortOpen, setIsSortOpen] = useState(false);
  const sortRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      const target = e.target as Element;
      if (isSortOpen && sortRef.current && !target.closest('.custom-select')) {
        setIsSortOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsSortOpen(false);
    };
    document.addEventListener('click', onDocClick);
    document.addEventListener('keydown', onKey as any);
    return () => {
      document.removeEventListener('click', onDocClick);
      document.removeEventListener('keydown', onKey as any);
    };
  }, [isSortOpen]);
  
  // Pagination state'leri
  const [currentPage, setCurrentPage] = useState(parseInt(page));
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [hasPreviousPage, setHasPreviousPage] = useState(false);

  // Debounced values for API calls
  const debouncedCity = useDebounce(selectedCity || "", 300);
  const debouncedDistrict = useDebounce(selectedDistrict || "", 300);
  const debouncedService = useDebounce(selectedService || "", 300);
  const debouncedCategory = useDebounce(selectedCategory || "", 300);
  const debouncedCarBrand = useDebounce(selectedCarBrand || "", 300);

  // Memoized options
  const cityOptions = useMemo(() => 
    cities.map(city => ({ value: city, label: city })), 
    [cities]
  );

  const districtOptions = useMemo(() => 
    districts.map(district => ({ value: district, label: district })), 
    [districts]
  );

  const serviceOptions = useMemo(() => 
    services.map(service => ({ value: service.id.toString(), label: service.name })), 
    [services]
  );

  const categoryOptions = useMemo(() => {
    const filtered = selectedService 
      ? categories.filter(cat => cat.service_area.toString() === selectedService)
      : categories;
    return filtered.map(cat => ({ value: cat.id.toString(), label: cat.name }));
  }, [categories, selectedService]);

  const carBrandOptions = useMemo(() => 
    carBrands.map(brand => ({ value: brand.id.toString(), label: brand.name })), 
    [carBrands]
  );

  // Şehir verisini yükle
  useEffect(() => {
    loadTurkeyData();
  }, [loadTurkeyData]);

  // URL'den gelen değerleri işle
  useEffect(() => {
    if (city && cities.length > 0) {
      setSelectedCity(city);
      if (district) {
        const cityDistricts = getDistricts(city);
        if (cityDistricts.includes(district)) {
          setSelectedDistrict(district);
        }
      }
    }
    
    if (service) {
      setSelectedService(service);
    }
    
    if (category) {
      setSelectedCategory(category);
    }
    
    if (page) {
      setCurrentPage(parseInt(page));
    }
  }, [city, district, service, category, page, cities, getDistricts]);

  // İl değişince ilçeleri güncelle
  useEffect(() => {
    if (selectedCity) {
      const newDistricts = getDistricts(selectedCity);
      setDistricts(newDistricts);
      if (selectedDistrict && !newDistricts.includes(selectedDistrict)) {
        setSelectedDistrict("");
      }
    } else {
      setDistricts([]);
      setSelectedDistrict("");
    }
  }, [selectedCity, getDistricts]);

  // Hizmet alanları ve kategoriler artık useServices hook'undan geliyor

  // Component mount olduğunda initial search yap
  useEffect(() => {
    const initialSearch = async () => {
      try {
        setLoading(true);
        setError("");
        
        // URL'deki parametreleri kullanarak search yap
        const searchParamsObject: any = { page: '1' };
        
        if (city) searchParamsObject.city = city;
        if (district) searchParamsObject.district = district;
        if (service) searchParamsObject.service = service;
        if (category) searchParamsObject.category = category;
        if (searchQuery) searchParamsObject.q = normalizeSearchInput(searchQuery);
        
        const carBrandParam = searchParams.get("carBrand");
        if (carBrandParam) searchParamsObject.carBrand = carBrandParam;
        
        const response = await api.searchVendors(searchParamsObject);
        
        const data: SearchResponse = response.data;
        setVendors(data.results || []);
        
        // Pagination bilgilerini set et
        if (data.count !== undefined) {
          setTotalCount(data.count);
          setTotalPages(Math.ceil(data.count / 15));
        }
        
        // Next/Previous sayfa bilgilerini set et
        setHasNextPage(!!data.next);
        setHasPreviousPage(!!data.previous);
      } catch (err: any) {
        console.error("Initial vendor yükleme hatası:", err);
        setError("Esnaflar yüklenirken bir hata oluştu. Lütfen tekrar deneyin.");
      } finally {
        setLoading(false);
      }
    };
    
    initialSearch();
  }, [city, district, service, category, searchQuery]); // URL parametrelerini dependency olarak ekle

  // Debounced search
  useEffect(() => {
    const searchVendors = async () => {
      // Önceki isteği iptal et
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      // Yeni abort controller oluştur
      abortControllerRef.current = new AbortController();

      try {
        setLoading(true);
        setError("");
        
        // Güvenlik: Input'ları sanitize et
        const sanitizedParams = {
          city: sanitizeInput(debouncedCity),
          district: sanitizeInput(debouncedDistrict),
          service: sanitizeInput(debouncedService),
          category: sanitizeInput(debouncedCategory),
          carBrand: sanitizeInput(debouncedCarBrand)
        };
        
        // Güvenlik: Parametreleri validate et
        if (!validateSearchParams(sanitizedParams)) {
          setError("Geçersiz arama parametreleri");
          return;
        }
        
        // Hizmet ve araba markası birlikte seçildiyse, sadece o kombinasyonu ara
        const searchParams: any = {
          city: sanitizedParams.city,
          district: sanitizedParams.district,
          service: sanitizedParams.service,
          category: sanitizedParams.category,
          page: currentPage.toString(), // Sayfa numarasını ekle
        };
        
        // Text search parametresi ekle
        if (searchQuery) {
          searchParams.q = normalizeSearchInput(searchQuery);
        }
        
        // Araba markası seçildiyse ekle
        if (sanitizedParams.carBrand) {
          searchParams.carBrand = sanitizedParams.carBrand;
        }
        
        const response = await api.searchVendors(searchParams);
        
        const data: SearchResponse = response.data;
        setVendors(data.results || []);
        
        // Pagination bilgilerini set et
        if (data.count !== undefined) {
          setTotalCount(data.count);
          setTotalPages(Math.ceil(data.count / 15)); // Backend'de page_size = 15
        }
        
        // Next/Previous sayfa bilgilerini set et
        if (data.next) {
          setHasNextPage(true);
        } else {
          setHasNextPage(false);
        }
        
        if (data.previous) {
          setHasPreviousPage(true);
        } else {
          setHasPreviousPage(false);
        }
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          console.error("Vendor arama hatası:", err);
          setError("Arama sırasında bir hata oluştu. Lütfen tekrar deneyin.");
        }
      } finally {
        setLoading(false);
      }
    };

    // Hizmet veya araba markası seçildiyse arama yap
    if (debouncedCity || debouncedDistrict || debouncedService || debouncedCategory || debouncedCarBrand || searchQuery) {
      searchVendors();
    }
    
    // Sayfa değiştiğinde de arama yap
    if (currentPage > 1) {
      searchVendors();
    }
    
    // Hiçbir filter seçilmediğinde de tüm esnafları getir
    if (!debouncedCity && !debouncedDistrict && !debouncedService && !debouncedCategory && !debouncedCarBrand && !searchQuery) {
      searchVendors();
    }

    // Cleanup
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [debouncedCity, debouncedDistrict, debouncedService, debouncedCategory, debouncedCarBrand, currentPage, searchQuery]);

  const handleFilterChange = useCallback((type: string, value: string) => {
    if (type === 'city') setSelectedCity(value);
    if (type === 'district') setSelectedDistrict(value);
    if (type === 'service') {
      setSelectedService(value);
      setSelectedCategory(""); // Hizmet değişince kategoriyi sıfırla
    }
    if (type === 'category') setSelectedCategory(value);
    if (type === 'carBrand') setSelectedCarBrand(value);
    
    // Filter değişince sayfa numarasını sıfırla
    setCurrentPage(1);
  }, []);

  const handleSearch = useCallback(() => {
    // Güvenlik: Input'ları sanitize et
    const sanitizedParams = {
      city: sanitizeInput(selectedCity),
      district: sanitizeInput(selectedDistrict),
      service: sanitizeInput(selectedService),
      category: sanitizeInput(selectedCategory),
      carBrand: sanitizeInput(selectedCarBrand)
    };
    
    // Güvenlik: Parametreleri validate et
    if (!validateSearchParams(sanitizedParams)) {
      setError("Geçersiz arama parametreleri");
      return;
    }
    
    const params = new URLSearchParams();
    if (sanitizedParams.city) params.set('city', sanitizedParams.city);
    if (sanitizedParams.district) params.set('district', sanitizedParams.district);
    if (sanitizedParams.service) params.set('service', sanitizedParams.service);
    if (sanitizedParams.category) params.set('category', sanitizedParams.category);
    if (sanitizedParams.carBrand) params.set('carBrand', sanitizedParams.carBrand);
    
    // Güvenlik: URL'i encode et
    const safeUrl = `/musteri/esnaflar?${params.toString()}`;
    router.push(safeUrl);
    
    // Arama yapıldığında sayfa numarasını sıfırla
    setCurrentPage(1);
  }, [selectedCity, selectedDistrict, selectedService, selectedCategory, selectedCarBrand, router]);

  // Pagination fonksiyonları
  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
    
    // URL'e page parametresi ekle
    const params = new URLSearchParams();
    if (selectedCity) params.set('city', selectedCity);
    if (selectedDistrict) params.set('district', selectedDistrict);
    if (selectedService) params.set('service', selectedService);
    if (selectedCategory) params.set('category', selectedCategory);
    if (selectedCarBrand) params.set('carBrand', selectedCarBrand);
    params.set('page', page.toString());
    
    router.push(`/musteri/esnaflar?${params.toString()}`);
  }, [selectedCity, selectedDistrict, selectedService, selectedCategory, selectedCarBrand, router]);

  const handleNextPage = useCallback(() => {
    if (hasNextPage) {
      handlePageChange(currentPage + 1);
    }
  }, [hasNextPage, currentPage, handlePageChange]);

  const handlePreviousPage = useCallback(() => {
    if (hasPreviousPage) {
      handlePageChange(currentPage - 1);
    }
  }, [hasPreviousPage, currentPage, handlePageChange]);

  // Memoized vendor list with virtualization for high traffic
  const sortedVendors = useMemo(() => {
    const copy = [...vendors];
    if (sortOption === 'name_asc') {
      copy.sort((a, b) => a.display_name.localeCompare(b.display_name, 'tr'));
    } else if (sortOption === 'name_desc') {
      copy.sort((a, b) => b.display_name.localeCompare(a.display_name, 'tr'));
    } else if (sortOption === 'city_asc') {
      copy.sort((a, b) => (a.city || '').localeCompare(b.city || '', 'tr'));
    } else if (sortOption === 'reviews_asc' || sortOption === 'reviews_desc') {
      const getReviewCount = (v: any) => {
        const count = (v.reviews_count ?? v.review_count ?? (Array.isArray(v.reviews) ? v.reviews.length : 0));
        return typeof count === 'number' ? count : 0;
      };
      copy.sort((a, b) => {
        const ca = getReviewCount(a);
        const cb = getReviewCount(b);
        return sortOption === 'reviews_asc' ? ca - cb : cb - ca;
      });
    }
    return copy;
  }, [vendors, sortOption]);

  const vendorList = useMemo(() => 
    sortedVendors.map((vendor, index) => (
      <VendorCard 
        key={`${vendor.id}-${index}`} 
        vendor={vendor} 
      />
    )), 
    [sortedVendors]
  );

  return (
    <div className="container">
        <div className="musteri-search-layout">
          {/* Mobile actions */}
          <div className="musteri-mobile-actions mobile-only">
            <button 
              className="m-filter-btn"
              onClick={() => setShowFiltersMobileModal(true)}
            >
              Filtreler
            </button>
            <div ref={sortRef} className="custom-select">
              <button
                type="button"
                className="custom-select-trigger"
                onClick={() => setIsSortOpen(v => !v)}
                aria-haspopup="listbox"
                aria-expanded={isSortOpen}
              >
                <span>
                  {sortOption === 'name_asc' ? 'İsim (A-Z)' :
                   sortOption === 'name_desc' ? 'İsim (Z-A)' :
                   sortOption === 'city_asc' ? 'Şehir (A-Z)' : 'Sırala'}
                </span>
                {React.createElement(iconMapping['chevron-down'], { size: 18, color: '#111' })}
              </button>
                  {isSortOpen && (
                <div className="custom-select-options" role="listbox">
                  <div
                    className="custom-select-option"
                    role="option"
                    aria-selected={sortOption === ''}
                    onClick={() => { setSortOption(""); setIsSortOpen(false); }}
                  >
                    <span>Sırala</span>
                  </div>
                  <div
                    className="custom-select-option"
                    role="option"
                    aria-selected={sortOption === 'name_asc'}
                    onClick={() => { setSortOption('name_asc'); setIsSortOpen(false); }}
                  >
                    <span>İsim (A-Z)</span>
                  </div>
                  <div
                    className="custom-select-option"
                    role="option"
                    aria-selected={sortOption === 'name_desc'}
                    onClick={() => { setSortOption('name_desc'); setIsSortOpen(false); }}
                  >
                    <span>İsim (Z-A)</span>
                  </div>
                  <div
                    className="custom-select-option"
                    role="option"
                    aria-selected={sortOption === 'city_asc'}
                    onClick={() => { setSortOption('city_asc'); setIsSortOpen(false); }}
                  >
                    <span>Şehir (A-Z)</span>
                  </div>
                      <div
                        className="custom-select-option"
                        role="option"
                        aria-selected={sortOption === 'reviews_asc'}
                        onClick={() => { setSortOption('reviews_asc'); setIsSortOpen(false); }}
                      >
                        <span>Yorum sayısı (artan)</span>
                      </div>
                      <div
                        className="custom-select-option"
                        role="option"
                        aria-selected={sortOption === 'reviews_desc'}
                        onClick={() => { setSortOption('reviews_desc'); setIsSortOpen(false); }}
                      >
                        <span>Yorum sayısı (azalan)</span>
                      </div>
                </div>
              )}
            </div>
          </div>
          {/* Sol Sütun - Filtreler */}
          <div className={`musteri-filters-sidebar`}>
            <h3 className="musteri-filters-title">Filtreler</h3>
            
            <div className="musteri-tip-box">💡 <strong>İpucu:</strong> Şehir/ilçe, hizmet ve marka seçerek sonuçları hızla daraltabilirsiniz.</div>

            <FilterSelect
              label="Şehir"
              value={selectedCity}
              onChange={(value) => handleFilterChange('city', value)}
              options={cityOptions}
              placeholder="İl seçiniz"
            />

            <FilterSelect
              label="İlçe"
              value={selectedDistrict}
              onChange={(value) => handleFilterChange('district', value)}
              options={districtOptions}
              disabled={!selectedCity}
              placeholder="İlçe seçiniz"
            />

            <FilterSelect
              label="Hizmet Alanı"
              value={selectedService}
              onChange={(value) => handleFilterChange('service', value)}
              options={serviceOptions}
              placeholder="Hizmet seçiniz"
            />

            <FilterSelect
              label="Kategori"
              value={selectedCategory}
              onChange={(value) => handleFilterChange('category', value)}
              options={categoryOptions}
              disabled={!selectedService}
              placeholder="Kategori seçiniz"
            />

            <FilterSelect
              label="Araba Markası"
              value={selectedCarBrand}
              onChange={(value) => handleFilterChange('carBrand', value)}
              options={carBrandOptions}
              placeholder="Marka seçiniz"
            />

            {/* Sonuç Sayısı */}
            <div className="musteri-filters-summary"><strong>{vendors.length}</strong> usta bulundu</div>
          </div>

          {/* Sağ Sütun - Arama Sonuçları */}
          {/* Sonuçlar */}
                  <div className="musteri-search-results-container">
          {/* Arama sorgusu göster */}
          {searchQuery && (
            <div className="musteri-query-box">
              <div className="musteri-query-row">
                <span className="musteri-query-icon">🔍</span>
                <strong>Arama Sorgusu:</strong>
                <span className="musteri-query-chip">"{searchQuery}"</span>
              </div>
            </div>
          )}
          
          {loading ? (
              <div className="musteri-loading">
                <div>
                  <div className="musteri-loading-spinner"></div>
                  <div>Aranıyor...</div>
                  <div className="musteri-loading-hint">
                    {searchQuery ? `"${searchQuery}" için sonuçlar aranıyor...` : 'Sonuçlar yükleniyor...'}
                  </div>
                </div>
              </div>
            ) : error ? (
              <div className="musteri-error">{error}</div>
            ) : vendors.length === 0 ? (
              <div className="musteri-empty-state">
                <h3>{searchQuery ? `"${searchQuery}" için sonuç bulunamadı` : 'Sonuç bulunamadı'}</h3>
                <p>{searchQuery ? 'Farklı kelimeler deneyin veya filtreleri değiştirin.' : 'Filtreleri değiştirmeyi deneyin.'}</p>
              </div>
            ) : (
              <>
                <div className="musteri-results-meta">
                  <div className="musteri-results-meta-row">
                    <span className="musteri-results-count">{totalCount} sonuç bulundu</span>
                    {searchQuery && (
                      <>
                        <span className="mrm-sep">•</span>
                        <span className="mrm-chip">"{searchQuery}" için</span>
                      </>
                    )}
                    {totalPages > 1 && (
                      <>
                        <span className="mrm-sep">•</span>
                        <span className="mrm-page">Sayfa {currentPage} / {totalPages}</span>
                      </>
                    )}
                  </div>
                </div>
                
                <div className="musteri-search-results">
                  {vendorList}
                </div>
                
                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="musteri-pagination">
                    <button 
                      onClick={handlePreviousPage} 
                      disabled={!hasPreviousPage}
                      className="musteri-pagination-btn"
                    >
                      Önceki
                    </button>
                    
                    {/* Sayfa numaraları */}
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }
                      
                      return (
                        <button
                          key={pageNum}
                          onClick={() => handlePageChange(pageNum)}
                          className={`musteri-pagination-btn ${currentPage === pageNum ? 'active' : ''}`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                    
                    <button 
                      onClick={handleNextPage} 
                      disabled={!hasNextPage}
                      className="musteri-pagination-btn"
                    >
                      Sonraki
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
        {/* Mobile Filters Modal */}
        {showFiltersMobileModal && (
          <div className="musteri-filter-modal">
            <div className="mfm-content">
              <div className="mfm-header">
                <h3>Filtreler</h3>
                <button className="mfm-close" onClick={() => setShowFiltersMobileModal(false)}>Kapat</button>
              </div>
              <div className="mfm-body">
                {/* Same filters duplicated for modal */}
                <FilterSelect
                  label="Şehir"
                  value={selectedCity}
                  onChange={(value) => setSelectedCity(value)}
                  options={cityOptions}
                  placeholder="İl seçiniz"
                />

                <FilterSelect
                  label="İlçe"
                  value={selectedDistrict}
                  onChange={(value) => setSelectedDistrict(value)}
                  options={districtOptions}
                  disabled={!selectedCity}
                  placeholder="İlçe seçiniz"
                />

                <FilterSelect
                  label="Hizmet Alanı"
                  value={selectedService}
                  onChange={(value) => { setSelectedService(value); setSelectedCategory(""); }}
                  options={serviceOptions}
                  placeholder="Hizmet seçiniz"
                />

                <FilterSelect
                  label="Kategori"
                  value={selectedCategory}
                  onChange={(value) => setSelectedCategory(value)}
                  options={categoryOptions}
                  disabled={!selectedService}
                  placeholder="Kategori seçiniz"
                />

                <FilterSelect
                  label="Araba Markası"
                  value={selectedCarBrand}
                  onChange={(value) => setSelectedCarBrand(value)}
                  options={carBrandOptions}
                  placeholder="Marka seçiniz"
                />
              </div>
              <div className="mfm-footer">
                <button className="mfm-apply" onClick={() => { handleSearch(); setShowFiltersMobileModal(false); }}>Uygula</button>
              </div>
            </div>
          </div>
        )}
      </div>
  );
}

export default function AramaSonuclari() {
  return (
    <Suspense fallback={
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        fontSize: '18px',
        color: '#666'
      }}>
        Yükleniyor...
      </div>
    }>
      <AramaSonuclariContent />
    </Suspense>
  );
} 