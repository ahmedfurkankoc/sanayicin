'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ChevronRight, Home } from 'lucide-react'

function toTitle(segment: string): string {
  const map: Record<string, string> = {
    '': 'Dashboard',
    'users': 'Kullanıcılar',
    'vendors': 'Esnaflar',
    'blog': 'Blog',
    'support': 'Destek',
    'content': 'İçerik',
    'analytics': 'İstatistikler',
    'logs': 'Kayıtlar',
    'definitions': 'Tanımlamalar',
    'settings': 'Ayarlar',
    'new': 'Yeni',
    'edit': 'Düzenle',
  }
  return map[segment] || segment
}

export default function Breadcrumbs() {
  const pathname = usePathname()
  const segments = (pathname || '/').split('/').filter(Boolean)

  const crumbs = [] as Array<{ href: string; label: string; isLast: boolean }>
  let hrefAcc = ''
  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i]
    hrefAcc += `/${seg}`
    const isLast = i === segments.length - 1
    const isIdLike = /^(\d+|[a-f0-9-]{6,})$/i.test(seg)
    const label = isIdLike ? `#${seg}` : toTitle(seg)
    crumbs.push({ href: hrefAcc || '/', label, isLast })
  }

  // Ensure root when at "/"
  if (crumbs.length === 0) {
    crumbs.push({ href: '/', label: 'Dashboard', isLast: true })
  }

  return (
    <nav aria-label="Breadcrumb" className="flex items-center text-sm text-gray-600 mb-4">
      <Link href="/" className="inline-flex items-center text-gray-700 hover:text-gray-900">
        <Home className="h-4 w-4 mr-1" />
        Dashboard
      </Link>
      {crumbs
        .filter(c => c.href !== '/')
        .map((c) => (
          <span key={c.href} className="inline-flex items-center">
            <ChevronRight className="h-4 w-4 mx-2 text-gray-400" />
            {c.isLast ? (
              <span className="text-gray-900 font-medium">{c.label}</span>
            ) : (
              <Link href={c.href} className="hover:text-gray-900">
                {c.label}
              </Link>
            )}
          </span>
        ))}
    </nav>
  )
}


