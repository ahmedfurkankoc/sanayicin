'use client';

import React, { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { createPortal } from "react-dom";
import { api } from "@/app/utils/api";
import { useTurkeyData } from "@/app/hooks/useTurkeyData";
import { ChevronDown } from "lucide-react";
import { toast } from "sonner";
type SearchBarVariant = 'default' | 'stacked';

interface SearchBarProps {
  variant?: SearchBarVariant;
}

const SearchBar: React.FC<SearchBarProps> = ({ variant = 'default' }) => {
  const router = useRouter();
  const { cities, loadTurkeyData, getDistricts } = useTurkeyData();
  const [selectedCity, setSelectedCity] = useState("");
  const [districts, setDistricts] = useState<string[]>([]);
  const [selectedDistrict, setSelectedDistrict] = useState("");
  const [services, setServices] = useState<any[]>([]);
  const [selectedService, setSelectedService] = useState("");
  const [carBrands, setCarBrands] = useState<any[]>([]);
  const [selectedCarBrand, setSelectedCarBrand] = useState("");
  
  // Dropdown state
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [dropdownPosition, setDropdownPosition] = useState<{top: number, left: number, width: number} | null>(null);
  const [mounted, setMounted] = useState(false);
  
  // Validation state
  const [hasValidationError, setHasValidationError] = useState(false);
  
  // Ref'ler
  const cityRef = useRef<HTMLDivElement>(null);
  const districtRef = useRef<HTMLDivElement>(null);
  const serviceRef = useRef<HTMLDivElement>(null);
  const carBrandRef = useRef<HTMLDivElement>(null);
  

  // Component mount olduğunda portal için gerekli
  useEffect(() => {
    setMounted(true);
  }, []);

  // Şehir verisini yükle
  useEffect(() => {
    loadTurkeyData();
  }, [loadTurkeyData]);

  // İl değişince ilçeleri güncelle
  useEffect(() => {
    if (selectedCity) {
      setDistricts(getDistricts(selectedCity));
      setSelectedDistrict("");
    } else {
      setDistricts([]);
      setSelectedDistrict("");
    }
  }, [selectedCity, getDistricts]);

  // Seçim yapıldığında validation error'ı temizle
  useEffect(() => {
    if (selectedCity || selectedDistrict || selectedService || selectedCarBrand) {
      setHasValidationError(false);
    }
  }, [selectedCity, selectedDistrict, selectedService, selectedCarBrand]);

  // Hizmet alanlarını çek
  useEffect(() => {
    api.getServiceAreas()
      .then(res => setServices(res.data))
      .catch(() => setServices([]));
  }, []);

  // Araba markalarını çek
  useEffect(() => {
    api.getCarBrands()
      .then(res => setCarBrands(res.data))
      .catch(() => setCarBrands([]));
  }, []);

  // Dropdown pozisyonunu hesapla
  const calculateDropdownPosition = (ref: React.RefObject<HTMLDivElement | null>) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    setDropdownPosition({
      top: rect.bottom + window.scrollY + 4,
      left: rect.left + window.scrollX,
      width: rect.width
    });
  };

  // Dropdown'ları dışarı tıklandığında kapat
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('.custom-select') && !target.closest('.dropdown-portal')) {
        setOpenDropdown(null);
        setDropdownPosition(null);
      }
    };

    if (openDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [openDropdown]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // En az bir filtre seçilmiş olmalı
    if (!selectedCity && !selectedDistrict && !selectedService && !selectedCarBrand) {
      setHasValidationError(true);
      toast.error("Lütfen en az bir filtre seçiniz", {
        description: "Şehir, ilçe, hizmet alanı veya araba markası seçerek arama yapabilirsiniz."
      });
      return;
    }
    
    // Validation geçtiyse error state'i temizle
    setHasValidationError(false);
    
    // Arama sonuçları sayfasına her zaman yönlendir (giriş gerekmez)
    const params = new URLSearchParams();
    
    if (selectedCity) params.set('city', selectedCity);
    if (selectedDistrict) params.set('district', selectedDistrict);
    
    // Service name ile ekle (ID yerine)
    if (selectedService) {
      const serviceName = services.find(service => service.id.toString() === selectedService)?.name;
      if (serviceName) {
        params.append('service', serviceName);
      }
    }
    
    // Araba markası seçilmişse ekle
    if (selectedCarBrand) {
      params.append('carBrand', selectedCarBrand);
    }
    
    // Refresh ile yönlendir
    window.location.href = `/musteri/esnaflar?${params.toString()}`;
  };

  return (
    <>
      <form className={`modernSearchBar ${variant === 'stacked' ? 'modernSearchBar--stacked' : ''} ${hasValidationError ? 'has-error' : ''}`} autoComplete="off" onSubmit={handleSubmit}>
        {/* İl Seçimi */}
        <div className={`custom-select ${openDropdown === 'city' ? 'open' : ''} ${hasValidationError && !selectedCity && !selectedDistrict && !selectedService && !selectedCarBrand ? 'error' : ''}`} ref={cityRef}>
          <div 
            className="custom-select-trigger"
            onClick={() => {
              if (openDropdown === 'city') {
                setOpenDropdown(null);
                setDropdownPosition(null);
              } else {
                calculateDropdownPosition(cityRef);
                setOpenDropdown('city');
              }
            }}
          >
            <span>
              {selectedCity || "İl seçiniz"}
            </span>
            <ChevronDown className="custom-select-arrow" size={16} />
          </div>
        </div>

        {/* İlçe Seçimi */}
        <div className={`custom-select ${openDropdown === 'district' ? 'open' : ''} ${hasValidationError && !selectedCity && !selectedDistrict && !selectedService && !selectedCarBrand ? 'error' : ''}`} ref={districtRef}>
          <div 
            className="custom-select-trigger"
            onClick={() => {
              if (!selectedCity) return;
              if (openDropdown === 'district') {
                setOpenDropdown(null);
                setDropdownPosition(null);
              } else {
                calculateDropdownPosition(districtRef);
                setOpenDropdown('district');
              }
            }}
            style={{ opacity: !selectedCity ? 0.5 : 1, cursor: !selectedCity ? 'not-allowed' : 'pointer' }}
          >
            <span>
              {selectedDistrict || "İlçe seçiniz"}
            </span>
            <ChevronDown className="custom-select-arrow" size={16} />
          </div>
        </div>

        {/* Hizmet Seçimi */}
        <div className={`custom-select ${openDropdown === 'service' ? 'open' : ''} ${hasValidationError && !selectedCity && !selectedDistrict && !selectedService && !selectedCarBrand ? 'error' : ''}`} ref={serviceRef}>
          <div 
            className="custom-select-trigger"
            onClick={() => {
              if (openDropdown === 'service') {
                setOpenDropdown(null);
                setDropdownPosition(null);
              } else {
                calculateDropdownPosition(serviceRef);
                setOpenDropdown('service');
              }
            }}
          >
            <span>
              {selectedService 
                ? services.find(service => service.id.toString() === selectedService)?.name 
                : "Hizmet seçiniz"
              }
            </span>
            <ChevronDown className="custom-select-arrow" size={16} />
          </div>
        </div>

        {/* Araba Markası Seçimi */}
        <div className={`custom-select ${openDropdown === 'carBrand' ? 'open' : ''} ${hasValidationError && !selectedCity && !selectedDistrict && !selectedService && !selectedCarBrand ? 'error' : ''}`} ref={carBrandRef}>
          <div 
            className="custom-select-trigger"
            onClick={() => {
              if (openDropdown === 'carBrand') {
                setOpenDropdown(null);
                setDropdownPosition(null);
              } else {
                calculateDropdownPosition(carBrandRef);
                setOpenDropdown('carBrand');
              }
            }}
          >
            <span>
              {selectedCarBrand 
                ? carBrands.find(brand => brand.id.toString() === selectedCarBrand)?.name 
                : "Araba markası"
              }
            </span>
            <ChevronDown className="custom-select-arrow" size={16} />
          </div>
        </div>

        <button type="submit" className="modernSearchButton">Ara</button>
        
        {/* Validation Error Message */}
        {hasValidationError && (
          <div className="search-bar-error-message">
            <p>⚠️ Lütfen en az bir filtre seçiniz</p>
          </div>
        )}
      </form>

      {/* Portal ile dropdown'ları body'ye render et */}
      {mounted && openDropdown && dropdownPosition && (
        createPortal(
          <div 
            className="dropdown-portal"
            style={{
              position: 'absolute',
              top: dropdownPosition.top,
              left: dropdownPosition.left,
              width: dropdownPosition.width,
              zIndex: 999999
            }}
          >
            <div className="custom-select-options">
              {openDropdown === 'city' && cities.map(city => (
                <div 
                  key={city}
                  className="custom-select-option"
                  onClick={() => {
                    setSelectedCity(city);
                    setOpenDropdown(null);
                    setDropdownPosition(null);
                  }}
                >
                  <span>{city}</span>
                </div>
              ))}
              
              {openDropdown === 'district' && selectedCity && districts.map(district => (
                <div 
                  key={district}
                  className="custom-select-option"
                  onClick={() => {
                    setSelectedDistrict(district);
                    setOpenDropdown(null);
                    setDropdownPosition(null);
                  }}
                >
                  <span>{district}</span>
                </div>
              ))}
              
              {openDropdown === 'service' && services.map(service => (
                <div 
                  key={service.id}
                  className="custom-select-option"
                  onClick={() => {
                    setSelectedService(service.id.toString());
                    setOpenDropdown(null);
                    setDropdownPosition(null);
                  }}
                >
                  <span>{service.name}</span>
                </div>
              ))}
              
              {openDropdown === 'carBrand' && (
                <>
                  <div 
                    className="custom-select-option"
                    onClick={() => {
                      setSelectedCarBrand("");
                      setOpenDropdown(null);
                      setDropdownPosition(null);
                    }}
                  >
                    <span>Araba markası</span>
                  </div>
                  {carBrands.map(brand => (
                    <div 
                      key={brand.id}
                      className="custom-select-option"
                      onClick={() => {
                        setSelectedCarBrand(brand.id.toString());
                        setOpenDropdown(null);
                        setDropdownPosition(null);
                      }}
                    >
                      {brand.logo_url && (
                        <img 
                          src={brand.logo_url}
                          alt={brand.name}
                          className="brand-logo-option"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      )}
                      <span>{brand.name}</span>
                    </div>
                  ))}
                </>
              )}
            </div>
          </div>,
          document.body
        )
      )}
    </>
  );
};

export default SearchBar; 