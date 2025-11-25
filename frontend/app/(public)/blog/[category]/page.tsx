'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Banner from '../../components/Banner'
import { api, resolveMediaUrl } from '../../../utils/api'

interface PublicBlogPost {
  id: number
  title: string
  slug: string
  excerpt?: string
  cover_image?: string
  category_name?: string
  published_at?: string
}

interface BlogCategory {
  id: number
  name: string
  slug: string
  description?: string
}

export default function CategoryBlogListPage() {
  const params = useParams() as { category: string }
  const router = useRouter()
  const [items, setItems] = useState<PublicBlogPost[]>([])
  const [category, setCategory] = useState<BlogCategory | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      if (!params?.category) return
      try {
        setLoading(true)
        setError(null)
        
        // Önce kategori bilgisini al
        try {
          const categoriesRes = await api.listBlogCategories()
          const categories = categoriesRes.data || []
          const foundCategory = categories.find((c: BlogCategory) => c.slug === params.category)
          if (foundCategory) {
            if (!cancelled) setCategory(foundCategory)
          } else {
            if (!cancelled) {
              setError('Kategori bulunamadı')
              setLoading(false)
              return
            }
          }
        } catch (err) {
          console.error('Kategori bilgisi alınamadı:', err)
          if (!cancelled) {
            setError('Kategori bilgisi alınamadı')
            setLoading(false)
            return
          }
        }
        
        // Blog yazılarını kategoriye göre yükle
        const res = await api.listBlogPostsByCategory(params.category, { 
          page, 
          page_size: 9, 
          ordering: '-published_at' 
        })
        if (cancelled) return
        const data = res.data
        setItems(data.results || data.items || [])
        setTotalPages(data.total_pages || Math.max(1, Math.ceil((data.count || 0) / 9)))
      } catch (e: any) {
        if (cancelled) return
        if (e?.response?.status === 404) {
          setError('Kategori bulunamadı')
          router.push('/blog')
        } else {
          setError(e?.response?.data?.detail || 'Blog yazıları yüklenemedi')
        }
      } finally {
        if (cancelled) return
        setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [params?.category, page, router])

  // SEO Meta Tags
  useEffect(() => {
    if (category) {
      document.title = `${category.name} | Blog | Sanayicin`
      
      const updateMetaTag = (name: string, content: string, isProperty = false) => {
        const attribute = isProperty ? 'property' : 'name';
        let tag = document.querySelector(`meta[${attribute}="${name}"]`);
        if (!tag) {
          tag = document.createElement('meta');
          tag.setAttribute(attribute, name);
          document.head.appendChild(tag);
        }
        tag.setAttribute('content', content);
      }
      
      updateMetaTag('description', category.description || `${category.name} kategorisindeki blog yazıları`);
      updateMetaTag('og:title', `${category.name} | Blog | Sanayicin`, true);
      updateMetaTag('og:description', category.description || `${category.name} kategorisindeki blog yazıları`, true);
      updateMetaTag('og:url', typeof window !== 'undefined' ? window.location.href : `https://sanayicin.com/blog/${category.slug}`, true);
      updateMetaTag('og:type', 'website', true);
      
      // Canonical link
      let canonical = document.querySelector('link[rel="canonical"]');
      if (!canonical) {
        canonical = document.createElement('link');
        canonical.setAttribute('rel', 'canonical');
        document.head.appendChild(canonical);
      }
      canonical.setAttribute('href', `https://sanayicin.com/blog/${category.slug}`);
    }
  }, [category])


  return (
    <>
      <Banner title={category?.name || 'Blog'} description={category?.description || 'Kategorideki blog yazıları'} backgroundColor="var(--gray)" />
      <section className="blog-page" itemScope itemType="https://schema.org/CollectionPage">
        <div className="container">
          {error && <div className="alert-error">{error}</div>}

          {loading ? (
            <div className="blog-grid">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="blog-card blog-card--skeleton" />
              ))}
            </div>
          ) : items.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 16px', color: '#666' }}>
              <p style={{ fontSize: '16px', marginBottom: '8px' }}>
                Bu kategoride henüz blog yazısı yok.
              </p>
              <Link href="/blog" style={{ color: 'var(--yellow)', textDecoration: 'underline' }}>
                Tüm blog yazılarına git
              </Link>
            </div>
          ) : (
            <>
              <div className="blog-grid">
                {items.map((item) => (
                  <article key={item.id} itemScope itemType="https://schema.org/BlogPosting" className="blog-card">
                    <Link 
                      href={`/blog/${params.category}/${item.slug}`} 
                      style={{ textDecoration: 'none', display: 'block' }}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      {item.cover_image && (
                        <img
                          src={resolveMediaUrl(item.cover_image)}
                          alt={item.title}
                          className="blog-card-img"
                          itemProp="image"
                          loading="lazy"
                        />
                      )}
                      <div className="blog-card-body">
                        {item.category_name && (
                          <span className="blog-badge" itemProp="articleSection">
                            {item.category_name}
                          </span>
                        )}
                        <h2 className="blog-card-title" itemProp="headline">
                          {item.title}
                        </h2>
                        {item.excerpt && (
                          <p className="blog-card-excerpt" itemProp="description">
                            {item.excerpt}
                          </p>
                        )}
                        {item.published_at && (
                          <time 
                            itemProp="datePublished" 
                            dateTime={item.published_at}
                            className="blog-card-date"
                          >
                            {new Date(item.published_at).toLocaleDateString('tr-TR', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                            })}
                          </time>
                        )}
                      </div>
                    </Link>
                  </article>
                ))}
              </div>

              <div className="blog-pagination">
                <button
                  onClick={() => setPage(prev => Math.max(1, prev - 1))}
                  disabled={page <= 1}
                  className={`btn btn-outline ${page <= 1 ? 'btn-disabled' : ''}`}
                >
                  Önceki
                </button>
                <span className="blog-page-indicator">{page} / {totalPages}</span>
                <button
                  onClick={() => setPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={page >= totalPages}
                  className={`btn btn-outline ${page >= totalPages ? 'btn-disabled' : ''}`}
                >
                  Sonraki
                </button>
              </div>
            </>
          )}
        </div>
      </section>
    </>
  )
}

