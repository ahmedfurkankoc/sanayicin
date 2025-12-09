import type { NextConfig } from "next";

// Base URL'i .env'den al
// NEXT_PUBLIC_BASE_URL varsa onu kullan
// Yoksa NEXT_PUBLIC_API_URL'den /api kısmını kaldırarak al
// Yoksa localhost
const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 
  (process.env.NEXT_PUBLIC_API_URL?.replace(/\/api\/?$/, '')) || 
  'http://localhost:8000';

// API URL'i oluştur - .env'de NEXT_PUBLIC_API_URL varsa onu kullan, yoksa baseUrl'den oluştur
const apiUrl = process.env.NEXT_PUBLIC_API_URL || `${baseUrl}/api`;

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    unoptimized: true,
  },
  // API URL'i env'e ekle
  env: {
    NEXT_PUBLIC_API_URL: apiUrl,
    NEXT_PUBLIC_BASE_URL: baseUrl,
  },
  // Media dosyalarını Django backend'e proxy et
  async rewrites() {
    return [
      {
        source: '/media/:path*',
        destination: `${baseUrl}/media/:path*`,
      },
    ];
  },
  // SSR için output mode (varsayılan olarak SSR aktif)
  // Next.js 13+ App Router varsayılan olarak SSR kullanır
  // Static generation için generateStaticParams kullanılabilir
};

export default nextConfig;
