import { apiClient } from './api'

export interface ClientListItem {
  id: number
  email: string
  first_name: string
  last_name: string
  role: 'client' | 'vendor' | string
  is_verified?: boolean
  date_joined?: string
  last_login?: string | null
  phone_number?: string | null
}

export async function fetchClients(params?: { search?: string; page?: number; page_size?: number }) {
  const resp = await apiClient.get<{ results: ClientListItem[]; count: number }>('/users/', { params })
  const data = resp.data
  if (Array.isArray(data)) {
    return { count: data.length, next: null, previous: null, results: data as ClientListItem[] }
  }
  return data as { count: number; next: string | null; previous: string | null; results: ClientListItem[] }
}

export async function fetchClient(id: number) {
  const resp = await apiClient.get<ClientListItem>(`/users/${id}/`)
  return resp.data
}

export async function createClient(data: {
  email: string
  first_name?: string
  last_name?: string
  phone_number?: string
  password?: string
  role?: 'client' | 'vendor'
  is_verified?: boolean
  is_active?: boolean
}) {
  const resp = await apiClient.post<ClientListItem>('/users/', data)
  return resp.data
}

export async function updateClient(id: number, data: Partial<ClientListItem>) {
  const resp = await apiClient.patch<ClientListItem>(`/users/${id}/`, data)
  return resp.data
}

export async function deleteClient(id: number) {
  await apiClient.delete(`/users/${id}/`)
}

// Review interfaces and functions
export interface ReviewItem {
  id: number
  vendor: number
  vendor_display_name: string
  user: number
  user_email: string
  user_name: string
  service: number | null
  service_name: string | null
  rating: number
  comment: string
  service_date: string
  is_read: boolean
  created_at: string
  updated_at: string
}

export interface ReviewsResponse {
  results: ReviewItem[]
  count: number
  page: number
  page_size: number
  total_pages: number
}

export async function fetchReviews(params?: {
  search?: string
  user?: number
  vendor?: number
  rating?: number
  is_read?: boolean
  page?: number
  page_size?: number
}) {
  const resp = await apiClient.get<ReviewsResponse>('/reviews/', { params })
  return resp.data
}

export async function getReview(id: number) {
  const resp = await apiClient.get<ReviewItem>(`/reviews/${id}/`)
  return resp.data
}

export async function updateReview(id: number, payload: Partial<ReviewItem>) {
  const resp = await apiClient.patch<ReviewItem>(`/reviews/${id}/`, payload)
  return resp.data
}

export async function deleteReview(id: number) {
  await apiClient.delete(`/reviews/${id}/`)
}


