'use client'

import { useState, useEffect } from 'react'
import { Search, Trash2, Edit, Star, X, Check } from 'lucide-react'
import { fetchReviews, updateReview, deleteReview, type ReviewItem } from '../../api/clients'
import Pagination from '../../components/Pagination'
import DeleteConfirmModal from '../../components/DeleteConfirmModal'
import VendorDropdown from '../../components/VendorDropdown'

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<ReviewItem[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [vendorFilter, setVendorFilter] = useState<string>('')
  const [ratingFilter, setRatingFilter] = useState<string>('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [pageSize] = useState(20)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editingComment, setEditingComment] = useState<string>('')
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [reviewToDelete, setReviewToDelete] = useState<ReviewItem | null>(null)

  useEffect(() => {
    loadReviews()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, search, vendorFilter, ratingFilter])

  const loadReviews = async () => {
    setLoading(true)
    try {
      const params: Record<string, string | number> = {
        page: currentPage,
        page_size: pageSize,
      }
      
      if (search) params.search = search
      if (vendorFilter) params.vendor = vendorFilter
      if (ratingFilter) params.rating = ratingFilter
      
      const data = await fetchReviews(params)
      setReviews(data.results)
      setTotalPages(data.total_pages)
      setTotalCount(data.count)
    } catch (error) {
      console.error('Error loading reviews:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (review: ReviewItem) => {
    setEditingId(review.id)
    setEditingComment(review.comment)
  }

  const handleSave = async (id: number) => {
    try {
      await updateReview(id, { comment: editingComment })
      setEditingId(null)
      setEditingComment('')
      await loadReviews()
    } catch (error) {
      console.error('Error updating review:', error)
      alert('Yorum güncellenirken bir hata oluştu')
    }
  }

  const handleCancel = () => {
    setEditingId(null)
    setEditingComment('')
  }

  const handleDeleteClick = (review: ReviewItem) => {
    setReviewToDelete(review)
    setDeleteModalOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!reviewToDelete) return
    
    try {
      await deleteReview(reviewToDelete.id)
      await loadReviews()
      setDeleteModalOpen(false)
      setReviewToDelete(null)
    } catch (error) {
      console.error('Error deleting review:', error)
      alert('Yorum silinirken bir hata oluştu')
    }
  }

  const handleDeleteCancel = () => {
    setDeleteModalOpen(false)
    setReviewToDelete(null)
  }

  const renderStars = (rating: number) => {
    return [...Array(5)].map((_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${
          i < rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'
        }`}
      />
    ))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Yükleniyor...</div>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Müşteri Yorumları</h1>
        <p className="text-gray-600 mt-1">Toplam {totalCount} yorum</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Ara..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setCurrentPage(1)
              }}
              className="pl-10 pr-3 py-2 w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
            />
          </div>

          {/* Rating Filter */}
          <select
            value={ratingFilter}
            onChange={(e) => {
              setRatingFilter(e.target.value)
              setCurrentPage(1)
            }}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
          >
            <option value="">Tüm Puanlar</option>
            <option value="1">1 Yıldız</option>
            <option value="2">2 Yıldız</option>
            <option value="3">3 Yıldız</option>
            <option value="4">4 Yıldız</option>
            <option value="5">5 Yıldız</option>
          </select>

          {/* Vendor Filter */}
          <VendorDropdown
            value={vendorFilter}
            onChange={(vendorId) => {
              setVendorFilter(vendorId)
              setCurrentPage(1)
            }}
            placeholder="Esnaf ara..."
          />
        </div>
      </div>

      {/* Reviews List */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Kullanıcı
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Esnaf
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Puan
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Yorum
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
              {reviews.map((review) => (
                <tr key={review.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {review.user_name}
                    </div>
                    <div className="text-sm text-gray-500">{review.user_email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{review.vendor_display_name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-1">
                      {renderStars(review.rating)}
                    </div>
                  </td>
                <td className="px-6 py-4">
                  {editingId === review.id ? (
                    <div className="space-y-2">
                      <textarea
                        value={editingComment}
                        onChange={(e) => setEditingComment(e.target.value)}
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-yellow-500"
                        rows={2}
                      />
                      <div className="flex items-center space-x-1">
                        <button
                          onClick={() => handleSave(review.id)}
                          className="p-1 text-green-600 hover:text-green-800 rounded transition-colors"
                          title="Kaydet"
                        >
                          <Check className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleCancel()}
                          className="p-1 text-gray-600 hover:text-gray-800 rounded transition-colors"
                          title="İptal"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-sm text-gray-900 max-w-xs truncate">
                      {review.comment}
                    </div>
                  )}
                </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(review.created_at).toLocaleDateString('tr-TR')}
                  </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleEdit(review)}
                      className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Düzenle"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteClick(review)}
                      className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors"
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

        {reviews.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">Henüz yorum bulunmuyor.</p>
          </div>
        )}
      </div>

      {/* Pagination */}
      <div className="mt-6">
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalCount={totalCount}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={() => {
            // Page size değiştiğinde ilk sayfaya dön
            setCurrentPage(1)
            // Bu durumda page size değiştiremiyoruz çünkü sabit tutuyoruz
          }}
          itemName="yorum"
        />
      </div>

      {/* Delete Confirm Modal */}
      <DeleteConfirmModal
        isOpen={deleteModalOpen}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        title="Yorumu Sil"
        itemName="yorum"
        itemDetails={reviewToDelete ? {
          id: reviewToDelete.id,
          name: reviewToDelete.user_name,
          email: reviewToDelete.user_email,
          vendor: reviewToDelete.vendor_display_name,
          comment: reviewToDelete.comment
        } : undefined}
        description="Bu yorumu kalıcı olarak silmek istediğinizden emin misiniz?"
        warningMessage="Bu yorum kalıcı olarak silinecek. Bu işlem geri alınamaz."
      />
    </div>
  )
}

