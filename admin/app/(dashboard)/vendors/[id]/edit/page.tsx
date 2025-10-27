'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { getVendor, updateVendor, type VendorProfile } from '../../../../api/vendors'
import { useTurkeyData } from '../../../../hooks/useTurkeyData'

export default function VendorEditPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const [vendor, setVendor] = useState<Partial<VendorProfile> | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { cities, isLoading: turkeyDataLoading, loadTurkeyData, getDistricts, getNeighbourhoods } = useTurkeyData()
  const [districts, setDistricts] = useState<string[]>([])
  const [neighbourhoods, setNeighbourhoods] = useState<string[]>([])

  // Turkey data'yı yükle
  useEffect(() => {
    loadTurkeyData()
  }, [loadTurkeyData])

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

  // Şehir değiştiğinde ilçeleri yükle
  useEffect(() => {
    if (vendor?.city) {
      const cityDistricts = getDistricts(vendor.city)
      setDistricts(cityDistricts)
    } else {
      setDistricts([])
      setNeighbourhoods([])
    }
  }, [vendor?.city, getDistricts])

  // İlçe değiştiğinde mahalleleri yükle
  useEffect(() => {
    if (vendor?.city && vendor?.district) {
      const districtNeighbourhoods = getNeighbourhoods(vendor.city, vendor.district)
      setNeighbourhoods(districtNeighbourhoods)
    } else {
      setNeighbourhoods([])
    }
  }, [vendor?.city, vendor?.district, getNeighbourhoods])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!vendor?.id) return
    
    setSaving(true)
    try {
      await updateVendor(vendor.id, vendor)
      alert('Esnaf bilgileri başarıyla güncellendi')
      router.push(`/vendors/${vendor.id}`)
    } catch (error) {
      console.error('Error updating vendor:', error)
      alert('Esnaf güncellenirken bir hata oluştu')
    } finally {
      setSaving(false)
    }
  }

  const getBusinessTypeText = (type: string) => {
    const types = {
      'sahis': 'Şahıs Şirketi',
      'limited': 'Limited Şirketi', 
      'anonim': 'Anonim Şirketi',
      'esnaf': 'Esnaf'
    }
    return types[type as keyof typeof types] || type
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
          <h1 className="text-2xl font-bold text-gray-900">Esnaf Düzenle</h1>
          <p className="text-gray-600">ID: {vendor.id}</p>
        </div>
        <button onClick={() => router.push(`/vendors/${vendor.id}`)} className="px-3 py-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50">
          İptal
        </button>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Sol Kolon */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Temel Bilgiler</h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Görünen Ad *
              </label>
              <input
                type="text"
                value={vendor.display_name || ''}
                onChange={(e) => setVendor({ ...vendor, display_name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Şirket Ünvanı *
              </label>
              <input
                type="text"
                value={vendor.company_title || ''}
                onChange={(e) => setVendor({ ...vendor, company_title: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                İş Türü *
              </label>
              <select
                value={vendor.business_type || 'esnaf'}
                onChange={(e) => setVendor({ ...vendor, business_type: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
              >
                <option value="esnaf">Esnaf</option>
                <option value="sahis">Şahıs Şirketi</option>
                <option value="limited">Limited Şirketi</option>
                <option value="anonim">Anonim Şirketi</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Vergi Dairesi *
              </label>
              <input
                type="text"
                value={vendor.tax_office || ''}
                onChange={(e) => setVendor({ ...vendor, tax_office: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Vergi Numarası *
              </label>
              <input
                type="text"
                value={vendor.tax_no || ''}
                onChange={(e) => setVendor({ ...vendor, tax_no: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                İş Telefonu *
              </label>
              <input
                type="tel"
                value={vendor.business_phone || ''}
                onChange={(e) => setVendor({ ...vendor, business_phone: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Adres
              </label>
              <textarea
                value={vendor.address || ''}
                onChange={(e) => setVendor({ ...vendor, address: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
                rows={2}
              />
            </div>
          </div>

          {/* Sağ Kolon */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Konum Bilgileri</h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Şehir *
              </label>
              <select
                value={vendor.city || ''}
                onChange={(e) => {
                  setVendor({ ...vendor, city: e.target.value, district: '', subdistrict: '' })
                  const cityDistricts = getDistricts(e.target.value)
                  setDistricts(cityDistricts)
                  setNeighbourhoods([])
                }}
                required
                disabled={turkeyDataLoading}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 disabled:bg-gray-100"
              >
                <option value="">Şehir seçin</option>
                {cities.map(city => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </select>
              {turkeyDataLoading && (
                <p className="text-sm text-gray-500 mt-1">Şehirler yükleniyor...</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                İlçe *
              </label>
              <select
                value={vendor.district || ''}
                onChange={(e) => {
                  setVendor({ ...vendor, district: e.target.value, subdistrict: '' })
                  if (vendor.city) {
                    const districtNeighbourhoods = getNeighbourhoods(vendor.city, e.target.value)
                    setNeighbourhoods(districtNeighbourhoods)
                  }
                }}
                required
                disabled={!vendor.city || districts.length === 0}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 disabled:bg-gray-100"
              >
                <option value="">İlçe seçin</option>
                {districts.map(district => (
                  <option key={district} value={district}>{district}</option>
                ))}
              </select>
              {!vendor.city && (
                <p className="text-sm text-gray-500 mt-1">Önce şehir seçin</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Mahalle
              </label>
              <select
                value={vendor.subdistrict || ''}
                onChange={(e) => setVendor({ ...vendor, subdistrict: e.target.value })}
                disabled={!vendor.district || neighbourhoods.length === 0}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 disabled:bg-gray-100"
              >
                <option value="">Mahalle seçin</option>
                {neighbourhoods.map(neighbourhood => (
                  <option key={neighbourhood} value={neighbourhood}>{neighbourhood}</option>
                ))}
              </select>
              {!vendor.district && (
                <p className="text-sm text-gray-500 mt-1">Önce ilçe seçin</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Hakkında
              </label>
              <textarea
                value={vendor.about || ''}
                onChange={(e) => setVendor({ ...vendor, about: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
                rows={4}
              />
            </div>

            <div>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={vendor.user_is_verified || false}
                  onChange={(e) => setVendor({ ...vendor, user_is_verified: e.target.checked })}
                  className="h-4 w-4 text-yellow-600 focus:ring-yellow-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-700">Doğrulandı</span>
              </label>
            </div>

            <div className="border-t pt-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Bilgiler</h4>
              <p className="text-xs text-gray-500">
                Kayıt Tarihi: {vendor.created_at ? new Date(vendor.created_at).toLocaleString('tr-TR') : '-'}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Son Güncelleme: {vendor.updated_at ? new Date(vendor.updated_at).toLocaleString('tr-TR') : '-'}
              </p>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="mt-6 flex justify-end space-x-3">
          <button
            type="button"
            onClick={() => router.push(`/vendors/${vendor.id}`)}
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

