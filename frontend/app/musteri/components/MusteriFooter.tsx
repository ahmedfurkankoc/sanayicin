'use client';

import React from 'react';
import Link from 'next/link';

export default function MusteriFooter() {
  return (
    <footer className="musteri-footer">
      <div className="musteri-footer-content">
        <div style={{ marginBottom: '1rem' }}>
          <Link href="/" className="musteri-logo" style={{ fontSize: '1.2rem' }}>
            Sanayicin
          </Link>
        </div>
        
        <div style={{ marginBottom: '1rem', fontSize: '0.9rem', opacity: 0.8 }}>
          <p>Güvenilir hizmet sağlayıcıları ile ihtiyaçlarınızı karşılayın</p>
        </div>
        
        <div style={{ display: 'flex', justifyContent: 'center', gap: '2rem', marginBottom: '1rem' }}>
          <Link href="/hakkimizda" style={{ color: 'white', textDecoration: 'none', opacity: 0.8 }}>
            Hakkımızda
          </Link>
          <Link href="/iletisim" style={{ color: 'white', textDecoration: 'none', opacity: 0.8 }}>
            İletişim
          </Link>
          <Link href="/gizlilik" style={{ color: 'white', textDecoration: 'none', opacity: 0.8 }}>
            Gizlilik Politikası
          </Link>
        </div>
        
        <div style={{ fontSize: '0.8rem', opacity: 0.6 }}>
          © 2024 Sanayicin. Tüm hakları saklıdır.
        </div>
      </div>
    </footer>
  );
}
