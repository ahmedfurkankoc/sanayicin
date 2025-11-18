import { apiClient, PaginatedResponse } from './api'

export interface VendorItem {
  id: number
  user: number
  display_name: string
  city?: string
  district?: string
  created_at?: string
}

export interface VendorProfile {
  id: number
  user: number
  user_email: string
  user_name: string
  slug: string
  business_type: 'sahis' | 'limited' | 'anonim' | 'esnaf'
  company_title: string
  tax_office: string
  tax_no: string
  display_name: string
  about: string
  business_phone: string
  address: string
  city: string
  district: string
  subdistrict: string
  social_media: Record<string, string>
  working_hours: Record<string, string>
  unavailable_dates: string[]
  manager_birthdate: string
  manager_tc: string
  created_at: string
  updated_at: string
  user_is_verified: boolean
  service_areas: number[]
  categories: number[]
  car_brands: number[]
}

export async function fetchVendors(params?: { search?: string; page?: number; page_size?: number }) {
  const resp = await apiClient.get<PaginatedResponse<VendorItem>>('/vendors/', { params })
  return resp.data
}

export async function listVendors(params?: { page?: number; page_size?: number; search?: string; is_verified?: boolean }) {
  const resp = await apiClient.get<{ results: VendorProfile[]; count: number; page: number; page_size: number; total_pages: number }>(`/vendors/`, { params })
  const data = resp.data
  return { items: data.results ?? [], count: data.count ?? 0 }
}

export async function getVendor(id: number) {
  const resp = await apiClient.get<VendorProfile>(`/vendors/${id}/`)
  return resp.data
}

export async function updateVendor(id: number, payload: Partial<VendorProfile>) {
  const resp = await apiClient.patch<VendorProfile>(`/vendors/${id}/`, payload)
  return resp.data
}

export async function verifyVendor(id: number) {
  const resp = await apiClient.patch<VendorProfile>(`/vendors/${id}/`, { user: { is_verified: true } })
  return resp.data
}

export async function unverifyVendor(id: number) {
  const resp = await apiClient.patch<VendorProfile>(`/vendors/${id}/`, { user: { is_verified: false } })
  return resp.data
}

export async function deleteVendor(id: number) {
  await apiClient.delete(`/vendors/${id}/`)
}

export interface VendorSearchResult {
  id: number
  display_name: string
}

export interface VendorSearchResponse {
  results: VendorSearchResult[]
  count: number
}

export async function searchVendorsMinimal(searchQuery: string): Promise<VendorSearchResponse> {
  const resp = await apiClient.get<VendorSearchResponse>(`/vendors/search-minimal/`, { 
    params: { q: searchQuery } 
  })
  return resp.data
}

export async function createVendor(data: {
  user: number
  business_type: 'sahis' | 'limited' | 'anonim' | 'esnaf'
  company_title: string
  tax_office: string
  tax_no: string
  display_name: string
  about?: string
  business_phone: string
  address: string
  city: string
  district: string
  subdistrict?: string
  manager_birthdate: string
  manager_tc: string
  social_media?: Record<string, string>
  working_hours?: Record<string, string>
  unavailable_dates?: string[]
}) {
  const resp = await apiClient.post<VendorProfile>('/vendors/', data)
  return resp.data
}

export interface VendorDetailedStats {
  vendor: VendorProfile
  statistics: {
    total_requests: number
    pending_requests: number
    responded_requests: number
    completed_requests: number
    cancelled_requests: number
    quotes: number
    total_appointments: number
    pending_appointments: number
    confirmed_appointments: number
    completed_appointments: number
    cancelled_appointments: number
    total_reviews: number
    average_rating: number
  }
  service_requests: Array<{
    id: number
    title: string
    description: string
    request_type: string
    status: string
    status_code: string
    client_name: string
    client_email: string
    client_phone: string
    service: string | null
    vehicle_info: string
    last_offered_price: number | null
    last_offered_days: number | null
    cancellation_reason: string
    created_at: string
    updated_at: string
  }>
  appointments: Array<{
    id: number
    client_name: string
    client_phone: string
    client_email: string
    service_description: string
    appointment_date: string
    appointment_time: string
    status: string
    status_code: string
    notes: string
    created_at: string
    updated_at: string
  }>
  reviews: Array<{
    id: number
    user_name: string
    user_email: string
    service: string | null
    rating: number
    comment: string
    service_date: string | null
    is_read: boolean
    created_at: string
  }>
  cancelled_requests: Array<{
    id: number
    title: string
    description: string
    request_type: string
    client_name: string
    client_email: string
    cancellation_reason: string
    created_at: string
    cancelled_at: string
  }>
  quotes: Array<{
    id: number
    title: string
    description: string
    status: string
    status_code: string
    client_name: string
    client_email: string
    service: string | null
    last_offered_price: number | null
    last_offered_days: number | null
    created_at: string
    updated_at: string
  }>
}

export async function getVendorDetailedStats(id: number): Promise<VendorDetailedStats> {
  const resp = await apiClient.get<VendorDetailedStats>(`/vendors/${id}/detailed-stats/`)
  return resp.data
}


