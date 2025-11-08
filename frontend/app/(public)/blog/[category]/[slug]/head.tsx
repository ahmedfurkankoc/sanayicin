import { mediaBaseUrl } from '../../../../utils/api'

type Params = { params: { category: string; slug: string } }

async function fetchPost(slug: string) {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000/api'
  const res = await fetch(`${apiUrl}/blog/posts/${slug}/`, { cache: 'no-store' })
  if (!res.ok) return null
  return res.json()
}

function stripHtmlAndTruncate(html: string, maxLength: number = 160): string {
  if (!html) return ''
  const strippedText = html.replace(/<[^>]*>?/gm, '')
  return strippedText.length > maxLength
    ? strippedText.substring(0, maxLength - 3) + '...'
    : strippedText
}

export default async function Head({ params }: Params) {
  const post = await fetchPost(params.slug)

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://sanayicin.com'

  const baseTitle = post?.title || 'Sanayicin'
  const formattedTitle = post?.category_name
    ? `${baseTitle} - ${post.category_name}`
    : `${baseTitle}`

  const excerpt = post?.excerpt || stripHtmlAndTruncate(post?.content || '', 160)
  const description = post?.meta_description || excerpt || 'Sanayicin, sanayiye ihtiyacınız olan her yerde!'

  // Robust media URL resolver: accepts absolute URL, '/media/...' or storage path like 'blog/og/...'
  const resolveOg = (val?: string | null): string | null => {
    if (!val) return null
    const v = String(val).trim()
    if (!v) return null
    if (v.startsWith('http://') || v.startsWith('https://')) return v
    if (v.startsWith('/media/')) return `${mediaBaseUrl}${v}`
    // storage relative path (e.g., 'blog/og/..' or 'media/...')
    const rel = v.startsWith('media/') ? v.slice(5) : v
    return `${mediaBaseUrl}/media/${rel}`
  }

  const preferred = resolveOg(post?.og_image) || resolveOg(post?.cover_image)
  const imageUrl = preferred || `${siteUrl}/opengraph-image.jpg`

  const canonical = `${siteUrl}/blog/${post?.category_slug || params.category}/${params.slug}`
  const keywords: string | undefined = post?.meta_keywords

  return (
    <>
      <title>{formattedTitle}</title>
      <link rel="canonical" href={canonical} />
      <meta name="description" content={description} />
      {keywords ? <meta name="keywords" content={keywords} /> : null}

      {/* Open Graph */}
      <meta property="og:type" content="article" />
      <meta property="og:title" content={formattedTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={imageUrl} />
      <meta property="og:image:alt" content={baseTitle} />
      <meta property="og:url" content={canonical} />
      {post?.published_at && (
        <meta property="article:published_time" content={post.published_at} />
      )}
      {post?.updated_at && (
        <meta property="article:modified_time" content={post.updated_at} />
      )}
      {post?.category_name && (
        <meta property="article:section" content={post.category_name} />
      )}

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={formattedTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={imageUrl} />
      <meta name="twitter:image:alt" content={baseTitle} />
    </>
  )
}


