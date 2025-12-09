import type { NextConfig } from "next";

// Base URL'i .env'den al
// NEXT_PUBLIC_BASE_URL varsa onu kullan
// Yoksa NEXT_PUBLIC_API_URL'den /api/admin veya /api kısmını kaldırarak al
// Yoksa localhost
const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 
  (process.env.NEXT_PUBLIC_API_URL?.replace(/\/api\/admin\/?$/, '').replace(/\/api\/?$/, '')) || 
  'http://localhost:8000';

// API URL'i oluştur - .env'de NEXT_PUBLIC_API_URL varsa onu kullan, yoksa baseUrl'den oluştur
const apiUrl = process.env.NEXT_PUBLIC_API_URL || `${baseUrl}/api/admin`;

const nextConfig: NextConfig = {
  // Admin paneli için güvenlik ayarları
  images: {
    unoptimized: true, // Resim optimizasyonunu devre dışı bırak
  },
  // API URL'i env'e ekle
  env: {
    NEXT_PUBLIC_API_URL: apiUrl,
    NEXT_PUBLIC_BASE_URL: baseUrl,
  },
  async rewrites() {
    return [
      {
        source: '/api/admin/:path*',
        destination: `${baseUrl}/api/admin/:path*`,
      },
    ]
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Robots-Tag',
            value: 'noindex, nofollow, nosnippet, noarchive, noimageindex',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'no-referrer',
          },
        ],
      },
    ];
  },
};

export default nextConfig;