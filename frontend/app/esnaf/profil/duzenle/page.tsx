'use client';

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import EsnafPanelLayout from "../../components/EsnafPanelLayout";
import { useEsnaf } from "../../context/EsnafContext";
import { api } from "@/app/utils/api";
import { useTurkeyData } from "@/app/hooks/useTurkeyData";
import { LoadingSpinner } from "../../components/LoadingSpinner";
import LocationPicker from "@/app/components/LocationPicker";
import { Check, ChevronDown, ChevronUp, Clock } from "lucide-react";


export default function EsnafProfilDuzenlePage() {
  const router = useRouter();
  const { user, email, loading, handleLogout, refreshUser } = useEsnaf();
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [serviceAreas, setServiceAreas] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [carBrands, setCarBrands] = useState<any[]>([]);
  const [selectedServiceArea, setSelectedServiceArea] = useState("");
  const [availableCategories, setAvailableCategories] = useState<any[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [carBrandsDropdownOpen, setCarBrandsDropdownOpen] = useState(false);
  const [carBrandSearch, setCarBrandSearch] = useState("");
  const [location, setLocation] = useState<{ latitude?: number; longitude?: number }>({});
  const [expandedServiceAreas, setExpandedServiceAreas] = useState<Set<number>>(new Set());

  // Turkey data (city/district/neighbourhood)
  const { cities, loadTurkeyData, getDistricts, getNeighbourhoods } = useTurkeyData();
  const [districtOptions, setDistrictOptions] = useState<string[]>([]);
  const [neighbourhoodOptions, setNeighbourhoodOptions] = useState<string[]>([]);

  // Profil ve veri yükleme
  useEffect(() => {
    const loadData = async () => {
      try {
        const [areasRes, categoriesRes, carBrandsRes] = await Promise.all([
          api.getServiceAreas(),
          api.getCategories(),
          api.getCarBrands()
        ]);
        
        setServiceAreas(areasRes.data);
        setCategories(categoriesRes.data);
        setCarBrands(carBrandsRes.data);
        } catch (error) {
          // Veri yükleme hatası, sessizce devam et
        } finally {
        setDataLoading(false);
      }
    };

    // Konum bilgilerini yükle
    const loadLocation = async () => {
      if (user?.slug) {
        try {
          const response = await api.getVendorLocation(user.slug);
          setLocation({
            latitude: response.data.latitude,
            longitude: response.data.longitude
          });
        } catch (error) {
          // Konum bilgisi bulunamadı, sessizce devam et
        }
      }
    };

    if (!loading && user) {
      // Çalışma saatleri için default değerleri ayarla
      const defaultWorkingHours = {
        monday: { closed: true, open: "09:00", close: "18:00" },
        tuesday: { closed: true, open: "09:00", close: "18:00" },
        wednesday: { closed: true, open: "09:00", close: "18:00" },
        thursday: { closed: true, open: "09:00", close: "18:00" },
        friday: { closed: true, open: "09:00", close: "18:00" },
        saturday: { closed: true, open: "09:00", close: "18:00" },
        sunday: { closed: true, open: "09:00", close: "18:00" }
      };

      setProfile({
        ...user,
        social_media: user.social_media || {},
        working_hours: user.working_hours && Object.keys(user.working_hours).length > 0 
          ? user.working_hours 
          : defaultWorkingHours
      });
      loadData();
      loadLocation();
    }
  }, [loading, user]);

  // Load TR data on mount
  useEffect(() => {
    loadTurkeyData();
  }, [loadTurkeyData]);

  // When profile.city changes, populate districts
  useEffect(() => {
    if (!profile?.city) {
      setDistrictOptions([]);
      setNeighbourhoodOptions([]);
      return;
    }
    const d = getDistricts(profile.city);
    setDistrictOptions(d);
  }, [profile?.city, getDistricts]);

  // When profile.city & district change, populate neighbourhoods
  useEffect(() => {
    if (!profile?.city || !profile?.district) {
      setNeighbourhoodOptions([]);
      return;
    }
    const n = getNeighbourhoods(profile.city, profile.district);
    setNeighbourhoodOptions(n);
  }, [profile?.city, profile?.district, getNeighbourhoods]);



  // Kullanıcının mevcut hizmet alanını ayarla
  useEffect(() => {
    if (profile && profile.service_areas && profile.service_areas.length > 0) {
      // Artık service_areas detaylı veri olarak geliyor, ilk elemanın id'sini al
      const firstServiceArea = profile.service_areas[0];
      const serviceAreaId = typeof firstServiceArea === 'object' ? firstServiceArea.id : firstServiceArea;
      setSelectedServiceArea(serviceAreaId.toString());
    }
  }, [profile]);

  // Seçilen hizmet alanına göre kategorileri filtrele
  useEffect(() => {
    if (selectedServiceArea) {
      const filtered = categories.filter(cat => 
        cat.service_area === parseInt(selectedServiceArea)
      );
      setAvailableCategories(filtered);
    } else {
      setAvailableCategories([]);
    }
  }, [selectedServiceArea, categories]);

  const handleInputChange = (field: string, value: any) => {
    setProfile((prev: any) => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSocialMediaChange = (platform: string, value: string) => {
    setProfile((prev: any) => ({
      ...prev,
      social_media: {
        ...prev.social_media,
        [platform]: value
      }
    }));
  };

  const handleWorkingHoursChange = (day: string, field: string, value: any) => {
    setProfile((prev: any) => ({
      ...prev,
      working_hours: {
        ...prev.working_hours,
        [day]: {
          ...prev.working_hours[day],
          [field]: value
        }
      }
    }));
  };

  const handleLocationChange = (lat: number, lng: number) => {
    setLocation({ latitude: lat, longitude: lng });
  };

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const formData = new FormData();
        formData.append('avatar', file);
        
        const response = await api.uploadAvatar(formData, 'vendor');
        
        if (response.data.avatar_url) {
          setProfile((prev: any) => ({
            ...prev,
            avatar: response.data.avatar_url
          }));
          toast.success('Avatar başarıyla yüklendi!');
          
          // Context'i güncelle
          await refreshUser();
        }
      } catch (error: any) {
        toast.error('Avatar yüklenirken hata oluştu!');
      }
    }
  };



  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const formData = new FormData();
      
      // Zorunlu alanlar - backend'den gelen mevcut değerleri kullan
      formData.append("display_name", profile.display_name || "");
      formData.append("about", profile.about || "");
      formData.append("phone", profile.phone || "");
      formData.append("city", profile.city || "");
      formData.append("district", profile.district || "");
      formData.append("subdistrict", profile.subdistrict || "");
      formData.append("address", profile.address || "");

      
      // Kayıt sırasında doldurulan alanlar - mevcut değerleri koru
      formData.append("business_type", profile.business_type || "");
      formData.append("company_title", profile.company_title || "");
      formData.append("tax_office", profile.tax_office || "");
      formData.append("tax_no", profile.tax_no || "");
      formData.append("manager_name", profile.manager_name || "");
      formData.append("manager_birthdate", profile.manager_birthdate || "");
      formData.append("manager_tc", profile.manager_tc || "");
      formData.append("manager_phone", profile.manager_phone || "");
      
      // Many-to-many alanlar - array olarak gönder
      if (profile.service_areas && profile.service_areas.length > 0) {
        profile.service_areas.forEach((area: any) => {
          const areaId = typeof area === 'object' ? area.id : area;
          formData.append("service_areas_ids", areaId.toString());
        });
      }
      
      if (profile.categories && profile.categories.length > 0) {
        profile.categories.forEach((category: any) => {
          const categoryId = typeof category === 'object' ? category.id : category;
          formData.append("categories_ids", categoryId.toString());
        });
      }
      
      if (profile.car_brands && profile.car_brands.length > 0) {
        profile.car_brands.forEach((brand: any) => {
          const brandId = typeof brand === 'object' ? brand.id : brand;
          formData.append("car_brands_ids", brandId.toString());
        });
      }
      
      // JSON alanlar
      formData.append("social_media", JSON.stringify(profile.social_media || {}));
      formData.append("working_hours", JSON.stringify(profile.working_hours || {}));

      // Fotoğraf - backend'de profile_photo olarak bekleniyor
      if (profile.profile_photo) {
        formData.append("profile_photo", profile.profile_photo);
      }



      const response = await api.updateProfile(formData);

      // Konum bilgilerini güncelle
      if (location.latitude && location.longitude) {
        try {
          await api.updateVendorLocation({
            latitude: location.latitude,
            longitude: location.longitude
          });
        } catch (error) {
          toast.error('Konum güncellenirken hata oluştu!');
        }
      }

      toast.success("Profil başarıyla güncellendi!");
      
      // Profil bilgilerini yenile ve kısa bir bekleme ekle
      await refreshUser();
      
      // Kısa bir bekleme ile context'in güncellenmesini bekle
      setTimeout(() => {
      router.push("/esnaf/profil");
      }, 500);
    } catch (error: any) {
      
      // Backend'den gelen hata detaylarını göster
      if (error.response) {
        
        // Backend'den gelen hata mesajını göster
        if (error.response.data && typeof error.response.data === 'object') {
          const errorMessages = Object.entries(error.response.data)
            .map(([field, messages]) => `${field}: ${Array.isArray(messages) ? messages.join(', ') : messages}`)
            .join('\n');
          toast.error(`Profil güncellenirken hata oluştu:\n${errorMessages}`);
        } else {
          toast.error(`Profil güncellenirken hata oluştu: ${error.response.status} - ${error.response.statusText}`);
        }
      } else {
        toast.error('Profil güncellenirken bir hata oluştu!');
      }
    } finally {
      setSaving(false);
    }
  };

  const filteredCarBrands = carBrands.filter(brand => 
    brand.name.toLowerCase().includes(carBrandSearch.toLowerCase())
  );

  const toggleServiceArea = (id: number) => {
    setExpandedServiceAreas(prev => {
      const newSet = new Set(prev);
      newSet.has(id) ? newSet.delete(id) : newSet.add(id);
      return newSet;
    });
  };

  const getCategoriesByServiceArea = (serviceAreaId: number): any[] => 
    categories.filter(cat => cat.service_area === serviceAreaId);

  // Dropdown dışına tıklandığında kapat
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('.esnaf-multi-select-container')) {
        setCarBrandsDropdownOpen(false);
      }
    };

    if (carBrandsDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [carBrandsDropdownOpen]);

  if (loading || dataLoading || !profile) {
    return <LoadingSpinner />;
  }

  return (
    <EsnafPanelLayout activePage="profil">
      <div className="esnaf-page-container">
        <div className="esnaf-page-header">
          <div>
            <h1 className="esnaf-page-title">Profil Düzenle</h1>
            <p className="esnaf-page-subtitle">
              Profil bilgilerinizi güncelleyin
            </p>
          </div>
        </div>
            
            <form onSubmit={handleSubmit} className="esnaf-profile-form">
              
              {/* Temel Bilgiler */}
              <div className="esnaf-profile-section">
                <h2 className="esnaf-section-title">Temel Bilgiler</h2>
                
                <div className="esnaf-form-group">
                  <label>Profil Fotoğrafı</label>
                  <div className="esnaf-photo-upload">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoChange}
                      className="esnaf-file-input"
                    />
                    {profile.avatar && (
                      <img 
                        src={profile.avatar} 
                        alt="Profil" 
                        className="esnaf-photo-preview"
                        style={{ width: '100px', height: '100px', objectFit: 'cover', borderRadius: '8px' }}
                      />
                    )}
                  </div>
                </div>

                <div className="esnaf-form-group">
                  <label>Görünen Ad</label>
                  <input
                    type="text"
                    value={profile.display_name}
                    onChange={(e) => handleInputChange("display_name", e.target.value)}
                    placeholder="İşletmenizin adı"
                    className="esnaf-input"
                  />
                </div>

                <div className="esnaf-form-group">
                  <label>Hakkında</label>
                  <textarea
                    value={profile.about}
                    onChange={(e) => handleInputChange("about", e.target.value)}
                    placeholder="İşletmeniz hakkında bilgi verin"
                    className="esnaf-textarea"
                    rows={4}
                  />
                </div>

                <div className="esnaf-form-group">
                  <label>Telefon</label>
                  <input
                    type="tel"
                    value={profile.phone}
                    onChange={(e) => handleInputChange("phone", e.target.value)}
                    placeholder="0555 123 45 67"
                    className="esnaf-input"
                  />
                </div>
              </div>

              {/* Hizmet Bilgileri */}
              <div className="esnaf-profile-section">
                <h2 className="esnaf-section-title">Hizmet Bilgileri</h2>
                
                <div className="esnaf-form-group">
                  <label>Hizmet Kategorileri</label>
                  <p style={{ 
                    color: '#666', 
                    fontSize: 14, 
                    marginBottom: 16 
                  }}>
                    Hangi hizmet kategorilerinde hizmet veriyorsunuz? Hizmet alanına tıklayarak alt kategorileri görüntüleyin.
                  </p>

                  {/* Hizmet Alanları Accordion */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {serviceAreas.map((serviceArea) => {
                      const isExpanded = expandedServiceAreas.has(serviceArea.id);
                      const areaCategories = getCategoriesByServiceArea(serviceArea.id);
                      // Seçili kategori sayısını hesapla
                      const selectedCount = areaCategories.filter(category => {
                        if (!profile.categories || !Array.isArray(profile.categories)) return false;
                        return profile.categories.some((cat: any) => {
                          const catId = typeof cat === 'object' && cat !== null ? cat.id : cat;
                          return Number(catId) === Number(category.id);
                        });
                      }).length;

                      return (
                        <div
                          key={serviceArea.id}
                          style={{
                            border: '1px solid #ddd',
                            borderRadius: 8,
                            overflow: 'hidden',
                            background: '#fff'
                          }}
                        >
                          {/* Hizmet Alanı Header */}
                          <button
                            type="button"
                            onClick={() => toggleServiceArea(serviceArea.id)}
                            style={{
                              width: '100%',
                              padding: '16px',
                              border: 'none',
                              background: 'transparent',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              textAlign: 'left',
                              transition: 'background 0.2s'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = '#f9f9f9';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = 'transparent';
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1 }}>
                              <div style={{
                                width: 24,
                                height: 24,
                                borderRadius: 4,
                                border: '2px solid #ddd',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0
                              }}>
                                {isExpanded ? (
                                  <ChevronUp size={16} color="#666" />
                                ) : (
                                  <ChevronDown size={16} color="#666" />
                                )}
                              </div>
                              <div style={{ flex: 1 }}>
                                <div style={{ 
                                  fontWeight: 600, 
                                  color: '#111', 
                                  fontSize: 14,
                                  marginBottom: 2
                                }}>
                                  {serviceArea.name}
                                </div>
                                {serviceArea.description && (
                                  <div style={{ 
                                    color: '#666', 
                                    fontSize: 12 
                                  }}>
                                    {serviceArea.description}
                                  </div>
                                )}
                              </div>
                              {selectedCount > 0 && (
                                <div style={{
                                  padding: '4px 12px',
                                  background: 'var(--yellow)',
                                  borderRadius: 12,
                                  fontSize: 12,
                                  fontWeight: 600,
                                  color: '#111'
                                }}>
                                  {selectedCount} seçili
                                </div>
                              )}
                            </div>
                          </button>

                          {/* Kategoriler (Expandable) */}
                          {isExpanded && (
                            <div style={{
                              padding: '16px',
                              borderTop: '1px solid #eee',
                              background: '#fafafa'
                            }}>
                              {areaCategories.length > 0 ? (
                                <div className="esnaf-categories-grid">
                                  {areaCategories.map((category) => {
                                    // Kategori seçili mi kontrol et
                                    const isSelected = profile.categories && Array.isArray(profile.categories) && profile.categories.some((cat: any) => {
                                      const catId = typeof cat === 'object' && cat !== null ? cat.id : cat;
                                      return Number(catId) === Number(category.id);
                                    });
                                    
                                    return (
                                      <label key={category.id} className="esnaf-checkbox-label">
                                        <input
                                          type="checkbox"
                                          checked={isSelected || false}
                                          onChange={(e) => {
                                            const currentCategories = profile.categories || [];
                                            const currentServiceAreas = profile.service_areas || [];
                                            
                                            // Mevcut kategorileri ID array'ine normalize et
                                            const normalizedCategories = currentCategories.map((cat: any) => {
                                              return typeof cat === 'object' && cat !== null ? cat.id : cat;
                                            });
                                            
                                            // Mevcut service areas'ı ID array'ine normalize et
                                            const normalizedServiceAreas = currentServiceAreas.map((sa: any) => {
                                              return typeof sa === 'object' && sa !== null ? sa.id : sa;
                                            });
                                            
                                            if (e.target.checked) {
                                              // Yeni kategori ekle (eğer yoksa)
                                              if (!normalizedCategories.includes(category.id)) {
                                                const newCategories = [...normalizedCategories, category.id];
                                                handleInputChange("categories", newCategories);
                                                
                                                // Service area'yı da ekle (eğer yoksa)
                                                const serviceAreaId = Number(category.service_area);
                                                if (!normalizedServiceAreas.some((saId: any) => Number(saId) === serviceAreaId)) {
                                                  const newServiceAreas = [...normalizedServiceAreas, serviceAreaId];
                                                  handleInputChange("service_areas", newServiceAreas);
                                                }
                                              }
                                            } else {
                                              // Kategoriyi çıkar
                                              const newCategories = normalizedCategories.filter((catId: any) => {
                                                return Number(catId) !== Number(category.id);
                                              });
                                              handleInputChange("categories", newCategories);
                                              
                                              // Eğer bu service_area'ya ait başka seçili kategori yoksa service_area'yı da kaldır
                                              const serviceAreaId = Number(category.service_area);
                                              const hasOtherCategories = newCategories.some((catId: any) => {
                                                const cat = categories.find(c => c.id === catId);
                                                return cat && Number(cat.service_area) === serviceAreaId;
                                              });
                                              
                                              if (!hasOtherCategories && normalizedServiceAreas.some((saId: any) => Number(saId) === serviceAreaId)) {
                                                const newServiceAreas = normalizedServiceAreas.filter((saId: any) => Number(saId) !== serviceAreaId);
                                                handleInputChange("service_areas", newServiceAreas);
                                              }
                                            }
                                          }}
                                          className="esnaf-checkbox"
                                        />
                                        {category.name}
                                      </label>
                                    );
                                  })}
                                </div>
                              ) : (
                                <div style={{ 
                                  padding: 24, 
                                  textAlign: 'center', 
                                  color: '#999' 
                                }}>
                                  Bu hizmet alanı için kategori bulunmamaktadır.
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="esnaf-form-group">
                  <label>Hizmet Verilen Araba Markaları</label>
                  <div className="esnaf-multi-select-container">
                    <div className="esnaf-multi-select-header" onClick={() => setCarBrandsDropdownOpen(!carBrandsDropdownOpen)}>
                      <span className="esnaf-multi-select-placeholder">
                        {profile.car_brands && profile.car_brands.length > 0 
                          ? `${profile.car_brands.length} marka seçildi` 
                          : "Araba markaları seçin"}
                      </span>
                      <svg 
                        className={`esnaf-multi-select-arrow ${carBrandsDropdownOpen ? 'open' : ''}`}
                        width="12" 
                        height="12" 
                        viewBox="0 0 12 12"
                      >
                        <path d="M3 4.5L6 7.5L9 4.5"  stroke="currentColor" strokeWidth="1.5" fill="none"/>
                      </svg>
                    </div>
                    
                    {carBrandsDropdownOpen && (
                      <div className="esnaf-multi-select-dropdown">
                        <div className="esnaf-multi-select-search">
                          <input
                            type="text"
                            placeholder="Marka ara..."
                            value={carBrandSearch}
                            onChange={(e) => setCarBrandSearch(e.target.value)}
                            className="esnaf-multi-select-search-input"
                          />
                        </div>
                        
                        <div className="esnaf-multi-select-options">
                          {filteredCarBrands.map((brand) => (
                            <label key={brand.id} className="esnaf-multi-select-option">
                              <input
                                type="checkbox"
                                checked={profile.car_brands && profile.car_brands.some((carBrand: any) => {
                                  const brandId = typeof carBrand === 'object' ? carBrand.id : carBrand;
                                  return brandId === brand.id;
                                })}
                                onChange={(e) => {
                                  const currentCarBrands = profile.car_brands || [];
                                  if (e.target.checked) {
                                    // Yeni marka ekle
                                    const newCarBrands = [...currentCarBrands, brand.id];
                                    handleInputChange("car_brands", newCarBrands);
                                  } else {
                                    // Markayı çıkar
                                    const newCarBrands = currentCarBrands.filter((carBrand: any) => {
                                      const brandId = typeof carBrand === 'object' ? carBrand.id : carBrand;
                                      return brandId !== brand.id;
                                    });
                                    handleInputChange("car_brands", newCarBrands);
                                  }
                                }}
                                className="esnaf-multi-select-checkbox"
                              />
                              <div className="esnaf-multi-select-option-content">
                                {brand.logo && (
                                  <img 
                                    src={brand.logo} 
                                    alt={brand.name} 
                                    className="esnaf-multi-select-brand-logo"
                                  />
                                )}
                                <span>{brand.name}</span>
                              </div>
                            </label>
                          ))}
                        </div>
                        
                        {filteredCarBrands.length === 0 && (
                          <div className="esnaf-multi-select-no-results">
                            Marka bulunamadı
                          </div>
                        )}
                      </div>
                    )}
                    
                    {/* Seçilen markaları göster */}
                    {profile.car_brands && profile.car_brands.length > 0 && (
                      <div className="esnaf-selected-brands">
                        {profile.car_brands.map((selectedBrand: any) => {
                          const brandId = typeof selectedBrand === 'object' ? selectedBrand.id : selectedBrand;
                          const brand = carBrands.find(b => b.id === brandId);
                          if (!brand) return null;
                          
                          return (
                            <div key={brand.id} className="esnaf-selected-brand-tag">
                              {brand.logo && (
                                <img 
                                  src={brand.logo} 
                                  alt={brand.name} 
                                  className="esnaf-selected-brand-logo"
                                />
                              )}
                              <span>{brand.name}</span>
                              <button
                                type="button"
                                onClick={() => {
                                  const newCarBrands = profile.car_brands.filter((carBrand: any) => {
                                    const brandId = typeof carBrand === 'object' ? carBrand.id : carBrand;
                                    return brandId !== brand.id;
                                  });
                                  handleInputChange("car_brands", newCarBrands);
                                }}
                                className="esnaf-selected-brand-remove"
                              >
                                ×
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Adres Bilgileri */}
              <div className="esnaf-profile-section">
                <h2 className="esnaf-section-title">Adres Bilgileri</h2>
                
                <div className="esnaf-form-row">
                  <div className="esnaf-form-group">
                    <label>İl</label>
                    <select
                      className="esnaf-select"
                      value={profile.city || ""}
                      onChange={(e) => {
                        const newCity = e.target.value;
                        handleInputChange("city", newCity);
                        // Reset dependent fields
                        handleInputChange("district", "");
                        handleInputChange("subdistrict", "");
                        setDistrictOptions(newCity ? getDistricts(newCity) : []);
                        setNeighbourhoodOptions([]);
                      }}
                    >
                      <option value="">İl seçiniz</option>
                      {cities.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                  <div className="esnaf-form-group">
                    <label>İlçe</label>
                    <select
                      className="esnaf-select"
                      value={profile.district || ""}
                      onChange={(e) => {
                        const newDistrict = e.target.value;
                        handleInputChange("district", newDistrict);
                        handleInputChange("subdistrict", "");
                        setNeighbourhoodOptions(newDistrict && profile.city ? getNeighbourhoods(profile.city, newDistrict) : []);
                      }}
                      disabled={!profile.city}
                    >
                      <option value="">İlçe seçiniz</option>
                      {districtOptions.map((d) => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="esnaf-form-row">
                  <div className="esnaf-form-group">
                    <label>Mahalle</label>
                    <select
                      className="esnaf-select"
                      value={profile.subdistrict || ""}
                      onChange={(e) => handleInputChange("subdistrict", e.target.value)}
                      disabled={!profile.city || !profile.district}
                    >
                      <option value="">Mahalle seçiniz</option>
                      {neighbourhoodOptions.map((n) => (
                        <option key={n} value={n}>{n}</option>
                      ))}
                    </select>
                  </div>
                  <div className="esnaf-form-group">
                    <label>Açık Adres</label>
                    <input
                      type="text"
                      value={profile.address}
                      onChange={(e) => handleInputChange("address", e.target.value)}
                      placeholder="Sokak, bina no"
                      className="esnaf-input"
                    />
                  </div>
                </div>

                {/* Konum Haritası */}
                {profile.city && profile.district && profile.subdistrict && (
                  <div className="esnaf-form-group">
                    <label>Konum Seçimi</label>
                    <div className="esnaf-location-picker-container">
                      <LocationPicker
                        initialLat={location.latitude || 41.0082}
                        initialLng={location.longitude || 28.9784}
                        onLocationChange={handleLocationChange}
                        city={profile.city}
                        district={profile.district}
                        subdistrict={profile.subdistrict}
                        height="400px"
                        className="esnaf-location-picker"
                      />
                      <div className="esnaf-location-info">
                        <p className="esnaf-help-text">
                          Haritaya tıklayarak işletmenizin tam konumunu belirleyin.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

              </div>

              {/* Sosyal Medya */}
              <div className="esnaf-profile-section">
                <h2 className="esnaf-section-title">Sosyal Medya</h2>
                
                <div className="esnaf-form-group">
                  <label>Instagram</label>
                  <input
                    type="url"
                    value={profile.social_media?.instagram || ""}
                    onChange={(e) => handleSocialMediaChange("instagram", e.target.value)}
                    placeholder="https://instagram.com/kullaniciadi"
                    className="esnaf-input"
                  />
                </div>

                <div className="esnaf-form-group">
                  <label>Facebook</label>
                  <input
                    type="url"
                    value={profile.social_media?.facebook || ""}
                    onChange={(e) => handleSocialMediaChange("facebook", e.target.value)}
                    placeholder="https://facebook.com/sayfaadi"
                    className="esnaf-input"
                  />
                </div>

                <div className="esnaf-form-group">
                  <label>Twitter</label>
                  <input
                    type="url"
                    value={profile.social_media?.twitter || ""}
                    onChange={(e) => handleSocialMediaChange("twitter", e.target.value)}
                    placeholder="https://twitter.com/kullaniciadi"
                    className="esnaf-input"
                  />
                </div>

                <div className="esnaf-form-group">
                  <label>Web Sitesi</label>
                  <input
                    type="url"
                    value={profile.social_media?.website || ""}
                    onChange={(e) => handleSocialMediaChange("website", e.target.value)}
                    placeholder="https://www.websitesi.com"
                    className="esnaf-input"
                  />
                </div>
              </div>

              {/* Çalışma Saatleri */}
              <div className="esnaf-profile-section">
                <h2 className="esnaf-section-title">Çalışma Saatleri</h2>
                <p className="esnaf-help-text">
                  Müşterilerin randevu alabilmesi için çalışma saatlerinizi belirleyin
                </p>
                
                <div className="esnaf-working-hours-grid">
                  {Object.entries(profile.working_hours || {}).map(([day, hours]: [string, any]) => {
                    const dayNames: { [key: string]: string } = {
                      monday: 'Pazartesi',
                      tuesday: 'Salı',
                      wednesday: 'Çarşamba',
                      thursday: 'Perşembe',
                      friday: 'Cuma',
                      saturday: 'Cumartesi',
                      sunday: 'Pazar'
                    };
                    const dayName = dayNames[day] || day;
                    const isClosed = hours.closed;

                    return (
                      <div key={day} className={`esnaf-working-day-card ${isClosed ? 'closed' : ''}`}>
                        <div className="esnaf-working-day-header">
                          <div className="esnaf-working-day-name">
                            <Clock size={18} />
                            <span>{dayName}</span>
                          </div>
                          <label className="esnaf-toggle-switch">
                            <input
                              type="checkbox"
                              checked={!isClosed}
                              onChange={(e) => handleWorkingHoursChange(day, "closed", !e.target.checked)}
                            />
                            <span className="esnaf-toggle-slider"></span>
                          </label>
                        </div>

                        {!isClosed && (
                          <div className="esnaf-working-day-times">
                            <div className="esnaf-time-selector">
                              <label>Açılış</label>
                              <select
                                value={(hours.open || "09:00").split(":")[0]}
                                onChange={(e) => handleWorkingHoursChange(day, "open", `${e.target.value.padStart(2, '0')}:00`)}
                                className="esnaf-time-select"
                              >
                                {Array.from({ length: 24 }).map((_, h) => (
                                  <option key={h} value={String(h).padStart(2, '0')}>
                                    {String(h).padStart(2, '0')}:00
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div className="esnaf-time-separator">-</div>
                            <div className="esnaf-time-selector">
                              <label>Kapanış</label>
                              <select
                                value={(hours.close || "18:00").split(":")[0]}
                                onChange={(e) => handleWorkingHoursChange(day, "close", `${e.target.value.padStart(2, '0')}:00`)}
                                className="esnaf-time-select"
                              >
                                {Array.from({ length: 24 }).map((_, h) => (
                                  <option key={h} value={String(h).padStart(2, '0')}>
                                    {String(h).padStart(2, '0')}:00
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>
                        )}

                        {isClosed && (
                          <div className="esnaf-working-day-closed">
                            <span>Kapalı</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Kaydet Butonu */}
              <div className="esnaf-form-actions">
                <button
                  type="button"
                  onClick={() => router.push("/esnaf/profil")}
                  className="esnaf-btn-secondary"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="esnaf-btn-primary"
                >
                  {saving ? "Kaydediliyor..." : "Profili Kaydet"}
                </button>
              </div>
            </form>
      </div>
    </EsnafPanelLayout>
  );
} 