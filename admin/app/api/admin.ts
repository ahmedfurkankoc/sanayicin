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
  users_change_pct: number
  vendors_change_pct: number
  support_change_pct: number
  blog_change_pct: number
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

// Users (CustomUser) - centralized here
// Client (CustomUser) APIs should live in clients.ts

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
  const data = resp.data as any
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
  const data = resp.data as any
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
  const data = resp.data as any
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
  const data = resp.data as any
  if (Array.isArray(data)) return { items: data, count: data.length }
  return { items: data.results ?? [], count: data.count ?? (data.results?.length ?? 0) }
}

export async function getSupportTicket(id: number) {
  const resp = await apiClient.get<SupportTicket>(`/support-tickets/${id}/`)
  return resp.data
}

export async function listSupportMessages(ticketId: number) {
  const resp = await apiClient.get<SupportMessage[] | { results: SupportMessage[] }>(`/support-messages/`, { params: { ticket: ticketId, page_size: 500 } })
  const data = resp.data as any
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
  const data = response.data as any
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