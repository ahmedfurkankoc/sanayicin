'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useMusteri } from '../context/MusteriContext';
import { api } from '@/app/utils/api';
import { toast } from 'sonner';
import Link from 'next/link';
import '../../styles/musteri.css';

interface ClientRequest {
  id: number;
  vendor_info: { id: number; slug: string; display_name: string; business_phone: string; city: string; district: string };
  request_type?: 'appointment' | 'quote' | 'emergency' | 'part';
  vehicle_info?: string;
  title: string;
  description: string;
  client_phone?: string;
  messages?: Array<{ by: 'vendor' | 'client'; content: string; at: string }>;
  status: 'pending' | 'responded' | 'completed' | 'cancelled' | 'closed';
  created_at: string;
  last_offered_price?: number;
  last_offered_days?: number;
}

export default function MusteriTaleplerimPage() {
  const { user } = useMusteri();
  const router = useRouter();
  const [requests, setRequests] = useState<ClientRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        setLoading(true);
        const res = await api.listClientServiceRequests(selectedStatus === 'all' ? {} : { status: selectedStatus as any });
        setRequests(res.data || []);
      } catch (error: any) {
        console.error('Talepler getirme hatası:', error);
        toast.error('Talepler yüklenirken hata oluştu');
      } finally {
        setLoading(false);
      }
    };
    fetchRequests();
  }, [selectedStatus]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'responded': return 'var(--green)';
      case 'pending': return 'var(--yellow)';
      case 'completed': return 'var(--blue)';
      case 'cancelled': return 'var(--red)';
      default: return 'var(--gray)';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'responded': return 'Yanıtlandı';
      case 'pending': return 'Beklemede';
      case 'completed': return 'Tamamlandı';
      case 'cancelled': return 'İptal Edildi';
      default: return 'Bilinmiyor';
    }
  };

  if (loading) {
    return (
      <div className="container">
        <div className="musteri-loading">
          <div className="musteri-loading-spinner"></div>
          <p>Talepler yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="musteri-page-header" style={{ color: '#111' }}>
        <h1 style={{ color: '#111' }}>Taleplerim</h1>
        <p style={{ color: '#111' }}>Taleplerinizi ve durumlarını buradan takip edebilirsiniz.</p>
      </div>

      {/* Status Filter */}
      <div className="musteri-filter-section">
        <div className="musteri-filter-buttons">
          <button
            className={`musteri-filter-btn ${selectedStatus === 'all' ? 'active' : ''}`}
            onClick={() => setSelectedStatus('all')}
            style={{ color: '#111' }}
          >
            Tümü ({requests.length})
          </button>
          <button
            className={`musteri-filter-btn ${selectedStatus === 'pending' ? 'active' : ''}`}
            onClick={() => setSelectedStatus('pending')}
            style={{ color: '#111' }}
          >
            Beklemede ({requests.filter(a => a.status === 'pending').length})
          </button>
          <button
            className={`musteri-filter-btn ${selectedStatus === 'responded' ? 'active' : ''}`}
            onClick={() => setSelectedStatus('responded')}
            style={{ color: '#111' }}
          >
            Yanıtlandı ({requests.filter(a => a.status === 'responded').length})
          </button>
          <button
            className={`musteri-filter-btn ${selectedStatus === 'completed' ? 'active' : ''}`}
            onClick={() => setSelectedStatus('completed')}
            style={{ color: '#111' }}
          >
            Tamamlandı ({requests.filter(a => a.status === 'completed').length})
          </button>
          <button
            className={`musteri-filter-btn ${selectedStatus === 'cancelled' ? 'active' : ''}`}
            onClick={() => setSelectedStatus('cancelled')}
            style={{ color: '#111' }}
          >
            İptal ({requests.filter(a => a.status === 'cancelled').length})
          </button>
        </div>
      </div>

      {/* Requests List */}
      {requests.length === 0 ? (
        <div className="musteri-empty-state">
          <div className="musteri-empty-icon">📋</div>
          <h3>
            {selectedStatus === 'all' 
              ? 'Henüz talebiniz bulunmuyor' 
              : `${getStatusText(selectedStatus)} statüsünde talebiniz bulunmuyor`
            }
          </h3>
          <p>
            {selectedStatus === 'all' 
              ? 'Esnaflardan taleplerde bulunarak burada takip edebilirsiniz.'
              : 'Diğer filtreleri kullanarak taleplerinizi görüntüleyebilirsiniz.'
            }
          </p>
          {selectedStatus === 'all' && (
            <Link href="/musteri" className="musteri-btn musteri-btn-primary">
              Hizmet Ara
            </Link>
          )}
        </div>
      ) : (
        <div className="musteri-appointments-list">
          {requests.map((req) => (
            <div key={req.id} className="musteri-appointment-card" style={{ color: '#111' }}>
              <div className="musteri-appointment-header" style={{ color: '#111' }}>
                <div className="musteri-appointment-vendor">
                  <Link 
                    href={`/musteri/esnaf/${req.vendor_info.slug}`}
                    className="musteri-vendor-link"
                  >
                    <h3 style={{ color: '#111' }}>{req.vendor_info.display_name}</h3>
                  </Link>
                  <p style={{ color: '#111' }}>{req.vendor_info.city} / {req.vendor_info.district}</p>
                  <p style={{ color: '#111' }}>📞 {req.vendor_info.business_phone}</p>
                </div>
                <div 
                  className="musteri-appointment-status"
                  style={{ 
                    backgroundColor: getStatusColor(req.status),
                    color: '#111'
                  }}
                >
                  {getStatusText(req.status)}
                </div>
              </div>

              <div className="musteri-appointment-details">
                <div className="musteri-appointment-info">
                  <div className="musteri-info-row">
                    <span className="musteri-info-label" style={{ color: '#111' }}>📅 Oluşturma:</span>
                    <span className="musteri-info-value" style={{ color: '#111' }}>{new Date(req.created_at).toLocaleString('tr-TR')}</span>
                  </div>
                  <div className="musteri-info-row">
                    <span className="musteri-info-label" style={{ color: '#111' }}>🔧 Talep:</span>
                    <span className="musteri-info-value" style={{ color: '#111' }}>{req.title}</span>
                  </div>
                  <div className="musteri-info-row">
                    <span className="musteri-info-label" style={{ color: '#111' }}>📞 Telefon:</span>
                    <span className="musteri-info-value" style={{ color: '#111' }}>{req.client_phone || '—'}</span>
                  </div>
                </div>
              </div>

              {/* Esnafın Teklifi (varsa) */}
              {(req.last_offered_price != null || req.last_offered_days != null || (Array.isArray(req.messages) && req.messages.some(m => m.by === 'vendor'))) && (
                <div style={{ marginTop: 12, border: '1px solid #e2e8f0', borderRadius: 12, background: '#f8fafc', padding: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                    <div style={{ fontWeight: 700, color: '#0f172a' }}>Esnaftan Gelen Teklif</div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      {req.last_offered_price != null && (
                        <span style={{ background: '#111', color: '#ffd600', borderRadius: 8, padding: '6px 10px', fontWeight: 700 }}>
                          {String(req.last_offered_price)} ₺
                        </span>
                      )}
                      {req.last_offered_days != null && (
                        <span style={{ background: '#e2e8f0', color: '#0f172a', borderRadius: 8, padding: '6px 10px', fontWeight: 600 }}>
                          {String(req.last_offered_days)} gün
                        </span>
                      )}
                    </div>
                  </div>
                  {(() => {
                    let lastVendorMessage = '' as string;
                    if (Array.isArray(req.messages)) {
                      const last = [...req.messages].reverse().find(m => m.by === 'vendor');
                      if (last) lastVendorMessage = last.content;
                    }
                    return (
                      <div style={{ color: '#111', whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>
                        {lastVendorMessage || 'Mesaj belirtilmemiş.'}
                      </div>
                    );
                  })()}
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 12 }}>
                    <button
                      onClick={async () => {
                        try {
                          // Vendor user id almak için detay çek
                          const vd = await api.getVendorDetail(req.vendor_info.slug);
                          const vendorUserId = vd?.data?.user?.id;
                          if (!vendorUserId) return;
                          // Konuşma oluştur
                          const conv = await api.chatCreateConversation(vendorUserId);
                          const conversationId = conv?.data?.id;
                          if (!conversationId) return;
                          // Alıntılı başlangıç mesajı
                          const origin = typeof window !== 'undefined' ? window.location.origin : '';
                          const taleplerimUrl = origin ? `${origin}/musteri/taleplerim` : '/musteri/taleplerim';
                          const payload = {
                            type: 'offer_marker',
                            request_id: req.id,
                            title: req.title,
                            vendor_name: req.vendor_info.display_name,
                            url: taleplerimUrl,
                            price: req.last_offered_price ?? null,
                            days: req.last_offered_days ?? null,
                            phone: req.client_phone ?? null,
                          };
                          await api.chatSendMessageREST(conversationId, `OFFER_CARD::${JSON.stringify(payload)}`);
                          router.push(`/musteri/mesajlar/${conversationId}`);
                        } catch (e) {
                          // sessizce geç
                        }
                      }}
                      className="musteri-btn musteri-btn-primary"
                    >
                      Mesaj Gönder
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
