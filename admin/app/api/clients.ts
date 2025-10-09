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


