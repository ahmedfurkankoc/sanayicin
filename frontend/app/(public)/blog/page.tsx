import type { Metadata } from 'next'
import Banner from '@/app/components/public/Banner'
import BlogList from '@/app/components/public/blog/BlogList'

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

async function getBlogData() {
  // API URL'i .env'den al, yoksa next.config.ts'den, yoksa localhost
  let apiUrl = process.env.NEXT_PUBLIC_API_URL;
  if (!apiUrl || !apiUrl.includes('/api')) {
    // Eğer /api yoksa ekle
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXT_PUBLIC_API_URL?.replace(/\/api\/?$/, '') || 'http://localhost:8000';
    apiUrl = `${baseUrl}/api`;
  }
  
  try {
    const [postsRes, categoriesRes] = await Promise.all([
      fetch(`${apiUrl}/blog/posts/?page=1&page_size=9&ordering=-published_at`, { 
        cache: 'no-store' 
      }),
      fetch(`${apiUrl}/blog/categories/`, { 
        cache: 'no-store' 
      })
    ])

    const postsData = postsRes.ok ? await postsRes.json() : { results: [], count: 0, total_pages: 1 }
    const categoriesData = categoriesRes.ok ? await categoriesRes.json() : { results: [] }

    return {
      posts: postsData.results || postsData.items || [],
      categories: categoriesData.results || categoriesData || [],
      totalPages: postsData.total_pages || Math.max(1, Math.ceil((postsData.count || 0) / 9))
    }
  } catch (error) {
    console.error('Blog data fetch error:', error)
    return {
      posts: [],
      categories: [],
      totalPages: 1
    }
  }
}

export default async function PublicBlogListPage() {
  const { posts, categories, totalPages } = await getBlogData()

  return (
    <>
      <Banner 
        title="Blog" 
        description="Sanayicin'den ipuçları, rehberler ve haberler" 
        backgroundColor="var(--black)"
        textColor="var(--white)"
        backgroundImageUrl="/images/banner/hakkimizda.jpg"
      />
      <section className="blog-page" itemScope itemType="https://schema.org/CollectionPage">
        <div className="container">
          <BlogList 
            initialPosts={posts}
            initialCategories={categories}
            initialTotalPages={totalPages}
          />
        </div>
      </section>
    </>
  );
}


