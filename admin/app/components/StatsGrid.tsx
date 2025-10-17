'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { 
  Users, 
  Shield, 
  MessageSquare, 
  FileText
} from 'lucide-react'
import { fetchDashboardStats } from '../api/admin'

type StatItem = {
  name: string
  value: string | number
  icon: React.ComponentType<{ className?: string }>
  change?: string
  changeType?: 'positive' | 'negative'
  href?: string
}

type StatsGridProps = {
  stats?: StatItem[] // Opsiyonel hale getirdik
}

export default function StatsGrid({ stats }: StatsGridProps) {
  const [internalStats, setInternalStats] = useState<StatItem[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (stats) {
      // Eğer stats prop olarak verilmişse onu kullan
      setInternalStats(stats)
      return
    }

    // Eğer stats verilmemişse kendi stats'larını yükle
    let cancelled = false
    setLoading(true)
    
    fetchDashboardStats()
      .then((statsData) => {
        if (cancelled) return
        const s: StatItem[] = [
          { 
            name: 'Toplam Kullanıcı', 
            value: statsData.total_users, 
            icon: Users, 
            change: `${Math.round(statsData.users_change_pct)}%`, 
            changeType: statsData.users_change_pct >= 0 ? 'positive' : 'negative', 
            href: '/users' 
          },
          { 
            name: 'Aktif Esnaf', 
            value: statsData.total_vendors, 
            icon: Shield, 
            change: `${Math.round(statsData.vendors_change_pct)}%`, 
            changeType: statsData.vendors_change_pct >= 0 ? 'positive' : 'negative', 
            href: '/vendors' 
          },
          { 
            name: 'Destek Talepleri', 
            value: statsData.pending_support_tickets, 
            icon: MessageSquare, 
            change: `${Math.round(statsData.support_change_pct)}%`, 
            changeType: statsData.support_change_pct >= 0 ? 'positive' : 'negative', 
            href: '/support' 
          },
          { 
            name: 'Blog Yazıları', 
            value: statsData.published_blog_posts, 
            icon: FileText, 
            change: `${Math.round(statsData.blog_change_pct)}%`, 
            changeType: statsData.blog_change_pct >= 0 ? 'positive' : 'negative', 
            href: '/blog' 
          },
        ]
        setInternalStats(s)
      })
      .catch(() => {
        if (cancelled) return
        // Hata durumunda boş array
        setInternalStats([])
      })
      .finally(() => {
        if (cancelled) return
        setLoading(false)
      })
    
    return () => { cancelled = true }
  }, [stats])

  const statsToRender = stats || internalStats

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white rounded-lg shadow p-6 animate-pulse">
            <div className="flex items-center">
              <div className="h-8 w-8 bg-gray-200 rounded"></div>
              <div className="ml-4 flex-1">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-6 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {statsToRender.map((stat) => {
        const Icon = stat.icon
        const isClickable = !!stat.href
        
        const cardContent = (
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Icon className="h-8 w-8 text-[color:var(--yellow)]" />
            </div>
            <div className="ml-4 flex-1">
              <p className="text-sm font-medium text-gray-500">{stat.name}</p>
              <p className="text-2xl font-semibold text-gray-900">{stat.value}</p>
            </div>
          </div>
        )

        const changeContent = stat.change && (
          <div className="mt-4">
            <span
              className={`text-sm font-medium ${
                stat.changeType === 'positive' ? 'text-green-600' : 'text-red-600'
              }`}
            >
              {stat.change}
            </span>
            <span className="text-sm text-gray-500 ml-1">geçen aya göre</span>
          </div>
        )

        if (isClickable) {
          return (
            <Link key={stat.name} href={stat.href!}>
              <div className="bg-white rounded-lg shadow p-6 cursor-pointer hover:shadow-lg hover:scale-105 transition-all duration-200">
                {cardContent}
                {changeContent}
              </div>
            </Link>
          )
        }

        return (
          <div key={stat.name} className="bg-white rounded-lg shadow p-6">
            {cardContent}
            {changeContent}
          </div>
        )
      })}
    </div>
  )
}


