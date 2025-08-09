'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { iconMapping } from '@/app/utils/iconMapping';
import Image from 'next/image';

export default function MusteriHeader() {
  const [searchQuery, setSearchQuery] = useState('');
  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/musteri/arama-sonuclari?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <header className="musteri-header">
      <div className="musteri-header-content">
        {/* Sol: Logo */}
        <div className="musteri-header-left">
          <Link href="/" className="musteri-logo">
            <Image
              src="/sanayicin-esnaf-logo.png"
              alt="sanayicin.com"
              width={500}
              height={150}
              priority
              style={{ width: '100%', height: 'auto' }}
            />
          </Link>
        </div>
        
        {/* Orta: Arama Motoru */}
        <div className="musteri-header-center">
          <form onSubmit={handleSearch} className="musteri-search-form">
            <div className="musteri-search-container">
              <input
                type="text"
                placeholder="Aradığınız hizmeti yazın..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="musteri-search-input"
              />
              <button type="submit" className="musteri-search-btn">
                {React.createElement(iconMapping.search, { size: 20 })}
              </button>
            </div>
          </form>
        </div>
        
        {/* Sağ: Bildirim ve Kullanıcı */}
        <div className="musteri-header-right">
          <button className="musteri-notification-btn">
            {React.createElement(iconMapping.bell, { size: 20 })}
          </button>
          <div className="musteri-user-menu">
            <button className="musteri-user-btn">
              {React.createElement(iconMapping.user, { size: 20 })}
            </button>
            <div className="musteri-user-dropdown">
              <Link href="/musteri/profil" className="musteri-dropdown-item">
                Profilim
              </Link>
              <Link href="/musteri/randevularim" className="musteri-dropdown-item">
                Randevularım
              </Link>
              <Link href="/musteri/favorilerim" className="musteri-dropdown-item">
                Favorilerim
              </Link>
              <div className="musteri-dropdown-divider"></div>
              <Link href="/esnaf/giris" className="musteri-dropdown-item">
                Esnaf Girişi
              </Link>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
