'use client';

import React, { useState, useEffect } from 'react';
import { api } from '@/app/utils/api';
import { useEsnaf } from '../context/EsnafContext';
import EsnafPanelLayout from '../components/EsnafPanelLayout';
import Icon from '@/app/components/ui/Icon';
import { LoadingSpinner } from '../components/LoadingSpinner';

interface Request {
  id: number;
  user: { id: number; name?: string; email?: string };
  service?: number;
  service_name?: string;
  request_type?: 'appointment' | 'quote' | 'emergency' | 'part';
  vehicle_info?: string;
  title: string;
  description: string;
  client_phone?: string;
  messages?: Array<{ by: 'vendor' | 'client'; content: string; at: string }>;
  unread_for_vendor?: boolean;
  status: 'pending' | 'responded' | 'completed' | 'cancelled' | 'closed';
  created_at: string;
}

export default function TaleplerimPage() {
  const { user, loading } = useEsnaf();
  const [requests, setRequests] = useState<Request[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [onlyPending, setOnlyPending] = useState(false);
  const [onlyQuotes, setOnlyQuotes] = useState(false);
  const [lastDays, setLastDays] = useState<number | ''>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [offerModalOpen, setOfferModalOpen] = useState(false);
  const [offerForId, setOfferForId] = useState<number | null>(null);
  const [offerSubmitting, setOfferSubmitting] = useState(false);
  const [offerMessage, setOfferMessage] = useState('');
  const [offerPrice, setOfferPrice] = useState<string>('');
  const [offerDays, setOfferDays] = useState<string>('');
  const [offerPhone, setOfferPhone] = useState<string>('');
  const [viewOfferId, setViewOfferId] = useState<number | null>(null);

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        setIsLoading(true);
        const params: any = {};
        if (filterStatus !== 'all') params.status = filterStatus;
        if (onlyPending) params.only_pending = true;
        if (onlyQuotes) params.only_quotes = true;
        if (lastDays) params.last_days = lastDays;
        const res = await api.listVendorServiceRequests(params);
        setRequests(res.data || []);
      } catch (e) {
        setRequests([]);
      } finally {
        setIsLoading(false);
      }
    };
    fetchRequests();
    const id = setInterval(fetchRequests, 15000);
    return () => clearInterval(id);
  }, [filterStatus, onlyPending, onlyQuotes, lastDays]);

  // Responsive breakpoint
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const filteredRequests = requests.filter(request => {
    const matchesSearch = (
      (request.user?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (request.service_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (request.title || '').toLowerCase().includes(searchTerm.toLowerCase())
    );
    return matchesSearch;
  });

  const getStatusColor = (status: string) => {
    const colors = {
      pending: '#f59e0b',
      responded: '#10b981',
      completed: '#3b82f6',
      cancelled: '#ef4444',
      closed: '#6b7280'
    };
    return colors[status as keyof typeof colors] || '#6b7280';
  };

  const getStatusText = (status: string) => {
    const texts = {
      pending: 'Beklemede',
      responded: 'Yanıtlandı',
      completed: 'Tamamlandı',
      cancelled: 'İptal',
      closed: 'Kapatıldı'
    };
    return texts[status as keyof typeof texts] || 'Bilinmiyor';
  };

  const getUrgencyColor = (urgency: string) => {
    const colors = {
      high: '#ef4444',
      medium: '#f59e0b',
      low: '#10b981'
    };
    return colors[urgency as keyof typeof colors] || '#6b7280';
  };

  const getUrgencyText = (urgency: string) => {
    const texts = {
      high: 'Acil',
      medium: 'Orta',
      low: 'Düşük'
    };
    return texts[urgency as keyof typeof texts] || 'Bilinmiyor';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatPrice = (value: number | string | null | undefined) => {
    if (value === null || value === undefined || value === '') return '';
    const num = typeof value === 'number' ? value : Number(value);
    if (isNaN(num)) return '';
    return new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(num);
  };

  const handleStatusChange = async (requestId: number, newStatus: 'responded' | 'completed' | 'cancelled' | 'closed') => {
    try {
      const res = await api.vendorUpdateServiceRequestStatus(requestId, newStatus as any);
      setRequests(prev => prev.map(req => req.id === requestId ? res.data : req));
    } catch (_) {
      setRequests(prev => prev.map(req => req.id === requestId ? { ...req, status: newStatus } : req));
    }
  };

  // Sayfada listelenen tüm talepleri okundu işaretle
  useEffect(() => {
    const markAllRead = async () => {
      const unread = requests.filter(r => r.unread_for_vendor);
      for (const r of unread) {
        try { await api.vendorMarkServiceRequestRead(r.id); } catch (_) {}
      }
      if (unread.length > 0) {
        setRequests(prev => prev.map(r => r.unread_for_vendor ? { ...r, unread_for_vendor: false } as any : r));
      }
    };
    if (requests.length) {
      markAllRead();
    }
  }, [requests]);

  if (loading || isLoading) {
    return (
      <EsnafPanelLayout activePage="taleplerim">
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '400px'
        }}>
          <LoadingSpinner message="Talepler yükleniyor..." size="large" />
        </div>
      </EsnafPanelLayout>
    );
  }

  return (
    <EsnafPanelLayout activePage="taleplerim">
      <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '32px',
          flexWrap: 'wrap',
          gap: '16px'
        }}>
          <div>
            <h1 style={{
              fontSize: '28px',
              fontWeight: '700',
              color: '#111111',
              margin: '0 0 8px 0'
            }}>
              Taleplerim
            </h1>
            <p style={{
              fontSize: '16px',
              color: '#666',
              margin: '0'
            }}>
              Müşterilerinizden gelen hizmet taleplerini yönetin
            </p>
          </div>
          
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 16px',
            backgroundColor: '#f9f9f9',
            borderRadius: '8px',
            border: '1px solid #e0e0e0'
          }}>
            <Icon name="filter" size="sm" color="#666" />
            <span style={{ fontSize: '14px', color: '#666' }}>
              {filteredRequests.length} talep
            </span>
          </div>
        </div>

        {/* Filters - Randevularım sayfasındaki stillerle aynı */}
        <div className="esnaf-appointments-filters">
          <div className="esnaf-appointments-filters-inner">
            {/* Search */}
            <div className="esnaf-appointments-search-container">
              <input
                type="text"
                placeholder="Müşteri, hizmet veya konum ara..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="esnaf-appointments-search-input"
              />
              <div className="esnaf-appointments-search-icon">
                <Icon name="search" size={16} />
              </div>
            </div>

            {/* Status Filter */}
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="esnaf-appointments-status-filter"
            >
              <option value="all">Tüm Durumlar</option>
              <option value="pending">Beklemede</option>
              <option value="responded">Yanıtlandı</option>
              <option value="completed">Tamamlandı</option>
              <option value="cancelled">İptal</option>
            </select>

            {/* Last N days */}
            <select
              value={String(lastDays)}
              onChange={(e) => setLastDays(e.target.value ? Number(e.target.value) : '')}
              className="esnaf-appointments-status-filter"
            >
              <option value="">Tüm Zamanlar</option>
              <option value="7">Son 7 gün</option>
              <option value="30">Son 30 gün</option>
            </select>

            {/* Toggles */}
            <label className="esnaf-appointments-toggle">
              <input type="checkbox" checked={onlyPending} onChange={(e) => setOnlyPending(e.target.checked)} /> Sadece beklemede
            </label>
            <label className="esnaf-appointments-toggle">
              <input type="checkbox" checked={onlyQuotes} onChange={(e) => setOnlyQuotes(e.target.checked)} /> Fiyat teklifleri
            </label>
          </div>
        </div>

        {/* Requests List */}
        {filteredRequests.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '60px 20px',
            color: '#666'
          }}>
            <div style={{ marginBottom: '16px' }}>
              <Icon name="file" size="lg" color="#ccc" />
            </div>
            <h3 style={{ margin: '0 0 8px 0', fontSize: '18px' }}>
              Talep Bulunamadı
            </h3>
            <p style={{ margin: '0', fontSize: '14px' }}>
              {searchTerm || filterStatus !== 'all' 
                ? 'Arama kriterlerinize uygun talep bulunamadı.'
                : 'Henüz hiç talep bulunmuyor.'
              }
            </p>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gap: '16px',
            gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))'
          }}>
            {filteredRequests.map((request) => (
              <div key={request.id} style={{
                backgroundColor: 'white',
                borderRadius: '12px',
                padding: '20px',
                border: '1px solid #e0e0e0',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
                transition: 'all 0.2s ease'
              }}>
                {/* Header */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  marginBottom: '16px'
                }}>
                  <div>
                    <h3 style={{
                      fontSize: '16px',
                      fontWeight: '600',
                      margin: '0 0 4px 0',
                      color: '#111111'
                    }}>
                      {request.user?.name || request.user?.email || 'Müşteri'}
                      {request.unread_for_vendor && (
                        <span style={{ marginLeft: 8, display: 'inline-block', width: 8, height: 8, background: '#ef4444', borderRadius: 9999 }}></span>
                      )}
                    </h3>
                    <p style={{
                      fontSize: '14px',
                      color: '#666',
                      margin: '0'
                    }}>
                      {(request.request_type ? {
                        appointment: 'Randevu',
                        quote: 'Fiyat Teklifi',
                        emergency: 'Acil Yardım',
                        part: 'Parça Talebi'
                      }[request.request_type] : '')}
                      {request.request_type ? ' • ' : ''}
                      {request.vehicle_info ? `${request.vehicle_info} • ` : ''}
                      {request.service_name || request.title}
                    </p>
                  </div>
                  
                  <div style={{
                    display: 'flex',
                    gap: '8px',
                    alignItems: 'center'
                  }}>
                    {/* Placeholder for future priority/urgency */}
                    
                    {/* Status Badge */}
                    <span style={{
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontSize: '11px',
                      fontWeight: '600',
                      backgroundColor: getStatusColor(request.status) + '20',
                      color: getStatusColor(request.status)
                    }}>
                      {getStatusText(request.status)}
                    </span>
                  </div>
                </div>

                {/* Description */}
                <p style={{
                  fontSize: '14px',
                  color: '#444',
                  margin: '0 0 16px 0',
                  lineHeight: '1.5'
                }}>
                  {request.description}
                </p>

                {/* Details */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '12px',
                  marginBottom: '16px'
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '13px',
                    color: '#666'
                  }}>
                    <Icon name="phone" size="sm" color="#666" />
                    <span>{request.client_phone || '—'}</span>
                  </div>
                  
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '13px',
                    color: '#666'
                  }}>
                    <Icon name="clock" size="sm" color="#666" />
                    <span>{formatDate(request.created_at)}</span>
                  </div>
                </div>

                {/* Ekler */}
                {Array.isArray((request as any).attachments) && (request as any).attachments.length > 0 && (
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
                    {(request as any).attachments.map((url: string, i: number) => (
                      <a key={i} href={url} target="_blank" rel="noreferrer" style={{ fontSize: 12, color: '#0066cc' }}>Ek {i+1}</a>
                    ))}
                  </div>
                )}

                {/* Mesajlar kaldırıldı */}

                {/* Teklif Aksiyonları */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
                  {/* Teklif Göster butonu: varsa */}
                  {(request as any).last_offered_price != null || (request as any).last_offered_days != null ? (
                    <button
                      onClick={() => setViewOfferId(request.id)}
                      style={{ padding: '8px 16px', background: '#f1f5f9', color: '#0f172a', border: '1px solid #e2e8f0', borderRadius: 6, fontWeight: 600, cursor: 'pointer' }}
                    >
                      Teklifi Göster
                    </button>
                  ) : <span />}
                  <button
                    onClick={() => {
                      setOfferForId(request.id);
                      setOfferMessage('');
                      setOfferPrice('');
                      setOfferDays('');
                      setOfferPhone(request.client_phone || '');
                      setOfferModalOpen(true);
                    }}
                    style={{ padding: '8px 16px', background: '#111', color: '#ffd600', border: 'none', borderRadius: 6, fontWeight: 700, cursor: 'pointer' }}
                  >
                    Teklif Ver
                  </button>
                </div>

                {/* Quick Actions (row-level) */}
                {request.status === 'pending' && (
                  <div style={{
                    display: 'flex',
                    gap: '8px',
                    marginTop: '16px'
                  }}>
                    <button
                      onClick={() => handleStatusChange(request.id, 'responded')}
                      style={{
                        padding: '8px 16px',
                        backgroundColor: '#10b981',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        fontSize: '13px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        transition: 'background-color 0.2s'
                      }}
                      onMouseOver={(e) => (e.target as HTMLButtonElement).style.backgroundColor = '#059669'}
                      onMouseOut={(e) => (e.target as HTMLButtonElement).style.backgroundColor = '#10b981'}
                    >
                      Yanıtlandı
                    </button>
                    
                    <button
                      onClick={() => handleStatusChange(request.id, 'cancelled')}
                      style={{
                        padding: '8px 16px',
                        backgroundColor: '#ef4444',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        fontSize: '13px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        transition: 'background-color 0.2s'
                      }}
                      onMouseOver={(e) => (e.target as HTMLButtonElement).style.backgroundColor = '#dc2626'}
                      onMouseOut={(e) => (e.target as HTMLButtonElement).style.backgroundColor = '#ef4444'}
                    >
                      İptal Et
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Teklif Ver Modal */}
      {offerModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }}>
          <div style={{ background: 'white', borderRadius: 12, width: '100%', maxWidth: 640, padding: 24, position: 'relative' }}>
            <button onClick={() => setOfferModalOpen(false)} style={{ position: 'absolute', right: 12, top: 12, background: 'none', border: 'none', fontSize: 22, color: '#666', cursor: 'pointer' }}>×</button>
            <h3 style={{ margin: 0, marginBottom: 12, fontSize: 20, fontWeight: 700, color: '#111' }}>Teklif Ver</h3>
            <form onSubmit={async (e) => {
              e.preventDefault();
              if (!offerForId) return;
              if (!offerMessage.trim()) return;
              try {
                setOfferSubmitting(true);
                const res = await api.vendorReplyServiceRequest(offerForId, {
                  message: offerMessage.trim(),
                  phone: offerPhone || undefined,
                  price: offerPrice ? Number(offerPrice) : undefined,
                  days: offerDays ? Number(offerDays) : undefined,
                });
                setRequests(prev => prev.map(r => r.id === offerForId ? res.data : r));
                setOfferModalOpen(false);
              } catch (_) {
              } finally {
                setOfferSubmitting(false);
              }
            }}>
              {/* Mesaj (üstte ve geniş) */}
              <div style={{ marginBottom: 12, position: 'relative' }}>
                <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, color: '#333' }}>Cevabınız</label>
                <textarea
                  value={offerMessage}
                  onChange={(e) => setOfferMessage(e.target.value)}
                  placeholder="Müşteriye iletmek istediğiniz teklifi ve detayları yazın"
                  required
                  maxLength={1000}
                  style={{ width: '100%', padding: 12, border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 14, minHeight: 160, resize: 'vertical' }}
                />
                <span style={{ position: 'absolute', right: 8, bottom: 8, fontSize: 12, color: '#64748b' }}>{offerMessage.length}/1000</span>
              </div>

              {/* Alt alanlar (fiyat, gün, telefon) */}
              <div style={{ display: 'grid', gap: 12, gridTemplateColumns: '140px 120px 1fr' }}>
                <input value={offerPrice} onChange={(e) => setOfferPrice(e.target.value)} name="price" type="number" step="0.01" min="0" placeholder="Fiyat" style={{ padding: 12, border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 14 }} />
                <input value={offerDays} onChange={(e) => setOfferDays(e.target.value)} name="days" type="number" min="0" placeholder="Gün" style={{ padding: 12, border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 14 }} />
                <input value={offerPhone} onChange={(e) => setOfferPhone(e.target.value)} name="phone" placeholder="Telefon (opsiyonel)" style={{ padding: 12, border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 14 }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 12 }}>
                <button type="button" onClick={() => setOfferModalOpen(false)} style={{ padding: '10px 16px', border: '1px solid #e2e8f0', borderRadius: 8, background: '#fff', color: '#475569', fontWeight: 600, cursor: 'pointer' }}>Vazgeç</button>
                <button type="submit" disabled={offerSubmitting} style={{ padding: '10px 16px', border: 'none', borderRadius: 8, background: '#111', color: '#ffd600', fontWeight: 700, cursor: offerSubmitting ? 'not-allowed' : 'pointer', opacity: offerSubmitting ? 0.8 : 1 }}>{offerSubmitting ? 'Gönderiliyor...' : 'Gönder'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Teklifi Göster Modal */}
      {viewOfferId && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }}>
          <div style={{ background: 'white', borderRadius: 12, width: '100%', maxWidth: 520, padding: 24, position: 'relative' }}>
            <button onClick={() => setViewOfferId(null)} style={{ position: 'absolute', right: 12, top: 12, background: 'none', border: 'none', fontSize: 22, color: '#666', cursor: 'pointer' }}>×</button>
            <h3 style={{ margin: 0, marginBottom: 12, fontSize: 20, fontWeight: 700, color: '#111' }}>Verilen Teklif</h3>
            {(() => {
              const req = requests.find(r => r.id === viewOfferId);
              if (!req) return null;
              const price = (req as any).last_offered_price;
              const days = (req as any).last_offered_days;
              const phone = req.client_phone;
              // Son vendor mesajını bul (varsa)
              let lastVendorMessage = '' as string;
              if (Array.isArray(req.messages)) {
                const last = [...req.messages].reverse().find(m => m.by === 'vendor');
                if (last) lastVendorMessage = last.content;
              }
              return (
                <div style={{ display: 'grid', gap: 10 }}>
                  <div style={{ fontSize: 14, color: '#334155' }}>
                    <span style={{ fontWeight: 600 }}>Mesaj:</span>
                    <div style={{ whiteSpace: 'pre-wrap', marginTop: 6 }}>{lastVendorMessage || '—'}</div>
                  </div>
                  <div style={{ display: 'grid', gap: 8, gridTemplateColumns: '1fr 1fr' }}>
                    <div style={{ fontSize: 14, color: '#334155' }}><span style={{ fontWeight: 600 }}>Fiyat:</span> {price != null ? `${formatPrice(price)} ₺` : '—'}</div>
                    <div style={{ fontSize: 14, color: '#334155' }}><span style={{ fontWeight: 600 }}>Gün:</span> {days != null ? String(days) : '—'}</div>
                  </div>
                  <div style={{ fontSize: 14, color: '#334155' }}><span style={{ fontWeight: 600 }}>Telefon:</span> {phone || '—'}</div>
                </div>
              );
            })()}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
              <button onClick={() => setViewOfferId(null)} style={{ padding: '10px 16px', border: '1px solid #e2e8f0', borderRadius: 8, background: '#fff', color: '#475569', fontWeight: 600, cursor: 'pointer' }}>Kapat</button>
            </div>
          </div>
        </div>
      )}
    </EsnafPanelLayout>
  );
} 