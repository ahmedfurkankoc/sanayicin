'use client'

import { 
  Users, 
  Shield, 
  MessageSquare, 
  FileText, 
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
  Settings
} from 'lucide-react'

const stats = [
  { name: 'Toplam Kullanıcı', value: '1,234', icon: Users, change: '+12%', changeType: 'positive' },
  { name: 'Aktif Esnaf', value: '456', icon: Shield, change: '+8%', changeType: 'positive' },
  { name: 'Destek Talepleri', value: '23', icon: MessageSquare, change: '-5%', changeType: 'negative' },
  { name: 'Blog Yazıları', value: '89', icon: FileText, change: '+15%', changeType: 'positive' },
]

const recentActivities = [
  { id: 1, type: 'user', message: 'Yeni kullanıcı kaydoldu', time: '2 dakika önce', icon: Users },
  { id: 2, type: 'vendor', message: 'Esnaf onayı bekliyor', time: '5 dakika önce', icon: Shield },
  { id: 3, type: 'support', message: 'Yeni destek talebi', time: '10 dakika önce', icon: MessageSquare },
  { id: 4, type: 'blog', message: 'Blog yazısı yayınlandı', time: '1 saat önce', icon: FileText },
]

export default function Dashboard() {
  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">Sanayicin admin paneline hoş geldiniz</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <div key={stat.name} className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Icon className="h-8 w-8 text-blue-600" />
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

      {/* Charts and activities */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart placeholder */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Kullanım İstatistikleri</h3>
          <div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center">
            <div className="text-center">
              <TrendingUp className="h-12 w-12 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-500">Grafik burada görünecek</p>
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
              <p className="text-sm text-gray-600">Hizmet Ekle</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  )
}



