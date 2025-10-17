'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { getVendor, type VendorProfile } from '../../../api/vendors'

export default function VendorDetailPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const [vendor, setVendor] = useState<VendorProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const id = Number(params?.id)
    if (!id) return
    let cancelled = false
    setLoading(true)
    getVendor(id)
      .then((v) => {
        if (cancelled) return
        setVendor(v)
        setError(null)
      })
      .catch(() => {
        if (cancelled) return
        setError('Esnaf bilgileri yüklenemedi')
      })
      .finally(() => {
        if (cancelled) return
        setLoading(false)
      })
    return () => { cancelled = true }
  }, [params?.id])

  const getBusinessTypeText = (type: string) => {
    const types = {
      'sahis': 'Şahıs Şirketi',
      'limited': 'Limited Şirketi', 
      'anonim': 'Anonim Şirketi',
      'esnaf': 'Esnaf'
    }
    return types[type as keyof typeof types] || type
  }

  const getStatusBadge = (isVerified: boolean) => {
    return isVerified 
      ? 'bg-green-100 text-green-800' 
      : 'bg-yellow-100 text-yellow-800'
  }

  const getStatusText = (isVerified: boolean) => {
    return isVerified ? 'Doğrulanmış' : 'Beklemede'
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

  if (!vendor) return null

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Esnaf Detayı</h1>
          <p className="text-gray-600">ID: {vendor.id}</p>
        </div>
        <button onClick={() => router.push('/vendors')} className="px-3 py-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50">
          Geri Dön
        </button>
      </div>

      {/* Status Badge */}
      <div className="flex justify-start">
        <span className={`inline-flex items-center px-3 py-1 text-sm font-semibold rounded-full ${getStatusBadge(vendor.user_is_verified)}`}>
          {getStatusText(vendor.user_is_verified)}
        </span>
      </div>

      {/* Main Card */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Sol Kolon - Temel Bilgiler */}
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Temel Bilgiler</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Görünen Ad</span>
                  <span className="text-gray-900 font-medium">{vendor.display_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Şirket Ünvanı</span>
                  <span className="text-gray-900">{vendor.company_title}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">İş Türü</span>
                  <span className="text-gray-900">{getBusinessTypeText(vendor.business_type)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Vergi Dairesi</span>
                  <span className="text-gray-900">{vendor.tax_office}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Vergi Numarası</span>
                  <span className="text-gray-900">{vendor.tax_no}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Slug</span>
                  <span className="text-gray-900 font-mono text-xs">{vendor.slug}</span>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">İletişim Bilgileri</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">E-posta</span>
                  <span className="text-gray-900">{vendor.user_email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">İş Telefonu</span>
                  <span className="text-gray-900">{vendor.business_phone || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Adres</span>
                  <span className="text-gray-900 text-right max-w-xs">{vendor.address}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Konum</span>
                  <span className="text-gray-900">{vendor.city}, {vendor.district}</span>
                </div>
                {vendor.subdistrict && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Mahalle</span>
                    <span className="text-gray-900">{vendor.subdistrict}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sağ Kolon - Ek Bilgiler */}
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Yönetici Bilgileri</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Yönetici Adı</span>
                  <span className="text-gray-900">{vendor.user_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Doğum Tarihi</span>
                  <span className="text-gray-900">{vendor.manager_birthdate ? new Date(vendor.manager_birthdate).toLocaleDateString('tr-TR') : '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">TC Kimlik No</span>
                  <span className="text-gray-900 font-mono">{vendor.manager_tc || '-'}</span>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Hakkında</h3>
              <div className="text-sm text-gray-900 bg-gray-50 p-3 rounded-md">
                {vendor.about || 'Hakkında bilgi girilmemiş.'}
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Sosyal Medya</h3>
              <div className="space-y-2 text-sm">
                {vendor.social_media && Object.keys(vendor.social_media).length > 0 ? (
                  Object.entries(vendor.social_media).map(([platform, url]) => (
                    <div key={platform} className="flex justify-between">
                      <span className="text-gray-500 capitalize">{platform}</span>
                      <a href={url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                        {url}
                      </a>
                    </div>
                  ))
                ) : (
                  <span className="text-gray-500">Sosyal medya hesabı eklenmemiş.</span>
                )}
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Çalışma Saatleri</h3>
              <div className="space-y-2 text-sm">
                {vendor.working_hours && Object.keys(vendor.working_hours).length > 0 ? (
                  Object.entries(vendor.working_hours).map(([day, hours]) => {
                    let hoursText = ''
                    if (typeof hours === 'object' && hours !== null) {
                      type HoursObject = { open?: string; close?: string; closed?: boolean }
                      const hoursObj = hours as HoursObject
                      if (hoursObj.open && hoursObj.close) {
                        hoursText = `${hoursObj.open} - ${hoursObj.close}`
                      } else if (hoursObj.closed) {
                        hoursText = 'Kapalı'
                      } else {
                        hoursText = 'Bilinmiyor'
                      }
                    } else if (typeof hours === 'string') {
                      hoursText = hours
                    } else {
                      hoursText = 'Bilinmiyor'
                    }
                    
                    return (
                      <div key={day} className="flex justify-between">
                        <span className="text-gray-500 capitalize">{day}</span>
                        <span className="text-gray-900">{hoursText}</span>
                      </div>
                    )
                  })
                ) : (
                  <span className="text-gray-500">Çalışma saatleri belirlenmemiş.</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Alt Bilgiler */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <h4 className="text-sm font-medium text-gray-500 mb-2">Kayıt Tarihi</h4>
              <p className="text-sm text-gray-900">{new Date(vendor.created_at).toLocaleString('tr-TR')}</p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-500 mb-2">Son Güncelleme</h4>
              <p className="text-sm text-gray-900">{new Date(vendor.updated_at).toLocaleString('tr-TR')}</p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-500 mb-2">Müsait Olmayan Tarihler</h4>
              <p className="text-sm text-gray-900">
                {vendor.unavailable_dates && vendor.unavailable_dates.length > 0 
                  ? `${vendor.unavailable_dates.length} tarih` 
                  : 'Müsait olmayan tarih yok'
                }
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
