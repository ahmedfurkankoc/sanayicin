'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import axios from 'axios'

// Types
interface User {
  id: number
  email: string
  first_name: string
  last_name: string
  role: 'admin' | 'editor' | 'support'
  is_superuser: boolean
  date_joined: string
}

interface Permission {
  read: boolean
  write: boolean
  delete: boolean
}

interface UserPermissions {
  [key: string]: Permission
}

interface AuthContextType {
  user: User | null
  permissions: UserPermissions | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string, password: string) => Promise<boolean>
  logout: () => void
  canAccess: (permission: string, action?: 'read' | 'write' | 'delete') => boolean
  refreshUser: () => Promise<void>
}

// Context
const AuthContext = createContext<AuthContextType | undefined>(undefined)

// API Base URL
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/admin'

// Axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
})

// Auth Provider
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [permissions, setPermissions] = useState<UserPermissions | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // Token management
  const getToken = () => {
    if (typeof window !== 'undefined') {
      // Cookie'den token'ı oku
      const cookies = document.cookie.split(';')
      const tokenCookie = cookies.find(cookie => cookie.trim().startsWith('admin_token='))
      return tokenCookie ? tokenCookie.split('=')[1] : null
    }
    return null
  }

  const setToken = (token: string) => {
    if (typeof window !== 'undefined') {
      // Cookie'ye kaydet (24 saat)
      document.cookie = `admin_token=${token}; path=/; max-age=86400; secure; samesite=strict`
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`
    }
  }

  const removeToken = () => {
    if (typeof window !== 'undefined') {
      // Cookie'yi sil
      document.cookie = 'admin_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
      delete api.defaults.headers.common['Authorization']
    }
  }

  // Permission check
  const canAccess = (permission: string, action: 'read' | 'write' | 'delete' = 'read'): boolean => {
    if (!permissions || !user) return false
    
    // Superuser her şeye erişebilir
    if (user.is_superuser) return true
    
    const perm = permissions[permission]
    if (!perm) return false
    
    return perm[action] || false
  }

  // Login function
  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      setIsLoading(true)
      
      const response = await api.post('/auth/login/', {
        email,
        password,
      })

      if (response.data.token) {
        setToken(response.data.token)
        setUser(response.data.user)
        setPermissions(response.data.user.permissions)
        setIsAuthenticated(true)
        return true
      }
      
      return false
    } catch (error) {
      console.error('Login error:', error)
      return false
    } finally {
      setIsLoading(false)
    }
  }

  // Logout function
  const logout = async () => {
    try {
      await api.post('/auth/logout/')
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      removeToken()
      setUser(null)
      setPermissions(null)
      setIsAuthenticated(false)
      
      // Redirect to login
      if (typeof window !== 'undefined') {
        window.location.href = '/login'
      }
    }
  }

  // Refresh user data
  const refreshUser = async () => {
    try {
      const token = getToken()
      if (!token) return

      api.defaults.headers.common['Authorization'] = `Bearer ${token}`
      
      const response = await api.get('/auth/user/')
      
      if (response.data) {
        setUser(response.data)
        setPermissions(response.data.permissions)
        setIsAuthenticated(true)
      }
    } catch (error) {
      console.error('Refresh user error:', error)
      logout()
    }
  }

  // Initialize auth state
  useEffect(() => {
    const initializeAuth = async () => {
      const token = getToken()
      
      if (token) {
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`
        await refreshUser()
      }
      
      setIsLoading(false)
    }

    initializeAuth()
  }, [])

  // Auto-refresh token
  useEffect(() => {
    if (!isAuthenticated) return

    const interval = setInterval(() => {
      refreshUser()
    }, 30 * 60 * 1000) // 30 dakikada bir refresh

    return () => clearInterval(interval)
  }, [isAuthenticated])

  const value: AuthContextType = {
    user,
    permissions,
    isAuthenticated,
    isLoading,
    login,
    logout,
    canAccess,
    refreshUser,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// Hook
export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

// Permission hook
export function usePermissions() {
  const { canAccess } = useAuth()
  
  return {
    canAccess,
    canRead: (permission: string) => canAccess(permission, 'read'),
    canWrite: (permission: string) => canAccess(permission, 'write'),
    canDelete: (permission: string) => canAccess(permission, 'delete'),
  }
}

export default AuthContext
