import { apiClient, PaginatedResponse } from './api'

export interface VendorItem {
  id: number
  user: number
  display_name: string
  city?: string
  district?: string
  created_at?: string
}

export async function fetchVendors(params?: { search?: string; page?: number; page_size?: number }) {
  const resp = await apiClient.get<PaginatedResponse<VendorItem>>('/vendors/', { params })
  return resp.data
}


