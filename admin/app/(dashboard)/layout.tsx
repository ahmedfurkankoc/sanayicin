'use client'

import Link from 'next/link'
import Image from 'next/image'
import logoEsnaf from '../../public/sanayicin-esnaf-logo.png'
import logoIcon from '../../public/sanayicin-icon.png'
import { usePathname } from 'next/navigation'
import { useAuth } from '../contexts/AuthContext'
import { usePermissions } from '../contexts/AuthContext'
import ProtectedRoute from '../components/ProtectedRoute'
import { 
  Home, 
  Users, 
  Shield, 
  MessageSquare, 
  FileText, 
  BarChart3, 
  Settings, 
  LogOut,
  Menu,
  X,
  Bell,
  ClipboardList,
  UserCheck,
  User,
  Star
} from 'lucide-react'
import { useState, useEffect, useCallback } from 'react'
import Breadcrumbs from '../components/Breadcrumbs'

const navigation = [
  { name: 'Dashboard', href: '/', icon: Home, permission: 'dashboard' },
  { name: 'Kullanıcılar', href: '/users', icon: Users, permission: 'users' },
  { name: 'Esnaflar', href: '/vendors', icon: Shield, permission: 'vendors' },
  { name: 'Yorumlar', href: '/reviews', icon: Star, permission: 'vendors' },
  { name: 'Blog', href: '/blog', icon: FileText, permission: 'blog' },
  { name: 'Destek', href: '/support', icon: MessageSquare, permission: 'support' },
  { name: 'İçerik', href: '/content', icon: FileText, permission: 'content' },
  { name: 'İstatistikler', href: '/analytics', icon: BarChart3, permission: 'analytics' },
  { name: 'Kayıtlar', href: '/logs', icon: ClipboardList, permission: 'logs' },
  { name: 'Tanımlamalar', href: '/definitions', icon: UserCheck, permission: 'definitions' },
  { name: 'Ayarlar', href: '/settings', icon: Settings, permission: 'settings' },
]

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const { user, logout } = useAuth()
  const { canAccess } = usePermissions()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [desktopCollapsed, setDesktopCollapsed] = useState(() => {
    if (typeof window !== 'undefined') {
      try {
        return localStorage.getItem('admin:desktopCollapsed') === '1'
      } catch {}
    }
    return false
  })
  

  const filteredNavigation = navigation.filter(item => 
    canAccess(item.permission)
  )

  // Close user menu on outside click / ESC
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setUserMenuOpen(false) }
    const onClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      // Close if click outside any button or menu container
      if (!target.closest('[aria-haspopup="menu"]') && !target.closest('[role="menu"]')) {
        setUserMenuOpen(false)
      }
    }
    document.addEventListener('keydown', onKey)
    document.addEventListener('mousedown', onClick)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('mousedown', onClick)
    }
  }, [])

  useEffect(() => {
    try {
      localStorage.setItem('admin:desktopCollapsed', desktopCollapsed ? '1' : '0')
    } catch {}
  }, [desktopCollapsed])

  

  return (
    <ProtectedRoute requiredPermission="dashboard">
      <div className="min-h-screen bg-gray-50">
        {/* Mobile sidebar */}
        <div className={`fixed inset-0 z-50 lg:hidden ${sidebarOpen ? 'block' : 'hidden'}`}>
          <div className="fixed inset-0 left-0 top-0 flex w-full h-full flex-col bg-gradient-to-b from-[var(--black)] via-[#222222] to-[var(--black)]">
            <div className="relative flex h-16 items-center px-4 mt-5">
              <div className="flex-1 flex justify-start">
                <Link href="/">
                  <Image src={logoEsnaf} alt="Sanayicin Esnaf Logo" priority className="h-14 w-auto" />
                </Link>
              </div>
              <button
                onClick={() => setSidebarOpen(false)}
                className="absolute right-4 text-[color:rgba(255,255,255,0.8)] hover:text-white"
              >
                <X className="h-6 w-6 text-white" />
              </button>
            </div>
            <nav className="flex-1 px-4 py-4 space-y-2">
              {filteredNavigation.map((item) => {
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                      isActive
                        ? 'bg-white text-[color:var(--black)] shadow-lg'
                        : 'text-[color:rgba(255,255,255,0.8)] hover:bg-[color:var(--yellow)] hover:text-[color:var(--black)]'
                    }`}
                    onClick={() => setSidebarOpen(false)}
                  >
                    <item.icon className="mr-3 h-5 w-5" />
                    {item.name}
                  </Link>
                )
              })}
            </nav>
            <div className="border-t border-[color:rgba(255,255,255,0.2)] p-4">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="h-10 w-10 rounded-full bg-[color:var(--yellow)] flex items-center justify-center">
                    <span className="text-sm font-medium text-white">
                      {user?.first_name?.[0] || user?.email?.[0]?.toUpperCase()}
                    </span>
                  </div>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-white">
                    {user?.first_name || user?.email}
                  </p>
                  <p className="text-xs text-[color:rgba(255,255,255,0.8)]">
                    {user?.is_superuser ? 'Super Admin' : 
                     user?.is_staff ? 'Admin' : 'Kullanıcı'}
                  </p>
                </div>
              </div>
              <button
                onClick={logout}
                className="mt-3 w-full flex items-center px-3 py-2 rounded-lg text-sm font-medium sidebar-logout-btn hover:bg-[color:var(--yellow)] transition-colors"
              >
                <LogOut className="mr-3 h-4 w-4" />
                Çıkış Yap
              </button>
            </div>
          </div>
        </div>

        {/* Desktop sidebar */}
        <div className={`hidden lg:fixed lg:inset-y-0 lg:flex ${desktopCollapsed ? 'lg:w-16' : 'lg:w-64'} lg:flex-col`}>
          <div className="flex flex-col flex-grow bg-gradient-to-b from-[var(--black)] via-[#222222] to-[var(--black)] pt-5 pb-4 overflow-y-auto">
            <div className="flex items-center justify-start flex-shrink-0 px-4">
              <Link href="/">
                {desktopCollapsed ? (
                  <Image src={logoIcon} alt="Sanayicin Icon" priority className="h-10 w-auto object-contain animate-[spin_12s_linear_infinite]" />
                ) : (
                  <Image src={logoEsnaf} alt="Sanayicin Esnaf Logo" priority className="h-14 w-auto" />
                )}
              </Link>
            </div>
            <nav className="mt-8 flex-1 px-3 space-y-2">
              {filteredNavigation.map((item) => {
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`group flex items-center px-3 py-3 text-sm font-medium rounded-lg transition-all duration-200 ${
                      isActive
                        ? 'bg-white text-[color:var(--black)] shadow-lg'
                        : 'text-[color:rgba(255,255,255,0.8)] hover:bg-[color:var(--yellow)] hover:text-[color:var(--black)]'
                    }`}
                  >
                    <item.icon className={`${desktopCollapsed ? 'mr-0' : 'mr-3'} h-5 w-5`} />
                    <span className={`${desktopCollapsed ? 'hidden' : 'inline'}`}>{item.name}</span>
                  </Link>
                )
              })}
            </nav>
            <div className="flex-shrink-0 border-t border-[color:rgba(255,255,255,0.2)] p-4">
              <div className="flex items-center mb-4">
                <div className="flex-shrink-0">
                  <div className="h-10 w-10 rounded-full bg-[color:var(--yellow)] flex items-center justify-center">
                    <span className="text-sm font-medium text-white">
                      {user?.first_name?.[0] || user?.email?.[0]?.toUpperCase()}
                    </span>
                  </div>
                </div>
                <div className={`ml-3 ${desktopCollapsed ? 'hidden' : 'block'}`}>
                  <p className="text-sm font-medium text-white">
                    {user?.first_name || user?.email}
                  </p>
                  <p className="text-xs text-[color:rgba(255,255,255,0.8)]">
                    {user?.is_superuser ? 'Super Admin' : 
                     user?.is_staff ? 'Admin' : 'Kullanıcı'}
                  </p>
                </div>
              </div>
              <button
                onClick={logout}
                className={`w-full flex items-center px-3 py-2 rounded-lg text-sm font-medium sidebar-logout-btn transition-colors ${desktopCollapsed ? 'justify-center' : ''} ${desktopCollapsed ? 'hover:bg-red-100/20' : 'hover:bg-[color:var(--yellow)]'}`}
                title="Çıkış Yap"
                aria-label="Çıkış Yap"
              >
                <LogOut className={`h-5 w-5 flex-shrink-0 ${desktopCollapsed ? 'text-red-600' : 'text-white mr-3'}`} />
                <span className={`${desktopCollapsed ? 'hidden' : 'inline'}`}>Çıkış Yap</span>
              </button>
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className={`${desktopCollapsed ? 'lg:pl-16' : 'lg:pl-64'} flex flex-col flex-1`}>
          {/* Top navbar */}
          <header className="bg-white shadow-sm border-b border-gray-200">
            <div className="flex items-center justify-between px-6 py-4">
              {/* Mobile menu button */}
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden text-gray-500 hover:text-gray-600"
              >
                <Menu className="h-6 w-6" />
              </button>

              {/* Desktop collapse/expand button */}
              <button
                onClick={() => setDesktopCollapsed((v) => !v)}
                className="hidden lg:inline-flex items-center px-2 py-2 text-gray-500 hover:text-gray-700"
                aria-label={desktopCollapsed ? 'Sidebarı aç' : 'Sidebarı kapat'}
                title={desktopCollapsed ? 'Sidebarı aç' : 'Sidebarı kapat'}
              >
                {desktopCollapsed ? <Menu className="h-5 w-5" /> : <X className="h-5 w-5" />}
              </button>

              {/* System status chips (API & WS) */}
              <StatusChips />

              {/* Right side */}
              <div className="flex items-center space-x-4 relative">
                {/* Notifications */}
                <button className="p-2 text-gray-400 hover:text-gray-500 relative">
                  <Bell className="h-6 w-6" />
                  <span className="absolute top-0 right-0 h-2 w-2 bg-red-500 rounded-full"></span>
                </button>

                {/* User info */}
                <div className="flex items-center">
                  <button
                    onClick={() => setUserMenuOpen((v) => !v)}
                    className="flex items-center space-x-3 focus:outline-none"
                    aria-haspopup="menu"
                    aria-expanded={userMenuOpen}
                  >
                    <div className="h-8 w-8 rounded-full bg-[color:var(--yellow)] flex items-center justify-center">
                      <span className="text-xs font-medium text-white">
                        {user?.first_name?.[0] || user?.email?.[0]?.toUpperCase()}
                      </span>
                    </div>
                    <div className="hidden md:block text-left">
                      <p className="text-sm font-medium text-gray-900">
                        {user?.first_name || user?.email}
                      </p>
                      <p className="text-xs text-gray-500">
                        {user?.is_superuser ? 'Super Admin' : 
                         user?.is_staff ? 'Admin' : 'Kullanıcı'}
                      </p>
                    </div>
                  </button>

                  {userMenuOpen && (
                    <div
                      className="absolute right-0 top-12 mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-50"
                      role="menu"
                    >
                      <div className="py-1">
                        <Link
                          href="/settings?tab=profile"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                          role="menuitem"
                        >
                          <User className="mr-3 h-4 w-4" />
                          Profil
                        </Link>
                        <button
                          onClick={() => { setUserMenuOpen(false); logout() }}
                          className="w-full text-left flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                          role="menuitem"
                        >
                          <LogOut className="mr-3 h-4 w-4" />
                          Çıkış Yap
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </header>

          {/* Page content */}
          <main className="flex-1 p-6">
            <div className="max-w-7xl mx-auto">
              <Breadcrumbs />
              {children}
            </div>
          </main>
        </div>
      </div>
    </ProtectedRoute>
  )
}

function StatusChips() {
  const [apiOk, setApiOk] = useState<boolean | null>(null)
  const [wsOk, setWsOk] = useState<boolean | null>(null)

  const checkApi = useCallback(async () => {
    try {
      // API URL'i doğru şekilde oluştur (versioning: /api/v1/admin/)
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || '/api/v1/admin'
      // URL'in sonunda / varsa kaldır, yoksa ekle
      const cleanBaseUrl = apiBaseUrl.endsWith('/') ? apiBaseUrl.slice(0, -1) : apiBaseUrl
      const apiUrl = `${cleanBaseUrl}/auth/user/`
      const resp = await fetch(apiUrl, { credentials: 'include' })
      setApiOk(resp.ok)
    } catch {
      setApiOk(false)
    }
  }, [])

  const checkWs = useCallback(() => {
    try {
      const wsUrl = (typeof window !== 'undefined' && (process.env.NEXT_PUBLIC_WS_URL || '')) || ''
      // WS URL yoksa pasif göster (normal durum, opsiyonel)
      if (!wsUrl || wsUrl.trim() === '') { 
        setWsOk(null) // null = bilinmiyor/opsiyonel
        return 
      }
      
      // WebSocket bağlantısını test et
      const ws = new WebSocket(wsUrl)
      let settled = false
      let timeoutId: NodeJS.Timeout | null = null
      
      ws.onopen = () => { 
        settled = true
        setWsOk(true)
        if (timeoutId) clearTimeout(timeoutId)
        ws.close()
      }
      
      ws.onerror = () => { 
        if (!settled) {
          setWsOk(false)
          if (timeoutId) clearTimeout(timeoutId)
        }
      }
      
      ws.onclose = () => {
        if (timeoutId) clearTimeout(timeoutId)
      }
      
      // Safety close after 3s
      timeoutId = setTimeout(() => { 
        try { 
          if (ws.readyState === WebSocket.CONNECTING || ws.readyState === WebSocket.OPEN) {
            ws.close()
          }
          if (!settled) {
            setWsOk(false)
          }
        } catch {} 
      }, 3000)
    } catch {
      setWsOk(false)
    }
  }, [])

  useEffect(() => {
    checkApi()
    checkWs()
    const t = setInterval(() => { checkApi(); checkWs() }, 60_000)
    return () => clearInterval(t)
  }, [checkApi, checkWs])

  const chip = (label: string, state: boolean | null, title: string) => {
    // state === null ise "bilinmiyor/opsiyonel" durumu (WS için)
    if (state === null) {
      return (
        <span title={title} className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border bg-gray-50 text-gray-500 border-gray-200">
          <span className="mr-2 h-2 w-2 rounded-full bg-gray-300"></span>
          {label}
          <span className="ml-1">:yapılandırılmamış</span>
        </span>
      )
    }
    
    return (
    <span title={title} className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${
        state ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'
    }`}>
        <span className={`mr-2 h-2 w-2 rounded-full ${state ? 'bg-green-500' : 'bg-red-500'}`}></span>
      {label}
      <span className="ml-1">{state ? ':aktif' : ':pasif'}</span>
    </span>
  )
  }

  return (
    <div className="hidden lg:flex items-center gap-2 mx-4">
      {chip('API', apiOk, 'API durumu')}
      {chip('WS', wsOk, 'WebSocket durumu (NEXT_PUBLIC_WS_URL gerekli)')}
    </div>
  )
}