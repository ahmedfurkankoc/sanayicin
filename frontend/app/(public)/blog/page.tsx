import type { Metadata } from 'next'
import BlogClient from './BlogClient'

export const metadata: Metadata = {
  title: "Blog",
  description: "Sanayicin blog'dan otomotiv, bakım, tamir ve sanayi sektörü hakkında güncel ipuçları, detaylı rehberler ve uzman görüşleri.",
  keywords: [
    "oto sanayi blog", "otomotiv ipuçları", "araba bakım rehberi", "oto tamir ipuçları",
    "sanayi haberleri", "otomotiv rehberleri", "araç bakım", "oto servis ipuçları"
  ],
  openGraph: {
    title: "Blog | Sanayicin - İpuçları, Rehberler ve Haberler",
    description: "Sanayicin blog'dan otomotiv, bakım, tamir ve sanayi sektörü hakkında güncel ipuçları, detaylı rehberler ve uzman görüşleri.",
    url: "https://sanayicin.com/blog",
    type: "website",
    images: [
      {
        url: "/images/banner/hakkimizda.jpg",
        width: 1200,
        height: 630,
        alt: "Sanayicin Blog",
      },
    ],
  },
  alternates: {
    canonical: "https://sanayicin.com/blog",
  },
};

export default function PublicBlogListPage() {
  return <BlogClient />;
}


