import type { Metadata } from 'next'
import { mediaBaseUrl } from '../../../../utils/api'
import BlogDetailContent from '@/app/components/public/blog/BlogDetailContent'

type Params = { params: Promise<{ category: string; slug: string }> }

async function fetchPost(slug: string) {
  // API URL'i .env'den al, yoksa next.config.ts'den, yoksa localhost
  let apiUrl = process.env.NEXT_PUBLIC_API_URL;
  if (!apiUrl || !apiUrl.includes('/api')) {
    // Eğer /api yoksa ekle
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXT_PUBLIC_API_URL?.replace(/\/api\/?$/, '') || 'http://localhost:8000';
    apiUrl = `${baseUrl}/api`;
  }
  const res = await fetch(`${apiUrl}/blog/posts/${slug}/`, { cache: 'no-store' })
  if (!res.ok) return null
  return res.json()
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
  
  // Title: Blog başlığı - Sanayicin (layout template otomatik ekleyecek)
  const title = post.title || 'Blog Yazısı'

  // Description: Önce meta_description, yoksa excerpt, yoksa içerikten özet çıkar
  const description = post.meta_description || 
    post.excerpt || 
    stripHtmlAndTruncate(post.content || '', 160) ||
    'Sanayicin blog yazısı'

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

  const preferred = resolveOg(post.og_image) || resolveOg(post.cover_image)
  const imageUrl = preferred || `${siteUrl}/opengraph-image.jpg`
  const canonical = `${siteUrl}/blog/${post.category_slug || category}/${slug}`

  return {
    title,
    description,
    keywords: post.meta_keywords ? post.meta_keywords.split(',').map((k: string) => k.trim()) : undefined,
    alternates: {
      canonical,
    },
    openGraph: {
      type: 'article',
      title,
      description,
      url: canonical,
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
      publishedTime: post.published_at,
      modifiedTime: post.updated_at || post.published_at,
      section: post.category_name,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [imageUrl],
    },
  }
}

export default async function CategoryBlogDetailPage({ params }: Params) {
  return <BlogDetailContent />
}

