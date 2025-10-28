'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { fetchClient, type ClientListItem } from '../../../../api/clients'
import { apiClient } from '../../../../api/api'

type EditableUser = Partial<ClientListItem> & { is_active?: boolean }

export default function UserEditPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const [user, setUser] = useState<EditableUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user?.id) return
    
    setSaving(true)
    try {
      // Only send fields that exist in CustomUser model
      const updateData: Partial<ClientListItem> & { is_active?: boolean } = {
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        phone_number: user.phone_number,
        role: user.role,
        is_verified: user.is_verified,
        is_active: user.is_active
      }
      await apiClient.patch(`/users/${user.id}/`, updateData)
      alert('Kullanıcı bilgileri başarıyla güncellendi')
      router.push(`/users/${user.id}`)
    } catch (error) {
      console.error('Error updating user:', error)
      alert('Kullanıcı güncellenirken bir hata oluştu')
    } finally {
      setSaving(false)
    }
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Kullanıcı Düzenle</h1>
          <p className="text-gray-600">ID: {user.id}</p>
        </div>
        <button onClick={() => router.push(`/users/${user.id}`)} className="px-3 py-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50">
          İptal
        </button>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left Column */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Temel Bilgiler</h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                E-posta
              </label>
              <input
                type="email"
                value={user.email || ''}
                onChange={(e) => setUser({ ...user, email: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ad
              </label>
              <input
                type="text"
                value={user.first_name || ''}
                onChange={(e) => setUser({ ...user, first_name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Soyad
              </label>
              <input
                type="text"
                value={user.last_name || ''}
                onChange={(e) => setUser({ ...user, last_name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Telefon
              </label>
              <input
                type="tel"
                value={user.phone_number || ''}
                onChange={(e) => setUser({ ...user, phone_number: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Rol
              </label>
              <select
                value={user.role || ''}
                onChange={(e) => setUser({ ...user, role: e.target.value as ClientListItem['role'] })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
              >
                <option value="client">Müşteri</option>
                <option value="vendor">Esnaf</option>
              </select>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Durum</h3>
            
            <div>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={user.is_verified || false}
                  onChange={(e) => setUser({ ...user, is_verified: e.target.checked })}
                  className="h-4 w-4 text-yellow-600 focus:ring-yellow-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-700">Doğrulandı</span>
              </label>
            </div>

            <div>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={user.is_active !== false}
                  onChange={(e) => setUser({ ...user, is_active: e.target.checked })}
                  className="h-4 w-4 text-yellow-600 focus:ring-yellow-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-700">Aktif</span>
              </label>
            </div>

            <div className="border-t pt-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Bilgiler</h4>
              <p className="text-xs text-gray-500">
                Kayıt Tarihi: {user.date_joined ? new Date(user.date_joined).toLocaleString('tr-TR') : '-'}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Son Giriş: {user.last_login ? new Date(user.last_login).toLocaleString('tr-TR') : '-'}
              </p>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="mt-6 flex justify-end space-x-3">
          <button
            type="button"
            onClick={() => router.push(`/users/${user.id}`)}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
          >
            İptal
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors disabled:opacity-50"
          >
            {saving ? 'Kaydediliyor...' : 'Kaydet'}
          </button>
        </div>
      </form>
    </div>
  )
}

