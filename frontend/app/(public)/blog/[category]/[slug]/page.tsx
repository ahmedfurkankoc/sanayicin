import type { Metadata } from 'next'
import { mediaBaseUrl } from '../../../../utils/api'
import BlogDetailContent from '@/app/components/public/blog/BlogDetailContent'

type Params = { params: Promise<{ category: string; slug: string }> }

async function fetchPost(slug: string) {
  // API URL'i .env'den al, yoksa next.config.ts'den, yoksa localhost
  // API v1 versiyonlaması: /api/v1/ yapısı kullanılıyor
  let apiUrl = process.env.NEXT_PUBLIC_API_URL;
  if (!apiUrl) {
    apiUrl = "http://localhost:8000/api/v1";
  } else {
    // API URL'inde /v1/ var mı kontrol et
    if (!apiUrl.includes('/v1')) {
      const baseUrl = apiUrl.replace(/\/$/, '');
      if (baseUrl.includes('/api')) {
        apiUrl = baseUrl.replace(/\/api\/?$/, '/api/v1');
      } else {
        apiUrl = `${baseUrl}/api/v1`;
  }
    }
  }
  try {
  const res = await fetch(`${apiUrl}/blog/posts/${slug}/`, { cache: 'no-store' })
  if (!res.ok) return null
  return res.json()
  } catch (error) {
    // Backend çalışmıyorsa veya network hatası varsa null döndür
    console.error('Blog post fetch error:', error)
    return null
  }
}

function stripHtmlAndTruncate(html: string, maxLength: number = 160): string {
  if (!html) return ''
  // HTML etiketlerini temizle
  const strippedText = html.replace(/<[^>]*>?/gm, '')
  // Fazla boşlukları temizle
  const cleanedText = strippedText.replace(/\s+/g, ' ').trim()
  // Maksimum uzunluğa göre kes
  return cleanedText.length > maxLength
    ? cleanedText.substring(0, maxLength - 3) + '...'
    : cleanedText
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug, category } = await params
  const post = await fetchPost(slug)

  if (!post) {
    return {
      title: 'Blog Yazısı Bulunamadı',
      description: 'Aradığınız blog yazısı bulunamadı.',
    }
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://sanayicin.com'
  
  // Title: Önce og_title, yoksa title
  const title = post.og_title || post.title || 'Blog Yazısı'
  const metaTitle = post.meta_title || post.title || 'Blog Yazısı'

  // Description: Sadece modeldeki meta_description kullan (fallback yok)
  const description = post.meta_description || 'Sanayicin blog yazısı'

  // Media URL resolver
  const resolveOg = (val?: string | null): string | null => {
    if (!val) return null
    const v = String(val).trim()
    if (!v) return null
    if (v.startsWith('http://') || v.startsWith('https://')) return v
    if (v.startsWith('/media/')) return `${mediaBaseUrl}${v}`
    const rel = v.startsWith('media/') ? v.slice(5) : v
    return `${mediaBaseUrl}/media/${rel}`
  }

  // OG Image: Önce og_image, yoksa cover_image (featured_image)
  const ogImage = resolveOg(post.og_image) || resolveOg(post.cover_image)
  const imageUrl = ogImage || `${siteUrl}/opengraph-image.jpg`
  
  // OG Alt: Önce og_alt, yoksa title
  const ogAlt = post.og_alt || title

  // Canonical URL: Önce canonical_url, yoksa otomatik oluştur
  const canonical = post.canonical_url || `${siteUrl}/blog/${post.category_slug || category}/${slug}`

  // Keywords
  const keywords = post.meta_keywords 
    ? post.meta_keywords.split(',').map((k: string) => k.trim()).filter(Boolean)
    : undefined

  return {
    title: metaTitle,
    description,
    keywords,
    alternates: {
      canonical,
    },
    openGraph: {
      type: 'article',
      title,
      description, // og:description için meta_description kullan (og_description değil)
      url: canonical,
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: ogAlt,
        },
      ],
      publishedTime: post.published_at,
      modifiedTime: post.updated_at || post.published_at,
      section: post.category_name,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description, // Twitter description için de meta_description kullan
      images: [imageUrl],
    },
  }
}

export default async function CategoryBlogDetailPage({ params }: Params) {
  return <BlogDetailContent />
}

