'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { api, resolveMediaUrl } from '../../../../utils/api'
import { iconMapping } from '../../../../utils/iconMapping'

function absolutizeContent(html: string): string {
  if (!html) return html
  return html
    .replace(/src=\"(\/api\/admin\/media[^\"]*)\"/g, (_m, p1) => `src=\"${resolveMediaUrl(p1)}\"`)
    .replace(/src=\"(\/media[^\"]*)\"/g, (_m, p1) => `src=\"${resolveMediaUrl(p1)}\"`)
    .replace(/src='(\/api\/admin\/media[^']*)'/g, (_m, p1) => `src='${resolveMediaUrl(p1)}'`)
    .replace(/src='(\/media[^']*)'/g, (_m, p1) => `src='${resolveMediaUrl(p1)}'`)
}

export default function CategoryBlogDetailPage() {
  const params = useParams() as { category: string; slug: string }
  const router = useRouter()
  const [post, setPost] = useState<any>(null)
  const [relatedPosts, setRelatedPosts] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingRelated, setLoadingRelated] = useState(false)
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
        
        // Kategori kontrolü - URL'deki kategori ile blog yazısındaki kategori eşleşmeli
        const postData = res.data
        if (params.category && postData.category_slug && postData.category_slug !== params.category) {
          // Kategori eşleşmiyorsa doğru kategoriye yönlendir
          router.replace(`/blog/${postData.category_slug}/${params.slug}`)
          return
        }
        
        setPost(postData)
        
        // İlgili yazıları yükle
        try {
          setLoadingRelated(true)
          const relatedRes = await api.getRelatedBlogPosts(params.slug)
          if (!cancelled) {
            setRelatedPosts(relatedRes.data || [])
          }
        } catch (err) {
          console.error('İlgili yazılar yüklenemedi:', err)
          if (!cancelled) setRelatedPosts([])
        } finally {
          if (!cancelled) setLoadingRelated(false)
        }
      } catch (e: any) {
        if (cancelled) return
        if (e?.response?.status === 404) {
          setError('Blog yazısı bulunamadı')
          router.push('/blog')
        } else {
          setError(e?.response?.data?.detail || 'Blog yazısı yüklenemedi')
        }
      } finally {
        if (cancelled) return
        setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [params?.slug, params?.category, router])

  // Client-side meta injection removed. Meta tags are rendered in head.tsx (SSR).

  // JSON-LD Structured Data
  useEffect(() => {
    if (!post) return

    const jsonLd = {
      '@context': 'https://schema.org',
      '@type': 'BlogPosting',
      headline: post.title,
      description: post.excerpt || post.meta_description || '',
      image: post.cover_image ? resolveMediaUrl(post.cover_image) : undefined,
      datePublished: post.published_at,
      dateModified: post.updated_at || post.published_at,
      author: {
        '@type': 'Person',
        name: post.author_name || 'Sanayicin',
      },
      publisher: {
        '@type': 'Organization',
        name: 'Sanayicin',
        logo: {
          '@type': 'ImageObject',
          url: typeof window !== 'undefined' ? `${window.location.origin}/logo.png` : 'https://sanayicin.com/logo.png',
        },
      },
      mainEntityOfPage: {
        '@type': 'WebPage',
        '@id': typeof window !== 'undefined' ? window.location.href : '',
      },
    }

    const scriptId = 'blog-post-schema'
    let script = document.getElementById(scriptId) as HTMLScriptElement | null
    if (script) {
      script.textContent = JSON.stringify(jsonLd)
    } else {
      script = document.createElement('script')
      script.id = scriptId
      script.setAttribute('type', 'application/ld+json')
      script.textContent = JSON.stringify(jsonLd)
      document.head.appendChild(script)
    }

    return () => {
      const existingScript = document.getElementById(scriptId)
      if (existingScript) existingScript.remove()
    }
  }, [post])

  if (loading) {
    return (
      <div className="blog-detail-page">
        <div className="container mx-auto px-4 py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[color:var(--yellow)] mx-auto"></div>
            <p className="mt-4 text-gray-600">Yükleniyor...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error || !post) {
    return (
      <div className="blog-detail-page">
        <div className="container mx-auto px-4 py-12">
          <div className="text-center">
            <p className="text-red-600 mb-4">{error || 'Blog yazısı bulunamadı'}</p>
            <Link href="/blog" className="text-[color:var(--yellow)] hover:underline">
              Blog sayfasına dön
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="blog-detail-page">
      <div className="container mx-auto px-4 py-8">

        <article itemScope itemType="https://schema.org/BlogPosting" className="blog-detail-container">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {post.cover_image && (
            <img 
              src={resolveMediaUrl(post.cover_image)} 
              alt={post.title}
              className="blog-cover"
              itemProp="image"
              loading="eager"
            />
          )}
          <header className="blog-detail-header">
            {post.category_name && (
              <Link
                href={`/blog/${post.category_slug || post.category}`}
                className="blog-badge"
                itemProp="articleSection"
              >
                {post.category_name}
              </Link>
            )}
            <h1 className="blog-detail-title" itemProp="headline" style={{ display: 'none' }}>
              {post.title}
            </h1>
          </header>
          <div className="blog-content" itemProp="articleBody">
            <div dangerouslySetInnerHTML={{ __html: absolutizeContent(post.content || '') }} />
          </div>

          {/* Share bar */}
          <div className="blog-share-bottom">
            <span className="share-title" aria-hidden>Paylaş</span>
            <div className="share-row">
              <button className="share-btn" aria-label="Facebook" onClick={() => {
                const u = encodeURIComponent(window.location.href); window.open(`https://www.facebook.com/sharer/sharer.php?u=${u}`,'_blank');
              }}>
                {(() => { const Icon = iconMapping.facebook; return <Icon size={20} color="#fff"/> })()}
              </button>
              <button className="share-btn" aria-label="X" onClick={() => {
                const u = encodeURIComponent(window.location.href); const t = encodeURIComponent(post.title || ''); window.open(`https://x.com/intent/tweet?url=${u}&text=${t}`,'_blank');
              }}>
                {(() => { const Icon = iconMapping['twitter-x']; return <Icon size={20} color="#fff"/> })()}
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

        {/* Related Posts */}
        {relatedPosts.length > 0 && (
          <aside className="blog-related-posts blog-detail-container mt-12">
            <h2 className="related-title">İlgili Yazılar</h2>
            <div className="grid related-grid">
              {relatedPosts.slice(0, 4).map((related) => (
                <article
                  key={related.id}
                  itemScope
                  itemType="https://schema.org/BlogPosting"
                  className="related-card bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
                >
                  <Link href={`/blog/${related.category_slug || 'genel'}/${related.slug}`}>
                    {related.cover_image && (
                      <div className="relative related-image h-40 w-full overflow-hidden">
                        <img
                          src={resolveMediaUrl(related.cover_image)}
                          alt={related.title}
                          itemProp="image"
                          loading="lazy"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <div className="related-body p-4">
                      {related.category_name && (
                        <span className="inline-block px-2 py-1 bg-[color:var(--yellow)] text-[color:var(--black)] rounded text-xs font-medium mb-2">
                          {related.category_name}
                        </span>
                      )}
                      <h3 className="related-card-title text-lg font-semibold text-gray-900 mb-2 line-clamp-2" itemProp="headline">
                        {related.title}
                      </h3>
                      {related.excerpt && (
                        <p className="related-card-excerpt text-sm text-gray-600 line-clamp-2 mb-2" itemProp="description">
                          {related.excerpt}
                        </p>
                      )}
                      {related.published_at && (
                        <time
                          itemProp="datePublished"
                          dateTime={related.published_at}
                          className="related-card-date text-xs text-gray-500"
                        >
                          {new Date(related.published_at).toLocaleDateString('tr-TR')}
                        </time>
                      )}
                    </div>
                  </Link>
                </article>
              ))}
            </div>
          </aside>
        )}
      </div>
    </div>
  )
}

