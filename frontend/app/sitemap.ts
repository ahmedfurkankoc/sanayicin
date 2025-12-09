import { MetadataRoute } from 'next'

// API URL'i .env'den al
let apiUrl = process.env.NEXT_PUBLIC_API_URL;
if (!apiUrl) {
  apiUrl = "http://localhost:8000/api";
} else if (!apiUrl.includes('/api')) {
  const baseUrl = apiUrl.replace(/\/$/, '');
  apiUrl = `${baseUrl}/api`;
}

async function getBlogPosts() {
  try {
    const res = await fetch(`${apiUrl}/blog/posts/?page_size=1000&ordering=-published_at`, {
      next: { revalidate: 3600 } // 1 saat cache
    });
    if (!res.ok) return [];
    const data = await res.json();
    return data.results || data.items || [];
  } catch (error) {
    console.error('Blog posts fetch error:', error);
    return [];
  }
}

async function getBlogCategories() {
  try {
    const res = await fetch(`${apiUrl}/blog/categories/`, {
      next: { revalidate: 3600 }
    });
    if (!res.ok) return [];
    const data = await res.json();
    return data.results || data || [];
  } catch (error) {
    console.error('Blog categories fetch error:', error);
    return [];
  }
}

async function getVendors() {
  try {
    const res = await fetch(`${apiUrl}/vendors/search/?page_size=1000&ordering=-review_count`, {
      next: { revalidate: 3600 }
    });
    if (!res.ok) return [];
    const data = await res.json();
    return data.results || data.items || [];
  } catch (error) {
    console.error('Vendors fetch error:', error);
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://sanayicin.com'
  
  // Statik sayfalar
  const staticPages = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 1,
    },
    {
      url: `${baseUrl}/hakkimizda`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.8,
    },
    {
      url: `${baseUrl}/iletisim`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    },
    {
      url: `${baseUrl}/usta-ariyorum`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.9,
    },
    {
      url: `${baseUrl}/en-yakin`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.9,
    },
    {
      url: `${baseUrl}/nasil-calisir`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.8,
    },
    {
      url: `${baseUrl}/hizmet-vermek-istiyorum`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.8,
    },
    {
      url: `${baseUrl}/neden-esnaf-olmaliyim`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.8,
    },
    {
      url: `${baseUrl}/blog`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.9,
    },
    {
      url: `${baseUrl}/kullanim-kosullari`,
      lastModified: new Date(),
      changeFrequency: 'yearly' as const,
      priority: 0.3,
    },
    {
      url: `${baseUrl}/kullanici-sozlesmesi`,
      lastModified: new Date(),
      changeFrequency: 'yearly' as const,
      priority: 0.3,
    },
    {
      url: `${baseUrl}/esnaf-sozlesmesi`,
      lastModified: new Date(),
      changeFrequency: 'yearly' as const,
      priority: 0.3,
    },
    {
      url: `${baseUrl}/kvkk-aydinlatma-metni`,
      lastModified: new Date(),
      changeFrequency: 'yearly' as const,
      priority: 0.3,
    },
    {
      url: `${baseUrl}/cerez-aydinlatma-metni`,
      lastModified: new Date(),
      changeFrequency: 'yearly' as const,
      priority: 0.3,
    },
    {
      url: `${baseUrl}/icerik-politikasi`,
      lastModified: new Date(),
      changeFrequency: 'yearly' as const,
      priority: 0.3,
    },
    {
      url: `${baseUrl}/yardim`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    },
    {
      url: `${baseUrl}/cerez-tercihleri`,
      lastModified: new Date(),
      changeFrequency: 'yearly' as const,
      priority: 0.3,
    },
  ]

  // Dinamik sayfalar - Blog yazıları
  const blogPosts = await getBlogPosts();
  const blogEntries = blogPosts.map((post: any) => ({
    url: `${baseUrl}/blog/${post.category_slug || 'genel'}/${post.slug}`,
    lastModified: post.updated_at ? new Date(post.updated_at) : (post.published_at ? new Date(post.published_at) : new Date()),
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }));

  // Blog kategorileri
  const blogCategories = await getBlogCategories();
  const categoryEntries = blogCategories.map((category: any) => ({
    url: `${baseUrl}/blog/${category.slug}`,
    lastModified: new Date(),
    changeFrequency: 'daily' as const,
    priority: 0.8,
  }));

  // Esnaf detay sayfaları
  const vendors = await getVendors();
  const vendorEntries = vendors.map((vendor: any) => ({
    url: `${baseUrl}/musteri/esnaf/${vendor.slug}`,
    lastModified: vendor.updated_at ? new Date(vendor.updated_at) : new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }));

  return [...staticPages, ...blogEntries, ...categoryEntries, ...vendorEntries]
}

