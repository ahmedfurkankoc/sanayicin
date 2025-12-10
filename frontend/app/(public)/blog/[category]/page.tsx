import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Banner from '@/app/components/public/Banner'
import CategoryBlogListClient from '@/app/components/public/blog/CategoryBlogListClient'

interface Params {
  params: Promise<{ category: string }>
}

// API URL helper
async function getApiUrl() {
  let apiUrl = process.env.NEXT_PUBLIC_API_URL;
  if (!apiUrl || !apiUrl.includes('/api')) {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL?.replace(/\/api\/?$/, '') || 
                   process.env.NEXT_PUBLIC_BASE_URL || 
                   'http://localhost:8000';
    apiUrl = `${baseUrl}/api/v1`;
  }
  return apiUrl;
}

// Kategori bilgisini al
async function getCategory(categorySlug: string) {
  try {
    const apiUrl = await getApiUrl();
    const res = await fetch(`${apiUrl}/blog/categories/`, { 
      cache: 'no-store' 
    });
    
    if (!res.ok) return null;
    
    const categories = await res.json();
    const categoryList = Array.isArray(categories) ? categories : (categories.results || []);
    return categoryList.find((c: { slug: string }) => c.slug === categorySlug) || null;
  } catch (error) {
    console.error('Category fetch error:', error);
    return null;
  }
}

// Blog yazılarını al
async function getBlogPosts(categorySlug: string, page: number = 1) {
  try {
    const apiUrl = await getApiUrl();
    const res = await fetch(`${apiUrl}/blog/posts/?category=${categorySlug}&page=${page}&page_size=9&ordering=-published_at`, { 
      cache: 'no-store' 
    });
    
    if (!res.ok) return { results: [], count: 0, total_pages: 1 };
    
    const data = await res.json();
    return {
      results: data.results || data.items || [],
      count: data.count || 0,
      total_pages: data.total_pages || Math.max(1, Math.ceil((data.count || 0) / 9))
    };
  } catch (error) {
    console.error('Blog posts fetch error:', error);
    return { results: [], count: 0, total_pages: 1 };
  }
}

// Metadata generate et
export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { category } = await params;
  const categoryData = await getCategory(category);
  
  if (!categoryData) {
    return {
      title: 'Kategori Bulunamadı - Blog | Sanayicin',
      description: 'Aradığınız kategori bulunamadı.',
    };
  }
  
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://sanayicin.com';
  const canonical = `${siteUrl}/blog/${category}`;
  
  return {
    title: `${categoryData.name} - Blog `,
    description: categoryData.description || `${categoryData.name} kategorisindeki blog yazıları`,
    keywords: [
      categoryData.name,
      'blog',
      'oto sanayi',
      'otomotiv',
      'rehber',
      'ipuçları'
    ],
    alternates: {
      canonical,
    },
    openGraph: {
      type: 'website',
      title: `${categoryData.name} - Blog`,
      description: categoryData.description || `${categoryData.name} kategorisindeki blog yazıları`,
      url: canonical,
      siteName: 'Sanayicin',
      images: [
        {
          url: '/images/banner/hakkimizda.jpg',
          width: 1200,
          height: 630,
          alt: `${categoryData.name} - Sanayicin Blog`,
        },
      ],
      locale: 'tr_TR',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${categoryData.name} | Blog | Sanayicin`,
      description: categoryData.description || `${categoryData.name} kategorisindeki blog yazıları`,
      images: ['/images/banner/hakkimizda.jpg'],
    },
  };
}

export default async function CategoryBlogListPage({ params }: Params) {
  const { category } = await params;
  
  // Kategori ve blog yazılarını al
  const [categoryData, blogData] = await Promise.all([
    getCategory(category),
    getBlogPosts(category, 1)
  ]);
  
  // Kategori bulunamadıysa 404
  if (!categoryData) {
    notFound();
  }

  return (
    <>
      <Banner 
        title={categoryData.name} 
        description={categoryData.description || 'Kategorideki blog yazıları'} 
        backgroundColor="var(--gray)" 
      />
      <section className="blog-page" itemScope itemType="https://schema.org/CollectionPage">
        <div className="container">
          <CategoryBlogListClient 
            initialCategory={categoryData}
            initialPosts={blogData.results}
            initialTotalPages={blogData.total_pages}
            categorySlug={category}
          />
        </div>
      </section>
    </>
  );
}
