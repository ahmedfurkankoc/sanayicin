'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { fetchClient, type ClientListItem } from '../../../api/clients'
import { fetchReviews, updateReview, deleteReview, type ReviewItem } from '../../../api/clients'
import { Star, Trash2, Edit } from 'lucide-react'
import DeleteConfirmModal from '../../../components/DeleteConfirmModal'

export default function UserDetailPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const [user, setUser] = useState<ClientListItem | null>(null)
  const [reviews, setReviews] = useState<ReviewItem[]>([])
  const [loading, setLoading] = useState(true)
  const [reviewsLoading, setReviewsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editingComment, setEditingComment] = useState<string>('')
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [reviewToDelete, setReviewToDelete] = useState<ReviewItem | null>(null)

  useEffect(() => {
    const id = Number(params?.id)
    if (!id) return
    let cancelled = false
    setLoading(true)
    fetchClient(id)
      .then((u) => {
        if (cancelled) return
        setUser(u)
        setError(null)
      })
      .catch(() => {
        if (cancelled) return
        setError('Kullanıcı bilgileri yüklenemedi')
      })
      .finally(() => {
        if (cancelled) return
        setLoading(false)
      })
    return () => { cancelled = true }
  }, [params?.id])

  useEffect(() => {
    loadReviews()
  }, [params?.id])

  const loadReviews = async () => {
    const id = Number(params?.id)
    if (!id) return
    
    setReviewsLoading(true)
    try {
      const data = await fetchReviews({ user: id, page_size: 10 })
      setReviews(data.results)
    } catch (error) {
      console.error('Error loading reviews:', error)
    } finally {
      setReviewsLoading(false)
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
      <div className="space-y-6">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[color:var(--yellow)] mx-auto mb-4"></div>
            <p className="text-gray-600">Yükleniyor...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-800">{error}</div>
      </div>
    )
  }

  if (!user) return null

  const fullName = `${user.first_name || ''} ${user.last_name || ''}`.trim()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Kullanıcı Detayı</h1>
          <p className="text-gray-600">ID: {user.id}</p>
        </div>
        <button onClick={() => router.push('/users')} className="px-3 py-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50">
          Geri Dön
        </button>
      </div>

      {/* User Info Card */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Temel Bilgiler</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-gray-500">Ad Soyad</span><span className="text-gray-900">{fullName || '-'}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">E-posta</span><span className="text-gray-900">{user.email}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Telefon</span><span className="text-gray-900">{user.phone_number || '-'}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Rol</span><span className="text-gray-900">{user.role}</span></div>
            </div>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Durum</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-gray-500">Doğrulama</span><span className="text-gray-900">{user.is_verified ? 'Doğrulandı' : 'Doğrulanmadı'}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Kayıt Tarihi</span><span className="text-gray-900">{user.date_joined ? new Date(user.date_joined).toLocaleString('tr-TR') : '-'}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Son Giriş</span><span className="text-gray-900">{user.last_login ? new Date(user.last_login).toLocaleString('tr-TR') : '-'}</span></div>
            </div>
          </div>
        </div>
      </div>

      {/* User Reviews Card */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Kullanıcının Yorumları</h3>
        
        {reviewsLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[color:var(--yellow)] mx-auto mb-4"></div>
            <p className="text-gray-600">Yorumlar yükleniyor...</p>
          </div>
        ) : reviews.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">Bu kullanıcının henüz yorumu bulunmuyor.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {reviews.map((review) => (
              <div key={review.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h4 className="text-sm font-semibold text-gray-900">{review.vendor_display_name}</h4>
                    {review.service_name && (
                      <p className="text-xs text-gray-500">{review.service_name}</p>
                    )}
                  </div>
                  <div className="flex items-center space-x-1">
                    {renderStars(review.rating)}
                  </div>
                </div>
                
                {editingId === review.id ? (
                  <div className="space-y-3">
                    <textarea
                      value={editingComment}
                      onChange={(e) => setEditingComment(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 text-sm"
                      rows={3}
                    />
                    <div className="flex items-center justify-end space-x-2">
                      <button
                        onClick={() => handleCancel()}
                        className="px-3 py-1 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        İptal
                      </button>
                      <button
                        onClick={() => handleSave(review.id)}
                        className="px-3 py-1 text-sm bg-yellow-500 text-white hover:bg-yellow-600 rounded-lg transition-colors"
                      >
                        Kaydet
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <p className="text-sm text-gray-700 mb-2">{review.comment}</p>
                    <div className="flex items-center justify-between mt-3">
                      <div className="flex items-center text-xs text-gray-500 space-x-3">
                        <span>Hizmet: {new Date(review.service_date).toLocaleDateString('tr-TR')}</span>
                        <span>Yorum: {new Date(review.created_at).toLocaleDateString('tr-TR')}</span>
                      </div>
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
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
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


