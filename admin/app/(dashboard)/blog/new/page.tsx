'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Save, Eye, ArrowLeft, X } from 'lucide-react'
// import { useAuth } from '../../../contexts/AuthContext' // Kullanılmıyor
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import 'quill/dist/quill.snow.css'
import { listBlogCategories, getBlogPost as apiGetBlogPost, createBlogPost, updateBlogPost, uploadImage as apiUploadImage, generateSlug as apiGenerateSlug } from '../../../api/admin'

interface BlogCategory {
  id: number
  name: string
  slug: string
}

interface BlogPost {
  id?: number
  title: string
  slug: string
  content: string
  excerpt: string
  status: 'draft' | 'published' | 'archived'
  category?: number
  is_featured: boolean
  meta_title: string
  meta_description: string
  meta_keywords: string
  canonical_url: string
  og_title: string
  og_description: string
  featured_image?: string
  featured_image_alt?: string
}

export default function BlogEditor({ params }: { params: { id?: string } }) {
  const router = useRouter()
  const isEdit = !!params.id
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [categories, setCategories] = useState<BlogCategory[]>([])
  const [showCreateCategory, setShowCreateCategory] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState('')
  
  const [formData, setFormData] = useState<BlogPost>({
    title: '',
    slug: '',
    content: '',
    excerpt: '',
    status: 'draft',
    category: undefined,
    is_featured: false,
    meta_title: '',
    meta_description: '',
    meta_keywords: '',
    canonical_url: '',
    og_title: '',
    og_description: '',
  })

  // const [previewMode] = useState(false) // Kullanılmıyor
  const editorContainerRef = useRef<HTMLDivElement | null>(null)
  const editorRef = useRef<HTMLDivElement | null>(null)
  const quillInstanceRef = useRef<unknown>(null)
  const editorInitializedRef = useRef<boolean>(false)
  const [showSeoGuide, setShowSeoGuide] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  // const [showCategoryManager] = useState(false) // Kullanılmıyor
  // const [creatingCategories] = useState(false) // Kullanılmıyor
  // const [selectedCategorySlugs, setSelectedCategorySlugs] = useState<Record<string, boolean>>({}) // Kullanılmıyor

  const [autoFill, setAutoFill] = useState({
    slug: true,
    canonical: true,
    metaTitle: true,
    ogTitle: true,
    excerpt: true,
    metaDescription: true,
    ogDescription: true,
  })

  const backendBase = (process.env.NEXT_PUBLIC_BACKEND_URL as string) || (process.env.NEXT_PUBLIC_API_URL as string) || 'http://localhost:8000'
  const resolveMediaUrl = (url: string | null | undefined) => {
    if (!url) return ''
    // Normalize common admin-proxied path to bare media path
    const normalized = url.replace('/api/admin/media', '/media')
    if (normalized.startsWith('http://') || normalized.startsWith('https://')) return normalized
    if (normalized.startsWith('/media')) return `${backendBase}${normalized}`
    return normalized
  }

  const normalizeContentHtml = (html: string): string => {
    if (!html) return html
    // Collapse various forms to relative /media/... so backend-agnostic
    return html
      .replace(/https?:\/\/[^\s"']+\/api\/admin\/media/gi, '/media')
      .replace(/https?:\/\/[^\s"']+\/media/gi, '/media')
      .replace(/\/api\/admin\/media/gi, '/media')
  }

  const absolutizeContentHtml = (html: string): string => {
    if (!html) return html
    return html
      .replace(/src=\"(\/api\/admin\/media[^\"]*)\"/g, (_m, p1) => `src=\"${resolveMediaUrl(p1)}\"`)
      .replace(/src=\"(\/media[^\"]*)\"/g, (_m, p1) => `src=\"${resolveMediaUrl(p1)}\"`)
      .replace(/src='(\/api\/admin\/media[^']*)'/g, (_m, p1) => `src='${resolveMediaUrl(p1)}'`)
      .replace(/src='(\/media[^']*)'/g, (_m, p1) => `src='${resolveMediaUrl(p1)}'`)
  }

  // Image insert modal state
  const [showImageModal, setShowImageModal] = useState(false)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imageAlt, setImageAlt] = useState('')
  const [imagePreview, setImagePreview] = useState<string | null>(null)

  const resetImageModal = () => {
    try {
      if (imagePreview) URL.revokeObjectURL(imagePreview)
    } catch {}
    setImageFile(null)
    setImageAlt('')
    setImagePreview(null)
  }

  const getAutoCanonical = (slug: string) => {
    try {
      const base = typeof window !== 'undefined' ? window.location.origin : 'https://sanayicin.com'
      return `${base}/blog/${slug}`
    } catch {
      return `https://sanayicin.com/blog/${slug}`
    }
  }

  const fetchCategories = async () => {
    try {
      const items = await listBlogCategories()
      setCategories(items || [])
    } catch (err) {
      console.error('Kategoriler yüklenemedi:', err)
    }
  }

  const fetchBlogPost = useCallback(async () => {
    if (!params.id) return
    
    setLoading(true)
    try {
      const data = await apiGetBlogPost(Number(params.id))
      setFormData({
        id: data.id,
        title: data.title,
        slug: data.slug,
        content: data.content,
        excerpt: data.excerpt || '',
        status: data.status,
        category: data.category,
        is_featured: data.is_featured,
        meta_title: data.meta_title || '',
        meta_description: data.meta_description || '',
        meta_keywords: data.meta_keywords || '',
        canonical_url: data.canonical_url || '',
        og_title: data.og_title || '',
        og_description: data.og_description || '',
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Bir hata oluştu')
    } finally {
      setLoading(false)
    }
  }, [params.id])

  useEffect(() => {
    fetchCategories()
    if (isEdit) {
      fetchBlogPost()
    }
  }, [isEdit, params.id, fetchBlogPost])

  // const generateSlug = (title: string) => {
  //   return title
  //     .toLowerCase()
  //     .replace(/[^a-z0-9\s-]/g, '')
  //     .replace(/\s+/g, '-')
  //     .replace(/-+/g, '-')
  //     .trim()
  // } // Kullanılmıyor

  const handleTitleChange = (title: string) => {
    setFormData(prev => {
      const nextSlug = autoFill.slug ? apiGenerateSlug(title) : (prev.slug || '')
      const isCanonicalAuto = autoFill.canonical && (!prev.canonical_url || prev.canonical_url === getAutoCanonical(prev.slug))
      return {
      ...prev,
      title,
        slug: nextSlug,
        meta_title: autoFill.metaTitle ? title.slice(0, 60) : prev.meta_title,
        og_title: autoFill.ogTitle ? title.slice(0, 100) : prev.og_title,
        canonical_url: isCanonicalAuto && nextSlug ? getAutoCanonical(nextSlug) : prev.canonical_url,
      }
    })
  }

  const handleContentChange = (content: string) => {
    const plain = content.replace(/<[^>]*>/g, '')
    setFormData(prev => ({
      ...prev,
      content,
      excerpt: autoFill.excerpt ? plain.slice(0, 500) : prev.excerpt,
      meta_description: autoFill.metaDescription ? plain.slice(0, 160) : prev.meta_description,
      og_description: autoFill.ogDescription ? plain.slice(0, 200) : prev.og_description,
    }))
  }

  // const suggestedCategories: Array<{ name: string; slug: string }> = [
  //   { name: 'Oto Bakım ve Servis', slug: apiGenerateSlug('Oto Bakım ve Servis') },
  //   { name: 'Periyodik Bakım', slug: apiGenerateSlug('Periyodik Bakım') },
  //   { name: 'Yağ Değişimi', slug: apiGenerateSlug('Yağ Değişimi') },
  //   { name: 'Fren ve Balata', slug: apiGenerateSlug('Fren ve Balata') },
  //   { name: 'Lastik ve Jant', slug: apiGenerateSlug('Lastik ve Jant') },
  //   { name: 'Rot Balans', slug: apiGenerateSlug('Rot Balans') },
  //   { name: 'Elektrik ve Elektronik', slug: apiGenerateSlug('Elektrik ve Elektronik') },
  //   { name: 'Diagnostik Arıza Tespiti', slug: apiGenerateSlug('Diagnostik Arıza Tespiti') },
  //   { name: 'Kaporta ve Boya', slug: apiGenerateSlug('Kaporta ve Boya') },
  //   { name: 'Klima Bakımı', slug: apiGenerateSlug('Klima Bakımı') },
  //   { name: 'Motor Mekanik', slug: apiGenerateSlug('Motor Mekanik') },
  //   { name: 'Şanzıman ve Debriyaj', slug: apiGenerateSlug('Şanzıman ve Debriyaj') },
  //   { name: 'Akü ve Şarj', slug: apiGenerateSlug('Akü ve Şarj') },
  //   { name: 'Egzoz Sistemleri', slug: apiGenerateSlug('Egzoz Sistemleri') },
  //   { name: 'Detaylı Temizlik ve Detailing', slug: apiGenerateSlug('Detaylı Temizlik ve Detailing') },
  //   { name: 'Yol Yardım', slug: apiGenerateSlug('Yol Yardım') },
  //   { name: 'Yedek Parça', slug: apiGenerateSlug('Yedek Parça') },
  //   { name: 'Muayene Hazırlık', slug: apiGenerateSlug('Muayene Hazırlık') },
  //   { name: 'Chip Tuning ve Yazılım', slug: apiGenerateSlug('Chip Tuning ve Yazılım') },
  //   { name: 'Aksesuar ve Modifiye', slug: apiGenerateSlug('Aksesuar ve Modifiye') },
  // ] // Kullanılmıyor

  // const createSelectedCategories = async () => {
  //   const toCreate = suggestedCategories.filter(c => selectedCategorySlugs[c.slug])
  //   if (toCreate.length === 0) return
  //   setCreatingCategories(true)
  //   setError(null)
  //   try {
  //     for (const c of toCreate) {
  //       await fetch('/api/admin/blog-categories/', {
  //         method: 'POST',
  //         credentials: 'include',
  //         headers: { 'Content-Type': 'application/json' },
  //         body: JSON.stringify({ name: c.name, slug: c.slug })
  //       })
  //     }
  //     await fetchCategories()
  //     setShowCategoryManager(false)
  //     setSelectedCategorySlugs({})
  //   } catch (e) {
  //     setError(e instanceof Error ? e.message : 'Kategoriler oluşturulamadı')
  //   } finally {
  //     setCreatingCategories(false)
  //   }
  // } // Kullanılmıyor

  const handleSave = async (status: 'draft' | 'published') => {
    setSaving(true)
    setError(null)
    
    try {
      const payload = { ...formData, status, content: normalizeContentHtml(formData.content) }
      const data = isEdit
        ? await updateBlogPost(Number(params.id), payload)
        : await createBlogPost(payload)
      
      if (!isEdit) {
        router.push(`/admin/blog/${data.id}/edit`)
      } else {
        // Show success message
        alert(status === 'published' ? 'Blog yazısı yayınlandı!' : 'Taslak kaydedildi!')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Bir hata oluştu')
    } finally {
      setSaving(false)
    }
  }

  const handleImageUpload = async (file: File) => {
    try {
      const resp = await apiUploadImage(file)
      return resolveMediaUrl(resp.url)
    } catch (err) {
      console.error('Görsel yükleme hatası:', err)
      return null
    }
  }

  useEffect(() => {
    let isMounted = true
    ;(async () => {
      if (!editorRef.current || editorInitializedRef.current) return
      try {
        const QuillModule = await import('quill')
        const Quill = (QuillModule as { default?: unknown }).default || QuillModule

        const toolbarOptions = [
          [{ header: [1, 2, 3, 4, 5, 6, false] }],
          ['bold', 'italic', 'underline', 'strike'],
          [{ color: [] }, { background: [] }],
          [{ script: 'sub' }, { script: 'super' }],
          [{ list: 'ordered' }, { list: 'bullet' }],
          [{ indent: '-1' }, { indent: '+1' }],
          [{ align: [] }],
          ['link', 'image', 'blockquote', 'code-block'],
          ['clean'],
        ]

        // Clear any previous Quill DOM (toolbars, editor) to avoid duplicates
        try {
          if (editorContainerRef.current) {
            const toolbars = editorContainerRef.current.querySelectorAll('.ql-toolbar')
            toolbars.forEach(tb => tb.parentElement?.removeChild(tb))
          }
          editorRef.current.innerHTML = ''
        } catch {}

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const quill: any = new (Quill as any)(editorRef.current, {
          theme: 'snow',
          modules: {
            toolbar: {
              container: toolbarOptions,
              handlers: {
                image: function (this: unknown) {
                  setShowImageModal(true)
                },
              },
            },
            clipboard: { matchVisual: false },
          },
        })

        // Enforce comfortable size and readable colors
        try {
          const containerEl = quill.root.parentElement as HTMLElement | null
          if (containerEl) {
            containerEl.style.minHeight = '420px'
            containerEl.style.width = '100%'
            containerEl.style.backgroundColor = '#ffffff'
          }
          quill.root.style.minHeight = '360px'
          quill.root.style.fontSize = '16px'
          quill.root.style.color = '#111827' // tailwind gray-900
          quill.root.style.backgroundColor = '#ffffff'
        } catch {}

        // Render-time: use absolute URLs for images so they appear inside admin editor
        quill.clipboard.dangerouslyPasteHTML(absolutizeContentHtml(formData.content || ''))

        // Mutation observer to rewrite any newly inserted /media src to absolute for editor display
        try {
          const observer = new MutationObserver(() => {
            const imgs = quill.root.querySelectorAll('img')
            imgs.forEach((img: HTMLImageElement) => {
              const src = img.getAttribute('src') || ''
              if (src.startsWith('/media') || src.includes('/api/admin/media')) {
                const abs = resolveMediaUrl(src)
                if (abs && abs !== src) img.setAttribute('src', abs)
              }
            })
          })
          observer.observe(quill.root, { childList: true, subtree: true, attributes: true, attributeFilter: ['src'] })
        } catch {}

        quill.on('text-change', () => {
          if (!isMounted) return
          const html = quill.root.innerHTML
          handleContentChange(html)
        })

        quillInstanceRef.current = quill
        editorInitializedRef.current = true
      } catch {
        // ignore init errors in SSR
      }
    })()
    return () => {
      isMounted = false
      // Cleanup DOM to avoid duplicate toolbars on Strict Mode remounts
      const editorContainer = editorContainerRef.current
      const editor = editorRef.current
      try {
        if (editorContainer) {
          const toolbars = editorContainer.querySelectorAll('.ql-toolbar')
          toolbars.forEach(tb => tb.parentElement?.removeChild(tb))
        }
        if (editor) editor.innerHTML = ''
      } catch {
        // ignore cleanup errors
      }
      quillInstanceRef.current = null
      editorInitializedRef.current = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editorRef])

  const handleCreateCategory = async () => {
    const name = newCategoryName.trim()
    if (!name) return
    try {
      const response = await fetch('http://localhost:8000/api/admin/blog-categories/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('admin_token')}`,
        },
        body: JSON.stringify({ name, slug: apiGenerateSlug(name) }),
      })
      if (!response.ok) {
        const e = await response.json().catch(() => ({}))
        throw new Error(e.detail || 'Kategori oluşturulamadı')
      }
      const created = await response.json()
      setCategories(prev => [...prev, created])
      setFormData(prev => ({ ...prev, category: created.id }))
      setShowCreateCategory(false)
      setNewCategoryName('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Kategori oluşturulamadı')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {isEdit ? 'Blog Yazısını Düzenle' : 'Yeni Blog Yazısı'}
            </h1>
            <p className="text-gray-600">SEO dostu blog yazısı oluşturun</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowPreview(true)}
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Eye className="h-4 w-4 mr-2" />
            Önizle
          </button>
          <button
            onClick={() => handleSave('draft')}
            disabled={saving}
            className="inline-flex items-center px-4 py-2 border border-gray-300 bg-gray-800 rounded-lg hover:bg-gray-200 disabled:opacity-50 transition-colors"
          >
            <Save className="h-4 w-4 mr-2 text-white" />
            <span className="text-white">{saving ? 'Kaydediliyor...' : 'Taslak Kaydet'}</span>
          </button>
          <button
            onClick={() => handleSave('published')}
            disabled={saving}
            className="inline-flex items-center px-4 py-2 bg-[color:var(--yellow)] text-[color:var(--black)] rounded-lg hover:brightness-95 disabled:opacity-50 transition-colors"
          >
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Yayınlanıyor...' : 'Yayınla'}
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Info */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Temel Bilgiler</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Başlık *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Blog yazısının başlığını girin"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Slug *
                </label>
                <input
                  type="text"
                  value={formData.slug}
                  onChange={(e) => setFormData(prev => {
                    const newSlug = apiGenerateSlug(e.target.value)
                    const isCanonicalAuto = autoFill.canonical && (!prev.canonical_url || prev.canonical_url === getAutoCanonical(prev.slug))
                    if (autoFill.slug) setAutoFill(flags => ({ ...flags, slug: false }))
                    return {
                      ...prev,
                      slug: newSlug,
                      canonical_url: isCanonicalAuto && newSlug ? getAutoCanonical(newSlug) : prev.canonical_url,
                    }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="url-friendly-slug"
                />
                <p className="text-xs text-gray-500 mt-1">
                  URL: /blog/{formData.slug}
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Özet
                </label>
                <textarea
                  value={formData.excerpt}
                  onChange={(e) => {
                    if (autoFill.excerpt) setAutoFill(flags => ({ ...flags, excerpt: false }))
                    setFormData(prev => ({ ...prev, excerpt: e.target.value }))
                  }}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Blog yazısının kısa özeti"
                />
                <p className="text-xs text-gray-500 mt-1">
                  {formData.excerpt.length}/500 karakter
                </p>
              </div>
            </div>
          </div>

          {/* Content Editor */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">İçerik</h3>
              <button
                type="button"
                onClick={() => setShowSeoGuide(true)}
                className="inline-flex items-center px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm"
                aria-label="SEO içerik rehberi"
              >
                Nasıl yazmalı?
              </button>
            </div>
            
            <div>
              <div ref={editorContainerRef} className="w-full">
                <div ref={editorRef} className="w-full" />
              </div>
              <p className="text-xs text-gray-500 mt-2">Başlıklar için H2/H3, listeler, bağlantılar ve görseller ekleyebilirsiniz.</p>
            </div>
          </div>

          {showSeoGuide && (
            <div className="fixed inset-0 z-50 flex items-center justify-center">
              <div className="absolute inset-0 bg-black/40" onClick={() => setShowSeoGuide(false)} />
              <div className="relative z-10 w-full max-w-3xl bg-white rounded-lg shadow-lg p-6 max-h-[85vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-lg font-semibold text-gray-900">SEO Dostu Blog Yazısı Rehberi</h4>
                  <button
                    type="button"
                    onClick={() => setShowSeoGuide(false)}
                    className="p-2 hover:bg-gray-100 rounded-md"
                    aria-label="Kapat"
                  >
                    <span className="sr-only">Kapat</span>
                    ×
                  </button>
                </div>
                <div className="space-y-4 text-sm text-gray-700">
                  <div>
                    <p className="font-medium mb-2">Başlık ve Slug</p>
                    <ul className="list-disc pl-5 space-y-1">
                      <li>H1 otomatik: Temel Bilgiler bölümündeki &quot;Başlık&quot; alanı sayfa H1&apos;i olarak kullanılır. İçerikte yeniden H1 kullanmayın.</li>
                      <li>Başlık (H1) net, faydayı anlatan ve ≤ 60 karakter olsun; hedef anahtar kelimeyi doğal şekilde içersin.</li>
                      <li>Slug kısa, açıklayıcı ve yalnızca küçük harf/“-” içersin (örn. <code>oto-bakim-ipuclari</code>).</li>
                    </ul>
                  </div>
                  <div>
                    <p className="font-medium mb-2">Başlık Kullanımı (H2/H3)</p>
                    <ul className="list-disc pl-5 space-y-1">
                      <li>İçerik içinde ana bölümler için H2, alt başlıklar için H3 kullanın; hiyerarşiyi bozmamaya özen gösterin.</li>
                      <li>Her başlık tek konuyu anlatsın; başlıklar tarayıcılar ve arama motorları için içerik haritasıdır.</li>
                    </ul>
                  </div>
                  <div>
                    <p className="font-medium mb-2">İçerik Yapısı</p>
                    <ul className="list-disc pl-5 space-y-1">
                      <li>Giriş paragrafında konuyu ve faydayı net söyleyin.</li>
                      <li>H2/H3 başlıklar ile bölümlendirin; her başlık tek konuyu anlatsın.</li>
                      <li>Kısa paragraflar (2-4 cümle), madde işaretleri ve görseller kullanın.</li>
                      <li>İç linkler (site içi ilgili sayfalara) ve gerekiyorsa harici güvenilir kaynaklara link verin.</li>
                    </ul>
                  </div>
                  <div>
                    <p className="font-medium mb-2">Meta ve Özet</p>
                    <ul className="list-disc pl-5 space-y-1">
                      <li>Meta başlık ≤ 60, meta açıklama ≤ 160 karakter olmalı.</li>
                      <li>Özet (excerpt) yazının en önemli faydasını 1-2 cümlede özetlesin.</li>
                    </ul>
                  </div>
                  <div>
                    <p className="font-medium mb-2">Anahtar Kelimeler ve Yoğunluk</p>
                    <ul className="list-disc pl-5 space-y-1">
                      <li>Anahtar kelimeyi doğal akışta kullanın; aşırı tekrar yapmayın.</li>
                      <li>Eş anlamlılar ve ilgili terimler kullanarak kapsamı genişletin (LSI).</li>
                    </ul>
                  </div>
                  <div>
                    <p className="font-medium mb-2">Görseller</p>
                    <ul className="list-disc pl-5 space-y-1">
                      <li>Görsellere açıklayıcı dosya adı ve alt metin (alt) ekleyin.</li>
                      <li>Alt metin neden önemli? Erişilebilirlik sağlar (ekran okuyucular) ve görsel yüklenmezse bağlamı korur; ayrıca arama motorlarına görselin içeriğini anlatır.</li>
                      <li>Uygun boyut ve format (WEBP/JPG) kullanın, gereksiz ağır görsellerden kaçının.</li>
                    </ul>
                  </div>
                  <div>
                    <p className="font-medium mb-2">Teknik SEO Kontrol Listesi</p>
                    <ul className="list-disc pl-5 space-y-1">
                      <li>Canonical URL slug ile otomatik gelir; içerik başka yerde yayınlandıysa canonical’ı orijinale işaret edecek şekilde güncelleyin.</li>
                      <li>Meta başlık ≤ 60, meta açıklama ≤ 160 karakter; açık, tıklamaya teşvik edici olsun.</li>
                      <li>OG başlık/açıklama sosyal paylaşımlar için kısa ve vurucu olsun; mümkünse kapak görseli kullanın.</li>
                      <li>İç linkler: İlgili blog yazılarına ve önemli sayfalara 2–4 iç link verin.</li>
                      <li>URL Yapısı: Slug kısa ve anlamlı olmalı; gereksiz durak kelimelerden kaçının.</li>
                      <li>Görseller: Anlamlı alt metin ekleyin; boyutları optimize edin (WEBP/JPG, genişlik ≤ 1200px önerilir).</li>
                    </ul>
                  </div>
                </div>
                <div className="mt-6 flex justify-end">
                  <button
                    type="button"
                    onClick={() => setShowSeoGuide(false)}
                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Tamam
                  </button>
                </div>
              </div>
            </div>
          )}

          {showImageModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center">
              <div className="absolute inset-0 bg-black/40" onClick={() => { setShowImageModal(false); resetImageModal() }} />
              <div className="relative z-10 w-full max-w-lg bg-white rounded-lg shadow-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-lg font-semibold text-gray-900">Görsel Ekle</h4>
                  <button
                    type="button"
                    onClick={() => { setShowImageModal(false); resetImageModal() }}
                    className="p-2 hover:bg-gray-100 rounded-md"
                    aria-label="Kapat"
                  >
                    ×
                  </button>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="inline-flex items-center">
                      <span className="sr-only">Görsel seç</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const f = e.target.files?.[0] || null
                          if (imagePreview) URL.revokeObjectURL(imagePreview)
                          setImageFile(f)
                          setImagePreview(f ? URL.createObjectURL(f) : null)
                        }}
                        className="block w-full text-sm text-gray-700 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                        aria-label="Görsel seç"
                      />
                    </label>
                  </div>
                  {imagePreview && (
                    <div>
                      <Image src={imagePreview} alt="Önizleme" width={400} height={160} className="w-full h-40 object-cover rounded-lg border" />
                    </div>
                  )}
              <div>
                    <label className="block text-xs text-gray-600 mb-1">Alt Metin</label>
                    <input
                      type="text"
                      value={imageAlt}
                      onChange={(e) => setImageAlt(e.target.value)}
                      placeholder="Görsel alternatif metni"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    />
                  </div>
                </div>
                <div className="mt-6 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => { setShowImageModal(false); resetImageModal() }}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                  >
                    İptal
                  </button>
                  <button
                    type="button"
                    disabled={!imageFile}
                    onClick={async () => {
                      if (!imageFile) return
                      const url = await handleImageUpload(imageFile)
                      if (!url || !quillInstanceRef.current) { setShowImageModal(false); resetImageModal(); return }
                      const quill = quillInstanceRef.current as { getSelection: (focus?: boolean) => { index: number } | null; clipboard: { dangerouslyPasteHTML: (index: number, html: string, source?: string) => void }; setSelection: (index: number) => void }
                      const range = quill.getSelection(true)
                      const safeAlt = (imageAlt || '').replace(/\"/g, '&quot;')
                      const relativeSrc = url.replace('/api/admin/media', '/media').replace(/^https?:\/\/[^\s"']+\/media/i, '/media')
                      const displaySrc = resolveMediaUrl(relativeSrc)
                      const html = `<img src=\"${displaySrc}\" alt=\"${safeAlt}\" />`
                      quill.clipboard.dangerouslyPasteHTML(range?.index || 0, html, 'user')
                      quill.setSelection(((range?.index || 0) + 1))
                      setShowImageModal(false)
                      resetImageModal()
                    }}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    Ekle
                  </button>
                </div>
              </div>
            </div>
          )}

          {showPreview && (
            <div className="fixed inset-0 z-50">
              <div className="absolute inset-0 bg-black/40" onClick={() => setShowPreview(false)} />
              <div className="relative z-10 h-full overflow-y-auto">
                {/* Simulated public page frame */}
                <div className="min-h-full bg-gray-50">
                  <div className="sticky top-0 bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/60 border-b">
                    <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
                      <span className="font-semibold text-gray-800">Sanayicin Blog Önizleme</span>
                      <button
                        type="button"
                        onClick={() => setShowPreview(false)}
                        className="px-3 py-1.5 text-sm border rounded-md hover:bg-gray-100"
                        aria-label="Kapat"
                      >
                        Kapat
                      </button>
                    </div>
                  </div>
                  <main className="max-w-4xl mx-auto px-4 py-8">
                    <article className="bg-white rounded-xl shadow-sm border">
                      <header className="px-6 pt-6 pb-4 border-b">
                        <div className="mb-2 flex items-center gap-2">
                          {formData.category && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100">
                              {categories.find(c => c.id === formData.category)?.name}
                            </span>
                          )}
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-50 text-gray-700 border border-gray-200">
                            {formData.status === 'published' ? 'Yayınlandı' : 'Taslak Önizleme'}
                          </span>
                        </div>
                        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 leading-tight">
                          {formData.title || 'Başlık yok'}
                        </h1>
                        <div className="mt-2 text-sm text-gray-500 flex items-center gap-2">
                          <span>{new Date().toLocaleDateString('tr-TR')}</span>
                          <span>·</span>
                          <span>{Math.max(1, Math.ceil((formData.content?.replace(/<[^>]*>/g, '')?.length || 200) / 800))} dk okuma</span>
                          {formData.slug && (
                            <>
                              <span>·</span>
                              <span className="truncate max-w-[50%]" title={formData.slug}>/blog/{formData.slug}</span>
                            </>
            )}
          </div>
                      </header>
                      <section className="px-6 py-6 text-gray-900">
                        <div className="prose prose-slate max-w-none prose-headings:scroll-mt-24 prose-img:rounded-lg prose-headings:text-gray-900 prose-p:text-gray-900 prose-li:text-gray-900 prose-strong:text-gray-900">
                          {(() => {
                            const html = absolutizeContentHtml(formData.content || '')
                            return <div dangerouslySetInnerHTML={{ __html: html || '<p><em>İçerik yok</em></p>' }} />
                          })()}
                        </div>
                      </section>
                    </article>
                  </main>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Featured Image */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Kapak Görseli</h3>
            <div className="space-y-3">
              {formData.featured_image ? (
                <div className="relative">
                  <Image src={resolveMediaUrl(formData.featured_image)} alt={formData.title || 'Kapak görseli'} width={400} height={160} className="w-full h-40 object-cover rounded-lg border" />
                  <div className="mt-2 flex items-center gap-2">
                    <button
                      type="button"
                      className="px-3 py-2 text-sm border rounded-lg hover:bg-gray-50"
                      onClick={() => setFormData(prev => ({ ...prev, featured_image: '' }))}
                    >
                      Kaldır
                    </button>
                  </div>
                  <div className="mt-2">
                    <label className="block text-xs text-gray-600 mb-1">Alt Metin</label>
                    <input
                      type="text"
                      value={formData.featured_image_alt || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, featured_image_alt: e.target.value }))}
                      placeholder="Görsel alternatif metni"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    />
                  </div>
                </div>
              ) : (
                <div>
                  <label className="inline-flex items-center">
                    <span className="sr-only">Kapak görseli seç</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={async (e) => {
                        const file = e.target.files?.[0]
                        if (!file) return
                        const url = await handleImageUpload(file)
                        if (url) setFormData(prev => ({ ...prev, featured_image: url }))
                      }}
                      className="block w-full text-sm text-gray-700 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                      aria-label="Kapak görseli seç"
                    />
                  </label>
                  <p className="text-xs text-gray-500 mt-2">Öneri: 1200x630px, JPG/WEBP</p>
                </div>
              )}
            </div>
          </div>
          {/* Settings */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Ayarlar</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Durum
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as 'draft' | 'published' | 'archived' }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="draft">Taslak</option>
                  <option value="published">Yayınlandı</option>
                  <option value="archived">Arşivlendi</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Kategori
                </label>
                <select
                  value={formData.category || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value ? Number(e.target.value) : undefined }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Kategori Seçin</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
                <div className="mt-2 flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => setShowCreateCategory(true)}
                    className="text-sm text-blue-600 hover:underline"
                  >
                    Yeni kategori oluştur
                  </button>
                  {showCreateCategory && (
                    <div className="w-full mt-2 flex items-center space-x-2">
                      <input
                        type="text"
                        value={newCategoryName}
                        onChange={(e) => setNewCategoryName(e.target.value)}
                        placeholder="Kategori adı"
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <button
                        type="button"
                        onClick={handleCreateCategory}
                        className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                      >
                        Ekle
                      </button>
                      <button
                        type="button"
                        onClick={() => { setShowCreateCategory(false); setNewCategoryName('') }}
                        className="p-2 text-gray-600 hover:text-gray-900"
                        aria-label="Kapat"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="is_featured"
                  checked={formData.is_featured}
                  onChange={(e) => setFormData(prev => ({ ...prev, is_featured: e.target.checked }))}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="is_featured" className="ml-2 text-sm text-gray-700">
                  Öne çıkan yazı
                </label>
              </div>
            </div>
          </div>

          {/* SEO Settings */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">SEO Ayarları</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Meta Başlık
                </label>
                <input
                  type="text"
                  value={formData.meta_title}
                  onChange={(e) => {
                    const val = e.target.value
                    if (autoFill.metaTitle) setAutoFill(flags => ({ ...flags, metaTitle: false }))
                    setFormData(prev => ({
                      ...prev,
                      meta_title: val,
                      og_title: autoFill.ogTitle ? val.slice(0, 100) : prev.og_title,
                    }))
                  }}
                  maxLength={60}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="SEO için başlık"
                />
                <p className="text-xs text-gray-500 mt-1">
                  {formData.meta_title.length}/60 karakter
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Meta Açıklama
                </label>
                <textarea
                  value={formData.meta_description}
                  onChange={(e) => {
                    const val = e.target.value
                    if (autoFill.metaDescription) setAutoFill(flags => ({ ...flags, metaDescription: false }))
                    setFormData(prev => ({
                      ...prev,
                      meta_description: val,
                      og_description: autoFill.ogDescription ? val.slice(0, 200) : prev.og_description,
                    }))
                  }}
                  maxLength={160}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="SEO için açıklama"
                />
                <p className="text-xs text-gray-500 mt-1">
                  {formData.meta_description.length}/160 karakter
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Anahtar Kelimeler
                </label>
                <input
                  type="text"
                  value={formData.meta_keywords}
                  onChange={(e) => setFormData(prev => ({ ...prev, meta_keywords: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="anahtar, kelime, virgülle, ayrılmış"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Canonical URL
                </label>
                <input
                  type="url"
                  value={formData.canonical_url}
                  onChange={(e) => {
                    if (autoFill.canonical) setAutoFill(flags => ({ ...flags, canonical: false }))
                    setFormData(prev => ({ ...prev, canonical_url: e.target.value }))
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="https://example.com/canonical-url"
                />
              </div>
            </div>
          </div>

          {/* Social Media */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Sosyal Medya</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  OG Başlık
                </label>
                <input
                  type="text"
                  value={formData.og_title}
                  onChange={(e) => {
                    if (autoFill.ogTitle) setAutoFill(flags => ({ ...flags, ogTitle: false }))
                    setFormData(prev => ({ ...prev, og_title: e.target.value }))
                  }}
                  maxLength={100}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Facebook/Twitter için başlık"
                />
                <p className="text-xs text-gray-500 mt-1">
                  {formData.og_title.length}/100 karakter
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  OG Açıklama
                </label>
                <textarea
                  value={formData.og_description}
                  onChange={(e) => {
                    if (autoFill.ogDescription) setAutoFill(flags => ({ ...flags, ogDescription: false }))
                    setFormData(prev => ({ ...prev, og_description: e.target.value }))
                  }}
                  maxLength={200}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Facebook/Twitter için açıklama"
                />
                <p className="text-xs text-gray-500 mt-1">
                  {formData.og_description.length}/200 karakter
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
