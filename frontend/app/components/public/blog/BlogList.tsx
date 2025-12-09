'use client';

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { api, resolveMediaUrl } from '@/app/utils/api'

interface PublicBlogPost {
  id: number
  title: string
  slug: string
  excerpt?: string
  cover_image?: string
  category_name?: string
  category_slug?: string
  published_at?: string
  is_featured?: boolean
}

interface BlogCategory {
  id: number
  name: string
  slug: string
  description?: string
}

interface BlogListProps {
  initialPosts: PublicBlogPost[]
  initialCategories: BlogCategory[]
  initialTotalPages: number
}

export default function BlogList({ initialPosts, initialCategories, initialTotalPages }: BlogListProps) {
  const [items, setItems] = useState<PublicBlogPost[]>(initialPosts)
  const [categories] = useState<BlogCategory[]>(initialCategories)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(initialTotalPages)

  // Blog yazılarını yükle
  useEffect(() => {
    if (page === 1 && !selectedCategory) {
      // İlk yükleme server'dan geldi, tekrar yükleme
      return
    }
    
    let cancelled = false
    const load = async () => {
      try {
        setLoading(true)
        setError(null)
        const params: any = { 
          page, 
          page_size: 9, 
          ordering: '-published_at' 
        }
        if (selectedCategory) {
          params.category = selectedCategory
        }
        const res = await api.listBlogPosts(params)
        if (cancelled) return
        const data = res.data
        setItems(data.results || data.items || [])
        setTotalPages(data.total_pages || Math.max(1, Math.ceil((data.count || 0) / 9)))
      } catch (e: any) {
        if (cancelled) return
        setError(e?.response?.data?.detail || 'Blog yazıları yüklenemedi')
      } finally {
        if (cancelled) return
        setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [page, selectedCategory])

  // SEO Structured Data
  useEffect(() => {
    const collectionJsonLd = {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: 'Sanayicin Blog',
      description: 'Otomotiv, bakım, tamir ve sanayi sektörü hakkında güncel ipuçları, detaylı rehberler ve uzman görüşleri',
      url: typeof window !== 'undefined' ? `${window.location.origin}/blog` : 'https://sanayicin.com/blog',
      mainEntity: {
        '@type': 'ItemList',
        numberOfItems: items.length,
        itemListElement: items.slice(0, 10).map((post, index) => ({
          '@type': 'ListItem',
          position: index + 1,
          item: {
            '@type': 'BlogPosting',
            headline: post.title,
            url: typeof window !== 'undefined' 
              ? `${window.location.origin}/blog/${post.category_slug || 'rehber'}/${post.slug}` 
              : `https://sanayicin.com/blog/${post.category_slug || 'rehber'}/${post.slug}`
          }
        }))
      }
    }
    
    const existingSchema = document.querySelector('script[type="application/ld+json"][data-blog-list]')
    if (existingSchema) {
      existingSchema.remove()
    }
    
    const schemaScript = document.createElement('script')
    schemaScript.type = 'application/ld+json'
    schemaScript.setAttribute('data-blog-list', 'true')
    schemaScript.textContent = JSON.stringify(collectionJsonLd)
    document.head.appendChild(schemaScript)
    
    return () => {
      if (schemaScript.parentNode) {
        schemaScript.parentNode.removeChild(schemaScript)
      }
    }
  }, [items])

  // Featured posts
  const featuredPosts = items
    .filter(post => post.is_featured === true)
    .sort((a, b) => {
      const dateA = a.published_at ? new Date(a.published_at).getTime() : 0
      const dateB = b.published_at ? new Date(b.published_at).getTime() : 0
      return dateB - dateA
    })
    .slice(0, 2)

  return (
    <>
      {error && <div className="alert-error">{error}</div>}

      {loading ? (
        <>
          {!selectedCategory && (
            <>
              <div className="blog-section-header">
                <h2 className="blog-section-title">Son Yazılar</h2>
              </div>
              <div className="blog-featured-grid">
                {Array.from({ length: 2 }).map((_, i) => (
                  <div key={i} className="blog-featured-card blog-card--skeleton" />
                ))}
              </div>
            </>
          )}
          <div className="blog-section-header">
            <h2 className="blog-section-title">Tüm Yazılar</h2>
          </div>
          <div className="blog-category-tabs">
            <button className="blog-category-tab active">Tümü</button>
          </div>
          <div className="blog-grid">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="blog-card blog-card--skeleton" />
            ))}
          </div>
        </>
      ) : items.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px 16px', color: '#666' }}>
          <p style={{ fontSize: '16px', marginBottom: '8px' }}>
            {selectedCategory ? 'Bu kategoride henüz blog yazısı yok.' : 'Henüz blog yazısı yok.'}
          </p>
        </div>
      ) : (
        <>
          {featuredPosts.length > 0 && !selectedCategory && (
            <div className="blog-featured-section">
              <div className="blog-section-header">
                <h2 className="blog-section-title">Son Yazılar</h2>
              </div>
              <div className="blog-featured-grid">
                {featuredPosts.map((post) => (
                  <article key={post.id} itemScope itemType="https://schema.org/BlogPosting" className="blog-featured-card">
                    <Link 
                      href={`/blog/${post.category_slug || 'rehber'}/${post.slug}`} 
                      style={{ textDecoration: 'none', display: 'block', height: '100%' }}
                    >
                      {post.cover_image ? (
                        <img
                          src={resolveMediaUrl(post.cover_image)}
                          alt={post.title}
                          className="blog-featured-img"
                          itemProp="image"
                          loading="lazy"
                        />
                      ) : (
                        <div className="blog-featured-img" style={{ background: 'linear-gradient(135deg, var(--black) 0%, #2a2a2a 100%)' }} />
                      )}
                      <div className="blog-featured-body">
                        {post.category_name && (
                          <span className="blog-featured-badge">{post.category_name}</span>
                        )}
                        <h2 className="blog-featured-title" itemProp="headline">
                          {post.title}
                        </h2>
                        {post.excerpt && (
                          <p className="blog-featured-excerpt" itemProp="description">
                            {post.excerpt}
                          </p>
                        )}
                      </div>
                    </Link>
                  </article>
                ))}
              </div>
            </div>
          )}

          <div className="blog-section-header">
            <h2 className="blog-section-title">Tüm Yazılar</h2>
          </div>

          <div className="blog-category-tabs">
            <button
              className={`blog-category-tab ${!selectedCategory ? 'active' : ''}`}
              onClick={() => {
                setSelectedCategory(null)
                setPage(1)
              }}
            >
              Tümü
            </button>
            {categories.map((category) => (
              <button
                key={category.id}
                className={`blog-category-tab ${selectedCategory === category.slug ? 'active' : ''}`}
                onClick={() => {
                  setSelectedCategory(category.slug)
                  setPage(1)
                }}
              >
                {category.name}
              </button>
            ))}
          </div>

          <div className="blog-grid">
            {items.map((post) => (
              <article key={post.id} itemScope itemType="https://schema.org/BlogPosting" className="blog-card">
                <Link 
                  href={`/blog/${post.category_slug || 'rehber'}/${post.slug}`} 
                  style={{ textDecoration: 'none', display: 'block', height: '100%' }}
                >
                  {post.cover_image ? (
                    <img
                      src={resolveMediaUrl(post.cover_image)}
                      alt={post.title}
                      className="blog-card-img"
                      itemProp="image"
                      loading="lazy"
                    />
                  ) : (
                    <div className="blog-card-img" style={{ background: 'linear-gradient(135deg, var(--black) 0%, #2a2a2a 100%)' }} />
                  )}
                  <div className="blog-card-body">
                    <h2 className="blog-card-title" itemProp="headline">
                      {post.title}
                    </h2>
                    {post.excerpt && (
                      <p className="blog-card-excerpt" itemProp="description">
                        {post.excerpt}
                      </p>
                    )}
                    <div className="blog-card-cta">
                      Devamını oku <span className="blog-card-cta-icon">→</span>
                    </div>
                  </div>
                </Link>
              </article>
            ))}
          </div>
        </>
      )}

      <div className="blog-pagination">
        <button
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={page <= 1}
          className={`btn btn-outline ${page <= 1 ? 'btn-disabled' : ''}`}
        >Önceki</button>
        <span className="blog-page-indicator">{page} / {totalPages}</span>
        <button
          onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          disabled={page >= totalPages}
          className={`btn btn-outline ${page >= totalPages ? 'btn-disabled' : ''}`}
        >Sonraki</button>
      </div>
    </>
  )
}

