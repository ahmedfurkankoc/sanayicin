'use client';

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/app/utils/api";
import { useTurkeyData } from "@/app/hooks/useTurkeyData";
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

  // Hizmet alanlarını çek
  useEffect(() => {
    api.getServiceAreas()
      .then(res => setServices(res.data))
      .catch(() => setServices([]));
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Arama sonuçları sayfasına her zaman yönlendir (giriş gerekmez)
    router.push(`/musteri/arama-sonuclari?city=${encodeURIComponent(selectedCity)}&district=${encodeURIComponent(selectedDistrict)}&service=${encodeURIComponent(selectedService)}`);
  };

  return (
    <>
      <form className={`modernSearchBar ${variant === 'stacked' ? 'modernSearchBar--stacked' : ''}`} autoComplete="off" onSubmit={handleSubmit}>
        <select
          className="modernSearchInput"
          value={selectedCity}
          onChange={e => setSelectedCity(e.target.value)}
          required
        >
          <option value="">İl seçiniz</option>
          {cities.map(city => (
            <option key={city} value={city}>{city}</option>
          ))}
        </select>
        <select
          className="modernSearchInput"
          value={selectedDistrict}
          onChange={e => setSelectedDistrict(e.target.value)}
          required
          disabled={!selectedCity}
        >
          <option value="">İlçe seçiniz</option>
          {districts.map(district => (
            <option key={district} value={district}>{district}</option>
          ))}
        </select>
        <select
          className="modernSearchInput"
          value={selectedService}
          onChange={e => setSelectedService(e.target.value)}
          required
        >
          <option value="">Hizmet seçiniz</option>
          {services.map(service => (
            <option key={service.id} value={service.id}>{service.name}</option>
          ))}
        </select>
        <button type="submit" className="modernSearchButton">Ara</button>
      </form>
    </>
  );
};

export default SearchBar; 