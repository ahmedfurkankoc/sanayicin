'use client'

import { useAuth } from '../../contexts/AuthContext'
import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { updateAdminUser, changeAdminPassword, getDomains, createDomain, deleteDomain, refreshDomain, type Domain } from '../../api/admin'
import ProtectedRoute from '../../components/ProtectedRoute'
import ServerMonitoringWidget from '../../components/ServerMonitoringWidget'
import HostingerSubscriptionsWidget from '../../components/HostingerSubscriptionsWidget'
import { 
  Server,
  Globe, 
  User, 
  Shield, 
  Save, 
  Eye, 
  EyeOff,
  Key,
  Plus,
  RefreshCw,
  Trash2,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react'

type SettingsTab = 'server' | 'domain' | 'profile' | 'security'

export default function SettingsPage() {
  const { user } = useAuth()
  const searchParams = useSearchParams()
  const [activeTab, setActiveTab] = useState<SettingsTab>('server')
  
  // Profile states
  const [firstName, setFirstName] = useState(user?.first_name || '')
  const [lastName, setLastName] = useState(user?.last_name || '')
  const [saving, setSaving] = useState(false)
  const [saveMsg, setSaveMsg] = useState<string | null>(null)
  const [editMode, setEditMode] = useState(false)
  const [currPwd, setCurrPwd] = useState('')
  const [newPwd, setNewPwd] = useState('')
  const [pwdSaving, setPwdSaving] = useState(false)
  const [pwdMsg, setPwdMsg] = useState<string | null>(null)
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)

  // Domain states
  const [domains, setDomains] = useState<Domain[]>([])
  const [domainsLoading, setDomainsLoading] = useState(false)
  const [domainsError, setDomainsError] = useState<string | null>(null)
  const [showAddDomain, setShowAddDomain] = useState(false)
  const [newDomainName, setNewDomainName] = useState('')
  const [newDomainAutoRenew, setNewDomainAutoRenew] = useState(false)
  const [domainStats, setDomainStats] = useState({
    total: 0,
    active: 0,
    expiring_soon: 0,
    expired: 0
  })

  // URL parametresinden tab'ı belirle
  useEffect(() => {
    const tab = searchParams.get('tab') as SettingsTab
    if (tab && ['server', 'domain', 'profile', 'security'].includes(tab)) {
      setActiveTab(tab)
    }
  }, [searchParams])

  const tabs = [
    { id: 'server' as SettingsTab, name: 'Sunucu Bilgileri', icon: Server },
    { id: 'domain' as SettingsTab, name: 'Domain Bilgileri', icon: Globe },
    { id: 'profile' as SettingsTab, name: 'Profil', icon: User },
    { id: 'security' as SettingsTab, name: 'Güvenlik', icon: Shield },
  ]

  const handleProfileSave = async () => {
    if (!user) return
    
    setSaving(true)
    setSaveMsg(null)
    
    try {
      await updateAdminUser(user.id, {
        first_name: firstName,
        last_name: lastName,
      })
      setSaveMsg('Profil başarıyla güncellendi')
      setEditMode(false)
    } catch (error: unknown) {
      const errorMessage = error && typeof error === 'object' && 'response' in error && error.response && typeof error.response === 'object' && 'data' in error.response && error.response.data && typeof error.response.data === 'object' && 'error' in error.response.data ? String(error.response.data.error) : 'Profil güncellenirken hata oluştu'
      setSaveMsg(errorMessage)
    } finally {
      setSaving(false)
    }
  }

  const handlePasswordChange = async () => {
    if (!user) return
    
    setPwdSaving(true)
    setPwdMsg(null)
    
    try {
      await changeAdminPassword(currPwd, newPwd)
      setPwdMsg('Şifre başarıyla değiştirildi')
      setCurrPwd('')
      setNewPwd('')
    } catch (error: unknown) {
      const errorMessage = error && typeof error === 'object' && 'response' in error && error.response && typeof error.response === 'object' && 'data' in error.response && error.response.data && typeof error.response.data === 'object' && 'error' in error.response.data ? String(error.response.data.error) : 'Şifre değiştirilirken hata oluştu'
      setPwdMsg(errorMessage)
    } finally {
      setPwdSaving(false)
    }
  }

  // Domain functions
  const loadDomains = async () => {
    setDomainsLoading(true)
    setDomainsError(null)
    
    try {
      const response = await getDomains()
      setDomains(response.domains)
      setDomainStats({
        total: response.total,
        active: response.active,
        expiring_soon: response.expiring_soon,
        expired: response.expired
      })
    } catch (error: unknown) {
      const errorMessage = error && typeof error === 'object' && 'response' in error && error.response && typeof error.response === 'object' && 'data' in error.response && error.response.data && typeof error.response.data === 'object' && 'error' in error.response.data ? String(error.response.data.error) : 'Domain listesi yüklenemedi'
      setDomainsError(errorMessage)
    } finally {
      setDomainsLoading(false)
    }
  }

  // Frontend daily timer removed; backend Celery Beat handles daily refresh at 00:01 TR

  const handleAddDomain = async () => {
    if (!newDomainName.trim()) return
    
    setDomainsLoading(true)
    setDomainsError(null)
    
    try {
      await createDomain({
        name: newDomainName.trim(),
        auto_renew: newDomainAutoRenew
      })
      
      setNewDomainName('')
      setNewDomainAutoRenew(false)
      setShowAddDomain(false)
      await loadDomains() // Refresh list
    } catch (error: unknown) {
      const errorMessage = error && typeof error === 'object' && 'response' in error && error.response && typeof error.response === 'object' && 'data' in error.response && error.response.data && typeof error.response.data === 'object' && 'error' in error.response.data ? String(error.response.data.error) : 'Domain eklenemedi'
      setDomainsError(errorMessage)
    } finally {
      setDomainsLoading(false)
    }
  }

  const handleDeleteDomain = async (id: number) => {
    if (!confirm('Bu domaini silmek istediğinizden emin misiniz?')) return
    
    setDomainsLoading(true)
    setDomainsError(null)
    
    try {
      await deleteDomain(id)
      await loadDomains() // Refresh list
    } catch (error: unknown) {
      const errorMessage = error && typeof error === 'object' && 'response' in error && error.response && typeof error.response === 'object' && 'data' in error.response && error.response.data && typeof error.response.data === 'object' && 'error' in error.response.data ? String(error.response.data.error) : 'Domain silinemedi'
      setDomainsError(errorMessage)
    } finally {
      setDomainsLoading(false)
    }
  }

  const handleRefreshDomain = async (id: number) => {
    setDomainsLoading(true)
    setDomainsError(null)
    
    try {
      await refreshDomain(id)
      await loadDomains() // Refresh list
    } catch (error: unknown) {
      const errorMessage = error && typeof error === 'object' && 'response' in error && error.response && typeof error.response === 'object' && 'data' in error.response && error.response.data && typeof error.response.data === 'object' && 'error' in error.response.data ? String(error.response.data.error) : 'Domain bilgileri yenilenemedi'
      setDomainsError(errorMessage)
    } finally {
      setDomainsLoading(false)
    }
  }

  // Load domains when domain tab is active (no frontend auto-refresh)
  useEffect(() => {
    if (activeTab === 'domain') {
      loadDomains()
    }
  }, [activeTab])

  return (
    <ProtectedRoute requiredPermission="settings">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Ayarlar</h1>
          <p className="text-gray-600">Sistem ayarlarını yönetin ve yapılandırın</p>
        </div>

        <div className="bg-white rounded-lg shadow">
          {/* Tab Navigation */}
          <div className="border-b border-gray-200 overflow-x-auto">
            <nav className="flex space-x-4 sm:space-x-8 px-4 sm:px-6 min-w-max" aria-label="Tabs">
              {tabs.map((tab) => {
                const Icon = tab.icon
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    } whitespace-nowrap py-3 sm:py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2`}
                  >
                    <Icon className="h-4 w-4" />
                    {tab.name}
                  </button>
                )
              })}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === 'server' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Sunucu Bilgileri</h2>
                  <p className="text-gray-600 mb-6">Sunucu performansını ve durumunu gerçek zamanlı olarak takip edin.</p>
                  
                  {/* Server Monitoring Widget */}
                  <ServerMonitoringWidget className="mb-10" />
                  
                  {/* Hostinger Subscriptions Widget */}
                  <HostingerSubscriptionsWidget />
                </div>
              </div>
            )}

            {activeTab === 'domain' && (
              <div className="space-y-6">
                <div>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-3">
                    <div>
                      <h2 className="text-lg font-semibold text-gray-900">Domain Yönetimi</h2>
                      <p className="text-gray-600">Domain bilgilerini takip edin ve yenileme tarihlerini yönetin</p>
                    </div>
                    <button
                      onClick={() => setShowAddDomain(true)}
                      className="mt-2 sm:mt-0 flex items-center gap-2 px-4 py-2 text-black rounded-lg transition-colors"
                      style={{ backgroundColor: 'var(--yellow)' }}
                    >
                      <Plus className="h-4 w-4" />
                      Domain Ekle
                    </button>
                  </div>

                  {/* Domain Stats */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                    <div className="bg-white rounded-lg shadow p-6">
                      <div className="flex items-center">
                        <Globe className="h-8 w-8 text-blue-600" />
                        <div className="ml-4">
                          <p className="text-sm font-medium text-gray-500">Toplam</p>
                          <p className="text-2xl font-semibold text-gray-900">{domainStats.total}</p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white rounded-lg shadow p-6">
                      <div className="flex items-center">
                        <CheckCircle className="h-8 w-8 text-green-600" />
                        <div className="ml-4">
                          <p className="text-sm font-medium text-gray-500">Aktif</p>
                          <p className="text-2xl font-semibold text-gray-900">{domainStats.active}</p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white rounded-lg shadow p-6">
                      <div className="flex items-center">
                        <AlertCircle className="h-8 w-8 text-yellow-600" />
                        <div className="ml-4">
                          <p className="text-sm font-medium text-gray-500">Yakında Dolacak</p>
                          <p className="text-2xl font-semibold text-gray-900">{domainStats.expiring_soon}</p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white rounded-lg shadow p-6">
                      <div className="flex items-center">
                        <XCircle className="h-8 w-8 text-red-600" />
                        <div className="ml-4">
                          <p className="text-sm font-medium text-gray-500">Süresi Dolmuş</p>
                          <p className="text-2xl font-semibold text-gray-900">{domainStats.expired}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Add Domain Modal */}
                  {showAddDomain && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
                        <div className="p-6">
                          <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-gray-900">Yeni Domain Ekle</h3>
                            <button
                              onClick={() => setShowAddDomain(false)}
                              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                              <span className="text-gray-500 text-xl">×</span>
                            </button>
                          </div>
                          
                          <div className="space-y-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">Domain Adı</label>
                              <input
                                type="text"
                                value={newDomainName}
                                onChange={(e) => setNewDomainName(e.target.value)}
                                placeholder="example.com"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              />
                            </div>
                            
                            <div className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                id="autoRenew"
                                checked={newDomainAutoRenew}
                                onChange={(e) => setNewDomainAutoRenew(e.target.checked)}
                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                              />
                              <label htmlFor="autoRenew" className="text-sm text-gray-700">
                                Otomatik yenileme
                              </label>
                            </div>
                          </div>
                          
                          <div className="flex justify-end gap-3 mt-6">
                            <button
                              onClick={() => setShowAddDomain(false)}
                              className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                            >
                              İptal
                            </button>
                            <button
                              onClick={handleAddDomain}
                              disabled={!newDomainName.trim() || domainsLoading}
                              className="px-4 py-2 text-black rounded-lg disabled:opacity-50 transition-colors"
                              style={{ backgroundColor: 'var(--yellow)' }}
                            >
                              {domainsLoading ? 'Ekleniyor...' : 'Ekle'}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Domain List */}
                  {domainsError ? (
                    <div className="text-center py-12">
                      <div className="p-3 bg-red-100 rounded-full w-fit mx-auto mb-4">
                        <XCircle className="h-8 w-8 text-red-600" />
                      </div>
                      <h4 className="text-lg font-medium text-gray-900 mb-2">Domain Listesi Yüklenemedi</h4>
                      <p className="text-red-600 mb-4">{domainsError}</p>
                      <button 
                        onClick={loadDomains}
                        className="px-4 py-2 text-black rounded-lg transition-colors"
                        style={{ backgroundColor: 'var(--yellow)' }}
                      >
                        Tekrar Dene
                      </button>
                    </div>
                  ) : domainsLoading ? (
                    <div className="text-center py-12">
                      <div className="p-3 bg-blue-100 rounded-full w-fit mx-auto mb-4">
                        <RefreshCw className="h-8 w-8 text-blue-600 animate-spin" />
                      </div>
                      <h4 className="text-lg font-medium text-gray-900 mb-2">Domain Listesi Yükleniyor</h4>
                      <p className="text-gray-600">Lütfen bekleyin...</p>
                    </div>
                  ) : domains.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="p-3 bg-gray-100 rounded-full w-fit mx-auto mb-4">
                        <Globe className="h-8 w-8 text-gray-400" />
                      </div>
                      <h4 className="text-lg font-medium text-gray-900 mb-2">Henüz Domain Eklenmemiş</h4>
                      <p className="text-gray-600 mb-4">İlk domaininizi ekleyerek başlayın</p>
                      <button
                        onClick={() => setShowAddDomain(true)}
                        className="px-4 py-2 text-black rounded-lg transition-colors"
                        style={{ backgroundColor: 'var(--yellow)' }}
                      >
                        Domain Ekle
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {domains.map((domain) => (
                        <div key={domain.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-4">
                              <div className={`w-4 h-4 rounded-full ${
                                domain.status === 'active' ? 'bg-green-500' :
                                domain.status === 'expiring_soon' ? 'bg-yellow-500' :
                                domain.status === 'expired' ? 'bg-red-500' :
                                'bg-gray-500'
                              }`}></div>
                              <div>
                                <h4 className="text-xl font-semibold text-gray-900">{domain.name}</h4>
                                <p className="text-sm text-gray-500">
                                  {domain.registrar && `${domain.registrar} • `}
                                  {domain.status === 'active' ? 'Aktif' :
                                   domain.status === 'expiring_soon' ? 'Yakında Dolacak' :
                                   domain.status === 'expired' ? 'Süresi Dolmuş' : 'Hata'}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleRefreshDomain(domain.id)}
                                disabled={domainsLoading}
                                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
                                title="Bilgileri Yenile"
                              >
                                <RefreshCw className={`h-4 w-4 ${domainsLoading ? 'animate-spin' : ''}`} />
                              </button>
                              <button
                                onClick={() => handleDeleteDomain(domain.id)}
                                disabled={domainsLoading}
                                className="p-2 text-red-600 hover:text-red-900 hover:bg-red-100 rounded-lg transition-colors disabled:opacity-50"
                                title="Sil"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {domain.registration_date && (
                              <div>
                                <label className="block text-sm font-medium text-gray-700">Kayıt Tarihi</label>
                                <p className="mt-1 text-sm text-gray-900">
                                  {new Date(domain.registration_date).toLocaleDateString('tr-TR')}
                                </p>
                              </div>
                            )}
                            
                            {domain.expiration_date && (
                              <div>
                                <label className="block text-sm font-medium text-gray-700">Bitiş Tarihi</label>
                                <p className="mt-1 text-sm text-gray-900">
                                  {new Date(domain.expiration_date).toLocaleDateString('tr-TR')}
                                </p>
                              </div>
                            )}
                            
                            {domain.days_until_expiry !== null && (
                              <div>
                                <label className="block text-sm font-medium text-gray-700">Kalan Gün</label>
                                <p className={`mt-1 text-sm font-semibold ${
                                  domain.days_until_expiry < 0 ? 'text-red-600' :
                                  domain.days_until_expiry <= 30 ? 'text-yellow-600' :
                                  'text-green-600'
                                }`}>
                                  {domain.days_until_expiry < 0 ? `${Math.abs(domain.days_until_expiry)} gün önce doldu` :
                                   domain.days_until_expiry === 0 ? 'Bugün doluyor' :
                                   `${domain.days_until_expiry} gün kaldı`}
                                </p>
                              </div>
                            )}
                            
                            {domain.nameservers.length > 0 && (
                              <div className="md:col-span-2 lg:col-span-3">
                                <label className="block text-sm font-medium text-gray-700">Name Server&apos;lar</label>
                                <div className="mt-1 flex flex-wrap gap-2">
                                  {domain.nameservers.map((ns, index) => (
                                    <span key={index} className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                                      {ns}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Subdomain Information */}
                  <div className="mt-8 bg-gray-50 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Subdomain Bilgileri</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Main Domain */}
                      <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-500 rounded-lg">
                              <Globe className="h-5 w-5 text-white" />
                            </div>
                            <div>
                              <h3 className="font-semibold text-gray-900">Ana Domain</h3>
                              <p className="text-sm text-gray-600">Ana site</p>
                            </div>
                          </div>
                        </div>
                        <div className="text-lg font-bold text-blue-600">sanayicin.com</div>
                        <div className="text-sm text-gray-500 mt-1">Aktif</div>
                      </div>

                      {/* Admin Domain */}
                      <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border border-green-200">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-green-500 rounded-lg">
                              <Shield className="h-5 w-5 text-white" />
                            </div>
                            <div>
                              <h3 className="font-semibold text-gray-900">Admin Panel</h3>
                              <p className="text-sm text-gray-600">Yönetim</p>
                            </div>
                          </div>
                        </div>
                        <div className="text-lg font-bold text-green-600">admin.sanayicin.com</div>
                        <div className="text-sm text-gray-500 mt-1">Aktif</div>
                      </div>

                      {/* Vendor Domain */}
                      <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 border border-purple-200">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-purple-500 rounded-lg">
                              <User className="h-5 w-5 text-white" />
                            </div>
                            <div>
                              <h3 className="font-semibold text-gray-900">Esnaf Paneli</h3>
                              <p className="text-sm text-gray-600">Esnaflar</p>
                            </div>
                          </div>
                        </div>
                        <div className="text-lg font-bold text-purple-600">esnaf.sanayicin.com</div>
                        <div className="text-sm text-gray-500 mt-1">Aktif</div>
                      </div>

                      {/* API Domain */}
                      <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-6 border border-orange-200">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-orange-500 rounded-lg">
                              <Server className="h-5 w-5 text-white" />
                            </div>
                            <div>
                              <h3 className="font-semibold text-gray-900">API Endpoint</h3>
                              <p className="text-sm text-gray-600">Backend</p>
                            </div>
                          </div>
                        </div>
                        <div className="text-lg font-bold text-orange-600">api.sanayicin.com</div>
                        <div className="text-sm text-gray-500 mt-1">Aktif</div>
                      </div>
                    </div>

                    {/* Domain Details */}
                    <div className="mt-6">
                      <h4 className="text-md font-semibold text-gray-900 mb-3">Domain Detayları</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">SSL Sertifikası</label>
                          <p className="mt-1 text-sm text-gray-900">Let&apos;s Encrypt - Geçerli</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Son Yenileme</label>
                          <p className="mt-1 text-sm text-gray-900">15 Ekim 2025</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">DNS Provider</label>
                          <p className="mt-1 text-sm text-gray-900">Cloudflare</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">CDN</label>
                          <p className="mt-1 text-sm text-gray-900">Cloudflare CDN</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'profile' && (
              <div className="space-y-8">
                {/* Profile Information */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-gray-900">Profil Bilgileri</h2>
                    <button
                      onClick={() => {
                        setSaveMsg(null)
                        if (!editMode) {
                          setFirstName(user?.first_name || '')
                          setLastName(user?.last_name || '')
                          setEditMode(true)
                        } else {
                          setEditMode(false)
                        }
                      }}
                      className="px-3 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50"
                    >
                      {editMode ? 'Düzenlemeyi İptal Et' : 'Düzenle'}
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Ad</label>
                      <input
                        type="text"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        disabled={!editMode}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Soyad</label>
                      <input
                        type="text"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        disabled={!editMode}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">E-posta</label>
                      <input
                        type="email"
                        value={user?.email || ''}
                        disabled
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Rol</label>
                      <input
                        type="text"
                        value={user?.is_superuser ? 'Süper Admin' : 'Admin'}
                        disabled
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
                      />
                    </div>
                  </div>
                  {editMode && (
                    <div className="mt-4 flex justify-end">
                      <button
                        onClick={handleProfileSave}
                        disabled={saving}
                        className="px-4 py-2 text-black rounded-lg disabled:opacity-50 flex items-center gap-2"
                        style={{ backgroundColor: 'var(--yellow)' }}
                      >
                        <Save className="h-4 w-4" />
                        {saving ? 'Kaydediliyor...' : 'Kaydet'}
                      </button>
                    </div>
                  )}
                  {saveMsg && (
                    <div className={`mt-4 p-3 rounded-lg text-sm ${
                      saveMsg.includes('başarıyla') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                    }`}>
                      {saveMsg}
                    </div>
                  )}
                </div>

                {/* Password Change */}
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Şifre Değiştir</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Mevcut Şifre</label>
                      <div className="relative">
                        <input
                          type={showCurrentPassword ? 'text' : 'password'}
                          value={currPwd}
                          onChange={(e) => setCurrPwd(e.target.value)}
                          className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                        <button
                          type="button"
                          onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Yeni Şifre</label>
                      <div className="relative">
                        <input
                          type={showNewPassword ? 'text' : 'password'}
                          value={newPwd}
                          onChange={(e) => setNewPwd(e.target.value)}
                          className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 flex justify-end">
                    <button
                      onClick={handlePasswordChange}
                      disabled={pwdSaving || !currPwd || !newPwd}
                      className="px-4 py-2 text-black rounded-lg disabled:opacity-50 flex items-center gap-2"
                      style={{ backgroundColor: 'var(--yellow)' }}
                    >
                      <Key className="h-4 w-4" />
                      {pwdSaving ? 'Değiştiriliyor...' : 'Şifreyi Değiştir'}
                    </button>
                  </div>
                  {pwdMsg && (
                    <div className={`mt-4 p-3 rounded-lg text-sm ${
                      pwdMsg.includes('başarıyla') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                    }`}>
                      {pwdMsg}
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'security' && (
              <div className="space-y-6">
                <div className="text-center py-20">
                  <div className="p-4 bg-gray-100 rounded-full w-fit mx-auto mb-6">
                    <Shield className="h-12 w-12 text-gray-400" />
                  </div>
                  <h2 className="text-2xl font-semibold text-gray-900 mb-4">Güvenlik Ayarları</h2>
                  <p className="text-lg text-gray-600 mb-2">İçerik güncellenecek</p>
                  <p className="text-gray-500">Yakında...</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}
