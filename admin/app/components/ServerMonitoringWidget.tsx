'use client'

import { 
  Server,
  Cpu,
  HardDrive,
  Wifi,
  Activity,
  RefreshCw,
  Copy,
  Info,
  ChevronDown,
  ChevronUp
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { getServerMonitoring, type ServerInfo } from '../api/admin'

interface ServerMonitoringWidgetProps {
  className?: string
  defaultExpanded?: boolean
}

export default function ServerMonitoringWidget({ className = '', defaultExpanded = true }: ServerMonitoringWidgetProps) {
  const [servers, setServers] = useState<ServerInfo[]>([])
  const [serversLoading, setServersLoading] = useState(false)
  const [serversError, setServersError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [showInfoModal, setShowInfoModal] = useState(false)
  const [isExpanded, setIsExpanded] = useState(defaultExpanded)
  const REFRESH_MS = 30 * 60 * 1000 // 30 dakika

  // Load with lightweight frontend cache and 30-min auto-refresh
  useEffect(() => {
    const cacheKey = 'serverMonitoring:cache'

    const loadServers = async (fromManual = false) => {
      setServersLoading(true)
      setServersError(null)
      
      try {
        const response = await getServerMonitoring()
        const serverData = response.servers || []
        
        setServers(serverData)
        const now = new Date()
        setLastUpdated(now)
        try {
          localStorage.setItem(cacheKey, JSON.stringify({ ts: now.getTime(), servers: serverData }))
        } catch {}
        
      } catch (error: unknown) {
        console.error('Server monitoring error:', error)
        const errorMessage = error && typeof error === 'object' && 'response' in error && (error as any).response && typeof (error as any).response === 'object' && 'data' in (error as any).response && (error as any).response.data && typeof (error as any).response.data === 'object' && 'error' in (error as any).response.data ? String((error as any).response.data.error) : 'Sunucu verileri yüklenemedi'
        setServersError(errorMessage)
      } finally {
        setServersLoading(false)
      }
    }

    // İlk yüklemede önbelleği dene
    try {
      const raw = localStorage.getItem(cacheKey)
      if (raw) {
        const parsed = JSON.parse(raw) as { ts: number; servers: ServerInfo[] }
        const isFresh = Date.now() - parsed.ts < REFRESH_MS
        if (isFresh) {
          setServers(parsed.servers || [])
          setLastUpdated(new Date(parsed.ts))
        } else {
          void loadServers()
        }
      } else {
        void loadServers()
      }
    } catch {
      void loadServers()
    }
    
    // 30 dakikada bir otomatik yenile
    const interval = setInterval(() => { void loadServers() }, REFRESH_MS)
    
    return () => clearInterval(interval)
  }, [])

  const handleRefresh = async () => {
    setServersLoading(true)
    setServersError(null)
    
    try {
      const response = await getServerMonitoring()
      const serverData = response.servers || []
      setServers(serverData)
      const now = new Date()
      setLastUpdated(now)
      try {
        localStorage.setItem('serverMonitoring:cache', JSON.stringify({ ts: now.getTime(), servers: serverData }))
      } catch {}
      
    } catch (error: unknown) {
      console.error('Server monitoring refresh error:', error)
      const errorMessage = error && typeof error === 'object' && 'response' in error && error.response && typeof error.response === 'object' && 'data' in error.response && error.response.data && typeof error.response.data === 'object' && 'error' in error.response.data ? String(error.response.data.error) : 'Sunucu verileri yenilenemedi'
      setServersError(errorMessage)
    } finally {
      setServersLoading(false)
    }
  }

  // Progress bar component
  const ProgressBar = ({ 
    value, 
    max = 100, 
    color = 'blue', 
    showPercentage = true,
    size = 'md',
    unit = '%'
  }: { 
    value: number
    max?: number
    color?: 'blue' | 'green' | 'purple' | 'orange' | 'pink'
    showPercentage?: boolean
    size?: 'sm' | 'md' | 'lg'
    unit?: string
  }) => {
    const percentage = Math.min((value / max) * 100, 100)
    
    const colorClasses = {
      blue: 'bg-blue-500',
      green: 'bg-green-500', 
      purple: 'bg-purple-500',
      orange: 'bg-orange-500',
      pink: 'bg-pink-500'
    }
    
    const sizeClasses = {
      sm: 'h-2',
      md: 'h-3',
      lg: 'h-4'
    }
    
    return (
      <div className="w-full">
        <div className={`w-full bg-gray-200 rounded-full overflow-hidden ${sizeClasses[size]}`}>
          <div 
            className={`${colorClasses[color]} transition-all duration-500 ease-out rounded-full h-full`}
            style={{ width: `${percentage}%` }}
          ></div>
        </div>
        {showPercentage && (
          <div className="flex justify-between items-center mt-2">
            <span className="text-xs text-gray-500">{value.toFixed(1)}{unit}</span>
            <span className="text-xs text-gray-400">{max}{unit}</span>
          </div>
        )}
      </div>
    )
  }

  return (
    <div 
      onClick={() => setIsExpanded(!isExpanded)}
      className={`bg-gradient-to-br from-white to-gray-50 rounded-xl shadow-lg border border-gray-100 cursor-pointer hover:shadow-xl transition-all duration-300 ${className}`}
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 p-6 pb-0 gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Server className="h-6 w-6 text-blue-600" />
          </div>
          <div className="text-left min-w-0">
            <h3 className="text-xl font-semibold text-gray-900 truncate">Sunucu Durumu</h3>
            <p className="text-sm text-gray-500 truncate">
              {servers.length} sunucu • {lastUpdated && `Son güncelleme: ${lastUpdated.toLocaleTimeString()}`}
            </p>
          </div>
          <div className="ml-2 flex-shrink-0">
            {isExpanded ? (
              <ChevronUp className="h-5 w-5 text-gray-400" />
            ) : (
              <ChevronDown className="h-5 w-5 text-gray-400" />
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={(e) => {
              e.stopPropagation()
              handleRefresh()
            }}
            disabled={serversLoading}
            className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${serversLoading ? 'animate-spin' : ''}`} />
            Yenile
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation()
              setShowInfoModal(true)
            }}
            className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Info className="h-4 w-4" />
            Bilgi
          </button>
        </div>
      </div>
      
      {/* Content */}
      {isExpanded && (
        <div className="px-6 pb-6">
          {serversError ? (
            <div className="text-center py-12">
              <div className="p-3 bg-red-100 rounded-full w-fit mx-auto mb-4">
                <Server className="h-8 w-8 text-red-600" />
              </div>
              <h4 className="text-lg font-medium text-gray-900 mb-2">Sunucu Verileri Alınamadı</h4>
              <p className="text-red-600 mb-4">{serversError}</p>
              <button 
                onClick={handleRefresh}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Tekrar Dene
              </button>
            </div>
          ) : serversLoading ? (
            <div className="text-center py-12">
              <div className="p-3 bg-blue-100 rounded-full w-fit mx-auto mb-4">
                <RefreshCw className="h-8 w-8 text-blue-600 animate-spin" />
              </div>
              <h4 className="text-lg font-medium text-gray-900 mb-2">Sunucu Verileri Yükleniyor</h4>
              <p className="text-gray-600">Lütfen bekleyin...</p>
            </div>
          ) : servers.length === 0 ? (
            <div className="text-center py-12">
              <div className="p-3 bg-gray-100 rounded-full w-fit mx-auto mb-4">
                <Server className="h-8 w-8 text-gray-400" />
              </div>
              <h4 className="text-lg font-medium text-gray-900 mb-2">Sunucu Bulunamadı</h4>
              <p className="text-gray-600">Henüz hiç sunucu eklenmemiş.</p>
            </div>
          ) : (
            <div className="space-y-8">
              {servers.map((server) => (
                <div key={server.id} className="bg-white p-6">
                  {/* Server Header */}
                  <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`w-4 h-4 rounded-full ${
                          server.status === 'running' ? 'bg-green-500 shadow-green-200 shadow-lg' : 
                          server.status === 'stopped' ? 'bg-red-500 shadow-red-200 shadow-lg' : 
                          'bg-yellow-500 shadow-yellow-200 shadow-lg'
                        }`}></div>
                        <div className="min-w-0">
                          <h4 className="text-xl font-semibold text-gray-900">{server.name}</h4>
                          {/* Mobile: single-line truncate; Desktop: full/wrapped */}
                          <p className="text-sm text-gray-500 truncate sm:hidden w-full" title={`${server.os} • ${server.ip_address}`}>
                            {(server.os && server.os.split(' ')[0]) || server.os} • {server.ip_address}
                          </p>
                          <p className="text-sm text-gray-500 hidden sm:block break-words whitespace-normal">
                            {server.os} • {server.ip_address}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation()
                          navigator.clipboard.writeText(`ssh root@${server.ip_address}`)
                        }}
                        className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        <Copy className="h-4 w-4" />
                        SSH Kopyala
                      </button>
                    </div>
                  </div>

                  {/* Metrics Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* CPU Usage */}
                    <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 border border-white/20 shadow-lg hover:shadow-xl transition-all duration-300">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-blue-500 rounded-lg">
                            <Cpu className="h-5 w-5 text-white" />
                          </div>
                          <div>
                            <h5 className="font-semibold text-gray-900">CPU Kullanımı</h5>
                            <p className="text-sm text-gray-600">İşlemci yükü</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-blue-600">{server.metrics.cpu_usage}</div>
                          <div className="text-xs text-gray-500">Ortalama</div>
                        </div>
                      </div>
                      <ProgressBar 
                        value={parseFloat(server.metrics.cpu_usage.replace('%', ''))} 
                        color="blue" 
                        size="lg"
                        unit="%"
                      />
                    </div>

                    {/* Memory Usage */}
                    <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 border border-white/20 shadow-lg hover:shadow-xl transition-all duration-300">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-green-500 rounded-lg">
                            <Activity className="h-5 w-5 text-white" />
                          </div>
                          <div>
                            <h5 className="font-semibold text-gray-900">Bellek Kullanımı</h5>
                            <p className="text-sm text-gray-600">RAM kullanımı</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-green-600">{server.metrics.memory_usage}</div>
                          <div className="text-xs text-gray-500">Ortalama</div>
                        </div>
                      </div>
                      <ProgressBar 
                        value={parseFloat(server.metrics.memory_usage.replace('%', ''))} 
                        color="green" 
                        size="lg"
                        unit="%"
                      />
                    </div>

                    {/* Disk Usage */}
                    <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 border border-white/20 shadow-lg hover:shadow-xl transition-all duration-300">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-purple-500 rounded-lg">
                            <HardDrive className="h-5 w-5 text-white" />
                          </div>
                          <div>
                            <h5 className="font-semibold text-gray-900">Disk Kullanımı</h5>
                            <p className="text-sm text-gray-600">Depolama alanı</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-purple-600">{server.metrics.disk_percentage}</div>
                          <div className="text-xs text-gray-500">Kullanılan</div>
                        </div>
                      </div>
                      <ProgressBar 
                        value={parseFloat(server.metrics.disk_percentage.replace('%', ''))} 
                        color="purple" 
                        size="lg"
                        unit="%"
                      />
                    </div>

                    {/* Network In */}
                    <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 border border-white/20 shadow-lg hover:shadow-xl transition-all duration-300">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-orange-500 rounded-lg">
                            <Wifi className="h-5 w-5 text-white" />
                          </div>
                          <div>
                            <h5 className="font-semibold text-gray-900">Gelen Trafik</h5>
                            <p className="text-sm text-gray-600">Network girişi</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-orange-600">{server.metrics.network_in}</div>
                          <div className="text-xs text-gray-500">Toplam</div>
                        </div>
                      </div>
                      <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                        <p className="text-xs text-gray-600 leading-relaxed">
                          Sunucuya gelen veri trafiği. Web siteleri, API istekleri ve dosya indirmeleri buradan geçer.
                        </p>
                      </div>
                    </div>

                    {/* Network Out */}
                    <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 border border-white/20 shadow-lg hover:shadow-xl transition-all duration-300">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-indigo-500 rounded-lg">
                            <Wifi className="h-5 w-5 text-white" />
                          </div>
                          <div>
                            <h5 className="font-semibold text-gray-900">Giden Trafik</h5>
                            <p className="text-sm text-gray-600">Network çıkışı</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-indigo-600">{server.metrics.network_out}</div>
                          <div className="text-xs text-gray-500">Toplam</div>
                        </div>
                      </div>
                      <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                        <p className="text-xs text-gray-600 leading-relaxed">
                          Sunucudan çıkan veri trafiği. Sayfa yanıtları, dosya yüklemeleri ve API cevapları buradan geçer.
                        </p>
                      </div>
                    </div>

                    {/* Bandwidth */}
                    <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 border border-white/20 shadow-lg hover:shadow-xl transition-all duration-300">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-pink-500 rounded-lg">
                            <Wifi className="h-5 w-5 text-white" />
                          </div>
                          <div>
                            <h5 className="font-semibold text-gray-900">Bant Genişliği</h5>
                            <p className="text-sm text-gray-600">Aylık limit</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-pink-600">{server.metrics.bandwidth_usage}</div>
                          <div className="text-xs text-gray-500">Kullanım</div>
                        </div>
                      </div>
                      <ProgressBar 
                        value={parseFloat(server.metrics.bandwidth_usage.split(' / ')[0].replace(/[^\d.]/g, ''))} 
                        color="pink" 
                        size="lg"
                        max={parseFloat(server.metrics.bandwidth_usage.split(' / ')[1].replace(/[^\d.]/g, '')) * 1024 * 1024}
                        unit=" MB"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      
      {/* Info Modal */}
      {showInfoModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Info className="h-6 w-6 text-blue-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900">Sunucu Durumu Hakkında</h3>
                </div>
                <button
                  onClick={() => setShowInfoModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <span className="text-gray-500 text-xl">×</span>
                </button>
              </div>
              
              <div className="space-y-6">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <Cpu className="h-4 w-4 text-blue-600" />
                    CPU Kullanımı
                  </h4>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    İşlemci kullanım yüzdesi. Yüksek değerler sunucunun yoğun çalıştığını gösterir. 
                    %80&apos;in üzerinde sürekli kalması performans sorunlarına işaret edebilir.
                  </p>
                </div>
                
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <Activity className="h-4 w-4 text-green-600" />
                    Bellek Kullanımı
                  </h4>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    RAM (Random Access Memory) kullanım yüzdesi. Sunucunun ne kadar bellek kullandığını gösterir. 
                    %90&apos;ın üzerinde kalması bellek yetersizliği sorunlarına yol açabilir.
                  </p>
                </div>
                
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <HardDrive className="h-4 w-4 text-purple-600" />
                    Disk Kullanımı
                  </h4>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    Sabit disk alanının ne kadarının kullanıldığını gösterir. 
                    %85&apos;in üzerinde kalması disk alanı sorunlarına neden olabilir.
                  </p>
                </div>
                
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <Wifi className="h-4 w-4 text-orange-600" />
                    Network Trafiği
                  </h4>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    <strong>Gelen Trafik:</strong> Sunucuya gelen veri miktarı (web siteleri, API istekleri)<br/>
                    <strong>Giden Trafik:</strong> Sunucudan çıkan veri miktarı (sayfa yanıtları, dosya yüklemeleri)
                  </p>
                </div>
                
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <Wifi className="h-4 w-4 text-pink-600" />
                    Bant Genişliği
                  </h4>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    Aylık veri transfer limiti. Sunucunuzun ayda ne kadar veri transfer edebileceğini gösterir. 
                    Limit aşılırsa ek ücret ödemeniz gerekebilir.
                  </p>
                </div>
                
                <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                  <h4 className="font-semibold text-blue-900 mb-2">💡 İpuçları</h4>
                  <ul className="text-blue-800 text-sm space-y-1">
                    <li>• Veriler her 5 dakikada bir otomatik güncellenir</li>
                    <li>• Yeşil nokta sunucunun çalıştığını gösterir</li>
                    <li>• SSH komutunu kopyalayarak sunucuya bağlanabilirsiniz</li>
                    <li>• Yüksek değerler performans optimizasyonu gerektirebilir</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
