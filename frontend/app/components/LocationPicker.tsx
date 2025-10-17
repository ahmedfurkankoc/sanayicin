'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import dynamic from 'next/dynamic';

// Leaflet CSS globalde import edildi (app/styles/styles.css)

// Leaflet icon sorununu çöz (sadece client-side'da)
const setupLeafletIcons = () => {
  if (typeof window !== 'undefined') {
    const L = require('leaflet');
    delete (L.Icon.Default.prototype as any)._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
      iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    });
  }
};

interface LocationPickerProps {
  initialLat?: number;
  initialLng?: number;
  onLocationChange: (lat: number, lng: number) => void;
  city?: string;
  district?: string;
  subdistrict?: string;
  height?: string;
  className?: string;
}

// Dinamik harita bileşenleri
const MapContainer = dynamic(() => import('react-leaflet').then(mod => mod.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import('react-leaflet').then(mod => mod.TileLayer), { ssr: false });
const Marker = dynamic(() => import('react-leaflet').then(mod => mod.Marker), { ssr: false });

// Harita olaylarını dinleyen bileşen
function MapEvents({ onLocationChange }: { onLocationChange: (lat: number, lng: number) => void }) {
  const { useMapEvents } = require('react-leaflet');
  
  useMapEvents({
    click: (e: any) => {
      const { lat, lng } = e.latlng;
      onLocationChange(lat, lng);
    },
  });
  return null;
}

export default function LocationPicker({
  initialLat = 41.0082, // İstanbul koordinatları (düzeltildi)
  initialLng = 28.9784,
  onLocationChange,
  city,
  district,
  subdistrict,
  height = '400px',
  className = ''
}: LocationPickerProps) {
  const [position, setPosition] = useState<[number, number]>([initialLat, initialLng]);
  const [isLoading, setIsLoading] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const mapRef = useRef<any>(null);
  const onLocationChangeRef = useRef(onLocationChange);
  const lastLocationKeyRef = useRef<string>('');
  
  // onLocationChange fonksiyonunu ref'te sakla
  useEffect(() => {
    onLocationChangeRef.current = onLocationChange;
  }, [onLocationChange]);

  // Client-side render kontrolü
  useEffect(() => {
    setIsClient(true);
    setupLeafletIcons();
  }, []);

  // Nominatim API ile koordinatları bulan fonksiyon
  const getCoordinatesFromNominatim = useCallback(async (city: string, district: string, subdistrict: string) => {
    try {
      // Sadece ilçe bazında arama yap
      let searchQuery = `${district}, ${city}, Turkey`;
      let url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=3&countrycodes=tr&addressdetails=1`;
      
      console.log('İlçe bazında arama:', searchQuery);
      
      let response = await fetch(url, {
        headers: {
          'User-Agent': 'SanayicinApp/1.0 (Location Picker)'
        }
      });
      
      let data = await response.json();
      
      // İlçe de bulunamazsa şehir bazında ara
      if (!data || data.length === 0) {
        searchQuery = `${city}, Turkey`;
        url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=3&countrycodes=tr&addressdetails=1`;
        
        console.log('Şehir bazında arama:', searchQuery);
        
        response = await fetch(url, {
          headers: {
            'User-Agent': 'SanayicinApp/1.0 (Location Picker)'
          }
        });
        
        data = await response.json();
      }
      
      if (data && data.length > 0) {
        // En iyi sonucu bul - ilçe bazında
        let bestResult = data[0];
        
        for (const result of data) {
          const address = result.address || {};
          const resultCity = address.city || address.state || '';
          const resultDistrict = address.county || address.municipality || '';
          
          // Şehir ve ilçe eşleşmesi kontrol et
          if (resultCity.toLowerCase().includes(city.toLowerCase()) && 
              resultDistrict.toLowerCase().includes(district.toLowerCase())) {
            bestResult = result;
            break;
          }
        }
        
        const lat = parseFloat(bestResult.lat);
        const lng = parseFloat(bestResult.lon);
        
        console.log('Bulunan koordinatlar:', lat, lng);
        console.log('Seçilen sonuç:', bestResult.display_name);
        
        // Koordinatları güncelle ve harita merkezini ayarla
        setPosition([lat, lng]);
        onLocationChangeRef.current(lat, lng);
        
        // Harita merkezini hemen ayarla
        if (mapRef.current && isClient) {
          try {
            mapRef.current.setView([lat, lng], 15);
          } catch (error) {
            console.log('Harita merkezi ayarlanamadı:', error);
          }
        }
        
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Nominatim API hatası:', error);
      return false;
    }
  }, [isClient]); // isClient dependency'sini ekledik

  // İl/ilçe/semt değiştiğinde haritayı o bölgeye odakla
  useEffect(() => {
    if (!city || !district || !subdistrict) return;
    
    // Önceki değerleri kontrol et
    const locationKey = `${city}-${district}-${subdistrict}`;
    
    if (locationKey === lastLocationKeyRef.current) return;
    
    lastLocationKeyRef.current = locationKey;
    setIsLoading(true);
    
    console.log('Konum aranıyor:', city, district, subdistrict);
    
    // Nominatim API ile koordinatları al
    getCoordinatesFromNominatim(city, district, subdistrict)
      .then(success => {
        if (!success) {
          // Nominatim başarısız olursa varsayılan koordinatları kullan
          console.log('Nominatim başarısız, varsayılan koordinatlar kullanılıyor');
          setPosition([41.0082, 28.9784]); // İstanbul merkez
          onLocationChangeRef.current(41.0082, 28.9784);
        }
      })
      .catch(error => {
        console.error('Konum bulunamadı:', error);
        setPosition([41.0082, 28.9784]); // İstanbul merkez
        onLocationChangeRef.current(41.0082, 28.9784);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [city, district, subdistrict]);

  // Harita merkezini güncelle - sadece manuel tıklama için
  useEffect(() => {
    if (mapRef.current && isClient && !isLoading) {
      try {
        mapRef.current.setView(position, 15);
      } catch (error) {
        console.log('Harita merkezi ayarlanamadı:', error);
      }
    }
  }, [position, isClient, isLoading]);

  const handleLocationChange = useCallback((lat: number, lng: number) => {
    setPosition([lat, lng]);
    onLocationChangeRef.current(lat, lng);
  }, []); // Dependency'leri kaldırdık

  // Client-side render kontrolü
  if (!isClient) {
    return (
      <div className={`location-picker ${className}`} style={{ height }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          background: '#f5f5f5',
          borderRadius: '8px',
          color: '#666',
          fontSize: '14px'
        }}>
          Harita yükleniyor...
        </div>
      </div>
    );
  }

  return (
    <div className={`location-picker ${className}`} style={{ height }}>
      {isLoading && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 1000,
          background: 'rgba(255, 255, 255, 0.9)',
          padding: '10px 20px',
          borderRadius: '8px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
          fontSize: '14px',
          fontWeight: '500'
        }}>
          Konum aranıyor...
        </div>
      )}
      
      <MapContainer
        center={position}
        zoom={15}
        style={{ height: '100%', width: '100%' }}
        ref={mapRef}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        <Marker position={position} />
        
        <MapEvents onLocationChange={handleLocationChange} />
      </MapContainer>
    </div>
  );
}
