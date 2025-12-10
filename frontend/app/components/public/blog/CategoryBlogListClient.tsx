'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { api, resolveMediaUrl } from '@/app/utils/api'

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

interface CategoryBlogListClientProps {
  initialCategory: BlogCategory
  initialPosts: PublicBlogPost[]
  initialTotalPages: number
  categorySlug: string
}

export default function CategoryBlogListClient({
  initialCategory,
  initialPosts,
  initialTotalPages,
  categorySlug,
}: CategoryBlogListClientProps) {
  const router = useRouter()
  const [items, setItems] = useState<PublicBlogPost[]>(initialPosts)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(initialTotalPages)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadPage = async (newPage: number) => {
    if (newPage < 1 || newPage > totalPages) return
    
    try {
      setLoading(true)
      setError(null)
      
      const res = await api.listBlogPostsByCategory(categorySlug, { 
        page: newPage, 
        page_size: 9, 
        ordering: '-published_at' 
      })
      
      const data = res.data
      setItems(data.results || data.items || [])
      setTotalPages(data.total_pages || Math.max(1, Math.ceil((data.count || 0) / 9)))
      setPage(newPage)
      
      // Sayfa değiştiğinde scroll to top
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (e: any) {
      if (e?.response?.status === 404) {
        setError('Kategori bulunamadı')
        router.push('/blog')
      } else {
        setError(e?.response?.data?.detail || 'Blog yazıları yüklenemedi')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
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
                  href={`/blog/${categorySlug}/${item.slug}`} 
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
              onClick={() => loadPage(page - 1)}
              disabled={page <= 1 || loading}
              className={`btn btn-outline ${page <= 1 || loading ? 'btn-disabled' : ''}`}
            >
              Önceki
            </button>
            <span className="blog-page-indicator">{page} / {totalPages}</span>
            <button
              onClick={() => loadPage(page + 1)}
              disabled={page >= totalPages || loading}
              className={`btn btn-outline ${page >= totalPages || loading ? 'btn-disabled' : ''}`}
            >
              Sonraki
            </button>
          </div>
        </>
      )}
    </>
  )
}

