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
  published_at?: string
}

export default function PublicBlogListPage() {
  const [items, setItems] = useState<PublicBlogPost[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      try {
        setLoading(true)
        setError(null)
        const res = await api.listBlogPosts({ page, page_size: 9, ordering: '-published_at' })
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
  }, [page])

  return (
    <>
    <Banner title="Blog" description="Sanayicin’den ipuçları, rehberler ve haberler" backgroundColor="var(--gray)" />
    <section className="blog-page">
      <div className="container">

        {error && <div className="alert-error">{error}</div>}

        {loading ? (
          <div className="blog-grid">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="blog-card blog-card--skeleton" />
            ))}
          </div>
        ) : (
          <div className="blog-grid">
            {items.map((post) => (
              <Link key={post.id} href={`/blog/${post.slug}`} className="blog-card">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={resolveMediaUrl((post as any).cover_image || (post as any).featured_image)}
                  alt={post.title}
                  className="blog-card-img"
                />
                <div className="blog-card-body">
                  {post.category_name && <span className="blog-badge">{post.category_name}</span>}
                  <h2 className="blog-card-title">{post.title}</h2>
                  <p className="blog-card-excerpt">{post.excerpt || ''}</p>
                  <div className="blog-card-date">{post.published_at ? new Date(post.published_at).toLocaleDateString('tr-TR') : ''}</div>
                </div>
              </Link>
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


