'use client'

import { useEffect, useMemo, useState } from 'react'
import ProtectedRoute from '../../components/ProtectedRoute'
import { usePermissions } from '../../contexts/AuthContext'
import { Users, Shield, PlusCircle, Save, Trash2 } from 'lucide-react'
import { listAdminUsers, updateAdminUserRole, getAdminRoles, updateAdminRoles, createAdminUser, AdminRole, AdminUserCreateData } from '../../api/admin'

type DefTab = 'roles' | 'assign' | 'new_admin'

const tabs: { key: DefTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { key: 'roles', label: 'Roller Tanımları', icon: Shield },
  { key: 'assign', label: 'Rol Atamaları', icon: Users },
  { key: 'new_admin', label: 'Yeni Admin Oluştur', icon: PlusCircle },
]

type RoleKey = 'admin' | 'editor' | 'support' | (string & {})

type PermissionTriple = { read: boolean; write: boolean; delete: boolean }

type ModuleKey =
  | 'dashboard'
  | 'users'
  | 'vendors'
  | 'blog'
  | 'support'
  | 'content'
  | 'analytics'
  | 'logs'
  | 'settings'
  | 'definitions'

const modules: Array<{ key: ModuleKey; label: string }> = [
  { key: 'dashboard', label: 'Dashboard' },
  { key: 'users', label: 'Kullanıcılar' },
  { key: 'vendors', label: 'Esnaflar' },
  { key: 'support', label: 'Destek' },
  { key: 'blog', label: 'Blog' },
  { key: 'content', label: 'İçerik' },
  { key: 'analytics', label: 'İstatistikler' },
  { key: 'settings', label: 'Ayarlar' },
  { key: 'definitions', label: 'Tanımlamalar' },
  { key: 'logs', label: 'Kayıtlar' },
]

interface RoleDef {
  key: RoleKey
  name: string
  description: string
  permissions: Record<ModuleKey, PermissionTriple>
}

// inline create form removed in favor of modal

export default function DefinitionsPage() {
  const { canAccess } = usePermissions()
  const [active, setActive] = useState<DefTab>('roles')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const fullPerms = (): Record<ModuleKey, PermissionTriple> => {
    const p: Record<ModuleKey, PermissionTriple> = {} as Record<ModuleKey, PermissionTriple>
    modules.forEach((m) => (p[m.key] = { read: true, write: true, delete: true }))
    return p
  }

  const emptyPerms = (): Record<ModuleKey, PermissionTriple> => {
    const p: Record<ModuleKey, PermissionTriple> = {} as Record<ModuleKey, PermissionTriple>
    modules.forEach((m) => (p[m.key] = { read: false, write: false, delete: false }))
    return p
  }

  const [roles, setRoles] = useState<RoleDef[]>([])

  const [selectedRoleKey, setSelectedRoleKey] = useState<RoleKey>('admin')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [createName, setCreateName] = useState('')
  const [createDescription, setCreateDescription] = useState('')

  // Mock user list for assignment tab
  const [users, setUsers] = useState<Array<{ id: number; email: string; role: RoleKey }>>([])
  const [assignSearch, setAssignSearch] = useState('')
  const [selectedUserIds, setSelectedUserIds] = useState<number[]>([])
  const [selectedRole, setSelectedRole] = useState<RoleKey>('support')
  const [assigningIds, setAssigningIds] = useState<number[]>([])

  // New admin form
  const [newAdmin, setNewAdmin] = useState({
    email: '',
    firstName: '',
    lastName: '',
    password: '',
    role: 'admin' as RoleKey,
  })
  const [showNewAdminPassword, setShowNewAdminPassword] = useState(false)

  const generateRandomPassword = () => {
    const length = 12
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%^&*()_+' // avoid ambiguous
    let pwd = ''
    const cryptoObj = typeof window !== 'undefined' && (window.crypto || (window as { msCrypto?: unknown }).msCrypto)
    if (cryptoObj && cryptoObj.getRandomValues) {
      const arr = new Uint32Array(length)
      cryptoObj.getRandomValues(arr)
      for (let i = 0; i < length; i++) pwd += chars[arr[i] % chars.length]
    } else {
      for (let i = 0; i < length; i++) pwd += chars[Math.floor(Math.random() * chars.length)]
    }
    setNewAdmin((prev) => ({ ...prev, password: pwd }))
    setShowNewAdminPassword(true)
  }

  const handleCreateAdmin = async () => {
    setMessage(null)
    if (!validators.new_admin()) {
      setMessage('Yeni admin formunu kontrol edin.')
      return
    }
    setSaving(true)
    
    try {
      const adminData: AdminUserCreateData = {
        email: newAdmin.email,
        first_name: newAdmin.firstName,
        last_name: newAdmin.lastName,
        password: newAdmin.password,
        role: newAdmin.role,
      }
      
      const createdUser = await createAdminUser(adminData)
      
      // Users listesini güncelle
      setUsers((prev) => [
        ...prev,
        {
          id: createdUser.id,
          email: createdUser.email,
          role: createdUser.role as RoleKey,
        },
      ])
      
      setNewAdmin({ email: '', firstName: '', lastName: '', password: '', role: 'admin' })
      setMessage('Yeni admin başarıyla oluşturuldu.')
    } catch (error) {
      console.error('Create admin error:', error)
      setMessage('Admin oluşturma işlemi başarısız oldu.')
    } finally {
      setSaving(false)
    }
  }

  const validators = useMemo(
    () => ({
      roles: () => roles.every((r) => r.name.trim().length > 0 && r.key.trim().length > 0),
      assign: () => selectedUserIds.length > 0 && !!selectedRole,
      new_admin: () =>
        /.+@.+\..+/.test(newAdmin.email) &&
        newAdmin.firstName.trim().length > 0 &&
        newAdmin.lastName.trim().length > 0 &&
        newAdmin.password.length >= 8,
    }),
    [roles, selectedUserIds, selectedRole, newAdmin]
  )

  const handleSave = async () => {
    setMessage(null)
    const isValid = validators[active]()
    if (!isValid) {
      setMessage('Lütfen bu bölümdeki alanları kontrol edin.')
      return
    }
    setSaving(true)
    
    try {
      if (active === 'roles') {
        // Backend'e rol tanımlarını gönder
        await updateAdminRoles(roles)
        setMessage('Rol tanımları başarıyla güncellendi.')
      } else {
        setMessage('Bu bölüm için kaydetme işlemi henüz implement edilmedi.')
      }
    } catch (error) {
      console.error('Save error:', error)
      setMessage('Kaydetme işlemi başarısız oldu.')
    } finally {
      setSaving(false)
    }
  }

  useEffect(() => setMessage(null), [active])

  // Load roles and users from backend
  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        
        // Load roles
        const rolesData = await getAdminRoles()
        setRoles(rolesData)
        
        // Load users
        const res = await listAdminUsers({ page_size: 500 })
        setUsers(
          res.items.map((u: { id: number; email: string; role: string }) => ({
            id: u.id,
            email: u.email,
            role: u.role as RoleKey,
          }))
        )
        
        // Set first role as selected if available
        if (rolesData.length > 0) {
          setSelectedRoleKey(rolesData[0].key as RoleKey)
        }
      } catch (error) {
        console.error('Load error:', error)
        setMessage('Veriler yüklenirken hata oluştu.')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  if (loading) {
    return (
      <ProtectedRoute requiredPermission="settings">
        <div className="space-y-6">
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[color:var(--yellow)] mx-auto mb-4"></div>
              <p className="text-gray-600">Veriler yükleniyor...</p>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute requiredPermission="settings">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Tanımlamalar</h1>
            <p className="text-sm text-gray-500">Roller, atamalar ve admin oluşturma.</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex flex-wrap gap-2" aria-label="Tabs">
            {tabs.map((t) => {
              const Icon = t.icon
              const isActive = active === t.key
              return (
                <button
                  key={t.key}
                  onClick={() => setActive(t.key)}
                  className={`inline-flex items-center gap-2 px-3 py-2 border-b-2 text-sm font-medium transition-colors ${
                    isActive
                      ? 'border-[color:var(--yellow)] text-gray-900'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="h-4 w-4" /> {t.label}
                </button>
              )
            })}
          </nav>
        </div>

        {message && (
          <div className="rounded-md border border-gray-200 bg-white p-3 text-sm text-gray-700">{message}</div>
        )}

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          {active === 'roles' && (
            <div className="space-y-6">
              {/* Role list and create */}
              <div className="flex flex-wrap items-end gap-3">
                <div className="min-w-56">
                  <label className="block text-sm font-medium text-gray-700">Rol Seç</label>
                  <select
                    value={selectedRoleKey}
                    onChange={(e) => setSelectedRoleKey(e.target.value as RoleKey)}
                    className="mt-1 w-full rounded border border-[color:var(--yellow)] bg-white text-[color:var(--black)] px-3 py-2 focus:ring-2 focus:ring-[color:var(--yellow)]"
                  >
                    {roles.map((r) => (
                      <option key={r.key} value={r.key}>
                        {r.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="grow" />
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-md border border-gray-300 bg-[color:var(--yellow)] text-[color:var(--black)] hover:opacity-90"
                >
                  <PlusCircle className="h-4 w-4" /> Yeni Rol Ekle
                </button>
                {selectedRoleKey !== 'admin' && (
                  <button
                    onClick={() => {
                      setRoles(roles.filter((r) => r.key !== selectedRoleKey))
                      setSelectedRoleKey('admin')
                    }}
                    className="inline-flex items-center gap-2 px-3 py-2 rounded-md border border-gray-300 text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" /> Sil
                  </button>
                )}
              </div>

              {/* Role details */}
              {roles
                .filter((r) => r.key === selectedRoleKey)
                .map((role) => (
                  <div key={role.key} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Rol Adı</label>
                        <input
                          type="text"
                          value={role.name}
                          onChange={(e) => {
                            const next = roles.map((r) =>
                              r.key === role.key ? { ...r, name: e.target.value } : r
                            )
                            setRoles(next)
                          }}
                          className="mt-1 w-full rounded border border-[color:var(--yellow)] bg-white text-[color:var(--black)] px-3 py-2 focus:ring-2 focus:ring-[color:var(--yellow)]"
                          disabled={role.key === 'admin'}
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700">Açıklama</label>
                        <input
                          type="text"
                          value={role.description}
                          onChange={(e) => {
                            const next = roles.map((r) =>
                              r.key === role.key ? { ...r, description: e.target.value } : r
                            )
                            setRoles(next)
                          }}
                          className="mt-1 w-full rounded border border-[color:var(--yellow)] bg-white text-[color:var(--black)] px-3 py-2 focus:ring-2 focus:ring-[color:var(--yellow)]"
                        />
                      </div>
                  </div>

                    {/* Permissions matrix */}
                    <div className="overflow-auto">
                      <table className="min-w-full border border-gray-200 rounded-md overflow-hidden">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="text-left text-xs font-semibold text-gray-600 px-3 py-2 border-b">Modül</th>
                            <th className="text-center text-xs font-semibold text-gray-600 px-3 py-2 border-b">Oku</th>
                            <th className="text-center text-xs font-semibold text-gray-600 px-3 py-2 border-b">Yaz</th>
                            <th className="text-center text-xs font-semibold text-gray-600 px-3 py-2 border-b">Sil</th>
                          </tr>
                        </thead>
                        <tbody>
                          {modules.map((m) => {
                            const triple = role.permissions[m.key] || { read: false, write: false, delete: false }
                            return (
                              <tr key={m.key} className='border'>
                                <td className="text-sm text-gray-700 px-3 py-2">{m.label}</td>
                                {(['read', 'write', 'delete'] as const).map((k) => (
                                  <td key={k} className="text-center px-3 py-2">
                            <input
                                      type="checkbox"
                                      checked={triple[k]}
                                      disabled={role.key === 'admin'}
                                      onChange={(e) => {
                                        const next = roles.map((r) => {
                                          if (r.key !== role.key) return r
                                          const perms = { ...r.permissions }
                                          if (!perms[m.key]) {
                                            perms[m.key] = { read: false, write: false, delete: false }
                                          }
                                          perms[m.key] = { ...perms[m.key], [k]: e.target.checked }
                                          return { ...r, permissions: perms }
                                        })
                                        setRoles(next)
                                      }}
                                    />
                                  </td>
                                ))}
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                    <div className="flex justify-end pt-3">
                      <button
                        onClick={handleSave}
                        disabled={saving || !canAccess('settings')}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-md border border-gray-300 bg-[color:var(--yellow)] text-[color:var(--black)] hover:opacity-90 disabled:opacity-60"
                      >
                        <Save className="h-4 w-4" />
                        {saving ? 'Kaydediliyor…' : 'Kaydet'}
                      </button>
                    </div>
                  </div>
                ))}

              {/* Create Role Modal */}
              {showCreateModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                  <div className="absolute inset-0 bg-black/40" onClick={() => setShowCreateModal(false)} />
                  <div className="relative bg-white rounded-lg border border-gray-200 shadow-lg w-full max-w-lg p-5">
                    <h3 className="text-lg font-semibold text-gray-900">Yeni Rol Ekle</h3>
                    <div className="mt-4 grid grid-cols-1 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Rol Adı</label>
                        <input
                          type="text"
                          value={createName}
                          onChange={(e) => setCreateName(e.target.value)}
                          className="mt-1 w-full rounded border border-[color:var(--yellow)] bg-white text-[color:var(--black)] px-3 py-2 focus:ring-2 focus:ring-[color:var(--yellow)]"
                          placeholder="Örn: Canlı Destek"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Açıklama</label>
                        <input
                          type="text"
                          value={createDescription}
                          onChange={(e) => setCreateDescription(e.target.value)}
                          className="mt-1 w-full rounded border border-[color:var(--yellow)] bg-white text-[color:var(--black)] px-3 py-2 focus:ring-2 focus:ring-[color:var(--yellow)]"
                          placeholder="Rol açıklaması"
                        />
                      </div>
                    </div>
                    <div className="mt-6 flex justify-end gap-2">
                      <button
                        onClick={() => setShowCreateModal(false)}
                        className="px-3 py-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50"
                      >
                        İptal
                      </button>
                      <button
                        onClick={() => {
                          const name = createName.trim()
                          if (name.length === 0) return
                          const description = createDescription.trim()
                          const key = name
                            .toLowerCase()
                            .replace(/[^a-z0-9]+/g, '-')
                            .replace(/(^-|-$)/g, '') as RoleKey
                          if (!key) return
                          if (roles.some((r) => r.key === key)) {
                            setMessage('Bu anahtar ile rol zaten mevcut.')
                            return
                          }
                          setRoles([...roles, { key, name, description, permissions: emptyPerms() }])
                          setSelectedRoleKey(key)
                          setCreateName('')
                          setCreateDescription('')
                          setShowCreateModal(false)
                        }}
                        className="inline-flex items-center gap-2 px-3 py-2 rounded-md border border-gray-300 bg-[color:var(--yellow)] text-[color:var(--black)] hover:opacity-90"
                      >
                        Oluştur
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {active === 'assign' && (
            <div className="space-y-4">
              {/* Controls */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700">Kullanıcı Ara</label>
                  <input
                    type="search"
                    value={assignSearch}
                    onChange={(e) => setAssignSearch(e.target.value)}
                    className="mt-1 w-full rounded border border-[color:var(--yellow)] bg-white text-[color:var(--black)] px-3 py-2 focus:ring-2 focus:ring-[color:var(--yellow)]"
                    placeholder="E-posta ile ara"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Toplu Atama Rolü</label>
                  <select
                    value={selectedRole}
                    onChange={(e) => setSelectedRole(e.target.value as RoleKey)}
                    className="mt-1 w-full rounded border border-[color:var(--yellow)] bg-white text-[color:var(--black)] focus:ring-2 focus:ring-[color:var(--yellow)]"
                  >
                    {roles.map((r) => (
                      <option key={r.key} value={r.key}>
                        {r.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Table */}
              <div className="rounded-md overflow-auto">
                <table className="min-w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left text-xs font-semibold text-gray-600 px-3 py-2">
                        <input
                          aria-label="Tümünü Seç"
                          type="checkbox"
                          checked={
                            users.filter((u) => u.email.toLowerCase().includes(assignSearch.toLowerCase())).length > 0 &&
                            users
                              .filter((u) => u.email.toLowerCase().includes(assignSearch.toLowerCase()))
                              .every((u) => selectedUserIds.includes(u.id))
                          }
                          onChange={(e) => {
                            const visible = users.filter((u) =>
                              u.email.toLowerCase().includes(assignSearch.toLowerCase())
                            )
                            if (e.target.checked) setSelectedUserIds(visible.map((u) => u.id))
                            else setSelectedUserIds((prev) => prev.filter((id) => !visible.some((u) => u.id === id)))
                          }}
                        />
                      </th>
                      <th className="text-left text-xs font-semibold text-gray-600 px-3 py-2">E-posta</th>
                      <th className="text-left text-xs font-semibold text-gray-600 px-3 py-2">Mevcut Rol</th>
                      <th className="text-left text-xs font-semibold text-gray-600 px-3 py-2">Yeni Rol</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users
                      .filter((u: { id: number; email: string; role: RoleKey }) =>
                        u.email.toLowerCase().includes(assignSearch.toLowerCase())
                      )
                      .map((u: { id: number; email: string; role: RoleKey }) => (
                        <tr key={u.id} className="border-t">
                          <td className="px-3 py-2">
                            <input
                              type="checkbox"
                              checked={selectedUserIds.includes(u.id)}
                              onChange={(e) => {
                                setSelectedUserIds((prev) =>
                                  e.target.checked ? [...prev, u.id] : prev.filter((id) => id !== u.id)
                                )
                              }}
                            />
                          </td>
                          <td className="px-3 py-2 text-sm text-gray-700">{u.email}</td>
                          <td className="px-3 py-2">
                            <span className="inline-flex items-center px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-700 border border-gray-200">
                              {u.role}
                            </span>
                          </td>
                          <td className="px-3 py-2">
                            <select
                              value={u.role}
                              onChange={async (e) => {
                                const newRole = e.target.value as RoleKey
                                try {
                                  setAssigningIds((prev) => [...prev, u.id])
                                  await updateAdminUserRole(u.id, String(newRole))
                                  setUsers((prev) => prev.map((x) => (x.id === u.id ? { ...x, role: newRole } : x)))
                                  setMessage('Rol güncellendi.')
                                } catch {
                                  setMessage('Rol güncelleme başarısız.')
                                } finally {
                                  setAssigningIds((prev) => prev.filter((id) => id !== u.id))
                                }
                              }}
                              disabled={assigningIds.includes(u.id) || !canAccess('settings')}
                            className="w-40 rounded border border-[color:var(--yellow)] bg-white text-[color:var(--black)] px-3 py-2 focus:ring-2 focus:ring-[color:var(--yellow)]"
                            >
                              {roles.map((r) => (
                                <option key={r.key} value={r.key}>
                                  {r.name}
                                </option>
                              ))}
                            </select>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>

              {/* Bulk apply */}
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  {selectedUserIds.length} kullanıcı seçildi
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setSelectedUserIds([])}
                    className="px-3 py-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50"
                  >
                    Seçimi Temizle
                  </button>
                  <button
                    onClick={async () => {
                      if (!validators.assign()) {
                        setMessage('Kullanıcı ve rol seçin.')
                        return
                      }
                      setSaving(true)
                      try {
                        await Promise.all(
                          selectedUserIds.map((id) => updateAdminUserRole(id, String(selectedRole)))
                        )
                        const res = await listAdminUsers({ page_size: 500 })
                        setUsers(
                          res.items.map((u: { id: number; email: string; role: string }) => ({
                            id: u.id,
                            email: u.email,
                            role: u.role as RoleKey,
                          }))
                        )
                        setSelectedUserIds([])
                        setMessage('Toplu rol atandı.')
                      } catch (error) {
                        console.error('Bulk role assignment error:', error)
                        setMessage('Toplu rol atama başarısız.')
                      } finally {
                        setSaving(false)
                      }
                    }}
                    disabled={saving || !canAccess('settings')}
                    className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-md border border-gray-300 bg-[color:var(--yellow)] text-[color:var(--black)] hover:opacity-90 disabled:opacity-60"
                  >
                    {saving ? 'Atanıyor...' : 'Seçilenlere Ata'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {active === 'new_admin' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">E-posta</label>
                <input
                  type="email"
                  value={newAdmin.email}
                  onChange={(e) => setNewAdmin({ ...newAdmin, email: e.target.value })}
                  className="mt-1 w-full rounded border border-[color:var(--yellow)] bg-white text-[color:var(--black)] px-3 py-2 focus:ring-2 focus:ring-[color:var(--yellow)]"
                  placeholder="admin@sanayicin.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Ad</label>
                <input
                  type="text"
                  value={newAdmin.firstName}
                  onChange={(e) => setNewAdmin({ ...newAdmin, firstName: e.target.value })}
                  className="mt-1 w-full rounded border border-[color:var(--yellow)] bg-white text-[color:var(--black)] px-3 py-2 focus:ring-2 focus:ring-[color:var(--yellow)]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Soyad</label>
                <input
                  type="text"
                  value={newAdmin.lastName}
                  onChange={(e) => setNewAdmin({ ...newAdmin, lastName: e.target.value })}
                  className="mt-1 w-full rounded border border-[color:var(--yellow)] bg-white text-[color:var(--black)] px-3 py-2 focus:ring-2 focus:ring-[color:var(--yellow)]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Parola</label>
                <div className="mt-1 flex items-center gap-2">
                  <input
                    type={showNewAdminPassword ? 'text' : 'password'}
                    value={newAdmin.password}
                    onChange={(e) => setNewAdmin({ ...newAdmin, password: e.target.value })}
                    className="w-full rounded border border-[color:var(--yellow)] bg-white text-[color:var(--black)] px-3 py-2 focus:ring-2 focus:ring-[color:var(--yellow)]"
                    placeholder="En az 8 karakter"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewAdminPassword((s) => !s)}
                    className="px-3 py-2 rounded-md border border-[color:var(--yellow)] text-[color:var(--black)] hover:opacity-90"
                  >
                    {showNewAdminPassword ? 'Gizle' : 'Göster'}
                  </button>
                  <button
                    type="button"
                    onClick={generateRandomPassword}
                    className="px-3 py-2 rounded-md border border-[color:var(--yellow)] bg-[color:var(--yellow)] text-[color:var(--black)] hover:opacity-90"
                  >
                    Rastgele
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Rol</label>
                <select
                  value={newAdmin.role}
                  onChange={(e) => setNewAdmin({ ...newAdmin, role: e.target.value as RoleKey })}
                  className="mt-1 w-full rounded border border-[color:var(--yellow)] bg-white text-[color:var(--black)] px-3 py-2 focus:ring-2 focus:ring-[color:var(--yellow)]"
                >
                  {roles.map((r) => (
                    <option key={r.key} value={r.key}>
                      {r.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="md:col-span-2 flex justify-end">
                <button
                  onClick={handleCreateAdmin}
                  disabled={saving || !canAccess('settings')}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-md border border-gray-300 bg-[color:var(--yellow)] text-[color:var(--black)] hover:opacity-90 disabled:opacity-60"
                >
                  Oluştur
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  )
}


