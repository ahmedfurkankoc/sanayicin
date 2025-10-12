'use client'

import { 
  Users, 
  Shield, 
  MessageSquare, 
  FileText, 
  TrendingUp,
  Settings
} from 'lucide-react'
import { fetchDashboardStats, fetchAdminAuthLogs, type AdminAuthLogItem } from '../api/admin'
import ServerMonitoringWidget from '../components/ServerMonitoringWidget'
import { useAuth } from '../contexts/AuthContext'
import { useEffect, useState } from 'react'
import { usePermissions } from '../contexts/AuthContext'
import Pagination from '../components/Pagination'

type StatItem = { name: string; value: string | number; icon: React.ComponentType<{ className?: string }>; change?: string; changeType?: 'positive' | 'negative' }

const recentActivities = [
  { id: 1, type: 'user', message: 'Yeni kullanıcı kaydoldu', time: '2 dakika önce', icon: Users },
  { id: 2, type: 'vendor', message: 'Esnaf onayı bekliyor', time: '5 dakika önce', icon: Shield },
  { id: 3, type: 'support', message: 'Yeni destek talebi', time: '10 dakika önce', icon: MessageSquare },
  { id: 4, type: 'blog', message: 'Blog yazısı yayınlandı', time: '1 saat önce', icon: FileText },
]

export default function Dashboard() {
  const { user } = useAuth()
  const fullName = `${user?.first_name || ''} ${user?.last_name || ''}`.trim() || user?.email || ''
  const { canRead } = usePermissions()
  const canReadLogs = canRead('logs')
  const [stats, setStats] = useState<StatItem[]>([])
  const [authLogs, setAuthLogs] = useState<AdminAuthLogItem[]>([])
  const [logsLoading, setLogsLoading] = useState(false)
  const [logsError, setLogsError] = useState<string | null>(null)
  const [logsPage, setLogsPage] = useState(1)
  const logsLimit = 10
  const [logsTotal, setLogsTotal] = useState(0)
  // const [authLogsLoading, setAuthLogsLoading] = useState(false) // Kullanılmıyor

  useEffect(() => {
    let cancelled = false
    fetchDashboardStats()
      .then((statsData) => {
        if (cancelled) return
        const s: StatItem[] = [
          { name: 'Toplam Kullanıcı', value: statsData.total_users, icon: Users, change: `${Math.round(statsData.users_change_pct)}%`, changeType: statsData.users_change_pct >= 0 ? 'positive' : 'negative' },
          { name: 'Aktif Esnaf', value: statsData.total_vendors, icon: Shield, change: `${Math.round(statsData.vendors_change_pct)}%`, changeType: statsData.vendors_change_pct >= 0 ? 'positive' : 'negative' },
          { name: 'Destek Talepleri', value: statsData.pending_support_tickets, icon: MessageSquare, change: `${Math.round(statsData.support_change_pct)}%`, changeType: statsData.support_change_pct >= 0 ? 'positive' : 'negative' },
          { name: 'Blog Yazıları', value: statsData.published_blog_posts, icon: FileText, change: `${Math.round(statsData.blog_change_pct)}%`, changeType: statsData.blog_change_pct >= 0 ? 'positive' : 'negative' },
        ]
        setStats(s)
      })
      .catch(() => {})
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    if (!canReadLogs) return
    let cancelled = false
    setLogsLoading(true)
    fetchAdminAuthLogs(logsLimit, logsPage)
      .then((res) => {
        if (cancelled) return
        setAuthLogs(res.results || [])
        setLogsTotal(res.count ?? res.results?.length ?? 0)
        setLogsError(null)
      })
      .catch((err) => {
        if (cancelled) return
        setLogsError(err?.response?.data?.error || 'Loglar yüklenemedi')
      })
      .finally(() => {
        if (cancelled) return
        setLogsLoading(false)
      })
    return () => { cancelled = true }
  }, [canReadLogs, logsPage])

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">
          {fullName && (
            <span className="font-medium text-gray-900 mr-1">{fullName},</span>
          )}
          Sanayicin yönetim paneline hoş geldiniz!
        </p>
      </div>

      {/* Server Monitoring */}
      <ServerMonitoringWidget />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <div key={stat.name} className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Icon className="h-8 w-8 text-[color:var(--yellow)]" />
                </div>
                <div className="ml-4 flex-1">
                  <p className="text-sm font-medium text-gray-500">{stat.name}</p>
                  <p className="text-2xl font-semibold text-gray-900">{stat.value}</p>
                </div>
              </div>
              <div className="mt-4">
                <span className={`text-sm font-medium ${
                  stat.changeType === 'positive' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {stat.change}
                </span>
                <span className="text-sm text-gray-500 ml-1">geçen aya göre</span>
              </div>
            </div>
          )
        })}
      </div>

      {/* Growth Chart - Full Width */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-gray-900">Büyüme Trendi</h3>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-blue-500 rounded"></div>
              <span className="text-sm text-gray-600">Kullanıcılar</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-500 rounded"></div>
              <span className="text-sm text-gray-600">Esnaflar</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-purple-500 rounded"></div>
              <span className="text-sm text-gray-600">Toplam</span>
            </div>
          </div>
        </div>

        {/* Detailed Chart */}
        <div className="h-80 bg-gradient-to-b from-gray-50 to-white rounded-lg p-6 overflow-hidden">
          <div className="h-full flex items-end justify-between space-x-0.5">
            {/* 30 days of data */}
            {Array.from({length: 30}, (_, i) => {
              const day = i + 1;
              const users = Math.floor(Math.random() * 50) + 20;
              const vendors = Math.floor(Math.random() * 20) + 5;
              const total = users + vendors;
              const maxHeight = 180; // Reduced from 200
              
              return (
                <div key={day} className="flex flex-col items-center flex-1 group relative">
                  {/* Stacked bars */}
                  <div className="flex flex-col items-center w-full max-w-3 h-full justify-end">
                    <div 
                      className="bg-blue-500 w-full rounded-t-sm hover:bg-blue-600 transition-colors cursor-pointer"
                      style={{height: `${(users / 70) * maxHeight}px`}}
                      title={`Gün ${day}: ${users} kullanıcı`}
                    ></div>
                    <div 
                      className="bg-green-500 w-full hover:bg-green-600 transition-colors cursor-pointer"
                      style={{height: `${(vendors / 25) * maxHeight}px`}}
                      title={`Gün ${day}: ${vendors} esnaf`}
                    ></div>
                  </div>
                  
                  {/* Day label */}
                  <span className="text-xs text-gray-500 mt-2 group-hover:text-gray-700 whitespace-nowrap">
                    {day}
                  </span>
                  
                  {/* Value on hover */}
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-8 bg-gray-800 text-white text-xs px-2 py-1 rounded z-10">
                    {total}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Detailed Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-6">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-600 font-medium">Bu Ay Toplam</p>
            <p className="text-2xl font-bold text-blue-900">1,247</p>
            <p className="text-xs text-blue-700 mt-1">+23% geçen aya göre</p>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <p className="text-sm text-green-600 font-medium">Ortalama Günlük</p>
            <p className="text-2xl font-bold text-green-900">42</p>
            <p className="text-xs text-green-700 mt-1">+8% geçen aya göre</p>
          </div>
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <p className="text-sm text-purple-600 font-medium">En Yüksek Gün</p>
            <p className="text-2xl font-bold text-purple-900">89</p>
            <p className="text-xs text-purple-700 mt-1">15 Ocak 2024</p>
          </div>
          <div className="text-center p-4 bg-orange-50 rounded-lg">
            <p className="text-sm text-orange-600 font-medium">Büyüme Oranı</p>
            <p className="text-2xl font-bold text-orange-900">+18%</p>
            <p className="text-xs text-orange-700 mt-1">Son 7 gün ortalaması</p>
          </div>
        </div>

        {/* Weekly Comparison */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 border rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Bu Hafta</span>
              <TrendingUp className="h-4 w-4 text-green-500" />
            </div>
            <p className="text-lg font-semibold text-gray-900">+127</p>
            <p className="text-xs text-gray-500">Kullanıcı: 89, Esnaf: 38</p>
          </div>
          <div className="p-4 border rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Geçen Hafta</span>
              <TrendingUp className="h-4 w-4 text-blue-500" />
            </div>
            <p className="text-lg font-semibold text-gray-900">+89</p>
            <p className="text-xs text-gray-500">Kullanıcı: 62, Esnaf: 27</p>
          </div>
          <div className="p-4 border rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Haftalık Artış</span>
              <TrendingUp className="h-4 w-4 text-purple-500" />
            </div>
            <p className="text-lg font-semibold text-gray-900">+43%</p>
            <p className="text-xs text-gray-500">Bu hafta vs geçen hafta</p>
          </div>
        </div>
      </div>

      {/* Charts and activities */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Visitor Analytics Chart */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Ziyaretçi İstatistikleri</h3>
          <div className="space-y-4">
            {/* Real-time visitors */}
            <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
              <div>
                <p className="text-sm text-blue-600">Anlık Ziyaretçi</p>
                <p className="text-2xl font-bold text-blue-900">24</p>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
            
            {/* Today's stats */}
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 bg-gray-50 rounded">
                <p className="text-sm text-gray-600">Bugünkü Ziyaretçi</p>
                <p className="text-xl font-semibold text-gray-900">1,247</p>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded">
                <p className="text-sm text-gray-600">Sayfa Görüntüleme</p>
                <p className="text-xl font-semibold text-gray-900">3,891</p>
              </div>
            </div>
            
            {/* Device distribution */}
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Cihaz Dağılımı</p>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Masaüstü</span>
                  <span className="text-sm font-medium text-gray-900">847</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Mobil</span>
                  <span className="text-sm font-medium text-gray-900">312</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Tablet</span>
                  <span className="text-sm font-medium text-gray-900">88</span>
                </div>
              </div>
            </div>
            
            {/* Country distribution */}
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Ülke Dağılımı</p>
              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">🇹🇷 Türkiye</span>
                  <span className="text-sm font-medium text-gray-900">1,156</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">🇩🇪 Almanya</span>
                  <span className="text-sm font-medium text-gray-900">67</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">🇳🇱 Hollanda</span>
                  <span className="text-sm font-medium text-gray-900">24</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent activities */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Son Aktiviteler</h3>
          <div className="space-y-4">
            {recentActivities.map((activity) => {
              const Icon = activity.icon
              return (
                <div key={activity.id} className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    <Icon className="h-5 w-5 text-gray-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900">{activity.message}</p>
                    <p className="text-xs text-gray-500">{activity.time}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>


      {/* Quick actions */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Hızlı İşlemler</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button className="flex items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400 transition-colors">
            <div className="text-center">
              <Users className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-600">Yeni Kullanıcı Ekle</p>
            </div>
          </button>
          <button className="flex items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400 transition-colors">
            <div className="text-center">
              <FileText className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-600">Blog Yazısı Yaz</p>
            </div>
          </button>
          <button className="flex items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400 transition-colors">
            <div className="text-center">
              <Settings className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-600">İçerik Ekle</p>
            </div>
          </button>
        </div>
      </div>

      {/* Recent Admin Auth Logs */}
      {canReadLogs && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Son Giriş Denemeleri</h2>
            {logsLoading && <span className="text-sm text-gray-500">Yükleniyor...</span>}
          </div>
          {logsError ? (
            <p className="text-sm text-red-600">{logsError}</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Zaman</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Seviye</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mesaj</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Kullanıcı</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">IP</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {authLogs.map((log) => (
                    <tr key={log.id}>
                      <td className="px-4 py-2 text-sm text-gray-700">{new Date(log.created_at).toLocaleString()}</td>
                      <td className="px-4 py-2 text-sm">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          log.level === 'info' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {log.level}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-700 break-words">{log.message}</td>
                      <td className="px-4 py-2 text-sm text-gray-700">{log.username ?? '-'}</td>
                      <td className="px-4 py-2 text-sm text-gray-700">{log.ip_address ?? '-'}</td>
                    </tr>
                  ))}
                  {authLogs.length === 0 && !logsLoading && (
                    <tr>
                      <td colSpan={5} className="px-4 py-6 text-center text-sm text-gray-500">Kayıt bulunamadı</td>
                    </tr>
                  )}
                </tbody>
              </table>
              <div className="mt-4">
                <Pagination
                  currentPage={logsPage}
                  totalPages={Math.max(1, Math.ceil(logsTotal / logsLimit))}
                  totalCount={logsTotal}
                  pageSize={logsLimit}
                  onPageChange={setLogsPage}
                  onPageSizeChange={() => { /* logsLimit is fixed */ }}
                  itemName="log"
                />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}



