'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { 
  ArrowLeft, 
  Edit, 
  CheckCircle, 
  Clock,
  FileText,
  Calendar,
  Star,
  DollarSign,
  Phone,
  Mail,
  MapPin
} from 'lucide-react'
import { getVendorDetailedStats, type VendorDetailedStats } from '../../../api/vendors'
import { usePermissions } from '../../../contexts/AuthContext'

export default function VendorDetailPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const { canRead } = usePermissions()
  const canReadVendors = canRead('vendors')
  
  const [data, setData] = useState<VendorDetailedStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'overview' | 'requests' | 'quotes' | 'appointments' | 'reviews' | 'cancelled'>('overview')

  useEffect(() => {
    if (!canReadVendors) return
    const id = Number(params?.id)
    if (!id) return
    
    let cancelled = false
    setLoading(true)
    getVendorDetailedStats(id)
      .then((stats) => {
        if (cancelled) return
        setData(stats)
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
  }, [params?.id, canReadVendors])

  const getBusinessTypeText = (type: string) => {
    const types = {
      'sahis': 'Şahıs Şirketi',
      'limited': 'Limited Şirketi', 
      'anonim': 'Anonim Şirketi',
      'esnaf': 'Esnaf'
    }
    return types[type as keyof typeof types] || type
  }

  const getStatusBadge = (statusCode: string) => {
    const statusColors: Record<string, string> = {
      'pending': 'bg-yellow-100 text-yellow-800',
      'responded': 'bg-blue-100 text-blue-800',
      'completed': 'bg-green-100 text-green-800',
      'cancelled': 'bg-red-100 text-red-800',
      'closed': 'bg-gray-100 text-gray-800',
      'confirmed': 'bg-green-100 text-green-800',
      'rejected': 'bg-red-100 text-red-800',
    }
    return statusColors[statusCode] || 'bg-gray-100 text-gray-800'
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('tr-TR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatCurrency = (amount: number | null) => {
    if (!amount) return '-'
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY'
    }).format(amount)
  }

  if (!canReadVendors) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Esnaf Detayı</h1>
        <p className="text-gray-600">Bu sayfayı görüntüleme yetkiniz yok.</p>
      </div>
    )
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

  if (error || !data) {
    return (
      <div className="space-y-6">
        <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          {error || 'Esnaf bilgileri bulunamadı'}
        </div>
      </div>
    )
  }

  const { vendor, statistics } = data

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => router.push('/vendors')} 
            className="p-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{vendor.display_name}</h1>
            <p className="text-gray-600">ID: {vendor.id} • {vendor.company_title}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => router.push(`/vendors/${vendor.id}/edit`)}
            className="px-4 py-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50 flex items-center gap-2"
          >
            <Edit className="h-4 w-4" />
            Düzenle
          </button>
          <span className={`inline-flex items-center px-3 py-1 text-sm font-semibold rounded-full ${
            vendor.user_is_verified 
              ? 'bg-green-100 text-green-800' 
              : 'bg-yellow-100 text-yellow-800'
          }`}>
            {vendor.user_is_verified ? (
              <>
                <CheckCircle className="h-4 w-4 mr-1" />
                Doğrulanmış
              </>
            ) : (
              <>
                <Clock className="h-4 w-4 mr-1" />
                Beklemede
              </>
            )}
          </span>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Toplam Talep</p>
              <p className="text-2xl font-semibold text-gray-900">{statistics.total_requests}</p>
            </div>
            <FileText className="h-8 w-8 text-blue-600" />
          </div>
          <div className="mt-4 flex gap-4 text-xs">
            <span className="text-yellow-600">Beklemede: {statistics.pending_requests}</span>
            <span className="text-green-600">Tamamlanan: {statistics.completed_requests}</span>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Teklifler</p>
              <p className="text-2xl font-semibold text-gray-900">{statistics.quotes}</p>
            </div>
            <DollarSign className="h-8 w-8 text-green-600" />
          </div>
          <div className="mt-4 flex gap-4 text-xs">
            <span className="text-blue-600">Yanıtlanan: {statistics.responded_requests}</span>
            <span className="text-red-600">İptal: {statistics.cancelled_requests}</span>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Randevular</p>
              <p className="text-2xl font-semibold text-gray-900">{statistics.total_appointments}</p>
            </div>
            <Calendar className="h-8 w-8 text-purple-600" />
          </div>
          <div className="mt-4 flex gap-4 text-xs">
            <span className="text-yellow-600">Beklemede: {statistics.pending_appointments}</span>
            <span className="text-green-600">Onaylanan: {statistics.confirmed_appointments}</span>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Yorumlar</p>
              <p className="text-2xl font-semibold text-gray-900">{statistics.total_reviews}</p>
            </div>
            <Star className="h-8 w-8 text-yellow-600" />
          </div>
          <div className="mt-4 flex items-center gap-2">
            <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
            <span className="text-sm font-medium">{statistics.average_rating.toFixed(1)} / 5.0</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            {[
              { id: 'overview', label: 'Genel Bakış' },
              { id: 'requests', label: `Tüm Talepler (${data.service_requests.length})` },
              { id: 'quotes', label: `Teklifler (${data.quotes.length})` },
              { id: 'appointments', label: `Randevular (${data.appointments.length})` },
              { id: 'reviews', label: `Yorumlar (${data.reviews.length})` },
              { id: 'cancelled', label: `İptal Edilenler (${data.cancelled_requests.length})` },
            ].map((tab) => {
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as 'overview' | 'requests' | 'quotes' | 'appointments' | 'reviews' | 'cancelled')}
                  className={`px-6 py-4 text-sm font-medium border-b-2 ${
                    activeTab === tab.id
                      ? 'border-[color:var(--yellow)] text-[color:var(--black)]'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab.label}
                </button>
              )
            })}
          </nav>
        </div>

        <div className="p-6">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Vendor Info */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">Temel Bilgiler</h3>
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
                      <span className="text-gray-900 font-mono text-xs">{vendor.tax_no}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Slug</span>
                      <span className="text-gray-900 font-mono text-xs">{vendor.slug}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">İletişim Bilgileri</h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-500">E-posta:</span>
                      <span className="text-gray-900">{vendor.user_email}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-500">İş Telefonu:</span>
                      <span className="text-gray-900">{vendor.business_phone || '-'}</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <MapPin className="h-4 w-4 text-gray-400 mt-0.5" />
                      <div>
                        <span className="text-gray-500">Adres:</span>
                        <span className="text-gray-900 ml-2 block">{vendor.address}</span>
                        <span className="text-gray-900">{vendor.city}, {vendor.district}</span>
                        {vendor.subdistrict && (
                          <span className="text-gray-900">, {vendor.subdistrict}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Statistics Summary */}
              <div className="border-t border-gray-200 pt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">İstatistik Özeti</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-xs text-gray-500">Toplam Talep</p>
                    <p className="text-xl font-semibold text-gray-900">{statistics.total_requests}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-xs text-gray-500">İptal Edilen</p>
                    <p className="text-xl font-semibold text-red-600">{statistics.cancelled_requests}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-xs text-gray-500">Randevu İptal</p>
                    <p className="text-xl font-semibold text-red-600">{statistics.cancelled_appointments}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-xs text-gray-500">Ortalama Puan</p>
                    <p className="text-xl font-semibold text-gray-900">{statistics.average_rating.toFixed(1)}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Service Requests Tab */}
          {activeTab === 'requests' && (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Başlık</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Müşteri</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tür</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Durum</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fiyat</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tarih</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {data.service_requests.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                        Talep bulunamadı
                      </td>
                    </tr>
                  ) : (
                    data.service_requests.map((req) => (
                      <tr key={req.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">#{req.id}</td>
                        <td className="px-6 py-4 text-sm">
                          <div className="font-medium text-gray-900">{req.title}</div>
                          <div className="text-gray-500 text-xs mt-1 line-clamp-2">{req.description}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <div className="text-gray-900">{req.client_name}</div>
                          <div className="text-gray-500 text-xs">{req.client_email}</div>
                          {req.client_phone && (
                            <div className="text-gray-500 text-xs">{req.client_phone}</div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{req.request_type}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadge(req.status_code)}`}>
                            {req.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {req.last_offered_price ? formatCurrency(req.last_offered_price) : '-'}
                          {req.last_offered_days && (
                            <div className="text-xs text-gray-500">{req.last_offered_days} gün</div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(req.created_at)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* Quotes Tab */}
          {activeTab === 'quotes' && (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Başlık</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Müşteri</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hizmet</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Durum</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Teklif Fiyatı</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tarih</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {data.quotes.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                        Teklif bulunamadı
                      </td>
                    </tr>
                  ) : (
                    data.quotes.map((quote) => (
                      <tr key={quote.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">#{quote.id}</td>
                        <td className="px-6 py-4 text-sm">
                          <div className="font-medium text-gray-900">{quote.title}</div>
                          <div className="text-gray-500 text-xs mt-1 line-clamp-2">{quote.description}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <div className="text-gray-900">{quote.client_name}</div>
                          <div className="text-gray-500 text-xs">{quote.client_email}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{quote.service || '-'}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadge(quote.status_code)}`}>
                            {quote.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <div className="text-gray-900 font-medium">
                            {quote.last_offered_price ? formatCurrency(quote.last_offered_price) : '-'}
                          </div>
                          {quote.last_offered_days && (
                            <div className="text-xs text-gray-500">{quote.last_offered_days} gün içinde</div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(quote.created_at)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* Appointments Tab */}
          {activeTab === 'appointments' && (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Müşteri</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hizmet</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tarih & Saat</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Durum</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Oluşturulma</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {data.appointments.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                        Randevu bulunamadı
                      </td>
                    </tr>
                  ) : (
                    data.appointments.map((apt) => (
                      <tr key={apt.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">#{apt.id}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <div className="text-gray-900 font-medium">{apt.client_name}</div>
                          <div className="text-gray-500 text-xs">{apt.client_email}</div>
                          <div className="text-gray-500 text-xs">{apt.client_phone}</div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          <div className="line-clamp-2">{apt.service_description}</div>
                          {apt.notes && (
                            <div className="text-xs text-gray-500 mt-1 line-clamp-1">{apt.notes}</div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <div className="text-gray-900">
                            {new Date(apt.appointment_date).toLocaleDateString('tr-TR')}
                          </div>
                          <div className="text-gray-500 text-xs">{apt.appointment_time}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadge(apt.status_code)}`}>
                            {apt.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(apt.created_at)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* Reviews Tab */}
          {activeTab === 'reviews' && (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Müşteri</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hizmet</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Puan</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Yorum</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tarih</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {data.reviews.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                        Yorum bulunamadı
                      </td>
                    </tr>
                  ) : (
                    data.reviews.map((review) => (
                      <tr key={review.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">#{review.id}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <div className="text-gray-900 font-medium">{review.user_name}</div>
                          <div className="text-gray-500 text-xs">{review.user_email}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{review.service || '-'}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-1">
                            <Star className={`h-4 w-4 ${review.rating >= 1 ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'}`} />
                            <Star className={`h-4 w-4 ${review.rating >= 2 ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'}`} />
                            <Star className={`h-4 w-4 ${review.rating >= 3 ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'}`} />
                            <Star className={`h-4 w-4 ${review.rating >= 4 ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'}`} />
                            <Star className={`h-4 w-4 ${review.rating >= 5 ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'}`} />
                            <span className="ml-2 text-sm font-medium text-gray-900">{review.rating}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          <div className="line-clamp-3">{review.comment}</div>
                          {review.service_date && (
                            <div className="text-xs text-gray-500 mt-1">
                              Hizmet Tarihi: {new Date(review.service_date).toLocaleDateString('tr-TR')}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(review.created_at)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* Cancelled Requests Tab */}
          {activeTab === 'cancelled' && (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Başlık</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Müşteri</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tür</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">İptal Nedeni</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Oluşturulma</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">İptal Tarihi</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {data.cancelled_requests.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                        İptal edilen talep bulunamadı
                      </td>
                    </tr>
                  ) : (
                    data.cancelled_requests.map((req) => (
                      <tr key={req.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">#{req.id}</td>
                        <td className="px-6 py-4 text-sm">
                          <div className="font-medium text-gray-900">{req.title}</div>
                          <div className="text-gray-500 text-xs mt-1 line-clamp-2">{req.description}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <div className="text-gray-900">{req.client_name}</div>
                          <div className="text-gray-500 text-xs">{req.client_email}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{req.request_type}</td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          <div className="line-clamp-3">{req.cancellation_reason || 'Neden belirtilmemiş'}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(req.created_at)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600">
                          {formatDate(req.cancelled_at)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
