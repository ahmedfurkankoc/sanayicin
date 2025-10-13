'use client'

import { 
  CreditCard,
  Calendar,
  DollarSign,
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertCircle,
  Clock,
  ChevronDown,
  ChevronUp,
  Info
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { getHostingerSubscriptions, type HostingerSubscription } from '../api/admin'

interface HostingerSubscriptionsWidgetProps {
  className?: string
  defaultExpanded?: boolean
}

export default function HostingerSubscriptionsWidget({ className = '', defaultExpanded = true }: HostingerSubscriptionsWidgetProps) {
  const [subscriptions, setSubscriptions] = useState<HostingerSubscription[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [isExpanded, setIsExpanded] = useState(defaultExpanded)

  // Load subscriptions data
  useEffect(() => {
    const loadSubscriptions = async () => {
      setLoading(true)
      setError(null)
      
      try {
        const response = await getHostingerSubscriptions()
        setSubscriptions(response.subscriptions)
        setLastUpdated(new Date(response.timestamp))
      } catch (error: unknown) {
        console.error('Subscriptions error:', error)
        const errorMessage = error && typeof error === 'object' && 'response' in error && error.response && typeof error.response === 'object' && 'data' in error.response && error.response.data && typeof error.response.data === 'object' && 'error' in error.response.data ? String(error.response.data.error) : 'Subscriptions verileri yüklenemedi'
        setError(errorMessage)
      } finally {
        setLoading(false)
      }
    }

    loadSubscriptions()
  }, [])

  const handleRefresh = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await getHostingerSubscriptions()
      setSubscriptions(response.subscriptions)
      setLastUpdated(new Date(response.timestamp))
    } catch (error: unknown) {
      console.error('Subscriptions refresh error:', error)
      const errorMessage = error && typeof error === 'object' && 'response' in error && error.response && typeof error.response === 'object' && 'data' in error.response && error.response.data && typeof error.response.data === 'object' && 'error' in error.response.data ? String(error.response.data.error) : 'Subscriptions verileri yenilenemedi'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'suspended':
        return <AlertCircle className="h-4 w-4 text-yellow-600" />
      case 'cancelled':
      case 'expired':
        return <XCircle className="h-4 w-4 text-red-600" />
      default:
        return <Clock className="h-4 w-4 text-gray-600" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800'
      case 'suspended':
        return 'bg-yellow-100 text-yellow-800'
      case 'cancelled':
      case 'expired':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2
    }).format(price / 100) // Assuming price is in cents
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('tr-TR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getDaysUntilExpiry = (expiresAt: string | null, nextBillingAt: string) => {
    // expires_at null ise next_billing_at kullan
    const expiryDate = expiresAt || nextBillingAt
    const expiry = new Date(expiryDate)
    const now = new Date()
    const diffTime = expiry.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  return (
    <div 
      onClick={() => setIsExpanded(!isExpanded)}
      className={`bg-gradient-to-br from-white to-gray-50 rounded-xl shadow-lg border border-gray-100 cursor-pointer hover:shadow-xl transition-all duration-300 ${className}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6 p-6 pb-0">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <CreditCard className="h-6 w-6 text-blue-600" />    
          </div>
          <div className="text-left">
            <h3 className="text-xl font-semibold text-gray-900">Hostinger Abonelik</h3>
            <p className="text-sm text-gray-500">
              {subscriptions.length} abonelik • {lastUpdated && `Son güncelleme: ${lastUpdated.toLocaleTimeString()}`}
            </p>
          </div>
          <div className="ml-2">
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
            disabled={loading}
            className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Yenile
          </button>
        </div>
      </div>
      
      {/* Content */}
      {isExpanded && (
        <div className="px-6 pb-6">
          {error ? (
            <div className="text-center py-12">
              <div className="p-3 bg-red-100 rounded-full w-fit mx-auto mb-4">
                <CreditCard className="h-8 w-8 text-red-600" />
              </div>
              <h4 className="text-lg font-medium text-gray-900 mb-2">Subscriptions Verileri Alınamadı</h4>
              <p className="text-red-600 mb-4">{error}</p>
              <button 
                onClick={handleRefresh}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Tekrar Dene
              </button>
            </div>
          ) : loading ? (
            <div className="text-center py-12">
              <div className="p-3 bg-blue-100 rounded-full w-fit mx-auto mb-4">
                <RefreshCw className="h-8 w-8 text-blue-600 animate-spin" />
              </div>
              <h4 className="text-lg font-medium text-gray-900 mb-2">Subscriptions Verileri Yükleniyor</h4>
              <p className="text-gray-600">Lütfen bekleyin...</p>
            </div>
          ) : subscriptions.length === 0 ? (
            <div className="text-center py-12">
              <div className="p-3 bg-gray-100 rounded-full w-fit mx-auto mb-4">
                <CreditCard className="h-8 w-8 text-gray-400" />
              </div>
              <h4 className="text-lg font-medium text-gray-900 mb-2">Subscription Bulunamadı</h4>
              <p className="text-gray-600">Henüz hiç subscription eklenmemiş.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {subscriptions.map((subscription) => {
                const daysUntilExpiry = getDaysUntilExpiry(subscription.expires_at, subscription.next_billing_at)
                const isExpiringSoon = daysUntilExpiry <= 7 && daysUntilExpiry > 0
                
                return (
                  <div key={subscription.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
                    {/* Subscription Header */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        {getStatusIcon(subscription.status)}
                        <div>
                          <h4 className="text-lg font-semibold text-gray-900">{subscription.name}</h4>
                          <p className="text-sm text-gray-500">ID: {subscription.id}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(subscription.status)}`}>
                          {subscription.status.toUpperCase()}
                        </span>
                        {subscription.is_auto_renewed && (
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                            AUTO RENEWAL
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Subscription Details */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {/* Pricing */}
                      <div className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <DollarSign className="h-4 w-4 text-green-600" />
                          <h5 className="font-medium text-gray-900">Fiyat Bilgileri</h5>
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm text-gray-600">
                            <span className="font-medium">Toplam:</span> {formatPrice(subscription.total_price, subscription.currency_code)}
                          </p>
                          <p className="text-sm text-gray-600">
                            <span className="font-medium">Yenileme:</span> {formatPrice(subscription.renewal_price, subscription.currency_code)}
                          </p>
                          <p className="text-sm text-gray-600">
                            <span className="font-medium">Periyot:</span> {subscription.billing_period} {subscription.billing_period_unit}
                          </p>
                        </div>
                      </div>

                      {/* Dates */}
                      <div className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Calendar className="h-4 w-4 text-blue-600" />
                          <h5 className="font-medium text-gray-900">Tarih Bilgileri</h5>
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm text-gray-600">
                            <span className="font-medium">Oluşturulma:</span> {formatDate(subscription.created_at)}
                          </p>
                          <p className="text-sm text-gray-600">
                            <span className="font-medium">Sonraki Fatura:</span> {formatDate(subscription.next_billing_at)}
                          </p>
                        </div>
                      </div>

                      {/* Status & Alerts */}
                      <div className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Info className="h-4 w-4 text-purple-600" />
                          <h5 className="font-medium text-gray-900">Durum & Uyarılar</h5>
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm text-gray-600">
                            <span className="font-medium">Durum:</span> {subscription.status}
                          </p>
                          <p className="text-sm text-gray-600">
                            <span className="font-medium">Kalan Gün:</span> 
                            <span className={`ml-1 ${isExpiringSoon ? 'text-red-600 font-bold' : daysUntilExpiry < 0 ? 'text-red-600' : 'text-green-600'}`}>
                              {daysUntilExpiry > 0 ? `${daysUntilExpiry} gün` : daysUntilExpiry === 0 ? 'Bugün' : 'Süresi dolmuş'}
                            </span>
                          </p>
                          {isExpiringSoon && (
                            <p className="text-xs text-red-600 font-medium">
                              ⚠️ Yakında süresi dolacak!
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
