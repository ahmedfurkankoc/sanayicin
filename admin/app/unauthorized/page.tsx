'use client'

import { Shield, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
            <Shield className="h-6 w-6 text-red-600" />
          </div>
          <h1 className="mt-4 text-3xl font-bold text-gray-900">
            Erişim Reddedildi
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            Bu sayfaya erişim yetkiniz bulunmuyor.
          </p>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <div className="text-center">
            <h2 className="text-lg font-medium text-gray-900 mb-4">
              Yetkisiz Erişim
            </h2>
            <p className="text-sm text-gray-600 mb-6">
              Bu sayfaya erişmek için gerekli izinlere sahip değilsiniz.
              <br />
              Lütfen sistem yöneticinizle iletişime geçin.
            </p>
            
            <div className="space-y-3">
              <Link
                href="/"
                className="w-full flex justify-center items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-[color:var(--black)] bg-[color:var(--yellow)] hover:brightness-95 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[color:var(--yellow)]"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Ana Sayfaya Dön
              </Link>
              
              <button
                onClick={() => window.history.back()}
                className="w-full flex justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[color:var(--yellow)]"
              >
                Önceki Sayfaya Dön
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}