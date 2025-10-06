import { apiClient } from './api'

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
  
  // SEO Fields
  meta_title?: string
  meta_description?: string
  meta_keywords?: string
  canonical_url?: string
  
  // Social Media
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

// Blog Categories
export async function listBlogCategories(): Promise<BlogCategory[]> {
  const response = await apiClient.get<BlogCategory[]>('/blog-categories/')
  return response.data
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

// Blog Posts
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

// Image Upload
export async function uploadImage(file: File): Promise<{ url: string }> {
  const formData = new FormData()
  formData.append('image', file)
  
  const response = await apiClient.post<{ url: string }>('/upload-image/', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  })
  
  return response.data
}

// SEO Helpers
export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
}

export function validateMetaTitle(title: string): { valid: boolean; message?: string } {
  if (title.length === 0) {
    return { valid: false, message: 'Meta başlık boş olamaz' }
  }
  if (title.length > 60) {
    return { valid: false, message: 'Meta başlık 60 karakterden uzun olamaz' }
  }
  return { valid: true }
}

export function validateMetaDescription(description: string): { valid: boolean; message?: string } {
  if (description.length === 0) {
    return { valid: false, message: 'Meta açıklama boş olamaz' }
  }
  if (description.length > 160) {
    return { valid: false, message: 'Meta açıklama 160 karakterden uzun olamaz' }
  }
  return { valid: true }
}
