'use client'

import { useEffect, useMemo, useState } from 'react'
import { BarChart3, Users, Shield, MessageSquare, FileText } from 'lucide-react'
import { fetchDashboardStats, type DashboardStats } from '../../api/admin'

export default function AnalyticsPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [range, setRange] = useState<7 | 30 | 90>(30)
  const [metric, setMetric] = useState<'users' | 'vendors' | 'total'>('total')
  const [trend, setTrend] = useState<Array<{ day: string; users: number; vendors: number; total: number }>>([])

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    fetchDashboardStats()
      .then((data) => {
        if (cancelled) return
        setStats(data)
      })
      .catch(() => {
        if (cancelled) return
        setError('İstatistikler yüklenemedi')
      })
      .finally(() => {
        if (cancelled) return
        setLoading(false)
      })
    return () => { cancelled = true }
  }, [])

  // Generate mock trend data for selected range (deterministic) and compute summary
  useEffect(() => {
    const now = new Date()
    const seed = range === 7 ? 13 : range === 30 ? 29 : 71
    const arr: Array<{ day: string; users: number; vendors: number; total: number }> = []
    for (let i = range - 1; i >= 0; i--) {
      const d = new Date(now)
      d.setDate(now.getDate() - i)
      // simple deterministic pseudo-random using seed
      const base = (Math.sin((i + seed) * 1.137) + 1) / 2 // 0..1
      const users = Math.round(20 + base * 60)
      const vendors = Math.round(5 + (1 - base) * 25)
      arr.push({ day: d.toISOString().slice(0, 10), users, vendors, total: users + vendors })
    }
    setTrend(arr)
  }, [range])

  const values = useMemo(() => trend.map((t) => t[metric]), [trend, metric])
  const maxVal = useMemo(() => Math.max(1, ...values), [values])
  const avg = useMemo(() => (values.length ? Math.round(values.reduce((a, b) => a + b, 0) / values.length) : 0), [values])
  const sorted = useMemo(() => [...values].sort((a, b) => a - b), [values])
  const median = useMemo(() => (sorted.length ? (sorted[Math.floor(sorted.length / 2)] + sorted[Math.ceil((sorted.length - 1) / 2)]) / 2 : 0), [sorted])
  const p95 = useMemo(() => (sorted.length ? sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * 0.95))] : 0), [sorted])
  const topIndex = useMemo(() => values.indexOf(Math.max(...values)), [values])
  const topDay = trend[topIndex]?.day

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">İstatistikler</h1>
          <p className="text-gray-600">Sistem genel görünümü ve trendler</p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KpiCard icon={Users} label="Toplam Kullanıcı" value={stats?.total_users ?? '-'} change={stats ? Math.round(stats.users_change_pct) : null} />
        <KpiCard icon={Shield} label="Aktif Esnaf" value={stats?.total_vendors ?? '-'} change={stats ? Math.round(stats.vendors_change_pct) : null} />
        <KpiCard icon={MessageSquare} label="Açık Destek" value={stats?.pending_support_tickets ?? '-'} change={stats ? Math.round(stats.support_change_pct) : null} />
        <KpiCard icon={FileText} label="Yayınlanan Blog" value={stats?.published_blog_posts ?? '-'} change={stats ? Math.round(stats.blog_change_pct) : null} />
      </div>

      {/* Trend with details */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">30 Günlük Trend</h2>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 bg-gray-100 rounded px-1 py-1">
              {[7, 30, 90].map((r) => (
                <button key={r} onClick={() => setRange(r as 7 | 30 | 90)} className={`px-2 py-1 rounded text-xs ${range === r ? 'bg-white shadow' : ''}`}>{r}g</button>
              ))}
            </div>
            <div className="flex items-center gap-1 bg-gray-100 rounded px-1 py-1">
              {[
                { k: 'users', label: 'Kullanıcılar' },
                { k: 'vendors', label: 'Esnaflar' },
                { k: 'total', label: 'Toplam' },
              ].map((m) => (
                <button key={m.k} onClick={() => setMetric(m.k as 'users' | 'vendors' | 'total')} className={`px-2 py-1 rounded text-xs ${metric === m.k ? 'bg-white shadow' : ''}`}>{m.label}</button>
              ))}
            </div>
            <BarChart3 className="h-5 w-5 text-gray-500" />
          </div>
        </div>
        <div className="h-64 bg-gradient-to-b from-gray-50 to-white rounded-lg p-4">
          <div className="h-full flex items-end justify-between space-x-0.5">
            {trend.map((d) => {
              const val = d[metric]
              const h = Math.max(4, Math.round((val / maxVal) * 180))
              return (
                <div key={d.day} className="flex-1 group relative">
                  <div
                    className={`w-full ${metric === 'users' ? 'bg-blue-500' : metric === 'vendors' ? 'bg-green-500' : 'bg-[color:var(--yellow)]'} rounded-sm hover:opacity-90 transition-opacity`}
                    style={{ height: `${h}px` }}
                    title={`${new Date(d.day).toLocaleDateString('tr-TR')}: ${val}`}
                  />
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-[10px] px-2 py-1 rounded whitespace-nowrap">
                    {new Date(d.day).toLocaleDateString('tr-TR')}: {val}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-3 bg-gray-50 rounded">
            <p className="text-xs text-gray-600">Ortalama</p>
            <p className="text-base font-semibold text-gray-900">{avg}</p>
          </div>
          <div className="p-3 bg-gray-50 rounded">
            <p className="text-xs text-gray-600">Medyan</p>
            <p className="text-base font-semibold text-gray-900">{Math.round(median)}</p>
          </div>
          <div className="p-3 bg-gray-50 rounded">
            <p className="text-xs text-gray-600">P95</p>
            <p className="text-base font-semibold text-gray-900">{p95}</p>
          </div>
          <div className="p-3 bg-gray-50 rounded">
            <p className="text-xs text-gray-600">En Yüksek Gün</p>
            <p className="text-base font-semibold text-gray-900">{topDay ? new Date(topDay).toLocaleDateString('tr-TR') : '-'}</p>
          </div>
        </div>
        {loading && <p className="mt-3 text-sm text-gray-500">Yükleniyor...</p>}
        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
      </div>

      {/* Status code distribution & latency */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">İstek Durum Kodları (24s)</h2>
          </div>
          <div className="h-64 bg-gradient-to-b from-gray-50 to-white rounded-lg p-4">
            <div className="h-full grid grid-rows-5 gap-3">
              {[{k:'2xx',c:'bg-green-500',w:72},{k:'3xx',c:'bg-blue-500',w:12},{k:'4xx',c:'bg-yellow-500',w:10},{k:'5xx',c:'bg-red-500',w:6},{k:'Diğer',c:'bg-gray-400',w:2}].map((r) => (
                <div key={r.k} className="flex items-center gap-3">
                  <span className="w-10 text-xs text-gray-600">{r.k}</span>
                  <div className="flex-1 h-3 bg-gray-200 rounded">
                    <div className={`${r.c} h-3 rounded`} style={{ width: `${r.w}%` }} />
                  </div>
                  <span className="w-10 text-xs text-gray-700 text-right">{r.w}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Gecikme Dağılımı (ms)</h2>
          </div>
          <div className="h-64 bg-gradient-to-b from-gray-50 to-white rounded-lg p-4">
            <div className="h-full flex items-end justify-between">
              {[50,100,200,400,800,1600].map((b,i) => (
                <div key={b} className="flex-1 mx-1">
                  <div className="w-full bg-purple-500/80 rounded-sm" style={{ height: `${20 + (i+1)*18}px` }} title={`≤ ${b} ms`} />
                  <div className="text-[10px] text-gray-600 mt-1 text-center">≤{b}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Top endpoints & error breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">En Çok Çağrılan Endpointler</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Endpoint</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">İstek</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ort. ms</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200 text-sm">
                {[{e:'/api/admin/system-logs/',n:1240,t:82},{e:'/api/admin/users/',n:980,t:110},{e:'/api/admin/support-tickets/',n:640,t:140},{e:'/api/admin/blog-posts/',n:420,t:95}].map((r) => (
                  <tr key={r.e}>
                    <td className="px-4 py-2 text-gray-900">{r.e}</td>
                    <td className="px-4 py-2 text-gray-700">{r.n.toLocaleString('tr-TR')}</td>
                    <td className="px-4 py-2 text-gray-700">{r.t}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Hata Dağılımı</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tür</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Adet</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Son 1s</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200 text-sm">
                {[{k:'4xx',n:132,'1h':12},{k:'5xx',n:24,'1h':2},{k:'Timeout',n:9,'1h':1},{k:'RateLimit',n:18,'1h':3}].map((r) => (
                  <tr key={r.k}>
                    <td className="px-4 py-2 text-gray-900">{r.k}</td>
                    <td className="px-4 py-2 text-gray-700">{r.n}</td>
                    <td className="px-4 py-2 text-gray-700">{r['1h']}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}

function KpiCard({ icon: Icon, label, value, change }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string | number; change: number | null }) {
  const changeText = change === null ? null : `${change}%`
  const changeClass = change === null ? 'text-gray-500' : change >= 0 ? 'text-green-600' : 'text-red-600'
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center">
        <div className="flex-shrink-0">
          <Icon className="h-8 w-8 text-[color:var(--yellow)]" />
        </div>
        <div className="ml-4 flex-1">
          <p className="text-sm text-gray-500">{label}</p>
          <p className="text-2xl font-semibold text-gray-900">{value}</p>
        </div>
      </div>
      {changeText && (
        <div className="mt-3">
          <span className={`text-sm font-medium ${changeClass}`}>{changeText}</span>
          <span className="text-sm text-gray-500 ml-1">geçen aya göre</span>
        </div>
      )}
    </div>
  )
}


