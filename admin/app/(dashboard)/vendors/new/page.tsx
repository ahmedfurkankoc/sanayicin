'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Save, Building2 } from 'lucide-react'
import { createClient } from '../../../api/clients'
import { createVendor } from '../../../api/vendors'
import { useTurkeyData } from '../../../hooks/useTurkeyData'

export default function NewVendorPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { cities, isLoading: turkeyDataLoading, loadTurkeyData, getDistricts, getNeighbourhoods } = useTurkeyData()
  const [districts, setDistricts] = useState<string[]>([])
  const [neighbourhoods, setNeighbourhoods] = useState<string[]>([])
  const [formData, setFormData] = useState({
    // User fields
    email: '',
    first_name: '',
    last_name: '',
    phone_number: '',
    password: '',
    is_verified: false,
    is_active: true,
    
    // Vendor fields
    business_type: 'esnaf' as 'sahis' | 'limited' | 'anonim' | 'esnaf',
    company_title: '',
    tax_office: '',
    tax_no: '',
    display_name: '',
    about: '',
    business_phone: '',
    address: '',
    city: '',
    district: '',
    subdistrict: '',
    manager_birthdate: '',
    manager_tc: '',
    social_media: {},
    working_hours: {},
    unavailable_dates: []
  })

  // Turkey data'yı yükle
  useEffect(() => {
    loadTurkeyData()
  }, [loadTurkeyData])

  // Şehir değiştiğinde ilçeleri yükle
  useEffect(() => {
    if (formData.city) {
      const cityDistricts = getDistricts(formData.city)
      setDistricts(cityDistricts)
      // İlçe ve mahalle alanlarını temizle
      setFormData(prev => ({ ...prev, district: '', subdistrict: '' }))
      setNeighbourhoods([])
    } else {
      setDistricts([])
      setNeighbourhoods([])
    }
  }, [formData.city, getDistricts])

  // İlçe değiştiğinde mahalleleri yükle
  useEffect(() => {
    if (formData.city && formData.district) {
      const districtNeighbourhoods = getNeighbourhoods(formData.city, formData.district)
      setNeighbourhoods(districtNeighbourhoods)
      // Mahalle alanını temizle
      setFormData(prev => ({ ...prev, subdistrict: '' }))
    } else {
      setNeighbourhoods([])
    }
  }, [formData.city, formData.district, getNeighbourhoods])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      // First create the user
      const newUser = await createClient({
        email: formData.email,
        first_name: formData.first_name,
        last_name: formData.last_name,
        phone_number: formData.phone_number,
        password: formData.password,
        role: 'vendor',
        is_verified: formData.is_verified,
        is_active: formData.is_active
      })

      // Then create the vendor profile
      await createVendor({
        user: newUser.id,
        business_type: formData.business_type,
        company_title: formData.company_title,
        tax_office: formData.tax_office,
        tax_no: formData.tax_no,
        display_name: formData.display_name,
        about: formData.about,
        business_phone: formData.business_phone,
        address: formData.address,
        city: formData.city,
        district: formData.district,
        subdistrict: formData.subdistrict,
        manager_birthdate: formData.manager_birthdate,
        manager_tc: formData.manager_tc,
        social_media: formData.social_media,
        working_hours: formData.working_hours,
        unavailable_dates: formData.unavailable_dates
      })

      router.push('/vendors')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Bir hata oluştu')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }))
  }

  const getBusinessTypeText = (type: string) => {
    const types = {
      'sahis': 'Şahıs Şirketi',
      'limited': 'Limited Şirketi', 
      'anonim': 'Anonim Şirketi',
      'esnaf': 'Esnaf'
    }
    return types[type as keyof typeof types] || type
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Yeni Esnaf</h1>
            <p className="text-gray-600">Yeni bir esnaf hesabı oluşturun</p>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="bg-white rounded-lg shadow">
        <form onSubmit={handleSubmit} className="p-6 space-y-8">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-800">{error}</p>
            </div>
          )}

          {/* User Information Section */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Building2 className="h-5 w-5 mr-2" />
              Kullanıcı Bilgileri
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email Adresi *
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[color:var(--yellow)] focus:border-transparent"
                  placeholder="ornek@email.com"
                />
              </div>

              {/* Phone Number */}
              <div>
                <label htmlFor="phone_number" className="block text-sm font-medium text-gray-700 mb-2">
                  Telefon Numarası
                </label>
                <input
                  type="tel"
                  id="phone_number"
                  name="phone_number"
                  value={formData.phone_number}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[color:var(--yellow)] focus:border-transparent"
                  placeholder="+90 5XX XXX XX XX"
                />
              </div>

              {/* Password */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  Şifre *
                </label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  required
                  minLength={6}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[color:var(--yellow)] focus:border-transparent"
                  placeholder="En az 6 karakter"
                />
              </div>

              {/* First Name */}
              <div>
                <label htmlFor="first_name" className="block text-sm font-medium text-gray-700 mb-2">
                  Ad
                </label>
                <input
                  type="text"
                  id="first_name"
                  name="first_name"
                  value={formData.first_name}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[color:var(--yellow)] focus:border-transparent"
                  placeholder="Ad"
                />
              </div>

              {/* Last Name */}
              <div>
                <label htmlFor="last_name" className="block text-sm font-medium text-gray-700 mb-2">
                  Soyad
                </label>
                <input
                  type="text"
                  id="last_name"
                  name="last_name"
                  value={formData.last_name}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[color:var(--yellow)] focus:border-transparent"
                  placeholder="Soyad"
                />
              </div>

              {/* Status */}
              <div>
                <label htmlFor="is_active" className="block text-sm font-medium text-gray-700 mb-2">
                  Durum
                </label>
                <select
                  id="is_active"
                  name="is_active"
                  value={formData.is_active.toString()}
                  onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.value === 'true' }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[color:var(--yellow)] focus:border-transparent"
                >
                  <option value="true">Aktif</option>
                  <option value="false">Pasif</option>
                </select>
              </div>

              {/* Verification Status */}
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="is_verified"
                  name="is_verified"
                  checked={formData.is_verified}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-[color:var(--yellow)] focus:ring-[color:var(--yellow)] border-gray-300 rounded"
                />
                <label htmlFor="is_verified" className="text-sm font-medium text-gray-700">
                  Kullanıcıyı doğrulanmış olarak işaretle
                </label>
              </div>
            </div>
          </div>

          {/* Business Information Section */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">İş Bilgileri</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Business Type */}
              <div>
                <label htmlFor="business_type" className="block text-sm font-medium text-gray-700 mb-2">
                  İş Türü *
                </label>
                <select
                  id="business_type"
                  name="business_type"
                  value={formData.business_type}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[color:var(--yellow)] focus:border-transparent"
                >
                  <option value="esnaf">Esnaf</option>
                  <option value="sahis">Şahıs Şirketi</option>
                  <option value="limited">Limited Şirketi</option>
                  <option value="anonim">Anonim Şirketi</option>
                </select>
              </div>

              {/* Company Title */}
              <div>
                <label htmlFor="company_title" className="block text-sm font-medium text-gray-700 mb-2">
                  Şirket Unvanı *
                </label>
                <input
                  type="text"
                  id="company_title"
                  name="company_title"
                  value={formData.company_title}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[color:var(--yellow)] focus:border-transparent"
                  placeholder="Şirket unvanı"
                />
              </div>

              {/* Display Name */}
              <div>
                <label htmlFor="display_name" className="block text-sm font-medium text-gray-700 mb-2">
                  Görünen Ad *
                </label>
                <input
                  type="text"
                  id="display_name"
                  name="display_name"
                  value={formData.display_name}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[color:var(--yellow)] focus:border-transparent"
                  placeholder="Görünen ad"
                />
              </div>

              {/* Tax Office */}
              <div>
                <label htmlFor="tax_office" className="block text-sm font-medium text-gray-700 mb-2">
                  Vergi Dairesi *
                </label>
                <input
                  type="text"
                  id="tax_office"
                  name="tax_office"
                  value={formData.tax_office}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[color:var(--yellow)] focus:border-transparent"
                  placeholder="Vergi dairesi"
                />
              </div>

              {/* Tax Number */}
              <div>
                <label htmlFor="tax_no" className="block text-sm font-medium text-gray-700 mb-2">
                  Vergi Numarası *
                </label>
                <input
                  type="text"
                  id="tax_no"
                  name="tax_no"
                  value={formData.tax_no}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[color:var(--yellow)] focus:border-transparent"
                  placeholder="Vergi numarası"
                />
              </div>

              {/* Business Phone */}
              <div>
                <label htmlFor="business_phone" className="block text-sm font-medium text-gray-700 mb-2">
                  İş Telefonu *
                </label>
                <input
                  type="tel"
                  id="business_phone"
                  name="business_phone"
                  value={formData.business_phone}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[color:var(--yellow)] focus:border-transparent"
                  placeholder="İş telefonu"
                />
              </div>
            </div>
          </div>

          {/* Location Information Section */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Konum Bilgileri</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Address */}
              <div className="md:col-span-2">
                <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-2">
                  Adres *
                </label>
                <input
                  type="text"
                  id="address"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[color:var(--yellow)] focus:border-transparent"
                  placeholder="Tam adres"
                />
              </div>

              {/* City */}
              <div>
                <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-2">
                  Şehir *
                </label>
                <select
                  id="city"
                  name="city"
                  value={formData.city}
                  onChange={handleInputChange}
                  required
                  disabled={turkeyDataLoading}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[color:var(--yellow)] focus:border-transparent disabled:bg-gray-100"
                >
                  <option value="">Şehir seçin</option>
                  {cities.map(city => (
                    <option key={city} value={city}>{city}</option>
                  ))}
                </select>
                {turkeyDataLoading && (
                  <p className="text-sm text-gray-500 mt-1">Şehirler yükleniyor...</p>
                )}
              </div>

              {/* District */}
              <div>
                <label htmlFor="district" className="block text-sm font-medium text-gray-700 mb-2">
                  İlçe *
                </label>
                <select
                  id="district"
                  name="district"
                  value={formData.district}
                  onChange={handleInputChange}
                  required
                  disabled={!formData.city || districts.length === 0}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[color:var(--yellow)] focus:border-transparent disabled:bg-gray-100"
                >
                  <option value="">İlçe seçin</option>
                  {districts.map(district => (
                    <option key={district} value={district}>{district}</option>
                  ))}
                </select>
                {!formData.city && (
                  <p className="text-sm text-gray-500 mt-1">Önce şehir seçin</p>
                )}
              </div>

              {/* Subdistrict */}
              <div>
                <label htmlFor="subdistrict" className="block text-sm font-medium text-gray-700 mb-2">
                  Mahalle
                </label>
                <select
                  id="subdistrict"
                  name="subdistrict"
                  value={formData.subdistrict}
                  onChange={handleInputChange}
                  disabled={!formData.district || neighbourhoods.length === 0}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[color:var(--yellow)] focus:border-transparent disabled:bg-gray-100"
                >
                  <option value="">Mahalle seçin</option>
                  {neighbourhoods.map(neighbourhood => (
                    <option key={neighbourhood} value={neighbourhood}>{neighbourhood}</option>
                  ))}
                </select>
                {!formData.district && (
                  <p className="text-sm text-gray-500 mt-1">Önce ilçe seçin</p>
                )}
              </div>
            </div>
          </div>

          {/* Manager Information Section */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Yetkili Kişi Bilgileri</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Manager TC */}
              <div>
                <label htmlFor="manager_tc" className="block text-sm font-medium text-gray-700 mb-2">
                  TC Kimlik No *
                </label>
                <input
                  type="text"
                  id="manager_tc"
                  name="manager_tc"
                  value={formData.manager_tc}
                  onChange={handleInputChange}
                  required
                  maxLength={11}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[color:var(--yellow)] focus:border-transparent"
                  placeholder="TC kimlik numarası"
                />
              </div>

              {/* Manager Birthdate */}
              <div>
                <label htmlFor="manager_birthdate" className="block text-sm font-medium text-gray-700 mb-2">
                  Doğum Tarihi *
                </label>
                <input
                  type="date"
                  id="manager_birthdate"
                  name="manager_birthdate"
                  value={formData.manager_birthdate}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[color:var(--yellow)] focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* About Section */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Hakkında</h3>
            <div>
              <label htmlFor="about" className="block text-sm font-medium text-gray-700 mb-2">
                Hakkında
              </label>
              <textarea
                id="about"
                name="about"
                value={formData.about}
                onChange={handleInputChange}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[color:var(--yellow)] focus:border-transparent"
                placeholder="İşletme hakkında bilgi..."
              />
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end space-x-3 pt-6 border-t">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              İptal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="bg-[color:var(--yellow)] text-[color:var(--black)] px-4 py-2 rounded-lg hover:brightness-95 transition-colors flex items-center disabled:opacity-50"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[color:var(--black)] mr-2"></div>
                  Oluşturuluyor...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Esnaf Oluştur
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
