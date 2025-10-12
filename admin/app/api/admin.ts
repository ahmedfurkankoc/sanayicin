import { apiClient } from './api'

export interface AdminUser {
  id: number
  email: string
  first_name: string
  last_name: string
  is_staff: boolean
  is_superuser: boolean
  permissions?: Record<string, { read: boolean; write: boolean; delete: boolean }>
}

export interface DashboardStats {
  total_users: number
  total_vendors: number
  total_admins: number
  pending_support_tickets: number
  published_blog_posts: number
  active_service_areas: number
  active_categories: number
  active_car_brands: number
  users_change_pct: number
  vendors_change_pct: number
  support_change_pct: number
  blog_change_pct: number
}

export async function loginAdmin(email: string, password: string) {
  const resp = await apiClient.post<{ user: AdminUser; token: string; message: string }>('/auth/login/', {
    email,
    password,
  })
  return resp.data
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

export async function fetchAdminAuthLogs(limit = 20, page = 1) {
  const resp = await apiClient.get<{ results: AdminAuthLogItem[]; count: number; page: number; limit: number }>(
    `/logs/auth/`,
    { params: { limit, page } }
  )
  return resp.data
}

// ========== System Logs ==========
export interface SystemLogItem {
  id: number
  level: 'debug' | 'info' | 'warning' | 'error' | 'critical'
  message: string
  module: string
  user?: number | null
  user_email?: string | null
  ip_address?: string | null
  user_agent?: string | null
  created_at: string
}

export interface ListSystemLogsParams {
  page?: number
  page_size?: number
  search?: string
  level?: SystemLogItem['level']
  module?: string
  ordering?: string
}

export async function listSystemLogs(params?: ListSystemLogsParams) {
  const resp = await apiClient.get<{ count: number; next: string | null; previous: string | null; results: SystemLogItem[] }>(
    `/system-logs/`,
    { params }
  )
  return resp.data
}

// Users (CustomUser) - centralized here
// Client (CustomUser) APIs should live in clients.ts
export interface AdminUserItem {
  id: number
  email: string
  first_name: string
  last_name: string
  role: string
  is_verified: boolean
  is_active: boolean
  date_joined: string
  last_login?: string | null
}

export async function listAdminUsers(params?: { page?: number; page_size?: number; search?: string }) {
  const resp = await apiClient.get<AdminUserItem[] | { results: AdminUserItem[]; count: number }>(`/admin-users/`, { params })
  const data = resp.data as AdminUserItem[] | { results: AdminUserItem[]; count: number }
  if (Array.isArray(data)) return { items: data, count: data.length }
  return { items: data.results ?? [], count: data.count ?? (data.results?.length ?? 0) }
}

export async function updateAdminUserRole(userId: number, role: string) {
  const resp = await apiClient.patch<AdminUserItem>(`/admin-users/${userId}/`, { role })
  return resp.data
}

export async function updateAdminUser(userId: number, payload: Partial<Pick<AdminUserItem, 'first_name' | 'last_name' | 'is_active' | 'role'>>) {
  const resp = await apiClient.patch<AdminUserItem>(`/admin-users/${userId}/`, payload)
  return resp.data
}

export async function changeAdminPassword(current_password: string, new_password: string) {
  // Backend endpoint to be implemented server-side
  const resp = await apiClient.post<{ detail: string }>(`/auth/change-password/`, {
    current_password,
    new_password,
  })
  return resp.data
}

// Vendors - centralized here (optional usage)
// Vendor APIs are not exposed in admin app per separation of concerns


// ========== Content Management (Service Areas, Categories, Car Brands) ==========

// Service Areas
export interface ServiceArea {
  id: number
  name: string
  description?: string
}

type ListResult<T> = { items: T[]; count: number }

export async function listServiceAreas(params?: { page?: number; page_size?: number; search?: string }) {
  const resp = await apiClient.get<ServiceArea[] | { results: ServiceArea[]; count: number }>(
    '/service-areas/',
    { params }
  )
  const data = resp.data as { results: ServiceArea[]; count: number; total_pages: number }
  if (Array.isArray(data)) return { items: data, count: data.length } as ListResult<ServiceArea>
  return { items: data.results ?? [], count: data.count ?? (data.results?.length ?? 0) } as ListResult<ServiceArea>
}

export async function createServiceArea(payload: Omit<ServiceArea, 'id'>) {
  const resp = await apiClient.post<ServiceArea>('/service-areas/', payload)
  return resp.data
}

export async function updateServiceArea(id: number, payload: Partial<Omit<ServiceArea, 'id'>>) {
  const resp = await apiClient.patch<ServiceArea>(`/service-areas/${id}/`, payload)
  return resp.data
}

export async function deleteServiceArea(id: number) {
  await apiClient.delete(`/service-areas/${id}/`)
}

// Categories
export interface Category {
  id: number
  name: string
  description?: string
  service_area: number
}

export async function listCategories(params?: { page?: number; page_size?: number; search?: string; service_area?: number }) {
  const resp = await apiClient.get<Category[] | { results: Category[]; count: number }>(
    '/categories/',
    { params }
  )
  const data = resp.data as { results: Category[]; count: number; total_pages: number }
  if (Array.isArray(data)) return { items: data, count: data.length } as ListResult<Category>
  return { items: data.results ?? [], count: data.count ?? (data.results?.length ?? 0) } as ListResult<Category>
}

export async function createCategory(payload: Omit<Category, 'id'>) {
  const resp = await apiClient.post<Category>('/categories/', payload)
  return resp.data
}

export async function updateCategory(id: number, payload: Partial<Omit<Category, 'id'>>) {
  const resp = await apiClient.patch<Category>(`/categories/${id}/`, payload)
  return resp.data
}

export async function deleteCategory(id: number) {
  await apiClient.delete(`/categories/${id}/`)
}

// Car Brands
export interface CarBrand {
  id: number
  name: string
  description?: string
  is_active: boolean
  logo?: string | null
  created_at?: string
  updated_at?: string
}

export async function listCarBrands(params?: { page?: number; page_size?: number; search?: string; is_active?: boolean }) {
  const resp = await apiClient.get<CarBrand[] | { results: CarBrand[]; count: number }>(
    '/car-brands/',
    { params }
  )
  const data = resp.data as { results: CarBrand[]; count: number; total_pages: number }
  if (Array.isArray(data)) return { items: data, count: data.length } as ListResult<CarBrand>
  return { items: data.results ?? [], count: data.count ?? (data.results?.length ?? 0) } as ListResult<CarBrand>
}

export async function createCarBrand(payload: { name: string; description?: string; is_active?: boolean; logo_file?: File | null }) {
  // Use multipart when a file is provided; otherwise JSON
  if (payload.logo_file) {
    const form = new FormData()
    form.append('name', payload.name)
    if (payload.description) form.append('description', payload.description)
    if (typeof payload.is_active === 'boolean') form.append('is_active', String(payload.is_active))
    form.append('logo', payload.logo_file)
    const resp = await apiClient.post<CarBrand>('/car-brands/', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return resp.data
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { logo_file, ...data } = payload
  const resp = await apiClient.post<CarBrand>('/car-brands/', data)
  return resp.data
}

export async function updateCarBrand(id: number, payload: { name?: string; description?: string; is_active?: boolean; logo_file?: File | null }) {
  if (payload.logo_file) {
    const form = new FormData()
    if (payload.name) form.append('name', payload.name)
    if (payload.description) form.append('description', payload.description)
    if (typeof payload.is_active === 'boolean') form.append('is_active', String(payload.is_active))
    form.append('logo', payload.logo_file)
    const resp = await apiClient.patch<CarBrand>(`/car-brands/${id}/`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return resp.data
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { logo_file, ...data } = payload
  const resp = await apiClient.patch<CarBrand>(`/car-brands/${id}/`, data)
  return resp.data
}

export async function deleteCarBrand(id: number) {
  await apiClient.delete(`/car-brands/${id}/`)
}

// ========== Support (Tickets & Messages) ==========
export interface SupportTicket {
  id: number
  subject: string
  message: string
  status: 'open' | 'pending' | 'resolved' | 'closed'
  user: number | null
  user_email?: string
  user_name?: string
  created_at: string
  updated_at: string
}

export interface SupportMessage {
  id: number
  ticket: number
  content: string
  user: number | null
  user_email?: string
  user_name?: string
  created_at: string
}

export async function listSupportTickets(params?: { page?: number; page_size?: number; search?: string; status?: string }) {
  const resp = await apiClient.get<SupportTicket[] | { results: SupportTicket[]; count: number }>(`/support-tickets/`, { params })
  const data = resp.data as { results: SupportTicket[]; count: number; total_pages: number }
  if (Array.isArray(data)) return { items: data, count: data.length }
  return { items: data.results ?? [], count: data.count ?? (data.results?.length ?? 0) }
}

export async function getSupportTicket(id: number) {
  const resp = await apiClient.get<SupportTicket>(`/support-tickets/${id}/`)
  return resp.data
}

export async function listSupportMessages(ticketId: number) {
  const resp = await apiClient.get<SupportMessage[] | { results: SupportMessage[] }>(`/support-messages/`, { params: { ticket: ticketId, page_size: 500 } })
  const data = resp.data as { results: SupportMessage[]; count: number; total_pages: number }
  return Array.isArray(data) ? data : (data.results ?? [])
}

export async function sendSupportMessage(ticketId: number, content: string) {
  const resp = await apiClient.post<SupportMessage>(`/support-messages/`, { ticket: ticketId, content })
  return resp.data
}

export async function updateSupportTicket(id: number, payload: Partial<Pick<SupportTicket, 'status' | 'subject' | 'message'>>) {
  const resp = await apiClient.patch<SupportTicket>(`/support-tickets/${id}/`, payload)
  return resp.data
}


// ========== Blog (Categories, Posts, Upload, SEO helpers) ==========
export interface BlogCategory {
  id: number
  name: string
  slug: string
  description?: string
  created_at: string
}

export interface BlogPost {
  id: number
  title: string
  slug: string
  content: string
  excerpt: string
  status: 'draft' | 'published' | 'archived'
  category?: number
  category_name?: string
  author: number
  author_name: string
  is_featured: boolean
  view_count: number
  published_at?: string
  created_at: string
  updated_at: string
  meta_title?: string
  meta_description?: string
  meta_keywords?: string
  canonical_url?: string
  og_title?: string
  og_description?: string
  og_image?: string
  featured_image?: string
}

export interface BlogPostListResponse {
  results: BlogPost[]
  count: number
  page: number
  page_size: number
  total_pages: number
}

export async function listBlogCategories(): Promise<BlogCategory[]> {
  const response = await apiClient.get<BlogCategory[] | { results: BlogCategory[]; count?: number }>(
    '/blog-categories/'
  )
  const data = response.data as { results: BlogCategory[]; count: number }
  return Array.isArray(data) ? data : (data?.results ?? [])
}

export async function createBlogCategory(data: Partial<BlogCategory>): Promise<BlogCategory> {
  const response = await apiClient.post<BlogCategory>('/blog-categories/', data)
  return response.data
}

export async function updateBlogCategory(id: number, data: Partial<BlogCategory>): Promise<BlogCategory> {
  const response = await apiClient.put<BlogCategory>(`/blog-categories/${id}/`, data)
  return response.data
}

export async function deleteBlogCategory(id: number): Promise<void> {
  await apiClient.delete(`/blog-categories/${id}/`)
}

export async function listBlogPosts(params?: {
  page?: number
  page_size?: number
  search?: string
  status?: string
  category?: number
}): Promise<BlogPostListResponse> {
  const searchParams = new URLSearchParams()
  if (params?.page) searchParams.append('page', params.page.toString())
  if (params?.page_size) searchParams.append('page_size', params.page_size.toString())
  if (params?.search) searchParams.append('search', params.search)
  if (params?.status) searchParams.append('status', params.status)
  if (params?.category) searchParams.append('category', params.category.toString())
  const url = `/blog-posts/${searchParams.toString() ? `?${searchParams.toString()}` : ''}`
  const response = await apiClient.get<BlogPostListResponse>(url)
  return response.data
}

export async function getBlogPost(id: number): Promise<BlogPost> {
  const response = await apiClient.get<BlogPost>(`/blog-posts/${id}/`)
  return response.data
}

export async function createBlogPost(data: Partial<BlogPost>): Promise<BlogPost> {
  const response = await apiClient.post<BlogPost>('/blog-posts/', data)
  return response.data
}

export async function updateBlogPost(id: number, data: Partial<BlogPost>): Promise<BlogPost> {
  const response = await apiClient.put<BlogPost>(`/blog-posts/${id}/`, data)
  return response.data
}

export async function deleteBlogPost(id: number): Promise<void> {
  await apiClient.delete(`/blog-posts/${id}/`)
}

export async function uploadImage(file: File): Promise<{ url: string }> {
  const formData = new FormData()
  formData.append('image', file)
  const response = await apiClient.post<{ url: string }>('/upload-image/', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return response.data
}

export function generateSlug(title: string): string {
  if (!title) return ''
  const turkishMap: Record<string, string> = {
    'Ç': 'C', 'ç': 'c', 'Ğ': 'G', 'ğ': 'g', 'İ': 'I', 'I': 'I', 'ı': 'i',
    'Ö': 'O', 'ö': 'o', 'Ş': 'S', 'ş': 's', 'Ü': 'U', 'ü': 'u'
  }
  const mapped = title.split('').map((ch) => turkishMap[ch] ?? ch).join('')
  return mapped
    .normalize('NFD')
    .replace(/\p{Diacritic}+/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

// ========== Admin Role Management ==========
export interface AdminRole {
  key: string
  name: string
  description: string
  permissions: Record<string, { read: boolean; write: boolean; delete: boolean }>
}

export interface AdminUserCreateData {
  email: string
  first_name: string
  last_name: string
  password: string
  role: string
}

export async function getAdminRoles(): Promise<AdminRole[]> {
  const resp = await apiClient.get<AdminRole[]>('/roles/')
  return resp.data
}

export async function updateAdminRoles(roles: AdminRole[]): Promise<{ message: string }> {
  const resp = await apiClient.post<{ message: string }>('/roles/', { roles })
  return resp.data
}

export async function createAdminUser(data: AdminUserCreateData): Promise<AdminUserItem> {
  const resp = await apiClient.post<AdminUserItem>('/admin-users/', data)
  return resp.data
}

// ========== Server Monitoring API ==========
export interface ServerMetrics {
  cpu_usage: string
  cpu_raw: number
  memory_usage: string
  memory_raw: number
  memory_used: string
  memory_total: string
  disk_usage: string
  disk_percentage: string
  disk_raw: number
  network_in: string
  network_out: string
  bandwidth_usage: string
  bandwidth_raw: number
  uptime: number
  load_average: number[]
}

export interface ServerInfo {
  id: string
  name: string
  os: string
  ip_address: string
  status: string
  region: string
  created_at: string
  ssh_command: string
  metrics: ServerMetrics
}

export interface ServerMonitoringResponse {
  servers: ServerInfo[]
  total_servers: number
  timestamp: string
}

export async function getServerMonitoring(): Promise<ServerMonitoringResponse> {
  const resp = await apiClient.get<ServerMonitoringResponse>('/servers/')
  return resp.data
}

export async function getServerDetail(serverId: string): Promise<ServerInfo> {
  const resp = await apiClient.get<ServerInfo>(`/servers/${serverId}/`)
  return resp.data
}

export async function performServerAction(serverId: string, action: string): Promise<{ message: string; action: string; server_id: string }> {
  const resp = await apiClient.post<{ message: string; action: string; server_id: string }>(`/servers/${serverId}/action/`, { action })
  return resp.data
}