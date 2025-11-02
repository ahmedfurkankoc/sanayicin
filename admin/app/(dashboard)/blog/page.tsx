'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Edit, Trash2, Eye } from 'lucide-react'
// import { useAuth } from '../../contexts/AuthContext' // Kullanılmıyor
import Pagination from '../../components/Pagination'
import { listBlogPosts, deleteBlogPost, listBlogCategories, createBlogCategory, updateBlogCategory, deleteBlogCategory, generateSlug as apiGenerateSlug } from '../../api/admin'
import DeleteConfirmModal from '../../components/DeleteConfirmModal'

interface BlogPost {
  id: number
  title: string
  slug: string
  excerpt: string
  status: 'draft' | 'published' | 'archived'
  author_name: string
  created_by_name?: string
  category_name?: string
  view_count: number
  published_at?: string
  created_at: string
  updated_at: string
  is_featured: boolean
  meta_title?: string
  meta_description?: string
}

export default function BlogManagement() {
  const router = useRouter()
  // const { user } = useAuth() // Kullanılmıyor
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [pageSize, setPageSize] = useState(10)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [categories, setCategories] = useState<Array<{ id: number; name: string; slug: string }>>([])
  const [catName, setCatName] = useState('')
  const [catSlug, setCatSlug] = useState('')
  const [catAutoSlug, setCatAutoSlug] = useState(true) // Slug otomatik oluşturma flag'i
  const [catLoading, setCatLoading] = useState(false)
  const [showCatModal, setShowCatModal] = useState(false)
  const [editingCatId, setEditingCatId] = useState<number | null>(null)
  const [editingCatName, setEditingCatName] = useState<string>('')
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [deleteModalType, setDeleteModalType] = useState<'post' | 'category'>('post')
  const [itemToDelete, setItemToDelete] = useState<{ id: number; name: string; category?: string } | null>(null)

  const fetchBlogPosts = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await listBlogPosts({
        page: currentPage,
        page_size: pageSize,
        search: searchTerm,
        status: statusFilter !== 'all' ? statusFilter : undefined,
      })
      setBlogPosts(data.results || [])
      setTotalCount(data.count || 0)
      setTotalPages(data.total_pages || Math.ceil((data.count || 0) / pageSize))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Bir hata oluştu')
    } finally {
      setLoading(false)
    }
  }, [currentPage, pageSize, searchTerm, statusFilter])

  useEffect(() => {
    fetchBlogPosts()
    fetchCategories()
  }, [fetchBlogPosts])

  const fetchCategories = async () => {
    try {
      const data = await listBlogCategories()
      setCategories(data)
    } catch {
      // ignore
    }
  }

  const handleCreateCategory = async () => {
    if (!catName.trim()) return
    setCatLoading(true)
    try {
      // Eğer autoSlug aktifse ve slug boşsa veya autoSlug değişmediyse, otomatik oluştur
      const finalSlug = catAutoSlug ? apiGenerateSlug(catName) : (catSlug || apiGenerateSlug(catName))
      const created = await createBlogCategory({ name: catName, slug: finalSlug })
      setCategories(prev => [...prev, created])
      setCatName('')
      setCatSlug('')
      setCatAutoSlug(true)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Kategori eklenemedi')
    } finally {
      setCatLoading(false)
    }
  }

  const handleRenameCategory = async (id: number, name: string) => {
    try {
      const updated = await updateBlogCategory(id, { name })
      setCategories(prev => prev.map(c => (c.id === id ? updated : c)))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Kategori güncellenemedi')
    }
  }

  const handleDeleteCategory = (id: number) => {
    const category = categories.find(c => c.id === id)
    if (!category) return
    setItemToDelete({ id, name: category.name })
    setDeleteModalType('category')
    setDeleteModalOpen(true)
  }

  const handleDelete = (id: number) => {
    const post = blogPosts.find(p => p.id === id)
    if (!post) return
    setItemToDelete({ id, name: post.title, category: post.category_name })
    setDeleteModalType('post')
    setDeleteModalOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!itemToDelete) return
    
    try {
      if (deleteModalType === 'category') {
        await deleteBlogCategory(itemToDelete.id)
        setCategories(prev => prev.filter(c => c.id !== itemToDelete.id))
      } else {
        await deleteBlogPost(itemToDelete.id)
        fetchBlogPosts()
      }
      setDeleteModalOpen(false)
      setItemToDelete(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Silme işlemi başarısız')
    }
  }

  const handleDeleteCancel = () => {
    setDeleteModalOpen(false)
    setItemToDelete(null)
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      draft: { color: 'bg-yellow-100 text-yellow-800', text: 'Taslak' },
      published: { color: 'bg-green-100 text-green-800', text: 'Yayınlandı' },
      archived: { color: 'bg-gray-100 text-gray-800', text: 'Arşivlendi' },
    }
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.draft
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
        {config.text}
      </span>
    )
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('tr-TR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Blog Yönetimi</h1>
          <p className="text-gray-600">Blog yazılarını yönetin ve SEO ayarlarını düzenleyin</p>
        </div>
        <a
          href="/blog/new"
          className="inline-flex items-center px-4 py-2 bg-[color:var(--yellow)] text-[color:var(--black)] rounded-lg hover:brightness-95 transition-colors"
        >
          <Plus className="h-4 w-4 mr-2" />
          Yeni Blog Yazısı
        </a>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Arama</label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Başlık, içerik veya yazar ara..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Durum</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Tümü</option>
              <option value="draft">Taslak</option>
              <option value="published">Yayınlandı</option>
              <option value="archived">Arşivlendi</option>
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={fetchBlogPosts}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 transition-colors"
            >
              Filtrele
            </button>
          </div>
        </div>
      </div>

      {/* Content & Categories Side-by-side */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Blog Posts Table */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Yükleniyor...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center">
            <p className="text-red-600">{error}</p>
            <button
              onClick={fetchBlogPosts}
              className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Tekrar Dene
            </button>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Başlık
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Durum
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Yazar
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Kategori
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Görüntülenme
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tarih
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      İşlemler
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {blogPosts.map((post) => (
                    <tr key={post.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {post.title}
                              {post.is_featured && (
                                <span className="ml-2 px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">
                                  Öne Çıkan
                                </span>
                              )}
                            </div>
                            <div className="text-sm text-gray-500 truncate max-w-xs">
                              {post.excerpt || 'Özet yok'}
                            </div>
                            {post.meta_title && (
                              <div className="text-xs text-blue-600 mt-1">
                                SEO: {post.meta_title}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(post.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {post.created_by_name || post.author_name || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {post.category_name || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {post.view_count.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {post.published_at ? formatDate(post.published_at) : formatDate(post.created_at)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => router.push(`/blog/${post.id}/edit`)}
                            className="text-blue-600 hover:text-blue-900"
                            title="Düzenle"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <a
                            href={`/blog/${post.slug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-green-600 hover:text-green-900"
                            title="Görüntüle"
                          >
                            <Eye className="h-4 w-4" />
                          </a>
                          <button
                            onClick={() => handleDelete(post.id)}
                            className="text-red-600 hover:text-red-900"
                            title="Sil"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="px-6 py-4 border-t border-gray-200">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalCount={totalCount}
                pageSize={pageSize}
                onPageChange={setCurrentPage}
                onPageSizeChange={setPageSize}
                itemName="blog yazısı"
              />
            </div>
          </>
        )}
        </div>

        {/* Right: Categories Panel */}
        <aside className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Kategoriler</h3>
            <button
              onClick={() => setShowCatModal(true)}
              className="px-3 py-2 text-sm bg-[color:var(--yellow)] text-[color:var(--black)] rounded-lg hover:brightness-95"
            >
              Yeni Ekle
            </button>
          </div>
          <ul className="divide-y divide-gray-200 text-gray-900">
            {categories.map((cat) => (
              <li key={cat.id} className="py-3 flex items-center">
                {editingCatId === cat.id ? (
                  <input
                    className="px-2 py-1 border border-gray-300 rounded mr-3 text-sm text-gray-900 bg-white placeholder-gray-400"
                    value={editingCatName}
                    onChange={(e) => setEditingCatName(e.target.value)}
                  />
                ) : (
                  <span className="mr-3 text-sm">{cat.name}</span>
                )}
                <span className="text-xs text-gray-500 ml-auto mr-3">/{cat.slug}</span>
                {editingCatId === cat.id ? (
                  <>
                    <button
                      onClick={async () => { await handleRenameCategory(cat.id, editingCatName.trim() || cat.name); setEditingCatId(null); setEditingCatName('') }}
                      className="px-3 py-1 rounded bg-[color:var(--yellow)] text-[color:var(--black)] text-sm hover:brightness-95"
                    >Kaydet</button>
                    <button
                      onClick={() => { setEditingCatId(null); setEditingCatName('') }}
                      className="ml-2 px-3 py-1 rounded border border-gray-300 hover:bg-gray-50 text-sm"
                    >İptal</button>
                  </>
                ) : (
                  <button
                    onClick={() => { setEditingCatId(cat.id); setEditingCatName(cat.name) }}
                    className="px-3 py-1 rounded border border-gray-300 hover:bg-gray-50 text-sm"
                  >Düzenle</button>
                )}
                <button
                  onClick={() => handleDeleteCategory(cat.id)}
                  className="ml-3 px-3 py-1 rounded btn-danger text-sm"
                >
                  Sil
                </button>
              </li>
            ))}
          </ul>
        </aside>
      </div>

      {/* Category Create Modal */}
      {showCatModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowCatModal(false)} />
          <div className="relative z-10 w-full max-w-lg bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-semibold text-gray-900">Yeni Kategori</h4>
              <button
                type="button"
                onClick={() => setShowCatModal(false)}
                className="p-2 hover:bg-gray-100 rounded-md"
                aria-label="Kapat"
              >
                ×
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Kategori Adı</label>
                <input
                  type="text"
                  value={catName}
                  onChange={(e) => {
                    const name = e.target.value
                    setCatName(name)
                    // Eğer otomatik slug aktifse, slug'ı güncelle
                    if (catAutoSlug) {
                      setCatSlug(apiGenerateSlug(name))
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Örn: Oto Bakım ve Servis"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Slug {catAutoSlug && <span className="text-xs text-gray-500 font-normal">(otomatik)</span>}
                </label>
                <input
                  type="text"
                  value={catSlug}
                  onChange={(e) => {
                    setCatSlug(e.target.value)
                    // Manuel değişiklik yapıldığında otomatik modu kapat
                    if (catAutoSlug) {
                      setCatAutoSlug(false)
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="oto-bakim-ve-servis"
                />
                <p className="text-xs text-gray-500 mt-1">
                  {catAutoSlug 
                    ? 'Slug otomatik olarak kategori adından oluşturuluyor' 
                    : 'Slug manuel olarak düzenleniyor'}
                </p>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setShowCatModal(false)
                  setCatName('')
                  setCatSlug('')
                  setCatAutoSlug(true)
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                İptal
              </button>
              <button
                type="button"
                disabled={catLoading || !catName.trim()}
                onClick={async () => { 
                  await handleCreateCategory()
                  setShowCatModal(false)
                  setCatName('')
                  setCatSlug('')
                  setCatAutoSlug(true)
                }}
                className="px-4 py-2 bg-[color:var(--yellow)] text-[color:var(--black)] rounded-lg hover:brightness-95 disabled:opacity-50"
              >
                {catLoading ? 'Ekleniyor...' : 'Ekle'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm Modal */}
      <DeleteConfirmModal
        isOpen={deleteModalOpen}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        title={deleteModalType === 'post' ? 'Blog Yazısını Sil' : 'Kategori Sil'}
        itemName={deleteModalType === 'post' ? 'blog yazısı' : 'kategori'}
        itemDetails={itemToDelete ? {
          id: itemToDelete.id,
          name: itemToDelete.name,
          category: itemToDelete.category
        } : undefined}
        description={deleteModalType === 'post' 
          ? "Bu blog yazısını kalıcı olarak silmek istediğinizden emin misiniz?"
          : "Bu kategoriyi kalıcı olarak silmek istediğinizden emin misiniz?"
        }
        warningMessage={deleteModalType === 'post'
          ? "Bu blog yazısı kalıcı olarak silinecek. Tüm içerik ve ilişkili veriler kaybolacaktır."
          : "Bu kategori kalıcı olarak silinecek. Bu kategoriye ait tüm blog yazıları etkilenebilir."
        }
      />
    </div>
  )
}
