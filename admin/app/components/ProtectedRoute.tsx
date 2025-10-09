'use client'

import { useAuth } from '../contexts/AuthContext'
import { usePermissions } from '../contexts/AuthContext'
import { Shield, Loader2 } from 'lucide-react'

interface ProtectedRouteProps {
  children: React.ReactNode
  requiredPermission?: string
  requiredAction?: 'read' | 'write' | 'delete'
  fallback?: React.ReactNode
}

export default function ProtectedRoute({ 
  children, 
  requiredPermission,
  requiredAction = 'read',
  fallback 
}: ProtectedRouteProps) {
  const { isAuthenticated, isLoading } = useAuth()
  const { canAccess } = usePermissions()


  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-[color:var(--yellow)]" />
          <p className="text-gray-600">Yükleniyor...</p>
        </div>
      </div>
    )
  }

  // Not authenticated
  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Shield className="h-12 w-12 mx-auto mb-4 text-red-500" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Giriş Gerekli
          </h2>
          <p className="text-gray-600 mb-4">
            Bu sayfaya erişmek için giriş yapmanız gerekiyor.
          </p>
          <button
            onClick={() => window.location.href = '/login'}
            className="px-4 py-2 bg-[color:var(--yellow)] text-[color:var(--black)] rounded-md hover:brightness-95 transition-colors"
          >
            Giriş Yap
          </button>
        </div>
      </div>
    )
  }

  // Permission check
  if (requiredPermission && !canAccess(requiredPermission, requiredAction)) {
    return fallback || (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Shield className="h-12 w-12 mx-auto mb-4 text-red-500" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Erişim Reddedildi
          </h2>
          <p className="text-gray-600 mb-4">
            Bu sayfaya erişim yetkiniz bulunmuyor.
          </p>
          <button
            onClick={() => window.history.back()}
            className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
          >
            Geri Dön
          </button>
        </div>
      </div>
    )
  }

  return <>{children}</>
}