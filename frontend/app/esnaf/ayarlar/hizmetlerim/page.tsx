'use client';

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import "../../../styles/esnaf.css";
import EsnafPanelLayout from "../../components/EsnafPanelLayout";
import { useEsnaf } from "../../context/EsnafContext";
import { api } from "@/app/utils/api";
import { LoadingSpinner } from "../../components/LoadingSpinner";
import { Save, Check, X, ChevronDown, ChevronUp } from "lucide-react";

interface ServiceArea {
  id: number;
  name: string;
  description?: string;
}

interface Category {
  id: number;
  name: string;
  description?: string;
  service_area: number;
}

interface CarBrand {
  id: number;
  name: string;
  logo?: string;
}

export default function HizmetlerimPage() {
  const router = useRouter();
  const { user, loading: contextLoading } = useEsnaf();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Tüm veriler
  const [allServiceAreas, setAllServiceAreas] = useState<ServiceArea[]>([]);
  const [allCategories, setAllCategories] = useState<Category[]>([]);
  const [allCarBrands, setAllCarBrands] = useState<CarBrand[]>([]);

  // Seçili olanlar
  const [selectedCategories, setSelectedCategories] = useState<number[]>([]);
  const [selectedServiceAreas, setSelectedServiceAreas] = useState<number[]>([]);
  const [selectedCarBrands, setSelectedCarBrands] = useState<number[]>([]);

  // UI State
  const [expandedServiceAreas, setExpandedServiceAreas] = useState<Set<number>>(new Set());
  const [carBrandsDropdownOpen, setCarBrandsDropdownOpen] = useState(false);
  const [carBrandSearch, setCarBrandSearch] = useState('');

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Vendor profilini getir
        const profileRes = await api.getProfile('vendor');
        const profile = profileRes.data;

        // Mevcut seçimleri yükle
        if (profile.categories) {
          setSelectedCategories(profile.categories.map((cat: any) => cat.id || cat));
        }
        if (profile.service_areas) {
          setSelectedServiceAreas(profile.service_areas.map((sa: any) => sa.id || sa));
        }
        if (profile.car_brands) {
          setSelectedCarBrands(profile.car_brands.map((cb: any) => cb.id || cb));
        }

        // Tüm verileri paralel olarak getir
        const [serviceAreasRes, categoriesRes, carBrandsRes] = await Promise.all([
          api.getServiceAreas(),
          api.getCategories(),
          api.getCarBrands()
        ]);

        const normalizeArray = (data: any) => 
          Array.isArray(data) ? data : (data?.results || []);

        setAllServiceAreas(normalizeArray(serviceAreasRes.data));
        setAllCategories(normalizeArray(categoriesRes.data));
        setAllCarBrands(normalizeArray(carBrandsRes.data));

      } catch (err: any) {
        setError(err.response?.data?.detail || 'Veriler yüklenirken bir hata oluştu');
      } finally {
        setLoading(false);
      }
    };

    if (!contextLoading) {
      loadData();
    }
  }, [contextLoading]);

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(false);

      const formData = new FormData();
      
      selectedServiceAreas.forEach(id => {
        formData.append('service_areas_ids', id.toString());
      });
      selectedCategories.forEach(id => {
        formData.append('categories_ids', id.toString());
      });
      selectedCarBrands.forEach(id => {
        formData.append('car_brands_ids', id.toString());
      });

      await api.updateProfile(formData, 'vendor');

      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
      }, 3000);

    } catch (err: any) {
      setError(err.response?.data?.detail || 'Kaydetme sırasında bir hata oluştu');
    } finally {
      setSaving(false);
    }
  };

  const toggleServiceArea = (id: number) => {
    setExpandedServiceAreas(prev => {
      const newSet = new Set(prev);
      newSet.has(id) ? newSet.delete(id) : newSet.add(id);
      return newSet;
    });
  };

  const toggleCategory = (id: number) => {
    const category = allCategories.find(cat => cat.id === id);
    if (!category) return;

    setSelectedCategories(prev => {
      const isSelected = prev.includes(id);
      
      if (isSelected) {
        const newCategories = prev.filter(catId => catId !== id);
        const hasOtherCategories = newCategories.some(catId => {
          const cat = allCategories.find(c => c.id === catId);
          return cat && Number(cat.service_area) === Number(category.service_area);
        });
        
        if (!hasOtherCategories) {
          setSelectedServiceAreas(prevAreas => 
            prevAreas.filter(saId => Number(saId) !== Number(category.service_area))
          );
        }
        
        return newCategories;
      } else {
        const serviceAreaId = Number(category.service_area);
        setSelectedServiceAreas(prevAreas => {
          if (!prevAreas.some(saId => Number(saId) === serviceAreaId)) {
            return [...prevAreas, serviceAreaId];
          }
          return prevAreas;
        });
        
        return [...prev, id];
      }
    });
  };

  const toggleCarBrand = (id: number) => {
    setSelectedCarBrands(prev => 
      prev.includes(id) ? prev.filter(cbId => cbId !== id) : [...prev, id]
    );
  };

  const getCategoriesByServiceArea = (serviceAreaId: number): Category[] => 
    allCategories.filter(cat => cat.service_area === serviceAreaId);

  const filteredCarBrands = allCarBrands.filter(cb =>
    cb.name.toLowerCase().includes(carBrandSearch.toLowerCase())
  );

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

  if (contextLoading || loading) {
    return <LoadingSpinner />;
  }

  return (
    <EsnafPanelLayout activePage="ayarlar">
      <div style={{ padding: '24px 32px' }}>
        {/* Header */}
        <div className="esnaf-page-header" style={{ marginBottom: 32 }}>
          <div>
            <h1 className="esnaf-page-title">Hizmetlerim</h1>
            <p className="esnaf-page-subtitle">
              Hizmet kategorilerinizi ve hizmet verdiğiniz araç markalarını seçin
            </p>
          </div>
        </div>

        {/* Hata/Success Mesajları */}
        {error && (
          <div style={{
            padding: '12px 16px',
            background: '#fee',
            color: '#c33',
            borderRadius: 8,
            marginBottom: 24,
            display: 'flex',
            alignItems: 'center',
            gap: 8
          }}>
            <X size={18} />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div style={{
            padding: '12px 16px',
            background: '#efe',
            color: '#3c3',
            borderRadius: 8,
            marginBottom: 24,
            display: 'flex',
            alignItems: 'center',
            gap: 8
          }}>
            <Check size={18} />
            <span>Değişiklikler başarıyla kaydedildi!</span>
          </div>
        )}

        {/* Hizmet Alanları ve Kategoriler Bölümü */}
        <div style={{ marginBottom: 48 }}>
          <h2 style={{ 
            fontSize: 20, 
            fontWeight: 800, 
            color: '#111', 
            marginBottom: 16 
          }}>
            Hizmet Kategorileri
          </h2>
          <p style={{ 
            color: '#666', 
            fontSize: 14, 
            marginBottom: 16 
          }}>
            Hangi hizmet kategorilerinde hizmet veriyorsunuz? Hizmet alanına tıklayarak alt kategorileri görüntüleyin.
          </p>

          {/* Hizmet Alanları Accordion */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {allServiceAreas.map((serviceArea) => {
              const isExpanded = expandedServiceAreas.has(serviceArea.id);
              const categories = getCategoriesByServiceArea(serviceArea.id);
              const selectedCount = categories.filter(cat => selectedCategories.includes(cat.id)).length;

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
                      {categories.length > 0 ? (
                        <div style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                          gap: 12
                        }}>
                          {categories.map((category) => {
                            const isSelected = selectedCategories.includes(category.id);
                            return (
                              <button
                                key={category.id}
                                onClick={() => toggleCategory(category.id)}
                                style={{
                                  padding: '12px 16px',
                                  border: `2px solid ${isSelected ? 'var(--yellow)' : '#ddd'}`,
                                  borderRadius: 8,
                                  background: isSelected ? '#fffef0' : '#fff',
                                  cursor: 'pointer',
                                  textAlign: 'left',
                                  transition: 'all 0.2s',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 12
                                }}
                                onMouseEnter={(e) => {
                                  if (!isSelected) {
                                    e.currentTarget.style.borderColor = '#ccc';
                                    e.currentTarget.style.background = '#f9f9f9';
                                  }
                                }}
                                onMouseLeave={(e) => {
                                  if (!isSelected) {
                                    e.currentTarget.style.borderColor = '#ddd';
                                    e.currentTarget.style.background = '#fff';
                                  }
                                }}
                              >
                                <div style={{
                                  width: 20,
                                  height: 20,
                                  borderRadius: 4,
                                  border: `2px solid ${isSelected ? 'var(--yellow)' : '#ddd'}`,
                                  background: isSelected ? 'var(--yellow)' : 'transparent',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  flexShrink: 0
                                }}>
                                  {isSelected && <Check size={14} color="#111" />}
                                </div>
                                <div style={{ 
                                  fontWeight: 500, 
                                  color: '#111', 
                                  fontSize: 13
                                }}>
                                  {category.name}
                                </div>
                              </button>
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

        {/* Araç Markaları Bölümü - Dropdown */}
        <div style={{ marginBottom: 48 }}>
          <h2 style={{ 
            fontSize: 20, 
            fontWeight: 800, 
            color: '#111', 
            marginBottom: 16 
          }}>
            Hizmet Verilen Araç Markaları
          </h2>
          <p style={{ 
            color: '#666', 
            fontSize: 14, 
            marginBottom: 16 
          }}>
            Hangi araç markaları için hizmet veriyorsunuz?
          </p>

          <div className="esnaf-multi-select-container">
            <div 
              className="esnaf-multi-select-header" 
              onClick={() => setCarBrandsDropdownOpen(!carBrandsDropdownOpen)}
            >
              <span className="esnaf-multi-select-placeholder">
                {selectedCarBrands.length > 0 
                  ? `${selectedCarBrands.length} marka seçildi` 
                  : "Araç markaları seçin"}
              </span>
              <svg 
                className={`esnaf-multi-select-arrow ${carBrandsDropdownOpen ? 'open' : ''}`}
                width="12" 
                height="12" 
                viewBox="0 0 12 12"
              >
                <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.5" fill="none"/>
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
                  {filteredCarBrands.map((brand) => {
                    const isSelected = selectedCarBrands.includes(brand.id);
                    return (
                      <label key={brand.id} className="esnaf-multi-select-option">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleCarBrand(brand.id)}
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
                    );
                  })}
                </div>
                
                {filteredCarBrands.length === 0 && (
                  <div className="esnaf-multi-select-no-results">
                    Marka bulunamadı
                  </div>
                )}
              </div>
            )}
            
            {/* Seçilen markaları göster */}
            {selectedCarBrands.length > 0 && (
              <div className="esnaf-selected-brands">
                {selectedCarBrands.map((brandId) => {
                  const brand = allCarBrands.find(b => b.id === brandId);
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
                        onClick={() => toggleCarBrand(brand.id)}
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

        {/* Kaydet Butonu */}
        <div style={{
          display: 'flex',
          justifyContent: 'flex-end',
          gap: 12,
          paddingTop: 24,
          borderTop: '1px solid #eee'
        }}>
          <button
            onClick={() => router.back()}
            style={{
              padding: '12px 24px',
              border: '1px solid #ddd',
              borderRadius: 8,
              background: '#fff',
              color: '#666',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: 14
            }}
          >
            İptal
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              padding: '12px 24px',
              border: 'none',
              borderRadius: 8,
              background: saving ? '#ccc' : 'var(--yellow)',
              color: '#111',
              cursor: saving ? 'not-allowed' : 'pointer',
              fontWeight: 800,
              fontSize: 14,
              display: 'flex',
              alignItems: 'center',
              gap: 8
            }}
          >
            {saving ? (
              <>
                <LoadingSpinner />
                Kaydediliyor...
              </>
            ) : (
              <>
                <Save size={18} />
                Kaydet
              </>
            )}
          </button>
        </div>
      </div>
    </EsnafPanelLayout>
  );
}
