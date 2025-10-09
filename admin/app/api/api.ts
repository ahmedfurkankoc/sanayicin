import axios from 'axios'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api/admin'

// Simple cache for API responses
const apiCache = new Map<string, { data: unknown; timestamp: number; ttl: number }>()

// Cache TTL (Time To Live) in milliseconds
const CACHE_TTL = {
  dashboard: 5 * 60 * 1000, // 5 minutes
  users: 2 * 60 * 1000, // 2 minutes
  vendors: 2 * 60 * 1000, // 2 minutes
  support: 1 * 60 * 1000, // 1 minute
  blog: 5 * 60 * 1000, // 5 minutes
  content: 10 * 60 * 1000, // 10 minutes
  logs: 30 * 1000, // 30 seconds
  default: 1 * 60 * 1000 // 1 minute
}

// Helper function to get cache key
function getCacheKey(url: string, params?: Record<string, unknown>): string {
  const paramStr = params ? JSON.stringify(params) : ''
  return `${url}${paramStr}`
}

// Helper function to get cache TTL
function getCacheTTL(url: string): number {
  if (url.includes('/dashboard-stats/')) return CACHE_TTL.dashboard
  if (url.includes('/users/')) return CACHE_TTL.users
  if (url.includes('/vendors/')) return CACHE_TTL.vendors
  if (url.includes('/support')) return CACHE_TTL.support
  if (url.includes('/blog')) return CACHE_TTL.blog
  if (url.includes('/service-areas/') || url.includes('/categories/') || url.includes('/car-brands/')) return CACHE_TTL.content
  if (url.includes('/logs/')) return CACHE_TTL.logs
  return CACHE_TTL.default
}

// Helper function to check if cache is valid
function isCacheValid(cacheEntry: { data: unknown; timestamp: number; ttl: number }): boolean {
  return Date.now() - cacheEntry.timestamp < cacheEntry.ttl
}

// Helper function to get cached data if available
export function getCachedData(url: string, params?: Record<string, unknown>): unknown | null {
  const cacheKey = getCacheKey(url, params)
  const cacheEntry = apiCache.get(cacheKey)
  
  if (cacheEntry && isCacheValid(cacheEntry)) {
    return cacheEntry.data
  }
  
  return null
}

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
})

// Request interceptor - localStorage'dan token al ve Authorization header'a ekle
apiClient.interceptors.request.use(
  (config) => {
    // localStorage'dan admin token'ı al
    const adminToken = localStorage.getItem('admin_token')
    if (adminToken) {
      config.headers.Authorization = `Bearer ${adminToken}`
    } else {
    }
    
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor - 401 hatası durumunda logout yap ve cache kaydet
apiClient.interceptors.response.use(
  (response) => {
    // Cache successful GET responses
    if (response.config.method === 'get' && response.status === 200) {
      const cacheKey = getCacheKey(response.config.url || '', response.config.params)
      const ttl = getCacheTTL(response.config.url || '')
      
      apiCache.set(cacheKey, {
        data: response.data,
        timestamp: Date.now(),
        ttl: ttl
      })
      
    }
    
    return response
  },
  (error) => {
    if (error.response?.status === 401 || error.response?.status === 403) {
      localStorage.removeItem('admin_token')
      localStorage.removeItem('admin_logged_in')
      localStorage.removeItem('admin_user')
      // Clear cache
      apiCache.clear()
      // Redirect to login
      if (typeof window !== 'undefined') {
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

export interface PaginatedResponse<T> {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}

// Cache management functions
export const cacheManager = {
  // Clear all cache
  clearAll: () => {
    apiCache.clear()
  },
  
  // Clear cache for specific endpoint
  clearEndpoint: (endpoint: string) => {
    const keysToDelete: string[] = []
    for (const key of apiCache.keys()) {
      if (key.includes(endpoint)) {
        keysToDelete.push(key)
      }
    }
    keysToDelete.forEach(key => apiCache.delete(key))
  },
  
  // Get cache stats
  getStats: () => {
    const stats = {
      totalEntries: apiCache.size,
      entries: Array.from(apiCache.entries()).map(([key, value]) => ({
        key,
        age: Date.now() - value.timestamp,
        ttl: value.ttl,
        isValid: isCacheValid(value)
      }))
    }
    return stats
  }
}


