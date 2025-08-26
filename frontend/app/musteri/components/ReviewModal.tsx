'use client';

import React, { useState } from 'react';
import { api } from '@/app/utils/api';
import { toast } from "sonner";

interface ReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  vendorName: string;
  vendorSlug: string;
  services: any[];
}

const ReviewModal: React.FC<ReviewModalProps> = ({ isOpen, onClose, vendorName, vendorSlug, services }) => {
  const [selectedDate, setSelectedDate] = useState({ year: '', month: '' });
  const [selectedService, setSelectedService] = useState('');
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState('');

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);
  const months = [
    'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
    'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedDate.year || !selectedDate.month || !selectedService || !rating || !review.trim()) {
      toast.error("Lütfen tüm alanları doldurun.", {
        description: "Değerlendirme yapabilmek için tüm alanları doldurmanız gerekmektedir."
      });
      return;
    }

    try {
      // Seçilen tarihi oluştur
      const serviceDate = `${selectedDate.year}-${String(selectedDate.month).padStart(2, '0')}-01`;
      
      // Değerlendirmeyi gönder
      await api.createReview(vendorSlug, {
        service: parseInt(selectedService),
        rating,
        comment: review.trim(),
        service_date: serviceDate
      });

      // Başarılı mesajı göster
      toast.success("Değerlendirmeniz başarıyla gönderildi.", {
        description: "Değerli görüşleriniz için teşekkür ederiz!"
      });
      onClose();
      
      // Sayfayı yenile (opsiyonel)
      window.location.reload();
    } catch (error: any) {
      console.error("Değerlendirme gönderme hatası:", error);
      toast.error("Değerlendirme gönderilirken bir hata oluştu.", {
        description: error.response?.data?.detail || "Lütfen daha sonra tekrar deneyin."
      });
    }
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px'
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: '32px',
        width: '100%',
        maxWidth: '600px',
        position: 'relative',
        maxHeight: '90vh',
        overflowY: 'auto'
      }}>
        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            background: 'none',
            border: 'none',
            fontSize: '24px',
            cursor: 'pointer',
            color: '#666'
          }}
        >
          ×
        </button>

        <h2 style={{ 
          fontSize: '24px', 
          fontWeight: 'bold',
          marginBottom: '24px',
          color: '#111'
        }}>
          Değerlendirme Yap
        </h2>

        <form onSubmit={handleSubmit}>
          {/* Tarih Seçimi */}
          <div style={{ marginBottom: '24px' }}>
            <label style={{ 
              display: 'block', 
              marginBottom: '8px',
              fontWeight: 600,
              color: '#333'
            }}>
              Hizmet Aldığınız Tarih
            </label>
            <div style={{ display: 'flex', gap: '12px' }}>
              <select
                value={selectedDate.year}
                onChange={(e) => setSelectedDate(prev => ({ ...prev, year: e.target.value }))}
                style={{
                  flex: 1,
                  padding: '12px',
                  border: '1px solid #e0e0e0',
                  borderRadius: '8px',
                  fontSize: '14px'
                }}
                required
              >
                <option value="">Yıl</option>
                {years.map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
              <select
                value={selectedDate.month}
                onChange={(e) => setSelectedDate(prev => ({ ...prev, month: e.target.value }))}
                style={{
                  flex: 1,
                  padding: '12px',
                  border: '1px solid #e0e0e0',
                  borderRadius: '8px',
                  fontSize: '14px'
                }}
                required
              >
                <option value="">Ay</option>
                {months.map((month, index) => (
                  <option key={month} value={index + 1}>{month}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Hizmet Seçimi */}
          <div style={{ marginBottom: '24px' }}>
            <label style={{ 
              display: 'block', 
              marginBottom: '8px',
              fontWeight: 600,
              color: '#333'
            }}>
              Aldığınız Hizmet
            </label>
            <select
              value={selectedService}
              onChange={(e) => setSelectedService(e.target.value)}
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #e0e0e0',
                borderRadius: '8px',
                fontSize: '14px'
              }}
              required
            >
              <option value="">Hizmet Seçin</option>
              {services.map(service => (
                <option key={service.id} value={service.id}>{service.name}</option>
              ))}
              <option value="other">Diğer</option>
            </select>
          </div>

          {/* Puan */}
          <div style={{ marginBottom: '24px' }}>
            <label style={{ 
              display: 'block', 
              marginBottom: '8px',
              fontWeight: 600,
              color: '#333'
            }}>
              Puanınız
            </label>
            <div style={{ display: 'flex', gap: '8px' }}>
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  style={{
                    background: 'none',
                    border: 'none',
                    padding: '4px',
                    cursor: 'pointer',
                    fontSize: '32px',
                    color: star <= rating ? '#ffd600' : '#e0e0e0'
                  }}
                >
                  ★
                </button>
              ))}
            </div>
          </div>

          {/* Yorum */}
          <div style={{ marginBottom: '24px' }}>
            <label style={{ 
              display: 'block', 
              marginBottom: '8px',
              fontWeight: 600,
              color: '#333'
            }}>
              Yorumunuz
            </label>
            <textarea
              value={review}
              onChange={(e) => setReview(e.target.value)}
              placeholder={`Örnek Yorum: ${vendorName} bize verdiği sözü tuttu. Belirttiği ücreti aldı, teşekkür ediyoruz.`}
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #e0e0e0',
                borderRadius: '8px',
                fontSize: '14px',
                minHeight: '120px',
                resize: 'vertical'
              }}
              required
            />
          </div>

          {/* Butonlar */}
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '12px 24px',
                border: '1px solid #e0e0e0',
                borderRadius: '8px',
                background: 'white',
                color: '#666',
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Vazgeç
            </button>
            <button
              type="submit"
              style={{
                padding: '12px 24px',
                border: 'none',
                borderRadius: '8px',
                background: '#ffd600',
                color: '#111',
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Değerlendir
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReviewModal;
