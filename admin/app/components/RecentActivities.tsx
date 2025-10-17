'use client'

import React, { useEffect, useState } from 'react'
import { 
  Users, 
  Shield, 
  MessageSquare, 
  FileText,
  Clock
} from 'lucide-react'
import { fetchRecentActivities, type RecentActivity } from '../api/admin'

const iconMap = {
  Users,
  Shield,
  MessageSquare,
  FileText,
  Clock
}

export default function RecentActivities() {
  const [activities, setActivities] = useState<RecentActivity[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    
    const loadActivities = async () => {
      try {
        setLoading(true)
        setError(null)
        const data = await fetchRecentActivities()
        if (cancelled) return
        setActivities(data)
      } catch (err) {
        if (cancelled) return
        setError('Aktiviteler yüklenemedi')
        console.error('Activities loading error:', err)
      } finally {
        if (cancelled) return
        setLoading(false)
      }
    }

    loadActivities()
    
    // Her 2 dakikada bir yenile (cache 5 dakika olduğu için güvenli)
    const interval = setInterval(loadActivities, 120000)
    
    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [])

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Son Aktiviteler</h3>
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-start space-x-3 animate-pulse">
              <div className="h-5 w-5 bg-gray-200 rounded"></div>
              <div className="flex-1">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-1"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Son Aktiviteler</h3>
        <div className="text-center py-4">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      </div>
    )
  }

  if (activities.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Son Aktiviteler</h3>
        <div className="text-center py-4">
          <Clock className="h-8 w-8 text-gray-400 mx-auto mb-2" />
          <p className="text-sm text-gray-500">Henüz aktivite bulunamadı</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Son Aktiviteler</h3>
      <div className="space-y-4">
        {activities.map((activity) => {
          const Icon = iconMap[activity.icon as keyof typeof iconMap] || Clock
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
  )
}
