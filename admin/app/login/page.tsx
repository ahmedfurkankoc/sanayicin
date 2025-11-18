'use client'

import { useState } from 'react'
import { Eye, EyeOff, Lock, Mail, AlertCircle } from 'lucide-react'
import Image from 'next/image'
import axios from 'axios'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api/admin'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  
  // SMS OTP state
  const [requiresSmsVerification, setRequiresSmsVerification] = useState(false)
  const [smsToken, setSmsToken] = useState('')
  const [phoneLast4, setPhoneLast4] = useState('')
  const [smsCode, setSmsCode] = useState(['', '', '', '', '', ''])
  const [smsCodeInputs] = useState<Array<HTMLInputElement | null>>([null, null, null, null, null, null])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      // Eğer SMS doğrulaması gerekiyorsa, SMS kodunu gönder
      if (requiresSmsVerification && smsToken) {
        const code = smsCode.join('')
        if (code.length !== 6) {
          setError('Lütfen 6 haneli SMS kodunu girin')
          setIsLoading(false)
          return
        }

        const response = await axios.post(`${API_BASE_URL}/auth/login/`, {
          token: smsToken,
          sms_code: code
        }, {
          withCredentials: true
        })
      
        if (response.data.user) {
          // Login başarılı - HttpOnly cookie set edildi
          // Sayfayı yenile ki AuthContext initializeAuth çalışsın
          window.location.href = '/'
        } else {
          setError('Geçersiz SMS kodu')
        }
        setIsLoading(false)
        return
      }

      // İlk aşama: email/password gönder
      const response = await axios.post(`${API_BASE_URL}/auth/login/`, {
        email,
        password
      }, {
        withCredentials: true
      })

      if (response.data.requires_sms_verification) {
        // SMS doğrulaması gerekiyor
        setRequiresSmsVerification(true)
        setSmsToken(response.data.token)
        setPhoneLast4(response.data.phone_last_4 || '')
        setError('')
      } else if (response.data.user) {
        // Direkt login başarılı (SMS kapalıysa)
        window.location.href = '/'
      } else {
        setError('Geçersiz kimlik bilgileri veya admin erişim yetkisi yok')
      }
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } } }
      setError(error.response?.data?.error || 'Giriş yapılırken bir hata oluştu')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSmsCodeChange = (index: number, value: string) => {
    // Sadece rakam kabul et
    if (value && !/^\d$/.test(value)) return

    const newCode = [...smsCode]
    newCode[index] = value
    setSmsCode(newCode)

    // Otomatik sonraki input'a geç
    if (value && index < 5) {
      smsCodeInputs[index + 1]?.focus()
    }
  }

  const handleSmsCodeKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    // Backspace ile önceki input'a geç
    if (e.key === 'Backspace' && !smsCode[index] && index > 0) {
      smsCodeInputs[index - 1]?.focus()
    }
  }

  const handleSmsCodePaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const pastedData = e.clipboardData.getData('text').slice(0, 6)
    if (/^\d{1,6}$/.test(pastedData)) {
      const newCode = pastedData.split('').concat(Array(6 - pastedData.length).fill(''))
      setSmsCode(newCode)
      // Son dolu input'a focus
      const lastIndex = Math.min(pastedData.length - 1, 5)
      smsCodeInputs[lastIndex]?.focus()
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Left Side - Background Image */}
      <div className="hidden lg:flex lg:w-3/5 relative">
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: "url('/images/car-repair-illustration-concept-vector.jpg')"
          }}
        />
        <div className="absolute inset-0 bg-black/20"></div>
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-2/5 flex flex-col justify-center py-12 px-6 sm:px-12">
        <div className="max-w-md mx-auto w-full">
          {/* Logo */}
          <div className="flex justify-center mb-8">
            <div className="w-16 h-16 flex items-center justify-center">
              <Image 
                src="/sanayicin-icon.png" 
                alt="Sanayicin Logo" 
                width={64}
                height={64}
                className="w-full h-full object-contain animate-spin-slow"
              />
            </div>
          </div>

          {/* Title */}
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              {requiresSmsVerification ? 'SMS Doğrulama' : 'Giriş Yap'}
            </h1>
            <p className="text-gray-600">
              {requiresSmsVerification 
                ? `Telefon numaranızın son 4 hanesi (****${phoneLast4}) numarasına gönderilen kodu girin`
                : 'Admin paneline giriş yapın'}
            </p>
          </div>

          {/* Login Form */}
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex">
                  <AlertCircle className="h-5 w-5 text-red-400" />
                  <div className="ml-3">
                    <p className="text-sm text-red-800">{error}</p>
                  </div>
                </div>
              </div>
            )}

            {!requiresSmsVerification ? (
              <>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                E-posta Adresi *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="appearance-none block w-full pl-12 pr-3 py-3 border border-gray-300 rounded-lg placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-gray-50"
                  placeholder="admin@sanayicin.com"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Şifre *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none block w-full pl-12 pr-12 py-3 border border-gray-300 rounded-lg placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-gray-50"
                  placeholder="••••••••"
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-gray-400 hover:text-gray-600 focus:outline-none"
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>
            </div>
              </>
            ) : (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-4 text-center">
                  SMS Doğrulama Kodu
                </label>
                <div className="flex justify-center gap-2">
                  {[0, 1, 2, 3, 4, 5].map((index) => (
                    <input
                      key={index}
                      ref={(el) => {
                        smsCodeInputs[index] = el
                      }}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={smsCode[index]}
                      onChange={(e) => handleSmsCodeChange(index, e.target.value)}
                      onKeyDown={(e) => handleSmsCodeKeyDown(index, e)}
                      onPaste={handleSmsCodePaste}
                      className="w-12 h-12 text-center text-lg font-semibold border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      autoFocus={index === 0}
                    />
                  ))}
                </div>
                <div className="mt-4 text-center">
                  <button
                    type="button"
                    onClick={() => {
                      setRequiresSmsVerification(false)
                      setSmsToken('')
                      setSmsCode(['', '', '', '', '', ''])
                      setError('')
                    }}
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    Geri dön
                  </button>
                </div>
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-black bg-yellow-400 hover:bg-yellow-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                style={{ backgroundColor: 'var(--yellow)' }}
              >
                {isLoading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-black mr-2"></div>
                    Giriş yapılıyor...
                  </div>
                ) : (
                  'Giriş Yap'
                )}
              </button>
            </div>
          </form>

          {/* Security Info */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <div className="text-center">
              <p className="text-xs text-gray-500 mb-3">
                Bu panel sadece yetkili admin kullanıcıları için tasarlanmıştır.
                <br />
                Tüm giriş denemeleri loglanır.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer - Right Side Bottom */}
      <div className="absolute bottom-0 right-0 lg:w-2/5 w-full bg-white border-t border-gray-200 py-4 px-6">
        <div className="max-w-md mx-auto text-center">
          <p className="text-xs text-gray-500 mb-2">
            Teknik destek ve yardım için:{' '}
            <a 
              href="mailto:info@monolitdigital.com"
              className="text-blue-600 hover:text-blue-800 transition-colors"
            >
              info@monolitdigital.com
            </a>
          </p>
          <p className="text-xs text-gray-400">
            <a 
              href="https://monolitdigital.com" 
              target="_blank" 
              rel="nofollow noreferrer"
              className="hover:text-gray-600 transition-colors"
            >
              Developed by Monolit Digital
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
