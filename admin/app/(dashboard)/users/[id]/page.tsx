'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { fetchClient, type ClientListItem } from '../../../api/clients'

export default function UserDetailPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const [user, setUser] = useState<ClientListItem | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

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

      {/* Card */}
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
    </div>
  )
}


