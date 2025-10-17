'use client';

import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';

// Leaflet CSS'i dinamik olarak yükle
if (typeof window !== 'undefined') {
  import('leaflet/dist/leaflet.css');
}

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

// Dinamik harita bileşenleri
const MapContainer = dynamic(() => import('react-leaflet').then(mod => mod.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import('react-leaflet').then(mod => mod.TileLayer), { ssr: false });
const Marker = dynamic(() => import('react-leaflet').then(mod => mod.Marker), { ssr: false });
const Popup = dynamic(() => import('react-leaflet').then(mod => mod.Popup), { ssr: false });

interface VendorLocationMapProps {
  vendor: {
    slug: string;
    display_name: string;
    company_title?: string;
    city: string;
    district: string;
    subdistrict: string;
    address?: string;
    business_phone?: string;
    avatar?: string;
  };
  latitude?: number;
  longitude?: number;
  height?: string;
  className?: string;
  showNearbyVendors?: boolean;
}

export default function VendorLocationMap({
  vendor,
  latitude,
  longitude,
  height = '300px',
  className = '',
  showNearbyVendors = false
}: VendorLocationMapProps) {
  const [nearbyVendors, setNearbyVendors] = useState<any[]>([]);
  const [isLoadingNearby, setIsLoadingNearby] = useState(false);
  const [isClient, setIsClient] = useState(false);

  // Client-side render kontrolü
  useEffect(() => {
    setIsClient(true);
    setupLeafletIcons();
  }, []);

  // Yakındaki vendor'ları yükle
  useEffect(() => {
    if (showNearbyVendors && latitude && longitude) {
      setIsLoadingNearby(true);
      
      fetch(`/api/vendors/nearby/?latitude=${latitude}&longitude=${longitude}&radius=5`)
        .then(response => response.json())
        .then(data => {
          if (data.vendors) {
            // Kendi vendor'ını filtrele
            const filtered = data.vendors.filter((v: any) => v.slug !== vendor.slug);
            setNearbyVendors(filtered.slice(0, 5)); // En yakın 5 tanesi
          }
        })
        .catch(error => {
          console.error('Yakındaki vendor\'lar yüklenemedi:', error);
        })
        .finally(() => {
          setIsLoadingNearby(false);
        });
    }
  }, [showNearbyVendors, latitude, longitude, vendor.slug]);

  // Client-side render kontrolü
  if (!isClient) {
    return (
      <div className={`vendor-location-map ${className}`} style={{ height }}>
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

  // Konum bilgisi yoksa harita gösterme
  if (!latitude || !longitude) {
    return (
      <div className={`vendor-location-map ${className}`} style={{ height }}>
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
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '24px', marginBottom: '8px' }}>📍</div>
            <div>Konum bilgisi bulunamadı</div>
            <div style={{ fontSize: '12px', marginTop: '4px' }}>
              {vendor.city}, {vendor.district}, {vendor.subdistrict}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`vendor-location-map ${className}`} style={{ height, position: 'relative' }}>
      <MapContainer
        center={[latitude, longitude]}
        zoom={15}
        style={{ height: '100%', width: '100%', borderRadius: '8px' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {/* Ana vendor marker'ı */}
        <Marker position={[latitude, longitude]}>
          <Popup>
            <div style={{ minWidth: '220px' }}>
              <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>
                {vendor.display_name}
              </div>
              <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>
                {vendor.company_title}
              </div>
              <div style={{ fontSize: '12px', marginBottom: '4px' }}>
                📍 {vendor.address || `${vendor.subdistrict ? vendor.subdistrict + ', ' : ''}${vendor.district}, ${vendor.city}`}
              </div>
              <div style={{ fontSize: '12px', marginBottom: '4px' }}>
                📞 {vendor.business_phone}
              </div>
              <div style={{ fontSize: '12px', marginBottom: '12px' }}>
                🏢 {vendor.city}, {vendor.district}
              </div>
              
              {/* Yol Tarifi Butonu */}
              <div style={{ display: 'flex', justifyContent: 'center', marginTop: '8px' }}>
                <button
                  onClick={() => {
                    // Varsayılan olarak Google Maps açılır
                    window.open(`https://maps.google.com/maps?daddr=${latitude},${longitude}`, '_blank');
                  }}
                  style={{
                    background: '#4285f4',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '8px 16px',
                    fontSize: '12px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontWeight: '600',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.background = '#3367d6';
                    e.currentTarget.style.transform = 'translateY(-1px)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.background = '#4285f4';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  🗺️ Yol Tarifi Al
                </button>
              </div>
            </div>
          </Popup>
        </Marker>
        
        {/* Yakındaki vendor'lar */}
        {nearbyVendors.map((nearbyVendor) => (
          <Marker 
            key={nearbyVendor.slug} 
            position={[nearbyVendor.latitude, nearbyVendor.longitude]}
            icon={typeof window !== 'undefined' ? require('leaflet').divIcon({
              className: 'nearby-vendor-marker',
              html: `<div style="
                background: #ffd600;
                color: #111;
                border-radius: 50%;
                width: 20px;
                height: 20px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 10px;
                font-weight: bold;
                border: 2px solid #fff;
                box-shadow: 0 2px 4px rgba(0,0,0,0.3);
              ">${Math.round(nearbyVendor.distance * 100) / 100}km</div>`,
              iconSize: [20, 20],
              iconAnchor: [10, 10]
            }) : undefined}
          >
            <Popup>
              <div style={{ minWidth: '200px' }}>
                <div style={{ fontWeight: 'bold', marginBottom: '6px' }}>
                  {nearbyVendor.display_name}
                </div>
                <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>
                  {nearbyVendor.company_title}
                </div>
                <div style={{ fontSize: '12px', marginBottom: '4px' }}>
                  📍 {nearbyVendor.address || `${nearbyVendor.subdistrict ? nearbyVendor.subdistrict + ', ' : ''}${nearbyVendor.district}, ${nearbyVendor.city}`}
                </div>
                <div style={{ fontSize: '12px', marginBottom: '4px' }}>
                  📞 {nearbyVendor.business_phone}
                </div>
                <div style={{ fontSize: '12px', marginBottom: '8px' }}>
                  🏢 {nearbyVendor.city}, {nearbyVendor.district}
                </div>
                <div style={{ fontSize: '11px', color: '#ffd600', fontWeight: 'bold', marginBottom: '8px' }}>
                  📏 {nearbyVendor.distance} km uzaklıkta
                </div>
                
                {/* Yol Tarifi Butonu */}
                <div style={{ display: 'flex', justifyContent: 'center', marginTop: '6px' }}>
                  <button
                    onClick={() => {
                      // Varsayılan olarak Google Maps açılır
                      window.open(`https://maps.google.com/maps?daddr=${nearbyVendor.latitude},${nearbyVendor.longitude}`, '_blank');
                    }}
                    style={{
                      background: '#4285f4',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      padding: '6px 12px',
                      fontSize: '11px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontWeight: '600',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.background = '#3367d6';
                      e.currentTarget.style.transform = 'translateY(-1px)';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.background = '#4285f4';
                      e.currentTarget.style.transform = 'translateY(0)';
                    }}
                  >
                    🗺️ Yol Tarifi
                  </button>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
      
      {/* Yakındaki vendor'lar yükleniyor */}
      {isLoadingNearby && (
        <div style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          background: 'rgba(255, 255, 255, 0.9)',
          padding: '6px 12px',
          borderRadius: '6px',
          fontSize: '12px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          zIndex: 1000
        }}>
          Yakındaki esnaflar yükleniyor...
        </div>
      )}
      
      {/* Konum bilgisi */}
      <div style={{
        position: 'absolute',
        bottom: '10px',
        left: '10px',
        background: 'rgba(255, 255, 255, 0.9)',
        padding: '8px 12px',
        borderRadius: '6px',
        fontSize: '12px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        zIndex: 1000
      }}>
        <div><strong>📍 Konum:</strong> {vendor.address}</div>
        <div><strong>🏢 Adres:</strong> {vendor.subdistrict}, {vendor.district}, {vendor.city}</div>
      </div>
    </div>
  );
}
