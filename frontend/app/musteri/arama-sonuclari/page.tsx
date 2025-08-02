'use client';

import React, { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { api } from "@/app/utils/api";

interface Vendor {
  id: number;
  user: {
    email: string;
    email_verified: boolean;
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
  profile_photo?: string;
  service_areas?: any[];
  categories?: any[];
  slug: string; // Added slug to the interface
}

interface SearchResponse {
  count: number;
  results: Vendor[];
}

function AramaSonuclariContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const city = searchParams.get("city") || "";
  const district = searchParams.get("district") || "";
  const service = searchParams.get("service") || "";
  const category = searchParams.get("category") || "";

  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [services, setServices] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedService, setSelectedService] = useState(service);
  const [selectedCategory, setSelectedCategory] = useState(category);
  const [selectedCity, setSelectedCity] = useState(city);
  const [selectedDistrict, setSelectedDistrict] = useState(district);

  // Hizmet alanlarını çek
  useEffect(() => {
    api.getServiceAreas()
      .then(res => setServices(res.data))
      .catch(() => setServices([]));
  }, []);

  // Kategorileri API'den çek
  useEffect(() => {
    api.getCategories()
      .then(res => setCategories(res.data))
      .catch(() => setCategories([]));
  }, []);

  useEffect(() => {
    const searchVendors = async () => {
      try {
        setLoading(true);
        setError("");
        
        const response = await api.searchVendors({
          city: selectedCity,
          district: selectedDistrict,
          service: selectedService,
          category: selectedCategory
        });
        
        const data: SearchResponse = response.data;
        setVendors(data.results || []);
      } catch (err: any) {
        console.error("Vendor arama hatası:", err);
        setError("Arama sırasında bir hata oluştu. Lütfen tekrar deneyin.");
      } finally {
        setLoading(false);
      }
    };

    if (selectedCity || selectedDistrict || selectedService || selectedCategory) {
      searchVendors();
    }
  }, [selectedCity, selectedDistrict, selectedService, selectedCategory]);

  const handleFilterChange = (type: string, value: string) => {
    if (type === 'city') setSelectedCity(value);
    if (type === 'district') setSelectedDistrict(value);
    if (type === 'service') {
      setSelectedService(value);
      setSelectedCategory(""); // Hizmet değişince kategoriyi sıfırla
    }
    if (type === 'category') setSelectedCategory(value);
  };

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (selectedCity) params.set('city', selectedCity);
    if (selectedDistrict) params.set('district', selectedDistrict);
    if (selectedService) params.set('service', selectedService);
    if (selectedCategory) params.set('category', selectedCategory);
    router.push(`/musteri/arama-sonuclari?${params.toString()}`);
  };

  // Seçili hizmet alanına göre kategorileri filtrele
  const filteredCategories = selectedService 
    ? categories.filter(cat => cat.service_area == selectedService)
    : categories;

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
      {/* Upwork Benzeri Header */}
      <header style={{ 
        backgroundColor: 'white', 
        borderBottom: '1px solid #e0e0e0',
        padding: '0 24px',
        height: '64px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        {/* Sol Kısım - Logo ve Navigation */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
          {/* Logo */}
          <div 
            onClick={() => router.push('/')}
            style={{
              fontSize: '24px',
              fontWeight: 'bold',
              color: '#ffd600',
              cursor: 'pointer'
            }}
          >
            Sanayicin
          </div>

          {/* Navigation Menüleri */}
          <nav style={{ display: 'flex', gap: '24px' }}>
            <div style={{ position: 'relative' }}>
              <button style={{
                background: 'none',
                border: 'none',
                padding: '8px 12px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                color: '#333',
                fontWeight: '500'
              }}>
                Hizmet Ara
                <span style={{ fontSize: '12px' }}>▼</span>
              </button>
            </div>
            
            <div style={{ position: 'relative' }}>
              <button style={{
                background: 'none',
                border: 'none',
                padding: '8px 12px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                color: '#333',
                fontWeight: '500'
              }}>
                Hizmet Ver
                <span style={{ fontSize: '12px' }}>▼</span>
              </button>
            </div>
            
            <div style={{ position: 'relative' }}>
              <button style={{
                background: 'none',
                border: 'none',
                padding: '8px 12px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                color: '#333',
                fontWeight: '500'
              }}>
                Mesajlar
                <span style={{ fontSize: '12px' }}>▼</span>
              </button>
            </div>
          </nav>
        </div>

        {/* Orta Kısım - Arama Çubuğu */}
        <div style={{ flex: 1, maxWidth: '600px', margin: '0 32px' }}>
          <div style={{ position: 'relative' }}>
            <input
              type="text"
              placeholder="Arama yapın..."
              value={`${selectedCity} ${selectedDistrict} ${services.find(s => s.id == selectedService)?.name || ''} ${categories.find(c => c.id == selectedCategory)?.name || ''}`}
              readOnly
              style={{
                width: '100%',
                padding: '12px 16px 12px 40px',
                border: '1px solid #ddd',
                borderRadius: '8px',
                fontSize: '16px',
                backgroundColor: '#f8f9fa'
              }}
            />
            <span style={{
              position: 'absolute',
              left: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: '#666',
              fontSize: '16px'
            }}>
              🔍
            </span>
            <button
              onClick={handleSearch}
              style={{
                position: 'absolute',
                right: '8px',
                top: '50%',
                transform: 'translateY(-50%)',
                backgroundColor: '#ffd600',
                color: '#111111',
                border: 'none',
                padding: '6px 12px',
                borderRadius: '4px',
                fontWeight: 'bold',
                cursor: 'pointer',
                fontSize: '12px'
              }}
            >
              Ara
            </button>
          </div>
        </div>

        {/* Sağ Kısım - User Menu */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {/* Yardım */}
          <button style={{
            background: 'none',
            border: 'none',
            fontSize: '18px',
            color: '#666',
            cursor: 'pointer',
            padding: '8px'
          }}>
            ?
          </button>

          {/* Bildirimler */}
          <button style={{
            background: 'none',
            border: 'none',
            fontSize: '18px',
            color: '#666',
            cursor: 'pointer',
            padding: '8px',
            position: 'relative'
          }}>
            🔔
            <span style={{
              position: 'absolute',
              top: '4px',
              right: '4px',
              backgroundColor: '#ff4444',
              color: 'white',
              borderRadius: '50%',
              width: '8px',
              height: '8px',
              fontSize: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              3
            </span>
          </button>

          {/* Ayarlar */}
          <button style={{
            background: 'none',
            border: 'none',
            fontSize: '18px',
            color: '#666',
            cursor: 'pointer',
            padding: '8px'
          }}>
            ⚙️
          </button>

          {/* User Avatar */}
          <button style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '4px'
          }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              backgroundColor: '#ffd600',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#111111',
              fontWeight: 'bold',
              fontSize: '14px'
            }}>
              U
            </div>
          </button>
        </div>
      </header>

      <div style={{ display: 'flex', minHeight: 'calc(100vh - 64px)' }}>
        {/* Sol Sütun - Filtreler */}
        <div style={{ 
          width: '300px', 
          backgroundColor: 'white', 
          padding: '24px',
          borderRight: '1px solid #e0e0e0'
        }}>
          <h3 style={{ marginBottom: '20px', color: '#333' }}>Filtreler</h3>
          
          {/* Şehir Filtresi */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
              Şehir
            </label>
            <input
              type="text"
              value={selectedCity}
              onChange={(e) => handleFilterChange('city', e.target.value)}
              placeholder="Şehir seçin"
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #ddd',
                borderRadius: '4px'
              }}
            />
          </div>

          {/* İlçe Filtresi */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
              İlçe
            </label>
            <input
              type="text"
              value={selectedDistrict}
              onChange={(e) => handleFilterChange('district', e.target.value)}
              placeholder="İlçe seçin"
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #ddd',
                borderRadius: '4px'
              }}
            />
          </div>

          {/* Hizmet Filtresi */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
              Hizmet Alanı
            </label>
            <select
              value={selectedService}
              onChange={(e) => handleFilterChange('service', e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #ddd',
                borderRadius: '4px'
              }}
            >
              <option value="">Tüm Hizmetler</option>
              {services.map(service => (
                <option key={service.id} value={service.id}>
                  {service.name}
                </option>
              ))}
            </select>
          </div>

          {/* Kategori Filtresi */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
              Kategori
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => handleFilterChange('category', e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #ddd',
                borderRadius: '4px'
              }}
              disabled={!selectedService}
            >
              <option value="">Tüm Kategoriler</option>
              {filteredCategories.map(category => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
            {!selectedService && (
              <small style={{ color: '#666', fontSize: '12px' }}>
                Önce hizmet alanı seçin
              </small>
            )}
          </div>

          {/* Sonuç Sayısı */}
          <div style={{ 
            padding: '16px', 
            backgroundColor: '#f8f9fa', 
            borderRadius: '8px',
            marginTop: '20px'
          }}>
            <strong>{vendors.length}</strong> usta bulundu
          </div>
        </div>

        {/* Sağ Sütun - Arama Sonuçları */}
        <div style={{ flex: 1, padding: '24px' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <div>Aranıyor...</div>
            </div>
          ) : error ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'red' }}>
              <div>{error}</div>
            </div>
          ) : vendors.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <h3>Sonuç bulunamadı</h3>
              <p>Seçtiğiniz kriterlere uygun usta bulunamadı. Lütfen farklı kriterler deneyin.</p>
            </div>
          ) : (
            <div>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                marginBottom: '20px'
              }}>
                <h2 style={{ margin: 0, color: '#333' }}>Arama Sonuçları</h2>
                <div style={{ color: '#666' }}>
                  <strong>{vendors.length}</strong> sonuç
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {vendors.map(vendor => (
                  <div key={vendor.id} style={{ 
                    backgroundColor: 'white',
                    border: '1px solid #e0e0e0',
                    borderRadius: '8px',
                    padding: '20px',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ flex: 1 }}>
                        <h3 style={{ margin: '0 0 8px 0', color: '#333' }}>
                          {vendor.display_name}
                        </h3>
                        <p style={{ margin: '0 0 8px 0', color: '#666' }}>
                          <strong>Şirket:</strong> {vendor.company_title}
                        </p>
                        <p style={{ margin: '0 0 8px 0', color: '#666' }}>
                          <strong>Konum:</strong> {vendor.city}/{vendor.district}
                        </p>
                        <p style={{ margin: '0 0 8px 0', color: '#666' }}>
                          <strong>Telefon:</strong> {vendor.phone}
                        </p>
                        {vendor.about && (
                          <p style={{ margin: '0 0 12px 0', color: '#666', lineHeight: '1.5' }}>
                            {vendor.about}
                          </p>
                        )}
                        
                        {/* Hizmet Alanları */}
                        {vendor.service_areas && vendor.service_areas.length > 0 && (
                          <div style={{ marginBottom: '12px' }}>
                            <strong style={{ color: '#333' }}>Hizmet Alanları:</strong>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '4px' }}>
                              {vendor.service_areas.map((service: any) => (
                                <span key={service.id} style={{
                                  backgroundColor: '#f0f0f0',
                                  padding: '4px 8px',
                                  borderRadius: '4px',
                                  fontSize: '12px',
                                  color: '#666'
                                }}>
                                  {service.name}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Kategoriler */}
                        {vendor.categories && vendor.categories.length > 0 && (
                          <div style={{ marginBottom: '12px' }}>
                            <strong style={{ color: '#333' }}>Kategoriler:</strong>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '4px' }}>
                              {vendor.categories.map((category: any) => (
                                <span key={category.id} style={{
                                  backgroundColor: '#e8f4fd',
                                  padding: '4px 8px',
                                  borderRadius: '4px',
                                  fontSize: '12px',
                                  color: '#0066cc',
                                  border: '1px solid #b3d9ff'
                                }}>
                                  {category.name}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                      
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <button style={{
                          backgroundColor: '#ffd600',
                          color: '#111111',
                          border: 'none',
                          padding: '8px 16px',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontWeight: 'bold',
                          fontSize: '14px'
                        }}>
                          İletişime Geç
                        </button>
                        <button 
                          onClick={() => router.push(`/musteri/esnaf/${vendor.slug}`)}
                          style={{
                          backgroundColor: 'transparent',
                          color: '#666',
                          border: '1px solid #ddd',
                          padding: '6px 12px',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '12px'
                        }}>
                          Profili Görüntüle
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AramaSonuclari() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AramaSonuclariContent />
    </Suspense>
  );
} 