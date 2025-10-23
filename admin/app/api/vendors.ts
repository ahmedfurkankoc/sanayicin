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


