'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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
  const router = useRouter();
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
  const [messageModalOpen, setMessageModalOpen] = useState(false);
  const [messageForRequest, setMessageForRequest] = useState<Request | null>(null);
  const [messageText, setMessageText] = useState('');
  const [messageSubmitting, setMessageSubmitting] = useState(false);

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

  const handleSendMessage = (request: Request) => {
    setMessageForRequest(request);
    setMessageText('');
    setMessageModalOpen(true);
  };

  const handleSendMessageSubmit = async () => {
    if (!messageForRequest || !messageText.trim()) return;
    
    try {
      setMessageSubmitting(true);
      
      // Önce conversation oluştur veya mevcut olanı bul
      const res = await api.chatCreateConversation(messageForRequest.user.id);
      const conversationId = res?.data?.id;
      
      if (conversationId) {
        // Talep bilgilerini mention olarak ekle
        const mentionText = `📋 Talep #${messageForRequest.id}: "${messageForRequest.title}"`;
        const fullMessage = `${mentionText}\n\n${messageText.trim()}`;
        
        // Mesajı gönder
        await api.chatSendMessageREST(conversationId, fullMessage);
        
        // Modal'ı kapat
        setMessageModalOpen(false);
        setMessageForRequest(null);
        setMessageText('');
        
        // Mesajlar sayfasına yönlendir
        router.push(`/esnaf/panel/mesajlar/${conversationId}`);
      }
    } catch (error) {
      console.error('Mesaj gönderilemedi:', error);
      // Hata durumunda sadece mesajlar sayfasına yönlendir
      router.push('/esnaf/panel/mesajlar');
    } finally {
      setMessageSubmitting(false);
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
        {/* Header */}
        <div className="esnaf-page-header">
          <div>
            <h1 className="esnaf-page-title">Taleplerim</h1>
            <p className="esnaf-page-subtitle">Müşterilerinizden gelen hizmet taleplerini yönetin</p>
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
          <div className="esnaf-requests-empty">
            <div className="esnaf-requests-empty-icon">
              <Icon name="file" size="lg" color="#ccc" />
            </div>
            <h3 className="esnaf-requests-empty-title">Talep Bulunamadı</h3>
            <p className="esnaf-requests-empty-text">
              {searchTerm || filterStatus !== 'all' 
                ? 'Arama kriterlerinize uygun talep bulunamadı.'
                : 'Henüz hiç talep bulunmuyor.'
              }
            </p>
          </div>
        ) : (
          <div className="esnaf-requests-grid">
            {filteredRequests.map((request) => (
              <div key={request.id} className="esnaf-request-card">
                {/* Header */}
                <div className="esnaf-request-card-header">
                  <div>
                    <h3 className="esnaf-request-client-name">
                      {request.user?.name || request.user?.email || 'Müşteri'}
                      {request.unread_for_vendor && (
                        <span className="esnaf-unread-dot"></span>
                      )}
                    </h3>
                    <p className="esnaf-request-subinfo">
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
                  <div className="esnaf-request-header-right">
                    <span className={`esnaf-status-badge ${request.status}`}>
                      {getStatusText(request.status)}
                    </span>
                  </div>
                </div>

                {/* Description */}
                <p className="esnaf-request-desc">
                  {request.description}
                </p>

                {/* Details */}
                <div className="esnaf-request-details">
                  <div className="esnaf-request-detail">
                    <Icon name="phone" size="sm" color="#666" />
                    <span>{request.client_phone || '—'}</span>
                  </div>
                  <div className="esnaf-request-detail">
                    <Icon name="clock" size="sm" color="#666" />
                    <span>{formatDate(request.created_at)}</span>
                  </div>
                </div>

                {/* Ekler */}
                {Array.isArray((request as any).attachments) && (request as any).attachments.length > 0 && (
                  <div className="esnaf-attachments">
                    {(request as any).attachments.map((url: string, i: number) => (
                      <a key={i} href={url} target="_blank" rel="noreferrer" className="esnaf-attachment-link">Ek {i+1}</a>
                    ))}
                  </div>
                )}

                {/* Mesajlar kaldırıldı */}

                {/* Teklif Aksiyonları */}
                <div className="esnaf-offer-actions">
                  {/* Teklif Göster butonu: varsa */}
                  {(request as any).last_offered_price != null || (request as any).last_offered_days != null ? (
                    <button
                      onClick={() => setViewOfferId(request.id)}
                      className="esnaf-btn esnaf-btn-secondary"
                    >
                      Teklifi Göster
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        setOfferForId(request.id);
                        setOfferMessage('');
                        setOfferPrice('');
                        setOfferDays('');
                        setOfferPhone(request.client_phone || '');
                        setOfferModalOpen(true);
                      }}
                      className="esnaf-btn esnaf-btn-primary"
                    >
                      Teklif Ver
                    </button>
                  )}
                  
                  {/* Mesaj Gönder butonu */}
                  <button
                    onClick={() => handleSendMessage(request)}
                    className="esnaf-btn esnaf-btn-outline"
                    style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                  >
                    <Icon name="message" size="sm" />
                    Mesaj Gönder
                  </button>
                </div>

                {/* Quick Actions (row-level) */}
                {request.status === 'pending' && (
                  <div className="esnaf-quick-actions">
                    <button
                      onClick={() => handleStatusChange(request.id, 'responded')}
                      className="esnaf-btn esnaf-btn-green"
                    >
                      Yanıtlandı
                    </button>
                    <button
                      onClick={() => handleStatusChange(request.id, 'cancelled')}
                      className="esnaf-btn esnaf-btn-red"
                    >
                      İptal Et
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      

      {/* Teklif Ver Modal */}
      {offerModalOpen && (
        <div className="esnaf-modal-overlay esnaf-modal-centered">
          <div className="esnaf-modal-popup" style={{ maxWidth: 640, width: '100%' }}>
            <button onClick={() => setOfferModalOpen(false)} className="esnaf-modal-close">×</button>
            <h3 className="esnaf-modal-title">Teklif Ver</h3>
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
              <div className="esnaf-offer-message">
                <label className="esnaf-offer-label">Cevabınız</label>
                <textarea
                  value={offerMessage}
                  onChange={(e) => setOfferMessage(e.target.value)}
                  placeholder="Müşteriye iletmek istediğiniz teklifi ve detayları yazın"
                  required
                  maxLength={1000}
                  className="esnaf-offer-textarea"
                />
                <span className="esnaf-offer-counter">{offerMessage.length}/1000</span>
              </div>

              {/* Alt alanlar (fiyat, gün, telefon) */}
              <div className="esnaf-offer-fields">
                <input value={offerPrice} onChange={(e) => setOfferPrice(e.target.value)} name="price" type="number" step="0.01" min="0" placeholder="Fiyat" className="esnaf-offer-input" />
                <input value={offerDays} onChange={(e) => setOfferDays(e.target.value)} name="days" type="number" min="0" placeholder="Gün" className="esnaf-offer-input" />
                <input value={offerPhone} onChange={(e) => setOfferPhone(e.target.value)} name="phone" placeholder="Telefon (opsiyonel)" className="esnaf-offer-input" />
              </div>
              <div className="esnaf-modal-actions">
                <button type="button" onClick={() => setOfferModalOpen(false)} className="esnaf-btn esnaf-btn-outline">Vazgeç</button>
                <button type="submit" disabled={offerSubmitting} className="esnaf-btn esnaf-btn-primary">{offerSubmitting ? 'Gönderiliyor...' : 'Gönder'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Teklifi Göster Modal */}
      {viewOfferId && (
        <div className="esnaf-modal-overlay esnaf-modal-centered">
          <div className="esnaf-modal-popup" style={{ maxWidth: 520, width: '100%' }}>
            <button onClick={() => setViewOfferId(null)} className="esnaf-modal-close">×</button>
            <h3 className="esnaf-modal-title">Verilen Teklif</h3>
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
                <div className="esnaf-view-offer-body">
                  <div className="esnaf-view-offer-row">
                    <span className="esnaf-view-offer-label">Mesaj:</span>
                    <div className="esnaf-view-offer-message">{lastVendorMessage || '—'}</div>
                  </div>
                  <div className="esnaf-view-offer-grid">
                    <div className="esnaf-view-offer-field"><span className="esnaf-view-offer-label">Fiyat:</span> {price != null ? `${formatPrice(price)} ₺` : '—'}</div>
                    <div className="esnaf-view-offer-field"><span className="esnaf-view-offer-label">Gün:</span> {days != null ? String(days) : '—'}</div>
                  </div>
                  <div className="esnaf-view-offer-row"><span className="esnaf-view-offer-label">Telefon:</span> {phone || '—'}</div>
                </div>
              );
            })()}
            <div className="esnaf-modal-actions">
              <button onClick={() => setViewOfferId(null)} className="esnaf-btn esnaf-btn-outline">Kapat</button>
            </div>
          </div>
        </div>
      )}

      {/* Mesaj Gönder Modal */}
      {messageModalOpen && messageForRequest && (
        <div className="esnaf-modal-overlay esnaf-modal-centered">
          <div className="esnaf-modal-popup" style={{ maxWidth: 600, width: '100%' }}>
            <button onClick={() => setMessageModalOpen(false)} className="esnaf-modal-close">×</button>
            <h3 className="esnaf-modal-title">Mesaj Gönder</h3>
            
            {/* Talep Bilgileri */}
            <div style={{ 
              background: '#f8f9fa', 
              padding: '16px', 
              borderRadius: '8px', 
              marginBottom: '20px',
              border: '1px solid #e9ecef'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <Icon name="file" size="sm" color="#666" />
                <span style={{ fontWeight: '600', color: '#333' }}>
                  Talep #{messageForRequest.id}: {messageForRequest.title}
                </span>
              </div>
              <div style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>
                Müşteri: {messageForRequest.user?.name || messageForRequest.user?.email || 'Bilinmeyen'}
              </div>
              <div style={{ fontSize: '13px', color: '#888', lineHeight: '1.4' }}>
                {messageForRequest.description.length > 100 
                  ? `${messageForRequest.description.substring(0, 100)}...` 
                  : messageForRequest.description
                }
              </div>
            </div>

            <form onSubmit={(e) => {
              e.preventDefault();
              handleSendMessageSubmit();
            }}>
              <div style={{ marginBottom: '20px' }}>
                <label className="esnaf-offer-label">Mesajınız</label>
                <textarea
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  placeholder="Müşteriye göndermek istediğiniz mesajı yazın..."
                  required
                  maxLength={1000}
                  className="esnaf-offer-textarea"
                  style={{ minHeight: '120px' }}
                />
                <span className="esnaf-offer-counter">{messageText.length}/1000</span>
              </div>

              <div style={{ 
                background: '#e3f2fd', 
                padding: '12px', 
                borderRadius: '6px', 
                marginBottom: '20px',
                fontSize: '13px',
                color: '#1565c0'
              }}>
                <strong>💡 İpucu:</strong> Mesajınız otomatik olarak talep bilgileri ile birlikte gönderilecek.
              </div>

              <div className="esnaf-modal-actions">
                <button 
                  type="button" 
                  onClick={() => setMessageModalOpen(false)} 
                  className="esnaf-btn esnaf-btn-outline"
                >
                  İptal
                </button>
                <button 
                  type="submit" 
                  disabled={messageSubmitting || !messageText.trim()} 
                  className="esnaf-btn esnaf-btn-primary"
                >
                  {messageSubmitting ? 'Gönderiliyor...' : 'Mesaj Gönder'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </EsnafPanelLayout>
  );
} 