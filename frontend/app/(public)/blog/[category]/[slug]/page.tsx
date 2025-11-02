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

  // SEO Meta Tags
  useEffect(() => {
    if (!post) return

    // Title
    const title = post.meta_title || post.title || 'Blog'
    document.title = title

    // Meta description
    const metaDescription = document.querySelector('meta[name="description"]')
    const description = post.meta_description || post.excerpt || ''
    if (metaDescription) {
      metaDescription.setAttribute('content', description)
    } else {
      const metaDesc = document.createElement('meta')
      metaDesc.name = 'description'
      metaDesc.content = description
      document.head.appendChild(metaDesc)
    }

    // Meta keywords
    if (post.meta_keywords) {
      let metaKeywords = document.querySelector('meta[name="keywords"]')
      if (metaKeywords) {
        metaKeywords.setAttribute('content', post.meta_keywords)
      } else {
        metaKeywords = document.createElement('meta')
        metaKeywords.setAttribute('name', 'keywords')
        metaKeywords.setAttribute('content', post.meta_keywords)
        document.head.appendChild(metaKeywords)
      }
    }

    // Canonical URL
    if (post.canonical_url) {
      let canonical = document.querySelector('link[rel="canonical"]')
      if (canonical) {
        canonical.setAttribute('href', post.canonical_url)
      } else {
        canonical = document.createElement('link')
        canonical.setAttribute('rel', 'canonical')
        canonical.setAttribute('href', post.canonical_url)
        document.head.appendChild(canonical)
      }
    }

    // Open Graph
    const ogTitle = post.og_title || post.title || ''
    const ogDescription = post.og_description || post.excerpt || ''
    const ogImage = post.og_image || post.cover_image || ''

    const setOGMeta = (property: string, content: string) => {
      let metaElement = document.querySelector(`meta[property="${property}"]`) as HTMLMetaElement | null
      if (metaElement) {
        metaElement.setAttribute('content', content)
      } else {
        metaElement = document.createElement('meta')
        metaElement.setAttribute('property', property)
        metaElement.setAttribute('content', content)
        document.head.appendChild(metaElement)
      }
    }

    setOGMeta('og:title', ogTitle)
    setOGMeta('og:description', ogDescription)
    if (ogImage) setOGMeta('og:image', resolveMediaUrl(ogImage))
    setOGMeta('og:type', 'article')
    if (typeof window !== 'undefined') {
      setOGMeta('og:url', window.location.href)
    }

    // Twitter Card
    setOGMeta('twitter:card', 'summary_large_image')
    setOGMeta('twitter:title', ogTitle)
    setOGMeta('twitter:description', ogDescription)
    if (ogImage) setOGMeta('twitter:image', resolveMediaUrl(ogImage))

    // Article meta
    if (post.published_at) {
      setOGMeta('article:published_time', post.published_at)
    }
    if (post.updated_at) {
      setOGMeta('article:modified_time', post.updated_at)
    }
    if (post.category_name) {
      setOGMeta('article:section', post.category_name)
    }
  }, [post])

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

        {/* Related Posts */}
        {relatedPosts.length > 0 && (
          <aside className="blog-related-posts mt-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">İlgili Yazılar</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {relatedPosts.map((related) => (
                <article
                  key={related.id}
                  itemScope
                  itemType="https://schema.org/BlogPosting"
                  className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
                >
                  <Link href={`/blog/${related.category_slug || 'genel'}/${related.slug}`}>
                    {related.cover_image && (
                      <div className="relative h-40 w-full overflow-hidden">
                        <img
                          src={resolveMediaUrl(related.cover_image)}
                          alt={related.title}
                          itemProp="image"
                          loading="lazy"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <div className="p-4">
                      {related.category_name && (
                        <span className="inline-block px-2 py-1 bg-[color:var(--yellow)] text-[color:var(--black)] rounded text-xs font-medium mb-2">
                          {related.category_name}
                        </span>
                      )}
                      <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2" itemProp="headline">
                        {related.title}
                      </h3>
                      {related.excerpt && (
                        <p className="text-sm text-gray-600 line-clamp-2 mb-2" itemProp="description">
                          {related.excerpt}
                        </p>
                      )}
                      {related.published_at && (
                        <time
                          itemProp="datePublished"
                          dateTime={related.published_at}
                          className="text-xs text-gray-500"
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

