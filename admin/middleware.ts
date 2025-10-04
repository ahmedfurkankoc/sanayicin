import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Admin rolleri
const ADMIN_ROLES = ['admin', 'editor', 'support']

// Permission matrisi
const PERMISSION_MATRIX: { [key: string]: string[] } = {
  '/': ['dashboard'],
  '/users': ['users'],
  '/vendors': ['vendors'],
  '/support': ['support'],
  '/blog': ['blog'],
  '/content': ['content'],
  '/analytics': ['analytics'],
  '/settings': ['settings'],
  '/logs': ['logs'],
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Login sayfasına erişim serbest
  if (pathname === '/login') {
    return NextResponse.next()
  }

  // Token kontrolü
  const token = request.cookies.get('admin_token')?.value || 
                request.headers.get('authorization')?.replace('Bearer ', '')

  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  try {
    // Token'ı backend'e gönder ve doğrula
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/user/`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      return NextResponse.redirect(new URL('/login', request.url))
    }

    const userData = await response.json()
    
    // Admin rolü kontrolü
    if (!ADMIN_ROLES.includes(userData.role) && !userData.is_superuser) {
      return NextResponse.redirect(new URL('/login', request.url))
    }

    // Permission kontrolü
    const requiredPermission = getRequiredPermission(pathname)
    if (requiredPermission && !hasPermission(userData, requiredPermission)) {
      return NextResponse.redirect(new URL('/unauthorized', request.url))
    }

    // Token'ı header'a ekle
    const requestHeaders = new Headers(request.headers)
    requestHeaders.set('x-user-id', userData.id?.toString() || '')
    requestHeaders.set('x-user-role', userData.role || '')
    requestHeaders.set('x-is-superuser', userData.is_superuser?.toString() || 'false')

    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    })

  } catch (error) {
    console.error('Token verification failed:', error)
    return NextResponse.redirect(new URL('/login', request.url))
  }
}

function getRequiredPermission(pathname: string): string | null {
  for (const [path, permissions] of Object.entries(PERMISSION_MATRIX)) {
    if (pathname.startsWith(path)) {
      return permissions[0]
    }
  }
  return null
}

function hasPermission(user: any, permission: string): boolean {
  // Superuser her şeye erişebilir
  if (user.is_superuser) return true

  // Rol bazlı permission kontrolü
  const rolePermissions: { [key: string]: string[] } = {
    admin: ['dashboard', 'users', 'vendors', 'support', 'blog', 'content', 'analytics', 'settings', 'logs'],
    editor: ['dashboard', 'blog', 'content', 'analytics'],
    support: ['dashboard', 'support', 'logs'],
  }

  return rolePermissions[user.role]?.includes(permission) || false
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}




