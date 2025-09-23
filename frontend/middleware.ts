import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Public sayfalar - authentication gerekmez
  const publicPaths = [
    '/',
    '/hakkimizda',
    '/nasil-calisir',
    '/neden-esnaf',
    '/iletisim',
    '/kullanim-kosullari',
    '/kullanici-sozlesmesi',
    '/kvkk-aydinlatma-metni',
    '/cerez-aydinlatma-metni',
    '/cerez-tercihleri',
    '/icerik-politikasi',
    '/icerik-moderasyon-politikasi',
    '/esnaf-sozlesmesi',
    '/hizmet-vermek',
    '/en-yakin',
    '/usta-ariyorum',
    '/musteri/arama-sonuclari' // Arama sonuçları sayfası public
  ]
  
  // Müşteri sayfaları - client token gerekir
  const musteriPaths = [
    '/musteri'
  ]
  
  // Esnaf sayfaları - vendor token gerekir
  const esnafPaths = [
    '/esnaf'
  ]
  
  // Auth sayfaları - zaten giriş yapmış kullanıcıları yönlendir
  const authPaths = [
    '/musteri/giris',
    '/musteri/kayit',
    '/musteri/sifremi-unuttum',
    '/musteri/email-dogrula',
    '/esnaf/giris',
    '/esnaf/kayit',
    '/esnaf/sifremi-unuttum',
    '/esnaf/email-dogrula',
    '/esnaf/sms-dogrula'
  ]
  
  // Public sayfa kontrolü
  if (publicPaths.some(path => pathname === path || pathname.startsWith(path + '/'))) {
    return NextResponse.next()
  }
  
  // Token kontrolü
  const clientToken = request.cookies.get('client_token')?.value
  const vendorToken = request.cookies.get('vendor_token')?.value
  
  // Müşteri sayfaları kontrolü
  if (musteriPaths.some(path => pathname.startsWith(path))) {
    // Auth sayfaları hariç
    if (authPaths.some(path => pathname.startsWith(path))) {
      // Eğer zaten giriş yapmışsa ana sayfaya yönlendir
      if (clientToken || vendorToken) {
        const redirectUrl = new URL('/musteri', request.url)
        return NextResponse.redirect(redirectUrl)
      }
      return NextResponse.next()
    }
    
    // Müşteri sayfaları için token kontrolü
    if (!clientToken && !vendorToken) {
      const redirectUrl = new URL('/musteri/giris', request.url)
      redirectUrl.searchParams.set('next', pathname)
      return NextResponse.redirect(redirectUrl)
    }
  }
  
  // Esnaf sayfaları kontrolü
  if (esnafPaths.some(path => pathname.startsWith(path))) {
    // Auth sayfaları hariç
    if (authPaths.some(path => pathname.startsWith(path))) {
      // Eğer zaten giriş yapmışsa ana sayfaya yönlendir
      if (vendorToken) {
        const redirectUrl = new URL('/esnaf/panel', request.url)
        return NextResponse.redirect(redirectUrl)
      }
      return NextResponse.next()
    }
    
    // Esnaf sayfaları için vendor token kontrolü
    if (!vendorToken) {
      const redirectUrl = new URL('/esnaf/giris', request.url)
      redirectUrl.searchParams.set('next', pathname)
      return NextResponse.redirect(redirectUrl)
    }
  }
  
  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!api|_next/static|_next/image|favicon.ico|public).*)',
  ],
}
