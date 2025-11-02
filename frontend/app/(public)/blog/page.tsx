'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Banner from '../components/Banner'
import { api, resolveMediaUrl } from '../../utils/api'

interface PublicBlogPost {
  id: number
  title: string
  slug: string
  excerpt?: string
  cover_image?: string
  category_name?: string
  category_slug?: string
  published_at?: string
}

interface BlogCategory {
  id: number
  name: string
  slug: string
  description?: string
}

export default function PublicBlogListPage() {
  const [items, setItems] = useState<PublicBlogPost[]>([])
  const [categories, setCategories] = useState<BlogCategory[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  // Kategorileri yükle
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const res = await api.listBlogCategories()
        setCategories(res.data || [])
      } catch (err) {
        console.error('Kategoriler yüklenemedi:', err)
      }
    }
    loadCategories()
  }, [])

  // Blog yazılarını yükle
  useEffect(() => {
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

  // SEO Meta Tags for Blog List
  useEffect(() => {
    document.title = 'Blog | Sanayicin - İpuçları, Rehberler ve Haberler'
    
    const updateMetaTag = (name: string, content: string, isProperty = false) => {
      const attribute = isProperty ? 'property' : 'name'
      let tag = document.querySelector(`meta[${attribute}="${name}"]`)
      if (!tag) {
        tag = document.createElement('meta')
        tag.setAttribute(attribute, name)
        document.head.appendChild(tag)
      }
      tag.setAttribute('content', content)
    }
    
    updateMetaTag('description', 'Sanayicin blog\'dan otomotiv, bakım, tamir ve sanayi sektörü hakkında güncel ipuçları, detaylı rehberler ve uzman görüşleri.')
    updateMetaTag('og:title', 'Blog | Sanayicin', true)
    updateMetaTag('og:description', 'Sanayicin blog\'dan otomotiv, bakım, tamir ve sanayi sektörü hakkında güncel ipuçları, detaylı rehberler ve uzman görüşleri.', true)
    updateMetaTag('og:type', 'website', true)
    
    // CollectionPage Structured Data
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
    
    // Remove existing schema script if any
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
      document.title = 'Sanayicin'
      if (schemaScript.parentNode) {
        schemaScript.parentNode.removeChild(schemaScript)
      }
    }
  }, [items])

  return (
    <>
    <Banner title="Blog" description="Sanayicin'den ipuçları, rehberler ve haberler" backgroundColor="var(--gray)" />
    <section className="blog-page" itemScope itemType="https://schema.org/CollectionPage">
      <div className="container">
        {/* Kategori Tab'ları */}
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
              {selectedCategory ? 'Bu kategoride henüz blog yazısı yok.' : 'Henüz blog yazısı yok.'}
            </p>
          </div>
        ) : (
          <div className="blog-grid">
            {items.map((post) => (
              <article key={post.id} itemScope itemType="https://schema.org/BlogPosting" className="blog-card">
                <Link 
                  href={`/blog/${post.category_slug || 'rehber'}/${post.slug}`} 
                  style={{ textDecoration: 'none', display: 'block' }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  {post.cover_image && (
                    <img
                      src={resolveMediaUrl(post.cover_image)}
                      alt={post.title}
                      className="blog-card-img"
                      itemProp="image"
                      loading="lazy"
                    />
                  )}
                  <div className="blog-card-body">
                    {post.category_name && (
                      <span className="blog-badge" itemProp="articleSection">
                        {post.category_name}
                      </span>
                    )}
                    <h2 className="blog-card-title" itemProp="headline">
                      {post.title}
                    </h2>
                    {post.excerpt && (
                      <p className="blog-card-excerpt" itemProp="description">
                        {post.excerpt}
                      </p>
                    )}
                    {post.published_at && (
                      <time 
                        itemProp="datePublished" 
                        dateTime={post.published_at}
                        className="blog-card-date"
                      >
                        {new Date(post.published_at).toLocaleDateString('tr-TR', {
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
      </div>
    </section>
    </>
  )
}


