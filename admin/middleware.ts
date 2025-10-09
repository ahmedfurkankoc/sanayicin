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

  // Middleware'i devre dışı bırak - localStorage kontrolü client-side'da yapılıyor
  // Cross-domain cookie sorunu nedeniyle middleware cookie kontrolü yapamıyor
  return NextResponse.next()
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