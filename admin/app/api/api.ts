import axios from 'axios'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api/admin'

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
})

export interface PaginatedResponse<T> {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}


