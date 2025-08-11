'use client';

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/app/utils/api";
import { useTurkeyData } from "@/app/hooks/useTurkeyData";
import MusteriHeader from "../components/MusteriHeader";
import MusteriFooter from "../components/MusteriFooter";

export default function MusteriKayitPage() {
  const router = useRouter();
  const { cities, loadTurkeyData, getDistricts } = useTurkeyData();
  
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    password2: "",
    first_name: "",
    last_name: "",
    phone: "",
    city: "",
    district: "",
    address: "",
    about: ""
  });
  
  const [districts, setDistricts] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // Şehir verisini yükle
  React.useEffect(() => {
    loadTurkeyData();
  }, [loadTurkeyData]);

  // İl değişince ilçeleri güncelle
  React.useEffect(() => {
    if (formData.city) {
      setDistricts(getDistricts(formData.city));
      setFormData(prev => ({ ...prev, district: "" }));
    } else {
      setDistricts([]);
      setFormData(prev => ({ ...prev, district: "" }));
    }
  }, [formData.city, getDistricts]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await api.register(formData, 'customer');
      
      if (response.status === 201) {
        setSuccess(true);
        setTimeout(() => {
          router.push('/musteri/giris');
        }, 3000);
      } else {
        setError(response.data?.detail || "Kayıt sırasında bir hata oluştu.");
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || 
                          err.response?.data?.error || 
                          "Kayıt sırasında bir hata oluştu.";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <>
        <MusteriHeader />
        <main className="musteri-auth-main">
          <div className="musteri-auth-container">
            <div className="musteri-auth-card">
              <div className="musteri-success-message">
                <h2>Kayıt Başarılı!</h2>
                <p>Hesabınız başarıyla oluşturuldu. Email doğrulama kodu gönderildi.</p>
                <p>Giriş sayfasına yönlendiriliyorsunuz...</p>
              </div>
            </div>
          </div>
        </main>
        <MusteriFooter />
      </>
    );
  }

  return (
    <>
      <MusteriHeader />
      <main className="musteri-auth-main">
        <div className="musteri-auth-container">
          <div className="musteri-auth-card">
            <h1 className="musteri-auth-title">Müşteri Kayıt</h1>
            <p className="musteri-auth-subtitle">
              Hızlıca hesap oluşturun ve hizmet almaya başlayın
            </p>

            <form onSubmit={handleSubmit} className="musteri-auth-form">
              <div className="musteri-form-row">
                <div className="musteri-form-group">
                  <label htmlFor="first_name" className="musteri-form-label">
                    Ad *
                  </label>
                  <input
                    type="text"
                    id="first_name"
                    name="first_name"
                    value={formData.first_name}
                    onChange={handleInputChange}
                    className="musteri-form-input"
                    placeholder="Adınız"
                    required
                  />
                </div>

                <div className="musteri-form-group">
                  <label htmlFor="last_name" className="musteri-form-label">
                    Soyad *
                  </label>
                  <input
                    type="text"
                    id="last_name"
                    name="last_name"
                    value={formData.last_name}
                    onChange={handleInputChange}
                    className="musteri-form-input"
                    placeholder="Soyadınız"
                    required
                  />
                </div>
              </div>

              <div className="musteri-form-group">
                <label htmlFor="email" className="musteri-form-label">
                  E-posta Adresi *
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="musteri-form-input"
                  placeholder="ornek@email.com"
                  required
                />
              </div>

              <div className="musteri-form-group">
                <label htmlFor="phone" className="musteri-form-label">
                  Telefon Numarası *
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="musteri-form-input"
                  placeholder="0555 123 45 67"
                  required
                />
              </div>

              <div className="musteri-form-row">
                <div className="musteri-form-group">
                  <label htmlFor="city" className="musteri-form-label">
                    İl *
                  </label>
                  <select
                    id="city"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    className="musteri-form-input"
                    required
                  >
                    <option value="">İl seçiniz</option>
                    {cities.map(city => (
                      <option key={city} value={city}>{city}</option>
                    ))}
                  </select>
                </div>

                <div className="musteri-form-group">
                  <label htmlFor="district" className="musteri-form-label">
                    İlçe *
                  </label>
                  <select
                    id="district"
                    name="district"
                    value={formData.district}
                    onChange={handleInputChange}
                    className="musteri-form-input"
                    required
                    disabled={!formData.city}
                  >
                    <option value="">İlçe seçiniz</option>
                    {districts.map(district => (
                      <option key={district} value={district}>{district}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="musteri-form-group">
                <label htmlFor="address" className="musteri-form-label">
                  Adres *
                </label>
                <textarea
                  id="address"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  className="musteri-form-input"
                  placeholder="Detaylı adres bilgisi"
                  rows={3}
                  required
                />
              </div>

              <div className="musteri-form-group">
                <label htmlFor="about" className="musteri-form-label">
                  Hakkımda
                </label>
                <textarea
                  id="about"
                  name="about"
                  value={formData.about}
                  onChange={handleInputChange}
                  className="musteri-form-input"
                  placeholder="Kendiniz hakkında kısa bilgi (opsiyonel)"
                  rows={3}
                />
              </div>

              <div className="musteri-form-row">
                <div className="musteri-form-group">
                  <label htmlFor="password" className="musteri-form-label">
                    Şifre *
                  </label>
                  <input
                    type="password"
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    className="musteri-form-input"
                    placeholder="En az 6 karakter"
                    required
                    minLength={6}
                  />
                </div>

                <div className="musteri-form-group">
                  <label htmlFor="password2" className="musteri-form-label">
                    Şifre Tekrar *
                  </label>
                  <input
                    type="password"
                    id="password2"
                    name="password2"
                    value={formData.password2}
                    onChange={handleInputChange}
                    className="musteri-form-input"
                    placeholder="Şifrenizi tekrar girin"
                    required
                    minLength={6}
                  />
                </div>
              </div>

              {error && (
                <div className="musteri-error-message">
                  {error}
                </div>
              )}

              <button
                type="submit"
                className="musteri-auth-button"
                disabled={loading}
              >
                {loading ? "Kayıt yapılıyor..." : "Hesap Oluştur"}
              </button>
            </form>

            <div className="musteri-auth-footer">
              <p>
                Zaten hesabınız var mı?{" "}
                <Link href="/musteri/giris" className="musteri-auth-link-bold">
                  Giriş yapın
                </Link>
              </p>
            </div>
          </div>
        </div>
      </main>
      <MusteriFooter />
    </>
  );
}
