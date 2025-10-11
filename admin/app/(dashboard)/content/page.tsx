'use client'

import { useEffect, useMemo, useState } from 'react'
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
  const [saPage, setSaPage] = useState(1)
  const [saPageSize, setSaPageSize] = useState(10)
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

  const serviceAreaMap = useMemo(() => {
    const m = new Map<number, ServiceArea>()
    for (const s of serviceAreas) m.set(s.id, s)
    return m
  }, [serviceAreas])

  useEffect(() => {
    if (!canReadContent) return
    let cancelled = false
    const loadAll = async () => {
      try {
        setLoading(true)
        setError(null)
        const [sa, cats, brands] = await Promise.all([
          listServiceAreas({ page: saPage, page_size: saPageSize, search: saSearch || undefined }),
          listCategories({ page: catPage, page_size: catPageSize, search: catSearch || undefined }),
          listCarBrands({ page: brandPage, page_size: brandPageSize, search: brandSearch || undefined }),
        ])
        if (cancelled) return
        setServiceAreas(sa.items)
        setSaTotal(sa.count)
        setCategories(cats.items)
        setCatTotal(cats.count)
        setCarBrands(brands.items)
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
  }, [canReadContent, saPage, saPageSize, saSearch, catPage, catPageSize, catSearch, brandPage, brandPageSize, brandSearch])

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
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Hizmet Alanları</h2>
          <div className="flex items-center gap-3">
            <div className="w-64">
              <input
                type="text"
                placeholder="Ara..."
                className="w-full border border-gray-300 rounded px-3 py-2"
                value={saSearch}
                onChange={(e) => { setSaSearch(e.target.value); setSaPage(1) }}
              />
            </div>
            {canWriteContent && (
              <button
                onClick={() => setSaModalOpen(true)}
                className="bg-[color:var(--yellow)] text-[color:var(--black)] font-medium rounded px-4 py-2"
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
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ad</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Açıklama</th>
                <th className="px-4 py-2"></th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {serviceAreas.map((sa) => (
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
                  <td className="px-4 py-2 text-sm text-right space-x-2">
                    {editingServiceArea?.id === sa.id ? (
                      <>
                        <button
                          className="px-3 py-1 rounded border border-gray-300 hover:bg-gray-50"
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
                        <button className="px-3 py-1 rounded border border-gray-300 hover:bg-gray-50" onClick={() => setEditingServiceArea(null)}>İptal</button>
                      </>
                    ) : (
                      <>
                        {canWriteContent && (
                          <button className="px-3 py-1 rounded border border-gray-300 hover:bg-gray-50 text-[color:var(--black)]" onClick={() => setEditingServiceArea(sa)}>Düzenle</button>
                        )}
                        {canDeleteContent && (
                          <button
                            className="px-3 py-1 rounded btn-danger"
                            onClick={async () => {
                              if (!confirm('Silmek istediğinize emin misiniz?')) return
                              try {
                                setLoading(true)
                                await deleteServiceArea(sa.id)
                                setServiceAreas((prev) => prev.filter((x) => x.id !== sa.id))
                              } catch (e: unknown) {
                                setError((e as { response?: { data?: { detail?: string } } })?.response?.data?.detail || 'Hizmet alanı silinemedi')
                              } finally {
                                setLoading(false)
                              }
                            }}
                          >Sil</button>
                        )}
                      </>
                    )}
                  </td>
                </tr>
              ))}
              {serviceAreas.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-4 py-6 text-center text-sm text-gray-500">Kayıt yok</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {/* Pagination */}
        <div className="mt-4">
          <Pagination
            currentPage={saPage}
            totalPages={Math.max(1, Math.ceil(saTotal / saPageSize))}
            totalCount={saTotal}
            pageSize={saPageSize}
            onPageChange={setSaPage}
            onPageSizeChange={(size) => { setSaPageSize(size); setSaPage(1) }}
            itemName="hizmet alanı"
          />
        </div>
      </section>
      )}

      {/* Categories */}
      {activeTab === 'categories' && (
      <section className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Kategoriler</h2>
          <div className="flex items-center gap-3">
            <div className="w-64">
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
                className="bg-[color:var(--yellow)] text-[color:var(--black)] font-medium rounded px-4 py-2"
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
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ad</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hizmet Alanı</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Açıklama</th>
                <th className="px-4 py-2"></th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {categories.map((cat) => (
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
                  <td className="px-4 py-2 text-sm text-right space-x-2">
                    {editingCategory?.id === cat.id ? (
                      <>
                        <button
                          className="px-3 py-1 rounded border border-gray-300 hover:bg-gray-50"
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
                        <button className="px-3 py-1 rounded border border-gray-300 hover:bg-gray-50" onClick={() => setEditingCategory(null)}>İptal</button>
                      </>
                    ) : (
                      <>
                        {canWriteContent && (
                          <button className="px-3 py-1 rounded border border-gray-300 hover:bg-gray-50 text-[color:var(--black)]" onClick={() => setEditingCategory(cat)}>Düzenle</button>
                        )}
                        {canDeleteContent && (
                          <button
                            className="px-3 py-1 rounded btn-danger"
                            onClick={async () => {
                              if (!confirm('Silmek istediğinize emin misiniz?')) return
                              try {
                                setLoading(true)
                                await deleteCategory(cat.id)
                                setCategories((prev) => prev.filter((x) => x.id !== cat.id))
                              } catch (e: unknown) {
                                setError((e as { response?: { data?: { detail?: string } } })?.response?.data?.detail || 'Kategori silinemedi')
                              } finally {
                                setLoading(false)
                              }
                            }}
                          >Sil</button>
                        )}
                      </>
                    )}
                  </td>
                </tr>
              ))}
              {categories.length === 0 && (
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
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Araba Markaları</h2>
          <div className="flex items-center gap-3">
            <div className="w-64">
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
                className="bg-[color:var(--yellow)] text-[color:var(--black)] font-medium rounded px-4 py-2"
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
                <div className="md:col-span-2 flex items-center gap-3">
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
                    Dosya Seç
                  </label>
                  <span className="text-sm text-gray-600 truncate">
                    {newBrand.logo_file ? newBrand.logo_file.name : 'Seçili dosya yok'}
                  </span>
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
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ad</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Durum</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Açıklama</th>
                <th className="px-4 py-2"></th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {carBrands.map((brand) => (
                <tr key={brand.id}>
                  <td className="px-4 py-2 text-sm">
                    {'logo' in brand && brand.logo ? (
                      // Try to show image if possible
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={brand.logo as string} alt={brand.name} className="h-8 w-8 object-contain" />
                    ) : (
                      <span className="text-gray-400 text-xs">Yok</span>
                    )}
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
                  <td className="px-4 py-2 text-sm text-right space-x-2">
                    {editingBrand?.id === brand.id ? (
                      <>
                        <button
                          className="px-3 py-1 rounded border border-gray-300 hover:bg-gray-50"
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
                        <button className="px-3 py-1 rounded border border-gray-300 hover:bg-gray-50" onClick={() => setEditingBrand(null)}>İptal</button>
                      </>
                    ) : (
                      <>
                        {canWriteContent && (
                          <button className="px-3 py-1 rounded border border-gray-300 hover:bg-gray-50 text-[color:var(--black)]" onClick={() => setEditingBrand(brand)}>Düzenle</button>
                        )}
                        {canDeleteContent && (
                          <button
                            className="px-3 py-1 rounded btn-danger"
                            onClick={async () => {
                              if (!confirm('Silmek istediğinize emin misiniz?')) return
                              try {
                                setLoading(true)
                                await deleteCarBrand(brand.id)
                                setCarBrands((prev) => prev.filter((x) => x.id !== brand.id))
                              } catch (e: unknown) {
                                setError((e as { response?: { data?: { detail?: string } } })?.response?.data?.detail || 'Marka silinemedi')
                              } finally {
                                setLoading(false)
                              }
                            }}
                          >Sil</button>
                        )}
                      </>
                    )}
                  </td>
                </tr>
              ))}
              {carBrands.length === 0 && (
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
    </div>
  )
}


