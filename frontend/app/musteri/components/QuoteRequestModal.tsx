'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/app/utils/api';
import { toast } from 'sonner';

interface Vehicle {
  id: number;
  brand?: string;
  brand_name?: string;
  model: string;
  year?: number;
  engine_type?: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  vendorSlug: string;
  services: Array<{ id: number; name: string }>; // vendor.categories
}

const QuoteRequestModal: React.FC<Props> = ({ isOpen, onClose, vendorSlug, services }) => {
  const router = useRouter();
  const [selectedService, setSelectedService] = useState<string>('');
  const [requestType, setRequestType] = useState<'appointment' | 'quote' | 'emergency' | 'part'>('quote');
  const [vehicleInfo, setVehicleInfo] = useState<string>('');
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>('');
  const [vehicleInputMode, setVehicleInputMode] = useState<'select' | 'manual'>('select');
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loadingVehicles, setLoadingVehicles] = useState(false);
  const [title, setTitle] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);

  // Modal açıldığında state'leri sıfırla ve araçları yükle
  useEffect(() => {
    if (isOpen) {
      setSelectedService('');
      setRequestType('quote');
      setVehicleInfo('');
      setSelectedVehicleId('');
      setTitle('');
      setDescription('');
      
      // Araçları yükle
      const loadVehicles = async () => {
        try {
          setLoadingVehicles(true);
          const response = await api.listVehicles();
          
          // Debug: Response'u logla
          console.log('Araçlar API Response:', response);
          
          // Response formatını normalize et (aracim sayfasındaki gibi)
          const data = response?.data ?? response;
          const items = Array.isArray(data)
            ? data
            : (Array.isArray(data?.results) ? data.results : []);
          
          const vehiclesData = Array.isArray(items) ? items : [];
          console.log('Normalize edilmiş araçlar:', vehiclesData);
          
          setVehicles(vehiclesData);
          
          // Eğer araç varsa select modunda başla, yoksa manual
          if (vehiclesData.length > 0) {
            setVehicleInputMode('select');
          } else {
            setVehicleInputMode('manual');
          }
        } catch (error: any) {
          // Hata durumunda manual moda geç
          console.error('Araçlar yüklenirken hata:', error);
          console.error('Hata detayı:', error?.response?.data || error?.message);
          setVehicleInputMode('manual');
          setVehicles([]);
        } finally {
          setLoadingVehicles(false);
        }
      };
      
      loadVehicles();
    } else {
      // Modal kapandığında state'leri temizle
      setVehicleInfo('');
      setSelectedVehicleId('');
      setVehicleInputMode('select');
    }
  }, [isOpen]);

  // Seçilen araç değiştiğinde vehicleInfo'yu güncelle
  useEffect(() => {
    if (selectedVehicleId && vehicleInputMode === 'select') {
      const selectedVehicle = vehicles.find(v => v.id === parseInt(selectedVehicleId));
      if (selectedVehicle) {
        const brandName = selectedVehicle.brand_name || selectedVehicle.brand || '';
        const year = selectedVehicle.year ? ` ${selectedVehicle.year}` : '';
        const engineType = selectedVehicle.engine_type ? ` ${selectedVehicle.engine_type}` : '';
        setVehicleInfo(`${brandName} ${selectedVehicle.model}${year}${engineType}`.trim());
      }
    } else if (vehicleInputMode === 'manual') {
      // Manuel modda vehicleInfo'yu temizle
      if (selectedVehicleId) {
        setVehicleInfo('');
        setSelectedVehicleId('');
      }
    }
  }, [selectedVehicleId, vehicleInputMode, vehicles]);

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
    <div className="m-quote-modal-overlay">
      <div className="m-quote-modal">
        <button onClick={onClose} className="m-quote-modal-close">×</button>

        <h2 className="m-quote-modal-title">Teklif Talebi Oluştur</h2>

        <form onSubmit={handleSubmit}>
          {/* Talep Türü */}
          <div className="m-quote-form-group">
            <label className="m-quote-form-label">Talep türü</label>
            <select 
              value={requestType} 
              onChange={(e) => setRequestType(e.target.value as any)} 
              className="m-quote-form-select"
            >
              <option value="quote">Fiyat Teklifi</option>
              <option value="appointment">Randevu</option>
              <option value="emergency">Acil Yardım</option>
              <option value="part">Parça Talebi</option>
            </select>
          </div>
          {/* Hizmet */}
          <div className="m-quote-form-group">
            <label className="m-quote-form-label">Hangi hizmete ihtiyacınız var?</label>
            <select
              value={selectedService}
              onChange={(e) => setSelectedService(e.target.value)}
              className="m-quote-form-select"
            >
              <option value="">Hizmet seçin (opsiyonel)</option>
              {services?.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>

          {/* Araç Bilgisi */}
          <div className="m-quote-form-group">
            <div className="m-quote-form-header">
              <label className="m-quote-form-label">Araç bilgisi (opsiyonel)</label>
              {vehicles.length > 0 && (
                <div className="m-quote-vehicle-mode-toggle">
                  <button
                    type="button"
                    onClick={() => {
                      setVehicleInputMode('select');
                      setSelectedVehicleId('');
                      setVehicleInfo('');
                    }}
                    className={`m-quote-vehicle-mode-btn ${vehicleInputMode === 'select' ? 'active' : ''}`}
                  >
                    Kayıtlı Araç
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setVehicleInputMode('manual');
                      setSelectedVehicleId('');
                    }}
                    className={`m-quote-vehicle-mode-btn ${vehicleInputMode === 'manual' ? 'active' : ''}`}
                  >
                    Manuel Giriş
                  </button>
                </div>
              )}
            </div>

            {loadingVehicles ? (
              <div className="m-quote-loading">
                Araçlar yükleniyor...
              </div>
            ) : vehicleInputMode === 'select' && vehicles.length > 0 ? (
              <div className="m-quote-vehicle-actions">
                <select
                  value={selectedVehicleId}
                  onChange={(e) => setSelectedVehicleId(e.target.value)}
                  className="m-quote-form-select"
                >
                  <option value="">Araç seçin (opsiyonel)</option>
                  {vehicles.map((vehicle) => {
                    const brandName = vehicle.brand_name || vehicle.brand || '';
                    const year = vehicle.year ? ` ${vehicle.year}` : '';
                    const displayName = `${brandName} ${vehicle.model}${year}`.trim();
                    return (
                      <option key={vehicle.id} value={vehicle.id}>
                        {displayName}
                      </option>
                    );
                  })}
                </select>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    router.push('/musteri/aracim');
                  }}
                  className="m-quote-vehicle-add-btn"
                >
                  + Yeni Araç Ekle
                </button>
              </div>
            ) : (
              <div className="m-quote-vehicle-actions">
                <input
                  value={vehicleInfo}
                  onChange={(e) => setVehicleInfo(e.target.value)}
                  placeholder="Örn: 2016 Ford Focus 1.6 TDCi"
                  className="m-quote-form-input"
                />
                {vehicles.length === 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      router.push('/musteri/aracim');
                    }}
                    className="m-quote-vehicle-add-btn"
                  >
                    + Yeni Araç Ekle
                  </button>
                )}
              </div>
            )}
          </div>
          <div className="m-quote-form-group">
            <label className="m-quote-form-label">Talep başlığı</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Örn: Triger seti değişimi için teklif"
              className="m-quote-form-input"
              required
            />
          </div>

          {/* Talep */}
          <div className="m-quote-form-group">
            <label className="m-quote-form-label">Talebiniz</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="İhtiyacınızı detaylıca yazın. Örn: 2016 model Ford Focus için ..."
              className="m-quote-form-textarea"
              required
            />
          </div>

          {/* Bilgilendirme */}
          <div className="m-quote-info-box">
            Talebinize gelen yanıtları e‑posta adresinizden ve Taleplerim sayfanızdan takip edebilirsiniz.
          </div>

          {/* Butonlar */}
          <div className="m-quote-form-actions">
            <button type="button" onClick={onClose} className="m-quote-btn m-quote-btn-secondary">Vazgeç</button>
            <button type="submit" disabled={submitting} className="m-quote-btn m-quote-btn-primary">
              {submitting ? 'Gönderiliyor...' : 'Talep Gönder'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default QuoteRequestModal;


