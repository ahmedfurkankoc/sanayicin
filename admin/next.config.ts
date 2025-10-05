import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Admin paneli için güvenlik ayarları
  async rewrites() {
    const backendOrigin = process.env.BACKEND_ORIGIN || 'http://localhost:8000'
    return [
      {
        source: '/api/admin/:path*',
        destination: `${backendOrigin}/api/admin/:path*`,
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