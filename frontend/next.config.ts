import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    unoptimized: true,
  },
  // Production'da doğru API URL'ini kullan
  env: {
    NEXT_PUBLIC_API_URL: process.env.NODE_ENV === 'production' 
      ? 'https://test.sanayicin.com/api' 
      : 'http://localhost:8000/api',
  },
};

export default nextConfig;
