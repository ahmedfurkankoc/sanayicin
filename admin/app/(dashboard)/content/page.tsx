'use client'

import { useEffect, useMemo, useState, useRef } from 'react'
import {
  listServiceAreas,
  createServiceArea,
  updateServiceArea,
  deleteServiceArea,
  listCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  listCarBrands,
  createCarBrand,
  updateCarBrand,
  deleteCarBrand,
  type ServiceArea,
  type Category,
  type CarBrand,
} from '../../api/admin'
import { usePermissions } from '../../contexts/AuthContext'
import Pagination from '../../components/Pagination'
import Image from 'next/image'
import DeleteConfirmModal from '../../components/DeleteConfirmModal'
import { 
  Upload,
  X,
  ArrowUp,
  ArrowDown,
  ArrowUpDown
} from 'lucide-react'

export default function ContentManagementPage() {
  const { canRead, canWrite, canDelete } = usePermissions()
  const canReadContent = canRead('content')
  const canWriteContent = canWrite('content')
  const canDeleteContent = canDelete('content')

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [serviceAreas, setServiceAreas] = useState<ServiceArea[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [carBrands, setCarBrands] = useState<CarBrand[]>([])
  const [activeTab, setActiveTab] = useState<'services' | 'categories' | 'brands'>('services')

  // Pagination state per tab
  const [saTotal, setSaTotal] = useState(0)
  const [saSearch, setSaSearch] = useState('')
  const [catPage, setCatPage] = useState(1)
  const [catPageSize, setCatPageSize] = useState(10)
  const [catTotal, setCatTotal] = useState(0)
  const [catSearch, setCatSearch] = useState('')
  const [brandPage, setBrandPage] = useState(1)
  const [brandPageSize, setBrandPageSize] = useState(10)
  const [brandTotal, setBrandTotal] = useState(0)
  const [brandSearch, setBrandSearch] = useState('')

  const [newServiceArea, setNewServiceArea] = useState<{ name: string; description?: string }>({ name: '' })
  const [editingServiceArea, setEditingServiceArea] = useState<ServiceArea | null>(null)
  const [saModalOpen, setSaModalOpen] = useState(false)

  const [newCategory, setNewCategory] = useState<{ name: string; description?: string; service_area: number | '' }>({ name: '', service_area: '' })
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [catModalOpen, setCatModalOpen] = useState(false)

  const [newBrand, setNewBrand] = useState<{ name: string; description?: string; is_active: boolean; logo_file: File | null }>({ name: '', is_active: true, logo_file: null })
  const [editingBrand, setEditingBrand] = useState<CarBrand | null>(null)
  const [brandModalOpen, setBrandModalOpen] = useState(false)
  const [uploadingLogo, setUploadingLogo] = useState<number | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [sortBy, setSortBy] = useState<'name_asc' | 'name_desc' | 'created_desc' | 'created_asc'>('name_asc')
  const [serviceAreaFilter, setServiceAreaFilter] = useState<number | ''>('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')
  
  // Sorting state for each table
  const [saSortField, setSaSortField] = useState<'name' | 'description' | null>(null)
  const [saSortDirection, setSaSortDirection] = useState<'asc' | 'desc'>('asc')
  const [catSortField, setCatSortField] = useState<'name' | 'service_area' | 'description' | null>(null)
  const [catSortDirection, setCatSortDirection] = useState<'asc' | 'desc'>('asc')
  const [brandSortField, setBrandSortField] = useState<'name' | 'is_active' | 'description' | null>(null)
  const [brandSortDirection, setBrandSortDirection] = useState<'asc' | 'desc'>('asc')
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [deleteModalType, setDeleteModalType] = useState<'service_area' | 'category' | 'brand'>('service_area')
  const [itemToDelete, setItemToDelete] = useState<{ id: number; name: string } | null>(null)

  const serviceAreaMap = useMemo(() => {
    const m = new Map<number, ServiceArea>()
    for (const s of serviceAreas) m.set(s.id, s)
    return m
  }, [serviceAreas])

  // Sort handler functions
  const handleSaSort = (field: 'name' | 'description') => {
    if (saSortField === field) {
      setSaSortDirection(saSortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSaSortField(field)
      setSaSortDirection('asc')
    }
  }

  const handleCatSort = (field: 'name' | 'service_area' | 'description') => {
    if (catSortField === field) {
      setCatSortDirection(catSortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setCatSortField(field)
      setCatSortDirection('asc')
    }
  }

  const handleBrandSort = (field: 'name' | 'is_active' | 'description') => {
    if (brandSortField === field) {
      setBrandSortDirection(brandSortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setBrandSortField(field)
      setBrandSortDirection('asc')
    }
  }

  // Sort icon helper
  const getSortIcon = (currentField: string | null, sortField: string | null, sortDirection: 'asc' | 'desc') => {
    if (currentField !== sortField) {
      return <ArrowUpDown className="h-4 w-4 inline-block ml-1 text-gray-400" />
    }
    return sortDirection === 'asc' 
      ? <ArrowUp className="h-4 w-4 inline-block ml-1 text-gray-600" />
      : <ArrowDown className="h-4 w-4 inline-block ml-1 text-gray-600" />
  }

  const handleDelete = (type: 'service_area' | 'category' | 'brand', id: number, name: string) => {
    setItemToDelete({ id, name })
    setDeleteModalType(type)
    setDeleteModalOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!itemToDelete) return
    
    try {
      setLoading(true)
      if (deleteModalType === 'service_area') {
        await deleteServiceArea(itemToDelete.id)
        setServiceAreas((prev) => prev.filter((x) => x.id !== itemToDelete.id))
      } else if (deleteModalType === 'category') {
        await deleteCategory(itemToDelete.id)
        setCategories((prev) => prev.filter((x) => x.id !== itemToDelete.id))
      } else {
        await deleteCarBrand(itemToDelete.id)
        setCarBrands((prev) => prev.filter((x) => x.id !== itemToDelete.id))
      }
      setDeleteModalOpen(false)
      setItemToDelete(null)
    } catch (e: unknown) {
      setError((e as { response?: { data?: { detail?: string } } })?.response?.data?.detail || 'Silme işlemi başarısız')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteCancel = () => {
    setDeleteModalOpen(false)
    setItemToDelete(null)
  }

  // Sortable data for each table
  const sortedServiceAreas = useMemo(() => {
    if (!saSortField) return serviceAreas
    const sorted = [...serviceAreas].sort((a, b) => {
      let aVal: string | number = ''
      let bVal: string | number = ''
      
      if (saSortField === 'name') {
        aVal = a.name.toLowerCase()
        bVal = b.name.toLowerCase()
      } else if (saSortField === 'description') {
        aVal = (a.description || '').toLowerCase()
        bVal = (b.description || '').toLowerCase()
      }
      
      if (aVal < bVal) return saSortDirection === 'asc' ? -1 : 1
      if (aVal > bVal) return saSortDirection === 'asc' ? 1 : -1
      return 0
    })
    return sorted
  }, [serviceAreas, saSortField, saSortDirection])

  const sortedCategories = useMemo(() => {
    if (!catSortField) return categories
    const sorted = [...categories].sort((a, b) => {
      let aVal: string | number = ''
      let bVal: string | number = ''
      
      if (catSortField === 'name') {
        aVal = a.name.toLowerCase()
        bVal = b.name.toLowerCase()
      } else if (catSortField === 'service_area') {
        aVal = serviceAreaMap.get(a.service_area)?.name || ''
        bVal = serviceAreaMap.get(b.service_area)?.name || ''
      } else if (catSortField === 'description') {
        aVal = (a.description || '').toLowerCase()
        bVal = (b.description || '').toLowerCase()
      }
      
      if (aVal < bVal) return catSortDirection === 'asc' ? -1 : 1
      if (aVal > bVal) return catSortDirection === 'asc' ? 1 : -1
      return 0
    })
    return sorted
  }, [categories, catSortField, catSortDirection, serviceAreaMap])

  const sortedBrands = useMemo(() => {
    if (!brandSortField) return carBrands
    const sorted = [...carBrands].sort((a, b) => {
      let aVal: string | number | boolean = ''
      let bVal: string | number | boolean = ''
      
      if (brandSortField === 'name') {
        aVal = a.name.toLowerCase()
        bVal = b.name.toLowerCase()
      } else if (brandSortField === 'is_active') {
        aVal = a.is_active ? 1 : 0
        bVal = b.is_active ? 1 : 0
      } else if (brandSortField === 'description') {
        aVal = (a.description || '').toLowerCase()
        bVal = (b.description || '').toLowerCase()
      }
      
      if (aVal < bVal) return brandSortDirection === 'asc' ? -1 : 1
      if (aVal > bVal) return brandSortDirection === 'asc' ? 1 : -1
      return 0
    })
    return sorted
  }, [carBrands, brandSortField, brandSortDirection])

  // Visible slices for pagination after sorting
  const visibleCategories = useMemo(() => {
    const start = (catPage - 1) * catPageSize
    const end = start + catPageSize
    return sortedCategories.slice(start, end)
  }, [sortedCategories, catPage, catPageSize])

  const visibleBrands = useMemo(() => {
    const start = (brandPage - 1) * brandPageSize
    const end = start + brandPageSize
    return sortedBrands.slice(start, end)
  }, [sortedBrands, brandPage, brandPageSize])

  const handleLogoUpload = async (brandId: number, file: File) => {
    try {
      setUploadingLogo(brandId)
      const formData = new FormData()
      formData.append('logo', file)
      
      // API endpoint'ini çağır
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/admin'}/car-brands/${brandId}/upload_logo/`, {
        method: 'POST',
        body: formData,
        credentials: 'include', // HttpOnly cookie gönder
      })
      
      if (response.ok) {
        const result = await response.json()
        setCarBrands(prev => prev.map(brand => 
          brand.id === brandId ? { ...brand, logo: result.logo_url } : brand
        ))
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Logo yüklenemedi')
      }
    } catch (error) {
      console.error('Logo upload error:', error)
      setError('Logo yüklenemedi')
    } finally {
      setUploadingLogo(null)
    }
  }

  useEffect(() => {
    if (!canReadContent) return
    let cancelled = false
    const loadAll = async () => {
      try {
        setLoading(true)
        setError(null)
        // Fetch with large page_size to allow global sorting across full dataset
        const [sa, cats, brands] = await Promise.all([
          listServiceAreas({ page: 1, page_size: 1000, search: saSearch || undefined }),
          listCategories({ page: 1, page_size: 1000, search: catSearch || undefined, service_area: serviceAreaFilter || undefined }),
          listCarBrands({ page: 1, page_size: 1000, search: brandSearch || undefined, is_active: statusFilter === 'all' ? undefined : statusFilter === 'active' }),
        ])
        if (cancelled) return
        const sortFunc = (a: { name: string; created_at?: string }, b: { name: string; created_at?: string }) => {
          if (sortBy === 'name_asc') return a.name.localeCompare(b.name)
          if (sortBy === 'name_desc') return b.name.localeCompare(a.name)
          if (sortBy === 'created_desc') return (new Date(b.created_at || 0).getTime()) - (new Date(a.created_at || 0).getTime())
          return (new Date(a.created_at || 0).getTime()) - (new Date(b.created_at || 0).getTime())
        }
        setServiceAreas(sa.items.slice().sort(sortFunc))
        setSaTotal(sa.count)
        setCategories(cats.items.slice().sort(sortFunc))
        setCatTotal(cats.count)
        setCarBrands(brands.items.slice().sort(sortFunc))
        setBrandTotal(brands.count)
      } catch (e: unknown) {
        if (cancelled) return
        setError((e as { response?: { data?: { detail?: string } } })?.response?.data?.detail || 'İçerik verileri yüklenemedi')
      } finally {
        if (cancelled) return
        setLoading(false)
      }
    }
    loadAll()
    return () => { cancelled = true }
  }, [canReadContent, saSearch, catPage, catPageSize, catSearch, brandPage, brandPageSize, brandSearch, serviceAreaFilter, statusFilter, sortBy])

  if (!canReadContent) {
    return (
      <div className="space-y-2">
        <h1 className="text-2xl font-bold text-gray-900">İçerik</h1>
        <p className="text-gray-600">Bu sayfayı görüntüleme yetkiniz yok.</p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">İçerik Yönetimi</h1>
        <p className="text-gray-600">Araba markaları, hizmet alanları ve kategoriler.</p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-6" aria-label="Tabs">
          {[
            { key: 'services', label: 'Hizmet Alanları' },
            { key: 'categories', label: 'Kategoriler' },
            { key: 'brands', label: 'Araba Markaları' },
          ].map((t) => (
            <button
              key={t.key}
              className={`whitespace-nowrap py-3 px-1 border-b-2 text-sm font-medium ${
                activeTab === (t.key as 'services' | 'categories' | 'brands')
                  ? 'border-[color:var(--yellow)] text-gray-900'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
              onClick={() => setActiveTab(t.key as 'services' | 'categories' | 'brands')}
            >
              {t.label}
            </button>
          ))}
        </nav>
      </div>

      {error && (
        <div className="rounded border border-red-200 bg-red-50 text-red-700 px-3 py-2 text-sm">{error}</div>
      )}

      {/* Service Areas */}
      {activeTab === 'services' && (
      <section className="bg-white rounded-lg shadow p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Hizmet Alanları</h2>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
            <button
              onClick={() => setFiltersOpen(true)}
              className="px-3 py-2 rounded border border-gray-300 hover:bg-gray-50 text-sm w-full sm:w-auto"
            >Filtreler</button>
            <div className="w-full sm:w-64">
              <input
                type="text"
                placeholder="Ara..."
                className="w-full border border-gray-300 rounded px-3 py-2"
                value={saSearch}
                onChange={(e) => { setSaSearch(e.target.value) }}
              />
            </div>
            {canWriteContent && (
              <button
                onClick={() => setSaModalOpen(true)}
                className="bg-[color:var(--yellow)] text-[color:var(--black)] font-medium rounded px-4 py-2 w-full sm:w-auto"
              >Yeni</button>
            )}
          </div>
        </div>
        {/* Service Area Create Modal */}
        {saModalOpen && canWriteContent && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/40" onClick={() => setSaModalOpen(false)} />
            <div className="relative bg-white rounded-lg shadow-xl w-full max-w-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Yeni Hizmet Alanı</h3>
              <div className="grid grid-cols-1 gap-3">
                <input
                  type="text"
                  placeholder="Ad"
                  className="border border-gray-300 rounded px-3 py-2"
                  value={newServiceArea.name}
                  onChange={(e) => setNewServiceArea((p) => ({ ...p, name: e.target.value }))}
                />
                <input
                  type="text"
                  placeholder="Açıklama (opsiyonel)"
                  className="border border-gray-300 rounded px-3 py-2"
                  value={newServiceArea.description || ''}
                  onChange={(e) => setNewServiceArea((p) => ({ ...p, description: e.target.value }))}
                />
              </div>
              <div className="mt-6 flex items-center justify-end gap-3">
                <button className="px-4 py-2 rounded border border-gray-300" onClick={() => setSaModalOpen(false)}>İptal</button>
                <button
                  disabled={!newServiceArea.name.trim() || loading}
                  className="bg-[color:var(--yellow)] text-[color:var(--black)] font-medium rounded px-4 py-2 disabled:opacity-50"
                  onClick={async () => {
                    if (!newServiceArea.name.trim()) return
                    try {
                      setLoading(true)
                      const created = await createServiceArea({ name: newServiceArea.name.trim(), description: newServiceArea.description?.trim() })
                      setServiceAreas((prev) => [created, ...prev])
                      setSaTotal((t) => t + 1)
                      setNewServiceArea({ name: '' })
                      setSaModalOpen(false)
                    } catch (e: unknown) {
                      setError((e as { response?: { data?: { detail?: string } } })?.response?.data?.detail || 'Hizmet alanı eklenemedi')
                    } finally {
                      setLoading(false)
                    }
                  }}
                >Kaydet</button>
              </div>
            </div>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th 
                  className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none"
                  onClick={() => handleSaSort('name')}
                >
                  <div className="flex items-center">
                    Ad
                    {getSortIcon('name', saSortField, saSortDirection)}
                  </div>
                </th>
                <th 
                  className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none"
                  onClick={() => handleSaSort('description')}
                >
                  <div className="flex items-center">
                    Açıklama
                    {getSortIcon('description', saSortField, saSortDirection)}
                  </div>
                </th>
                <th className="px-4 py-2"></th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sortedServiceAreas.map((sa) => (
                <tr key={sa.id}>
                  <td className="px-4 py-2 text-sm text-gray-900">
                    {editingServiceArea?.id === sa.id ? (
                      <input
                        className="border border-gray-300 rounded px-2 py-1 w-full"
                        value={editingServiceArea.name}
                        onChange={(e) => setEditingServiceArea((p) => p ? { ...p, name: e.target.value } : p)}
                      />
                    ) : (
                      sa.name
                    )}
                  </td>
                  <td className="px-4 py-2 text-sm text-gray-700">
                    {editingServiceArea?.id === sa.id ? (
                      <input
                        className="border border-gray-300 rounded px-2 py-1 w-full"
                        value={editingServiceArea.description || ''}
                        onChange={(e) => setEditingServiceArea((p) => p ? { ...p, description: e.target.value } : p)}
                      />
                    ) : (
                      sa.description || '-'
                    )}
                  </td>
                  <td className="px-4 py-2 text-sm">
                    <div className="flex justify-end gap-2 flex-nowrap">
                      {editingServiceArea?.id === sa.id ? (
                        <>
                          <button
                            className="px-3 py-1 rounded border border-gray-300 hover:bg-gray-50 shrink-0"
                            onClick={async () => {
                            if (!editingServiceArea) return
                            try {
                              setLoading(true)
                              const updated = await updateServiceArea(sa.id, { name: editingServiceArea.name, description: editingServiceArea.description })
                              setServiceAreas((prev) => prev.map((x) => (x.id === sa.id ? updated : x)))
                              setEditingServiceArea(null)
                            } catch (e: unknown) {
                              setError((e as { response?: { data?: { detail?: string } } })?.response?.data?.detail || 'Hizmet alanı güncellenemedi')
                            } finally {
                              setLoading(false)
                            }
                          }}
                          >Kaydet</button>
                          <button className="px-3 py-1 rounded border border-gray-300 hover:bg-gray-50 shrink-0" onClick={() => setEditingServiceArea(null)}>İptal</button>
                        </>
                      ) : (
                        <>
                          {canWriteContent && (
                            <button className="px-3 py-1 rounded border border-gray-300 hover:bg-gray-50 text-[color:var(--black)] shrink-0" onClick={() => setEditingServiceArea(sa)}>Düzenle</button>
                          )}
                          {canDeleteContent && (
                            <button
                              className="px-3 py-1 rounded btn-danger shrink-0"
                              onClick={() => handleDelete('service_area', sa.id, sa.name)}
                            >Sil</button>
                          )}
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {sortedServiceAreas.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-4 py-6 text-center text-sm text-gray-500">Kayıt yok</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {/* Service area count info */}
        <div className="mt-4 text-sm text-gray-600">
          Toplam {saTotal} hizmet alanı gösteriliyor
        </div>
      </section>
      )}

      {/* Categories */}
      {activeTab === 'categories' && (
      <section className="bg-white rounded-lg shadow p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Kategoriler</h2>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
            <button
              onClick={() => setFiltersOpen(true)}
              className="px-3 py-2 rounded border border-gray-300 hover:bg-gray-50 text-sm w-full sm:w-auto"
            >Filtreler</button>
            <div className="w-full sm:w-64">
              <input
                type="text"
                placeholder="Ara..."
                className="w-full border border-gray-300 rounded px-3 py-2"
                value={catSearch}
                onChange={(e) => { setCatSearch(e.target.value); setCatPage(1) }}
              />
            </div>
            {canWriteContent && (
              <button
                onClick={() => setCatModalOpen(true)}
                className="bg-[color:var(--yellow)] text-[color:var(--black)] font-medium rounded px-4 py-2 w-full sm:w-auto"
              >Yeni</button>
            )}
          </div>
        </div>
        {/* Category Create Modal */}
        {catModalOpen && canWriteContent && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/40" onClick={() => setCatModalOpen(false)} />
            <div className="relative bg-white rounded-lg shadow-xl w-full max-w-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Yeni Kategori</h3>
              <div className="grid grid-cols-1 gap-3">
                <input
                  type="text"
                  placeholder="Ad"
                  className="border border-gray-300 rounded px-3 py-2"
                  value={newCategory.name}
                  onChange={(e) => setNewCategory((p) => ({ ...p, name: e.target.value }))}
                />
                <select
                  className="border border-gray-300 rounded px-3 py-2"
                  value={newCategory.service_area}
                  onChange={(e) => setNewCategory((p) => ({ ...p, service_area: e.target.value ? Number(e.target.value) : '' }))}
                >
                  <option value="">Hizmet Alanı</option>
                  {serviceAreas.map((sa) => (
                    <option key={sa.id} value={sa.id}>{sa.name}</option>
                  ))}
                </select>
                <input
                  type="text"
                  placeholder="Açıklama (opsiyonel)"
                  className="border border-gray-300 rounded px-3 py-2"
                  value={newCategory.description || ''}
                  onChange={(e) => setNewCategory((p) => ({ ...p, description: e.target.value }))}
                />
              </div>
              <div className="mt-6 flex items-center justify-end gap-3">
                <button className="px-4 py-2 rounded border border-gray-300" onClick={() => setCatModalOpen(false)}>İptal</button>
                <button
                  disabled={!newCategory.name.trim() || !newCategory.service_area || loading}
                  className="bg-[color:var(--yellow)] text-[color:var(--black)] font-medium rounded px-4 py-2 disabled:opacity-50"
                  onClick={async () => {
                    if (!newCategory.name.trim() || !newCategory.service_area) return
                    try {
                      setLoading(true)
                      const created = await createCategory({
                        name: newCategory.name.trim(),
                        description: newCategory.description?.trim(),
                        service_area: Number(newCategory.service_area),
                      })
                      setCategories((prev) => [created, ...prev])
                      setCatTotal((t) => t + 1)
                      setNewCategory({ name: '', service_area: '' })
                      setCatModalOpen(false)
                    } catch (e: unknown) {
                      setError((e as { response?: { data?: { detail?: string } } })?.response?.data?.detail || 'Kategori eklenemedi')
                    } finally {
                      setLoading(false)
                    }
                  }}
                >Kaydet</button>
              </div>
            </div>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th 
                  className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none"
                  onClick={() => handleCatSort('name')}
                >
                  <div className="flex items-center">
                    Ad
                    {getSortIcon('name', catSortField, catSortDirection)}
                  </div>
                </th>
                <th 
                  className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none"
                  onClick={() => handleCatSort('service_area')}
                >
                  <div className="flex items-center">
                    Hizmet Alanı
                    {getSortIcon('service_area', catSortField, catSortDirection)}
                  </div>
                </th>
                <th 
                  className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none"
                  onClick={() => handleCatSort('description')}
                >
                  <div className="flex items-center">
                    Açıklama
                    {getSortIcon('description', catSortField, catSortDirection)}
                  </div>
                </th>
                <th className="px-4 py-2"></th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {visibleCategories.map((cat) => (
                <tr key={cat.id}>
                  <td className="px-4 py-2 text-sm text-gray-900">
                    {editingCategory?.id === cat.id ? (
                      <input className="border border-gray-300 rounded px-2 py-1 w-full" value={editingCategory.name} onChange={(e) => setEditingCategory((p) => p ? { ...p, name: e.target.value } : p)} />
                    ) : (
                      cat.name
                    )}
                  </td>
                  <td className="px-4 py-2 text-sm text-gray-700">
                    {editingCategory?.id === cat.id ? (
                      <select
                        className="border border-gray-300 rounded px-2 py-1 w-full"
                        value={editingCategory.service_area}
                        onChange={(e) => setEditingCategory((p) => p ? { ...p, service_area: Number(e.target.value) } : p)}
                      >
                        {serviceAreas.map((sa) => (
                          <option key={sa.id} value={sa.id}>{sa.name}</option>
                        ))}
                      </select>
                    ) : (
                      serviceAreaMap.get(cat.service_area)?.name || '-'
                    )}
                  </td>
                  <td className="px-4 py-2 text-sm text-gray-700">
                    {editingCategory?.id === cat.id ? (
                      <input className="border border-gray-300 rounded px-2 py-1 w-full" value={editingCategory.description || ''} onChange={(e) => setEditingCategory((p) => p ? { ...p, description: e.target.value } : p)} />
                    ) : (
                      cat.description || '-'
                    )}
                  </td>
                  <td className="px-4 py-2 text-sm">
                    <div className="flex justify-end gap-2 flex-nowrap">
                    {editingCategory?.id === cat.id ? (
                      <>
                        <button
                          className="px-3 py-1 rounded border border-gray-300 hover:bg-gray-50 shrink-0"
                          onClick={async () => {
                            if (!editingCategory) return
                            try {
                              setLoading(true)
                              const updated = await updateCategory(cat.id, {
                                name: editingCategory.name,
                                description: editingCategory.description,
                                service_area: editingCategory.service_area,
                              })
                              setCategories((prev) => prev.map((x) => (x.id === cat.id ? updated : x)))
                              setEditingCategory(null)
                            } catch (e: unknown) {
                              setError((e as { response?: { data?: { detail?: string } } })?.response?.data?.detail || 'Kategori güncellenemedi')
                            } finally {
                              setLoading(false)
                            }
                          }}
                        >Kaydet</button>
                        <button className="px-3 py-1 rounded border border-gray-300 hover:bg-gray-50 shrink-0" onClick={() => setEditingCategory(null)}>İptal</button>
                      </>
                    ) : (
                      <>
                        {canWriteContent && (
                          <button className="px-3 py-1 rounded border border-gray-300 hover:bg-gray-50 text-[color:var(--black)] shrink-0" onClick={() => setEditingCategory(cat)}>Düzenle</button>
                        )}
                        {canDeleteContent && (
                          <button
                            className="px-3 py-1 rounded btn-danger shrink-0"
                            onClick={() => handleDelete('category', cat.id, cat.name)}
                          >Sil</button>
                        )}
                      </>
                    )}
                    </div>
                  </td>
                </tr>
              ))}
              {sortedCategories.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-sm text-gray-500">Kayıt yok</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {/* Pagination */}
        <div className="mt-4">
          <Pagination
            currentPage={catPage}
            totalPages={Math.max(1, Math.ceil(catTotal / catPageSize))}
            totalCount={catTotal}
            pageSize={catPageSize}
            onPageChange={setCatPage}
            onPageSizeChange={(size) => { setCatPageSize(size); setCatPage(1) }}
            itemName="kategori"
          />
        </div>
      </section>
      )}

      {/* Car Brands */}
      {activeTab === 'brands' && (
      <section className="bg-white rounded-lg shadow p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Araba Markaları</h2>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
            <button
              onClick={() => setFiltersOpen(true)}
              className="px-3 py-2 rounded border border-gray-300 hover:bg-gray-50 text-sm w-full sm:w-auto"
            >Filtreler</button>
            <div className="w-full sm:w-64">
              <input
                type="text"
                placeholder="Ara..."
                className="w-full border border-gray-300 rounded px-3 py-2"
                value={brandSearch}
                onChange={(e) => { setBrandSearch(e.target.value); setBrandPage(1) }}
              />
            </div>
            {canWriteContent && (
              <button
                onClick={() => setBrandModalOpen(true)}
                className="bg-[color:var(--yellow)] text-[color:var(--black)] font-medium rounded px-4 py-2 w-full sm:w-auto"
              >Yeni</button>
            )}
          </div>
        </div>
        {/* Car Brand Create Modal */}
        {brandModalOpen && canWriteContent && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/40" onClick={() => setBrandModalOpen(false)} />
            <div className="relative bg-white rounded-lg shadow-xl w-full max-w-xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Yeni Araba Markası</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <input
                  type="text"
                  placeholder="Ad"
                  className="border border-gray-300 rounded px-3 py-2"
                  value={newBrand.name}
                  onChange={(e) => setNewBrand((p) => ({ ...p, name: e.target.value }))}
                />
                <label className="flex items-center gap-2 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    className="h-4 w-4"
                    checked={newBrand.is_active}
                    onChange={(e) => setNewBrand((p) => ({ ...p, is_active: e.target.checked }))}
                  />
                  Aktif
                </label>
                <input
                  type="text"
                  placeholder="Açıklama (opsiyonel)"
                  className="border border-gray-300 rounded px-3 py-2 md:col-span-2"
                  value={newBrand.description || ''}
                  onChange={(e) => setNewBrand((p) => ({ ...p, description: e.target.value }))}
                />
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Resim Yükle</label>
                  
                  {/* Logo Preview */}
                  {newBrand.logo_file && (
                    <div className="mb-3">
                      <div className="w-[150px] h-[150px] border border-gray-200 rounded-lg bg-gray-50 flex items-center justify-center overflow-hidden">
                        <Image 
                          src={URL.createObjectURL(newBrand.logo_file)} 
                          alt="Logo Preview" 
                          width={150}
                          height={150}
                          className="w-full h-full object-contain"
                        />
                      </div>
                    </div>
                  )}
                  
                  <div className="flex items-center gap-3">
                    <input
                      id="brand-logo-file"
                      type="file"
                      accept="image/*"
                      className="sr-only"
                      onChange={(e) => setNewBrand((p) => ({ ...p, logo_file: e.target.files?.[0] || null }))}
                    />
                    <label
                      htmlFor="brand-logo-file"
                      className="cursor-pointer inline-flex items-center px-3 py-2 rounded border border-gray-300 text-sm bg-white hover:bg-gray-50 text-[color:var(--black)]"
                    >
                      Resim Seç
                    </label>
                    <span className="text-sm text-gray-600 truncate">
                      {newBrand.logo_file ? newBrand.logo_file.name : 'Seçili dosya yok'}
                    </span>
                    {newBrand.logo_file && (
                      <button
                        type="button"
                        onClick={() => setNewBrand((p) => ({ ...p, logo_file: null }))}
                        className="text-red-600 hover:text-red-800"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Araç logosu boyutu: 150x150 piksel olmalıdır.</p>
                </div>
              </div>
              <div className="mt-6 flex items-center justify-end gap-3">
                <button className="px-4 py-2 rounded border border-gray-300" onClick={() => setBrandModalOpen(false)}>İptal</button>
                <button
                  disabled={!newBrand.name.trim() || loading}
                  className="bg-[color:var(--yellow)] text-[color:var(--black)] font-medium rounded px-4 py-2 disabled:opacity-50"
                  onClick={async () => {
                    if (!newBrand.name.trim()) return
                    try {
                      setLoading(true)
                      const created = await createCarBrand({
                        name: newBrand.name.trim(),
                        description: newBrand.description?.trim(),
                        is_active: newBrand.is_active,
                        logo_file: newBrand.logo_file || null,
                      })
                      setCarBrands((prev) => [created, ...prev])
                      setBrandTotal((t) => t + 1)
                      setNewBrand({ name: '', is_active: true, logo_file: null })
                      setBrandModalOpen(false)
                    } catch (e: unknown) {
                      setError((e as { response?: { data?: { detail?: string } } })?.response?.data?.detail || 'Araba markası eklenemedi')
                    } finally {
                      setLoading(false)
                    }
                  }}
                >Kaydet</button>
              </div>
            </div>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Logo</th>
                <th 
                  className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none"
                  onClick={() => handleBrandSort('name')}
                >
                  <div className="flex items-center">
                    Ad
                    {getSortIcon('name', brandSortField, brandSortDirection)}
                  </div>
                </th>
                <th 
                  className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none"
                  onClick={() => handleBrandSort('is_active')}
                >
                  <div className="flex items-center">
                    Durum
                    {getSortIcon('is_active', brandSortField, brandSortDirection)}
                  </div>
                </th>
                <th 
                  className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none"
                  onClick={() => handleBrandSort('description')}
                >
                  <div className="flex items-center">
                    Açıklama
                    {getSortIcon('description', brandSortField, brandSortDirection)}
                  </div>
                </th>
                <th className="px-4 py-2"></th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {visibleBrands.map((brand) => (
                <tr key={brand.id}>
                  <td className="px-4 py-2 text-sm">
                    <div className="relative w-[80px] h-[80px] flex items-center justify-center border border-gray-200 rounded-lg bg-gray-50">
                      {'logo' in brand && brand.logo ? (
                        editingBrand?.id === brand.id ? (
                          <Image 
                            src={brand.logo as string} 
                            alt={brand.name} 
                            width={80}
                            height={80}
                            className="w-full h-full object-contain rounded-lg" 
                          />
                        ) : (
                          <button
                            type="button"
                            onClick={() => setLightboxUrl(String(brand.logo))}
                            className="w-full h-full"
                            aria-label="Logo önizlemeyi büyüt"
                          >
                            <Image 
                              src={brand.logo as string} 
                              alt={brand.name} 
                              width={80}
                              height={80}
                              className="w-full h-full object-contain rounded-lg cursor-zoom-in" 
                            />
                          </button>
                        )
                      ) : (
                        <span className="text-gray-400 text-sm">Logo Yok</span>
                      )}
                      
                      {/* Upload overlay */}
                      {editingBrand?.id === brand.id && (
                        <div className="absolute inset-0 bg-black bg-opacity-50 rounded-lg flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity cursor-pointer"
                             onClick={() => fileInputRef.current?.click()}>
                          <div className="text-white text-center">
                            <Upload className="h-8 w-8 mx-auto mb-2" />
                            <span className="text-sm">Logo Yükle</span>
                          </div>
                        </div>
                      )}
                      
                      {/* Loading indicator */}
                      {uploadingLogo === brand.id && (
                        <div className="absolute inset-0 bg-white bg-opacity-75 rounded-lg flex items-center justify-center">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        </div>
                      )}
                    </div>
                    
                    {/* Hidden file input */}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file && editingBrand?.id === brand.id) {
                          handleLogoUpload(brand.id, file)
                        }
                      }}
                    />
                  </td>
                  <td className="px-4 py-2 text-sm text-gray-900">
                    {editingBrand?.id === brand.id ? (
                      <input className="border border-gray-300 rounded px-2 py-1 w-full" value={editingBrand.name} onChange={(e) => setEditingBrand((p) => p ? { ...p, name: e.target.value } : p)} />
                    ) : (
                      brand.name
                    )}
                  </td>
                  <td className="px-4 py-2 text-sm">
                    {editingBrand?.id === brand.id ? (
                      <label className="flex items-center gap-2">
                        <input type="checkbox" className="h-4 w-4" checked={Boolean((editingBrand as { is_active?: boolean }).is_active)} onChange={(e) => setEditingBrand((p) => p ? { ...p, is_active: e.target.checked } as CarBrand : p)} />
                        <span className="text-gray-700 text-sm">Aktif</span>
                      </label>
                    ) : (
                      <span className={`text-xs px-2 py-1 rounded ${brand.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>{brand.is_active ? 'Aktif' : 'Pasif'}</span>
                    )}
                  </td>
                  <td className="px-4 py-2 text-sm text-gray-700">
                    {editingBrand?.id === brand.id ? (
                      <input className="border border-gray-300 rounded px-2 py-1 w-full" value={editingBrand.description || ''} onChange={(e) => setEditingBrand((p) => p ? { ...p, description: e.target.value } : p)} />
                    ) : (
                      brand.description || '-'
                    )}
                  </td>
                  <td className="px-4 py-2 text-sm">
                    <div className="flex justify-end gap-2 flex-nowrap">
                    {editingBrand?.id === brand.id ? (
                      <>
                        <button
                          className="px-3 py-1 rounded border border-gray-300 hover:bg-gray-50 shrink-0"
                          onClick={async () => {
                            if (!editingBrand) return
                            try {
                              setLoading(true)
                              const updated = await updateCarBrand(brand.id, {
                                name: editingBrand.name,
                                description: editingBrand.description,
                                is_active: (editingBrand as { is_active?: boolean }).is_active,
                              })
                              setCarBrands((prev) => prev.map((x) => (x.id === brand.id ? updated : x)))
                              setEditingBrand(null)
                            } catch (e: unknown) {
                              setError((e as { response?: { data?: { detail?: string } } })?.response?.data?.detail || 'Marka güncellenemedi')
                            } finally {
                              setLoading(false)
                            }
                          }}
                        >Kaydet</button>
                        <button className="px-3 py-1 rounded border border-gray-300 hover:bg-gray-50 shrink-0" onClick={() => setEditingBrand(null)}>İptal</button>
                      </>
                    ) : (
                      <>
                        {canWriteContent && (
                          <button className="px-3 py-1 rounded border border-gray-300 hover:bg-gray-50 text-[color:var(--black)] shrink-0" onClick={() => setEditingBrand(brand)}>Düzenle</button>
                        )}
                        {canDeleteContent && (
                          <button
                            className="px-3 py-1 rounded btn-danger shrink-0"
                            onClick={() => handleDelete('brand', brand.id, brand.name)}
                          >Sil</button>
                        )}
                      </>
                    )}
                    </div>
                  </td>
                </tr>
              ))}
              {sortedBrands.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-sm text-gray-500">Kayıt yok</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {/* Pagination */}
        <div className="mt-4">
          <Pagination
            currentPage={brandPage}
            totalPages={Math.max(1, Math.ceil(brandTotal / brandPageSize))}
            totalCount={brandTotal}
            pageSize={brandPageSize}
            onPageChange={setBrandPage}
            onPageSizeChange={(size) => { setBrandPageSize(size); setBrandPage(1) }}
            itemName="marka"
          />
        </div>
      </section>
      )}

      {filtersOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setFiltersOpen(false)} />
          <div className="relative bg-white rounded-lg shadow-xl w-full max-w-xl p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Filtreler ve Sıralama</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Sıralama</label>
                <select className="w-full border rounded px-3 py-2" value={sortBy} onChange={(e) => setSortBy(e.target.value as typeof sortBy)}>
                  <option value="name_asc">Ad (A→Z)</option>
                  <option value="name_desc">Ad (Z→A)</option>
                  <option value="created_desc">Oluşturulma (Yeni→Eski)</option>
                  <option value="created_asc">Oluşturulma (Eski→Yeni)</option>
                </select>
              </div>
              {activeTab === 'categories' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Hizmet Alanı (Kategoriler)</label>
                  <select className="w-full border rounded px-3 py-2" value={serviceAreaFilter} onChange={(e) => setServiceAreaFilter(e.target.value ? Number(e.target.value) : '')}>
                    <option value="">Hepsi</option>
                    {serviceAreas.map((sa) => (
                      <option key={sa.id} value={sa.id}>{sa.name}</option>
                    ))}
                  </select>
                </div>
              )}
              {activeTab === 'brands' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Durum (Markalar)</label>
                  <select className="w-full border rounded px-3 py-2" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}>
                    <option value="all">Tümü</option>
                    <option value="active">Aktif</option>
                    <option value="inactive">Pasif</option>
                  </select>
                </div>
              )}
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button className="px-4 py-2 rounded border border-gray-300" onClick={() => setFiltersOpen(false)}>Kapat</button>
              <button
                className="px-4 py-2 rounded text-[color:var(--black)]"
                style={{ backgroundColor: 'var(--yellow)' }}
                onClick={() => { setCatPage(1); setBrandPage(1); setFiltersOpen(false) }}
              >Uygula</button>
            </div>
          </div>
        </div>
      )}

      {/* Lightbox Modal for brand logo */}
      {lightboxUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60" onClick={() => setLightboxUrl(null)} />
          <div className="relative bg-white rounded-lg shadow-2xl p-2 max-w-[90vw] max-h-[90vh]">
            <button
              className="absolute -top-3 -right-3 bg-white border border-gray-300 rounded-full p-1 shadow"
              onClick={() => setLightboxUrl(null)}
              aria-label="Kapat"
            >
              <X className="h-4 w-4" />
            </button>
            <div className="w-[85vw] max-w-[800px] h-[85vh] max-h-[80vh] flex items-center justify-center">
              <Image
                src={lightboxUrl}
                alt="Logo"
                width={800}
                height={800}
                className="w-auto h-auto max-w-full max-h-full object-contain"
              />
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm Modal */}
      <DeleteConfirmModal
        isOpen={deleteModalOpen}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        title={deleteModalType === 'service_area' ? 'Hizmet Alanını Sil' : deleteModalType === 'category' ? 'Kategoriyi Sil' : 'Markayı Sil'}
        itemName={deleteModalType === 'service_area' ? 'hizmet alanı' : deleteModalType === 'category' ? 'kategori' : 'marka'}
        itemDetails={itemToDelete ? {
          id: itemToDelete.id,
          name: itemToDelete.name
        } : undefined}
        description={deleteModalType === 'service_area' 
          ? "Bu hizmet alanını kalıcı olarak silmek istediğinizden emin misiniz?" 
          : deleteModalType === 'category'
          ? "Bu kategoriyi kalıcı olarak silmek istediğinizden emin misiniz?"
          : "Bu markayı kalıcı olarak silmek istediğinizden emin misiniz?"}
        warningMessage={deleteModalType === 'service_area'
          ? "Bu hizmet alanı kalıcı olarak silinecek. İlişkili kategoriler etkilenebilir."
          : deleteModalType === 'category'
          ? "Bu kategori kalıcı olarak silinecek. İlişkili içerik etkilenebilir."
          : "Bu marka kalıcı olarak silinecek. İlişkili veriler kaybolacaktır."}
      />
    </div>
  )
}


