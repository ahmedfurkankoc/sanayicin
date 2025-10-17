'use client'

import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { RefreshCw, Download, AlertTriangle, Info, CheckCircle2 } from 'lucide-react'
import { listSystemLogs, SystemLogItem } from '../../api/admin'
import Pagination from '../../components/Pagination'

type LogLevel = 'DEBUG' | 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL'

type LogItem = {
  id: number
  level: LogLevel
  message: string
  source: string
  user?: string | null
  ip_address?: string | null
  created_at: string
  activity_type?: string
  activity_data?: Record<string, any>
}

const levelBadge: Record<LogLevel, string> = {
  DEBUG: 'bg-gray-100 text-gray-800',
  INFO: 'bg-blue-100 text-blue-800',
  WARNING: 'bg-yellow-100 text-yellow-900',
  ERROR: 'bg-red-100 text-red-800',
  CRITICAL: 'bg-red-600/10 text-red-700 border border-red-300',
}

const levelIcon: Record<LogLevel, ReactNode> = {
  DEBUG: <Info className="h-3.5 w-3.5" />,
  INFO: <CheckCircle2 className="h-3.5 w-3.5" />,
  WARNING: <AlertTriangle className="h-3.5 w-3.5" />,
  ERROR: <AlertTriangle className="h-3.5 w-3.5" />,
  CRITICAL: <AlertTriangle className="h-3.5 w-3.5" />,
}

const activityTypeBadge: Record<string, string> = {
  system: 'bg-gray-100 text-gray-800',
  user_registered: 'bg-blue-100 text-blue-800',
  vendor_created: 'bg-green-100 text-green-800',
  support_ticket: 'bg-yellow-100 text-yellow-800',
  blog_published: 'bg-purple-100 text-purple-800',
  user_verified: 'bg-emerald-100 text-emerald-800',
  vendor_verified: 'bg-teal-100 text-teal-800',
}

const activityTypeLabels: Record<string, string> = {
  system: 'Sistem',
  user_registered: 'Kullanıcı Kaydı',
  vendor_created: 'Esnaf Oluşturuldu',
  support_ticket: 'Destek Talebi',
  blog_published: 'Blog Yayınlandı',
  user_verified: 'Kullanıcı Doğrulandı',
  vendor_verified: 'Esnaf Doğrulandı',
}

export default function LogsPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [level, setLevel] = useState<'all' | LogLevel>('all')
  const [source, setSource] = useState<'all' | 'core' | 'vendors' | 'admin_panel' | 'chat' | 'system'>('all')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<LogItem[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [error, setError] = useState<string | null>(null)

  // Load real logs from backend
  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    const params = {
      page,
      page_size: pageSize,
      search: searchTerm || undefined,
      level: level === 'all' ? undefined : (level.toLowerCase() as SystemLogItem['level']),
      module: source === 'all' ? undefined : source,
      ordering: '-created_at',
    }
    listSystemLogs(params)
      .then((resp) => {
        if (cancelled) return
        const mapped: LogItem[] = (resp.results || []).map((r) => ({
          id: r.id,
          level: (r.level || 'info').toUpperCase() as LogLevel,
          message: r.message,
          source: r.module || 'system',
          user: (r as { user_email?: string }).user_email || null,
          ip_address: r.ip_address || null,
          created_at: r.created_at,
          activity_type: (r as { activity_type?: string }).activity_type || 'system',
          activity_data: (r as { activity_data?: Record<string, any> }).activity_data || {},
        }))
        const items = mapped.slice(0, pageSize)
        setData(items)
        setTotalCount(resp.count || 0)
      })
      .catch(() => {
        if (cancelled) return
        setError('Kayıtlar yüklenemedi')
      })
      .finally(() => {
        if (cancelled) return
        setLoading(false)
      })
    return () => { cancelled = true }
  }, [searchTerm, level, source, page, pageSize])

  const totalPages = useMemo(() => Math.max(1, Math.ceil(totalCount / pageSize)), [totalCount, pageSize])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Kayıtlar (Loglar)</h1>
          <p className="text-gray-600">Sistem logları, güvenlik ve analiz kayıtları</p>
        </div>
        <div className="flex gap-2">
          <button className="px-3 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 flex items-center">
            <Download className="h-4 w-4 mr-2" />
            Dışa Aktar
          </button>
          <button
            onClick={() => { setPage(1); setSearchTerm(''); setLevel('all'); setSource('all') }}
            className="px-3 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 flex items-center"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Sıfırla
          </button>
        </div>
      </div>

      

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Seviye</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tür</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mesaj</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Kaynak</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Kullanıcı</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">IP</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tarih</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-10 text-center text-gray-500">Yükleniyor...</td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={7} className="px-6 py-10 text-center text-red-600">{error}</td>
                </tr>
              ) : data.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-10 text-center text-gray-500">Kayıt bulunamadı</td>
                </tr>
              ) : (
                data.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-full ${levelBadge[item.level]}`}>
                        {levelIcon[item.level]}
                        {item.level}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${activityTypeBadge[item.activity_type || 'system']}`}>
                        {activityTypeLabels[item.activity_type || 'system']}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 line-clamp-2" title={item.message}>{item.message}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{item.source}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{item.user || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{item.ip_address || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{new Date(item.created_at).toLocaleString('tr-TR')}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="px-6 py-4 border-t border-gray-200">
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            totalCount={totalCount}
            pageSize={pageSize}
            onPageChange={setPage}
            onPageSizeChange={(size) => { setPageSize(size); setPage(1) }}
            itemName="log"
          />
        </div>
      </div>
    </div>
  )
}


