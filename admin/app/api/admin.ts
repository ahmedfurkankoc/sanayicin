import { apiClient } from './api'

export interface DashboardStats {
  total_users: number
  total_vendors: number
  total_admins: number
  pending_support_tickets: number
  published_blog_posts: number
  active_service_areas: number
  active_categories: number
  active_car_brands: number
}

export async function fetchDashboardStats() {
  const resp = await apiClient.get<DashboardStats>('/dashboard-stats/')
  return resp.data
}

export interface AdminAuthLogItem {
  id: number
  level: string
  message: string
  username: string | null
  ip_address: string | null
  user_agent: string
  created_at: string
}

export async function fetchAdminAuthLogs(limit = 20) {
  const resp = await apiClient.get<{ results: AdminAuthLogItem[] }>(`/logs/auth/`, { params: { limit } })
  return resp.data
}

// Users (CustomUser) - centralized here
// Client (CustomUser) APIs should live in clients.ts

// Vendors - centralized here (optional usage)
// Vendor APIs are not exposed in admin app per separation of concerns


