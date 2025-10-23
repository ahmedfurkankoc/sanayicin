'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  Eye,
  UserPlus,
  CheckCircle,
  XCircle,
  Clock
} from 'lucide-react'
import { 
  listVendors, 
  verifyVendor, 
  unverifyVendor, 
  deleteVendor,
  type VendorProfile 
} from '../../api/vendors'
import { usePermissions } from '../../contexts/AuthContext'
import Pagination from '../../components/Pagination'

export default function VendorsPage() {
  const router = useRouter()
  const { canRead, canWrite } = usePermissions()
  const canReadVendors = canRead('vendors')
  const canWriteVendors = canWrite('vendors')

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [vendors, setVendors] = useState<VendorProfile[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [debouncedSearch, setDebouncedSearch] = useState('')

  // Debounce searchTerm to avoid spamming server
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchTerm.trim()), 400)
    return () => clearTimeout(t)
  }, [searchTerm])

  useEffect(() => {
    if (!canReadVendors) return
    let cancelled = false
    const loadVendors = async () => {
      try {
        setLoading(true)
        setError(null)
        const res = await listVendors({
          page,
          page_size: pageSize,
          search: debouncedSearch || undefined,
          is_verified: filterStatus === 'all' ? undefined : filterStatus === 'verified'
        })
        if (cancelled) return
        setVendors(res.items)
        setTotalCount(res.count)
      } catch (e: unknown) {
        if (cancelled) return
        setError((e as { response?: { data?: { detail?: string } } })?.response?.data?.detail || 'Esnaflar yüklenemedi')
      } finally {
        if (cancelled) return
        setLoading(false)
      }
    }
    loadVendors()
    return () => { cancelled = true }
  }, [canReadVendors, page, pageSize, debouncedSearch, filterStatus])

  const handleVerify = async (vendorId: number) => {
    if (!canWriteVendors) return
    try {
      await verifyVendor(vendorId)
      setVendors(prev => prev.map(v => v.id === vendorId ? { ...v, user_is_verified: true } : v))
    } catch (e) {
      console.error('Doğrulama hatası:', e)
    }
  }

  const handleUnverify = async (vendorId: number) => {
    if (!canWriteVendors) return
    try {
      await unverifyVendor(vendorId)
      setVendors(prev => prev.map(v => v.id === vendorId ? { ...v, user_is_verified: false } : v))
    } catch (e) {
      console.error('Doğrulama kaldırma hatası:', e)
    }
  }

  const handleDelete = async (vendorId: number) => {
    if (!canWriteVendors) return
    if (!confirm('Bu esnafı silmek istediğinize emin misiniz?')) return
    try {
      await deleteVendor(vendorId)
      setVendors(prev => prev.filter(v => v.id !== vendorId))
      setTotalCount(prev => prev - 1)
    } catch (e) {
      console.error('Silme hatası:', e)
    }
  }

  const getStatusBadge = (isVerified: boolean) => {
    return isVerified 
      ? 'bg-green-100 text-green-800' 
      : 'bg-yellow-100 text-yellow-800'
  }

  const getStatusIcon = (isVerified: boolean) => {
    return isVerified ? <CheckCircle className="h-4 w-4" /> : <Clock className="h-4 w-4" />
  }

  const getStatusText = (isVerified: boolean) => {
    return isVerified ? 'Doğrulanmış' : 'Beklemede'
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

  // Calculate stats
  const verifiedCount = vendors.filter(v => v.user_is_verified).length
  const pendingCount = vendors.filter(v => !v.user_is_verified).length

  if (!canReadVendors) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Esnaflar</h1>
        <p className="text-gray-600">Bu sayfayı görüntüleme yetkiniz yok.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Esnaflar</h1>
          <p className="text-gray-600">Tüm esnafları yönetin ve onaylayın</p>
        </div>
        <button 
          onClick={() => router.push('/vendors/new')}
          className="bg-[color:var(--yellow)] text-[color:var(--black)] px-4 py-2 rounded-lg hover:brightness-95 transition-colors flex items-center"
        >
          <UserPlus className="h-4 w-4 mr-2" />
          Yeni Esnaf
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <CheckCircle className="h-8 w-8 text-green-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Doğrulanmış</p>
              <p className="text-2xl font-semibold text-gray-900">{verifiedCount}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <Clock className="h-8 w-8 text-yellow-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Beklemede</p>
              <p className="text-2xl font-semibold text-gray-900">{pendingCount}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <UserPlus className="h-8 w-8 text-[color:var(--yellow)]" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Toplam</p>
              <p className="text-2xl font-semibold text-gray-900">{totalCount}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <Filter className="h-8 w-8 text-blue-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Bu Sayfada</p>
              <p className="text-2xl font-semibold text-gray-900">{vendors.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Esnaf ara..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[color:var(--yellow)] focus:border-transparent"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[color:var(--yellow)] focus:border-transparent"
            >
              <option value="all">Tüm Durumlar</option>
              <option value="verified">Doğrulanmış</option>
              <option value="pending">Beklemede</option>
            </select>
            <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center">
              <Filter className="h-4 w-4 mr-2" />
              Filtrele
            </button>
          </div>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* Vendors table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Esnaf
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  İletişim
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  İş Türü
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Durum
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Kayıt Tarihi
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  İşlemler
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                    Yükleniyor...
                  </td>
                </tr>
              ) : vendors.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                    Esnaf bulunamadı
                  </td>
                </tr>
              ) : (
                vendors.map((vendor) => (
                  <tr key={vendor.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                          <span className="text-sm font-medium text-gray-700">
                            {vendor.display_name.split(' ').map(n => n[0]).join('')}
                          </span>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{vendor.display_name}</div>
                          <div className="text-sm text-gray-500">{vendor.company_title}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{vendor.user_email}</div>
                      <div className="text-sm text-gray-500">{vendor.business_phone}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{getBusinessTypeText(vendor.business_type)}</div>
                      <div className="text-sm text-gray-500">{vendor.city}, {vendor.district}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadge(vendor.user_is_verified)}`}>
                        {getStatusIcon(vendor.user_is_verified)}
                        <span className="ml-1">{getStatusText(vendor.user_is_verified)}</span>
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(vendor.created_at).toLocaleDateString('tr-TR')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        <button 
                          className="text-[color:var(--black)] hover:text-black"
                          title="Görüntüle"
                          onClick={() => router.push(`/vendors/${vendor.id}`)}
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button 
                          className="text-gray-600 hover:text-gray-900"
                          title="Düzenle"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        {canWriteVendors && (
                          <>
                            {!vendor.user_is_verified && (
                              <button 
                                className="text-green-600 hover:text-green-900"
                                title="Doğrula"
                                onClick={() => handleVerify(vendor.id)}
                              >
                                <CheckCircle className="h-4 w-4" />
                              </button>
                            )}
                            {vendor.user_is_verified && (
                              <button 
                                className="text-yellow-600 hover:text-yellow-900"
                                title="Doğrulamayı Kaldır"
                                onClick={() => handleUnverify(vendor.id)}
                              >
                                <XCircle className="h-4 w-4" />
                              </button>
                            )}
                            <button 
                              className="text-red-600 hover:text-red-900"
                              title="Sil"
                              onClick={() => handleDelete(vendor.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      <Pagination
        currentPage={page}
        totalPages={Math.max(1, Math.ceil(totalCount / pageSize))}
        totalCount={totalCount}
        pageSize={pageSize}
        onPageChange={setPage}
        onPageSizeChange={(size) => { setPageSize(size); setPage(1) }}
        itemName="esnaf"
      />
    </div>
  )
}
