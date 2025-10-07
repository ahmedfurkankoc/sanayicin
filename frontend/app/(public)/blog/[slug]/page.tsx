'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { api, resolveMediaUrl } from '../../../utils/api'
import { iconMapping } from '../../../utils/iconMapping'

function absolutizeContent(html: string): string {
  if (!html) return html
  return html
    .replace(/src=\"(\/api\/admin\/media[^\"]*)\"/g, (_m, p1) => `src=\"${resolveMediaUrl(p1)}\"`)
    .replace(/src=\"(\/media[^\"]*)\"/g, (_m, p1) => `src=\"${resolveMediaUrl(p1)}\"`)
    .replace(/src='(\/api\/admin\/media[^']*)'/g, (_m, p1) => `src='${resolveMediaUrl(p1)}'`)
    .replace(/src='(\/media[^']*)'/g, (_m, p1) => `src='${resolveMediaUrl(p1)}'`)
}

export default function PublicBlogDetailPage() {
  const params = useParams() as { slug: string }
  const [post, setPost] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      if (!params?.slug) return
      try {
        setLoading(true)
        setError(null)
        const res = await api.getBlogPost(params.slug)
        if (cancelled) return
        setPost(res.data)
      } catch (e: any) {
        if (cancelled) return
        setError(e?.response?.data?.detail || 'Blog yazısı yüklenemedi')
      } finally {
        if (cancelled) return
        setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [params?.slug])

  if (loading) return <div className="blog-detail-container">Yükleniyor...</div>
  if (error) return <div className="blog-detail-container blog-error">{error}</div>
  if (!post) return null

  const cover = resolveMediaUrl(post.cover_image || post.featured_image)
  const canonical = (() => {
    try { return `${window.location.origin}/blog/${post.slug}` } catch { return `/blog/${post.slug}` }
  })()
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.meta_title || post.title,
    description: post.meta_description || post.excerpt || '',
    image: cover || undefined,
    datePublished: post.published_at || undefined,
    dateModified: post.updated_at || post.published_at || undefined,
    inLanguage: 'tr-TR',
    mainEntityOfPage: canonical,
    author: { '@type': 'Organization', name: 'Sanayicin' },
    publisher: { '@type': 'Organization', name: 'Sanayicin', logo: { '@type': 'ImageObject', url: '/sanayicin-logo.png' } },
    articleSection: post.category_name || undefined
  }

  return (
    <section className="blog-detail-page">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <article className="blog-detail-container">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {cover && (
          <img src={cover} alt={post.title} className="blog-cover" />
        )}
        <div className="blog-detail-header">
          {post.category_name && <span className="blog-badge">{post.category_name}</span>}
          <h1 className="blog-detail-title">{post.title}</h1>
          <div className="blog-detail-date">{post.published_at ? new Date(post.published_at).toLocaleDateString('tr-TR') : ''}</div>
        </div>
        <div className="blog-content">
          <div dangerouslySetInnerHTML={{ __html: absolutizeContent(post.content || '') }} />
        </div>

        {/* Share bar at very bottom */}
        <div className="blog-share-bottom">
          <span className="share-title" aria-hidden>Paylaş</span>
          <div className="share-row">
            <button className="share-btn" aria-label="Facebook" onClick={() => {
              const u = encodeURIComponent(window.location.href); window.open(`https://www.facebook.com/sharer/sharer.php?u=${u}`,'_blank');
            }}>
              {(() => { const Icon = iconMapping.facebook; return <Icon size={20} color="#fff"/> })()}
            </button>
            <button className="share-btn" aria-label="X" onClick={() => {
              const u = encodeURIComponent(window.location.href); const t = encodeURIComponent(post.title || ''); window.open(`https://twitter.com/intent/tweet?url=${u}&text=${t}`,'_blank');
            }}>
              {(() => { const Icon = iconMapping['x-social']; return <Icon size={20} color="#fff"/> })()}
            </button>
            <button className="share-btn" aria-label="LinkedIn" onClick={() => {
              const u = encodeURIComponent(window.location.href); const t = encodeURIComponent(post.title || ''); const s = encodeURIComponent(post.excerpt || ''); window.open(`https://www.linkedin.com/shareArticle?mini=true&url=${u}&title=${t}&summary=${s}`,'_blank');
            }}>
              {(() => { const Icon = iconMapping.linkedin; return <Icon size={20} color="#fff"/> })()}
            </button>
            <button className="share-btn" aria-label="WhatsApp" onClick={() => {
              const u = encodeURIComponent(window.location.href); const t = encodeURIComponent(post.title || ''); window.open(`https://wa.me/?text=${t}%20${u}`,'_blank');
            }}>
              {(() => { const Icon = iconMapping.whatsapp; return <Icon size={20} color="#fff"/> })()}
            </button>
            <button className="share-btn" aria-label="E-posta" onClick={() => {
              const u = encodeURIComponent(window.location.href); const t = encodeURIComponent(post.title || ''); const b = encodeURIComponent((post.excerpt || '') + '\n' + window.location.href); window.location.href = `mailto:?subject=${t}&body=${b}`;
            }}>
              {(() => { const Icon = iconMapping.mail; return <Icon size={20} color="#fff"/> })()}
            </button>
            <button className="share-btn" aria-label="Linki kopyala" onClick={async () => {
              try { await navigator.clipboard.writeText(window.location.href); alert('Bağlantı kopyalandı'); } catch { alert('Bağlantı kopyalanamadı'); }
            }}>
              {(() => { const Icon = iconMapping.copy; return <Icon size={20} color="#fff"/> })()}
            </button>
          </div>
        </div>
      </article>
    </section>
  )
}


