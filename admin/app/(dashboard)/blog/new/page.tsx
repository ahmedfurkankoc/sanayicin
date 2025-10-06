'use client'

import { useState, useEffect } from 'react'
import { Save, Eye, ArrowLeft, Upload, X } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { useRouter } from 'next/navigation'

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
}

export default function BlogEditor({ params }: { params: { id?: string } }) {
  const { user } = useAuth()
  const router = useRouter()
  const isEdit = !!params.id
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [categories, setCategories] = useState<BlogCategory[]>([])
  
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

  const [previewMode, setPreviewMode] = useState(false)

  useEffect(() => {
    fetchCategories()
    if (isEdit) {
      fetchBlogPost()
    }
  }, [isEdit, params.id])

  const fetchCategories = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/admin/blog-categories/', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('admin_token')}`,
        },
      })
      if (response.ok) {
        const data = await response.json()
        setCategories(data.results || [])
      }
    } catch (err) {
      console.error('Kategoriler yüklenemedi:', err)
    }
  }

  const fetchBlogPost = async () => {
    if (!params.id) return
    
    setLoading(true)
    try {
      const response = await fetch(`http://localhost:8000/api/admin/blog-posts/${params.id}/`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('admin_token')}`,
        },
      })
      
      if (!response.ok) {
        throw new Error('Blog yazısı yüklenemedi')
      }
      
      const data = await response.json()
      setFormData(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Bir hata oluştu')
    } finally {
      setLoading(false)
    }
  }

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim()
  }

  const handleTitleChange = (title: string) => {
    setFormData(prev => ({
      ...prev,
      title,
      slug: prev.slug || generateSlug(title),
      meta_title: prev.meta_title || title.substring(0, 60),
      og_title: prev.og_title || title.substring(0, 100),
    }))
  }

  const handleContentChange = (content: string) => {
    setFormData(prev => ({
      ...prev,
      content,
      excerpt: prev.excerpt || content.substring(0, 500).replace(/<[^>]*>/g, ''),
      meta_description: prev.meta_description || content.substring(0, 160).replace(/<[^>]*>/g, ''),
      og_description: prev.og_description || content.substring(0, 200).replace(/<[^>]*>/g, ''),
    }))
  }

  const handleSave = async (status: 'draft' | 'published') => {
    setSaving(true)
    setError(null)
    
    try {
      const url = isEdit ? `http://localhost:8000/api/admin/blog-posts/${params.id}/` : 'http://localhost:8000/api/admin/blog-posts/'
      const method = isEdit ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('admin_token')}`,
        },
        body: JSON.stringify({
          ...formData,
          status,
        }),
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || 'Kaydetme işlemi başarısız')
      }
      
      const data = await response.json()
      
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
    const formData = new FormData()
    formData.append('image', file)
    
    try {
      const response = await fetch('http://localhost:8000/api/admin/upload-image/', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('admin_token')}`,
        },
        body: formData,
      })
      
      if (!response.ok) {
        throw new Error('Görsel yüklenemedi')
      }
      
      const data = await response.json()
      return data.url
    } catch (err) {
      console.error('Görsel yükleme hatası:', err)
      return null
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
            onClick={() => setPreviewMode(!previewMode)}
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Eye className="h-4 w-4 mr-2" />
            {previewMode ? 'Düzenle' : 'Önizle'}
          </button>
          <button
            onClick={() => handleSave('draft')}
            disabled={saving}
            className="inline-flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 transition-colors"
          >
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Kaydediliyor...' : 'Taslak Kaydet'}
          </button>
          <button
            onClick={() => handleSave('published')}
            disabled={saving}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
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
                  onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
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
                  onChange={(e) => setFormData(prev => ({ ...prev, excerpt: e.target.value }))}
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
            <h3 className="text-lg font-medium text-gray-900 mb-4">İçerik</h3>
            
            {previewMode ? (
              <div className="prose max-w-none">
                <div dangerouslySetInnerHTML={{ __html: formData.content }} />
              </div>
            ) : (
              <div>
                <div className="mb-4">
                  <button
                    onClick={() => {
                      const imageInput = document.createElement('input')
                      imageInput.type = 'file'
                      imageInput.accept = 'image/*'
                      imageInput.onchange = async (e) => {
                        const file = (e.target as HTMLInputElement).files?.[0]
                        if (file) {
                          const url = await handleImageUpload(file)
                          if (url) {
                            const imgTag = `<img src="${url}" alt="${formData.title}" class="max-w-full h-auto rounded-lg" />`
                            handleContentChange(formData.content + '\n\n' + imgTag)
                          }
                        }
                      }
                      imageInput.click()
                    }}
                    className="inline-flex items-center px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Görsel Ekle
                  </button>
                </div>
                
                <textarea
                  value={formData.content}
                  onChange={(e) => handleContentChange(e.target.value)}
                  rows={20}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                  placeholder="Blog yazısının içeriğini HTML formatında yazın..."
                />
                <p className="text-xs text-gray-500 mt-2">
                  HTML formatında yazın. Başlıklar için &lt;h2&gt;, &lt;h3&gt; vb. kullanın.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
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
                  onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as any }))}
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
                  onChange={(e) => setFormData(prev => ({ ...prev, meta_title: e.target.value }))}
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
                  onChange={(e) => setFormData(prev => ({ ...prev, meta_description: e.target.value }))}
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
                  onChange={(e) => setFormData(prev => ({ ...prev, canonical_url: e.target.value }))}
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
                  onChange={(e) => setFormData(prev => ({ ...prev, og_title: e.target.value }))}
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
                  onChange={(e) => setFormData(prev => ({ ...prev, og_description: e.target.value }))}
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
