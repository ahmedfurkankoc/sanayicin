'use client'

import { 
  Users, 
  Shield, 
  MessageSquare, 
  FileText, 
  Settings
} from 'lucide-react'
import { fetchDashboardStats, fetchAdminAuthLogs, type AdminAuthLogItem } from '../api/admin'
import { useRouter } from 'next/navigation'
import ServerMonitoringWidget from '../components/ServerMonitoringWidget'
import { useAuth } from '../contexts/AuthContext'
import { useEffect, useState } from 'react'
import { usePermissions } from '../contexts/AuthContext'
import Pagination from '../components/Pagination'
import StatsGrid from '../components/StatsGrid'

type StatItem = { name: string; value: string | number; icon: React.ComponentType<{ className?: string }>; change?: string; changeType?: 'positive' | 'negative' }

const recentActivities = [
  { id: 1, type: 'user', message: 'Yeni kullanıcı kaydoldu', time: '2 dakika önce', icon: Users },
  { id: 2, type: 'vendor', message: 'Esnaf onayı bekliyor', time: '5 dakika önce', icon: Shield },
  { id: 3, type: 'support', message: 'Yeni destek talebi', time: '10 dakika önce', icon: MessageSquare },
  { id: 4, type: 'blog', message: 'Blog yazısı yayınlandı', time: '1 saat önce', icon: FileText },
]

export default function Dashboard() {
  const router = useRouter()
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

      {/* Stats */}
      <StatsGrid stats={stats} />
      <ServerMonitoringWidget defaultExpanded={false} />

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
          <button onClick={() => router.push('/definitions?tab=new_admin')} className="flex items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400 transition-colors">
            <div className="text-center">
              <Users className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-600">Yeni Kullanıcı Ekle</p>
            </div>
          </button>
          <button onClick={() => router.push('/blog/new')} className="flex items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400 transition-colors">
            <div className="text-center">
              <FileText className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-600">Blog Yazısı Yaz</p>
            </div>
          </button>
          <button onClick={() => router.push('/content')} className="flex items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400 transition-colors">
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



