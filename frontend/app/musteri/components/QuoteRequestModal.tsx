'use client';

import React, { useState } from 'react';
import { api } from '@/app/utils/api';
import { toast } from 'sonner';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  vendorSlug: string;
  services: Array<{ id: number; name: string }>; // vendor.categories
}

const QuoteRequestModal: React.FC<Props> = ({ isOpen, onClose, vendorSlug, services }) => {
  const [selectedService, setSelectedService] = useState<string>('');
  const [requestType, setRequestType] = useState<'appointment' | 'quote' | 'emergency' | 'part'>('quote');
  const [vehicleInfo, setVehicleInfo] = useState<string>('');
  const [title, setTitle] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      toast.error('Lütfen tüm alanları doldurun.', {
        description: 'Talep başlığı ve talep metni zorunludur.'
      });
      return;
    }

    try {
      setSubmitting(true);
      await api.createServiceRequest(vendorSlug, {
        service: selectedService ? parseInt(selectedService) : undefined,
        title: title.trim(),
        description: description.trim(),
        request_type: requestType,
        vehicle_info: vehicleInfo.trim() || undefined,
      });

      toast.success('Talebiniz gönderildi.', {
        description: 'Yanıtları e-posta adresinizden ve Taleplerim sayfanızdan takip edebilirsiniz.'
      });
      onClose();
    } catch (error: any) {
      toast.error('Talep gönderilemedi.', {
        description: error?.response?.data?.detail || 'Lütfen daha sonra tekrar deneyin.'
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px'
    }}>
      <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '24px', width: '100%', maxWidth: '620px', position: 'relative' }}>
        <button onClick={onClose} style={{ position: 'absolute', top: 12, right: 12, background: 'none', border: 'none', fontSize: 24, cursor: 'pointer', color: '#666' }}>×</button>

        <h2 style={{ fontSize: '22px', fontWeight: 700, margin: '0 0 16px 0', color: '#111' }}>Teklif Talebi Oluştur</h2>

        <form onSubmit={handleSubmit}>
          {/* Talep Türü */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, color: '#333' }}>Talep türü</label>
            <select value={requestType} onChange={(e) => setRequestType(e.target.value as any)} style={{ width: '100%', padding: '12px', border: '1px solid #e0e0e0', borderRadius: 8, fontSize: 14 }}>
              <option value="quote">Fiyat Teklifi</option>
              <option value="appointment">Randevu</option>
              <option value="emergency">Acil Yardım</option>
              <option value="part">Parça Talebi</option>
            </select>
          </div>
          {/* Hizmet */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, color: '#333' }}>Hangi hizmete ihtiyacınız var?</label>
            <select
              value={selectedService}
              onChange={(e) => setSelectedService(e.target.value)}
              style={{ width: '100%', padding: '12px', border: '1px solid #e0e0e0', borderRadius: 8, fontSize: 14 }}
            >
              <option value="">Hizmet seçin (opsiyonel)</option>
              {services?.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>

          {/* Başlık */}
          {/* Araç Bilgisi */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, color: '#333' }}>Araç bilgisi (opsiyonel)</label>
            <input
              value={vehicleInfo}
              onChange={(e) => setVehicleInfo(e.target.value)}
              placeholder="Örn: 2016 Ford Focus 1.6 TDCi"
              style={{ width: '100%', padding: '12px', border: '1px solid #e0e0e0', borderRadius: 8, fontSize: 14 }}
            />
          </div>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, color: '#333' }}>Talep başlığı</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Örn: Triger seti değişimi için teklif"
              style={{ width: '100%', padding: '12px', border: '1px solid #e0e0e0', borderRadius: 8, fontSize: 14 }}
              required
            />
          </div>

          {/* Talep */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, color: '#333' }}>Talebiniz</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="İhtiyacınızı detaylıca yazın. Örn: 2016 model Ford Focus için ..."
              style={{ width: '100%', padding: '12px', border: '1px solid #e0e0e0', borderRadius: 8, fontSize: 14, minHeight: 120, resize: 'vertical' }}
              required
            />
          </div>

          {/* Bilgilendirme */}
          <div style={{ background: '#f8fafc', border: '1px solid #e5e7eb', color: '#334155', padding: 12, borderRadius: 8, fontSize: 14, marginBottom: 16 }}>
            Talebinize gelen yanıtları e‑posta adresinizden ve Taleplerim sayfanızdan takip edebilirsiniz.
          </div>

          {/* Butonlar */}
          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
            <button type="button" onClick={onClose} style={{ padding: '10px 18px', border: '1px solid #e5e7eb', borderRadius: 8, background: 'white', color: '#475569', fontWeight: 600, cursor: 'pointer' }}>Vazgeç</button>
            <button type="submit" disabled={submitting} style={{ padding: '10px 18px', border: 'none', borderRadius: 8, background: '#111111', color: '#ffd600', fontWeight: 700, cursor: submitting ? 'not-allowed' : 'pointer', opacity: submitting ? 0.8 : 1 }}>
              {submitting ? 'Gönderiliyor...' : 'Talep Gönder'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default QuoteRequestModal;


