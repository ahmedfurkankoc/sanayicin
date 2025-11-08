import type { NextConfig } from "next";

const apiUrl = process.env.NODE_ENV === 'production' 
  ? 'https://test.sanayicin.com' 
  : 'http://localhost:8000';

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    unoptimized: true,
  },
  // Production'da doğru API URL'ini kullan
  env: {
    NEXT_PUBLIC_API_URL: `${apiUrl}/api`,
  },
  // Media dosyalarını Django backend'e proxy et
  async rewrites() {
    return [
      {
        source: '/media/:path*',
        destination: `${apiUrl}/media/:path*`,
      },
    ];
  },
};

export default nextConfig;
