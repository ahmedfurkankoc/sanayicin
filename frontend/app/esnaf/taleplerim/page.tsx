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
  const [lastDays, setLastDays] = useState<number | ''>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  // Pagination state
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(15);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalCount, setTotalCount] = useState<number>(0);
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
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<Request | null>(null);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [cancelRequestId, setCancelRequestId] = useState<number | null>(null);
  const [cancelReason, setCancelReason] = useState<string>('');
  const [cancelSubmitting, setCancelSubmitting] = useState(false);

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        setIsLoading(true);
        const params: any = {};
        if (filterStatus !== 'all') params.status = filterStatus;
        if (onlyPending) params.only_pending = true;
        if (lastDays) params.last_days = lastDays;
        // Pagination params
        params.page = String(currentPage);
        params.page_size = String(pageSize);
        const res = await api.listVendorServiceRequests(params);
        const payload = res?.data ?? res;
        const list: Request[] = Array.isArray(payload) ? payload : (Array.isArray(payload?.results) ? payload.results : []);
        setRequests(list);
        // Derive totals
        const count = typeof payload?.count === 'number' ? payload.count : (Array.isArray(list) ? list.length : 0);
        setTotalCount(count);
        setTotalPages(Math.max(1, Math.ceil(count / pageSize)));
      } catch (e) {
        setRequests([]);
        setTotalCount(0);
        setTotalPages(1);
      } finally {
        setIsLoading(false);
      }
    };
    fetchRequests();
    const id = setInterval(fetchRequests, 15000);
    return () => clearInterval(id);
  }, [filterStatus, onlyPending, lastDays, currentPage, pageSize]);

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

  const handleStatusChange = async (requestId: number, newStatus: 'responded' | 'completed' | 'cancelled' | 'closed', cancellationReason?: string) => {
    try {
      const payload: any = { status: newStatus };
      if (newStatus === 'cancelled' && cancellationReason) {
        payload.cancellation_reason = cancellationReason;
      }
      const res = await api.vendorUpdateServiceRequestStatus(requestId, newStatus as any, cancellationReason);
      setRequests(prev => prev.map(req => req.id === requestId ? res.data : req));
      if (newStatus === 'cancelled') {
        setCancelModalOpen(false);
        setCancelReason('');
        setCancelRequestId(null);
      }
    } catch (error: any) {
      console.error('Status update error:', error);
      // Hata durumunda sadece cancelled ise modal'ı kapatma, kullanıcı tekrar denesin
      if (newStatus !== 'cancelled') {
        setRequests(prev => prev.map(req => req.id === requestId ? { ...req, status: newStatus } : req));
      }
    }
  };

  const handleCancelClick = (requestId: number) => {
    setCancelRequestId(requestId);
    setCancelReason('');
    setCancelModalOpen(true);
  };

  const handleCancelSubmit = async () => {
    if (!cancelRequestId || !cancelReason.trim()) {
      return;
    }
    try {
      setCancelSubmitting(true);
      await handleStatusChange(cancelRequestId, 'cancelled', cancelReason.trim());
    } catch (error: any) {
      console.error('Cancel error:', error);
    } finally {
      setCancelSubmitting(false);
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

        {/* Filters */}
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

            {/* Filters Group */}
            <div className="esnaf-appointments-filters-group">
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
            </div>

            {/* Toggles Group */}
            <div className="esnaf-appointments-filters-group">
              <label className="esnaf-appointments-toggle">
                <input type="checkbox" checked={onlyPending} onChange={(e) => setOnlyPending(e.target.checked)} />
                <span>Sadece beklemede</span>
              </label>
            </div>
          </div>
        </div>

        {/* Requests Table */}
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
          <div className="esnaf-requests-table-wrapper">
            <table className="esnaf-requests-table">
              <thead>
                <tr>
                  <th className="esnaf-table-col-id">ID</th>
                  <th className="esnaf-table-col-client">Müşteri</th>
                  <th className="esnaf-table-col-type">Tür</th>
                  <th className="esnaf-table-col-service">Hizmet</th>
                  <th className="esnaf-table-col-vehicle">Araç</th>
                  <th className="esnaf-table-col-date">Tarih</th>
                  <th className="esnaf-table-col-status">Durum</th>
                  <th className="esnaf-table-col-actions">İşlemler</th>
                </tr>
              </thead>
              <tbody>
                {filteredRequests.map((request) => (
                  <tr 
                    key={request.id} 
                    className={`esnaf-table-row ${request.unread_for_vendor ? 'esnaf-table-row-unread' : ''}`}
                    onClick={(e) => {
                      // Butonlara tıklama durumunda modal açılmasın
                      if ((e.target as HTMLElement).closest('button')) return;
                      setSelectedRequest(request);
                      setDetailModalOpen(true);
                    }}
                    style={{ cursor: 'pointer' }}
                  >
                    <td className="esnaf-table-col-id">
                      <span className="esnaf-table-id">#{request.id}</span>
                    </td>
                    <td className="esnaf-table-col-client">
                      <div className="esnaf-table-client">
                        <span className="esnaf-table-client-name">
                          {request.user?.name || request.user?.email || 'Müşteri'}
                          {request.unread_for_vendor && (
                            <span className="esnaf-unread-dot"></span>
                          )}
                        </span>
                        {request.client_phone && (
                          <span className="esnaf-table-client-phone">
                            <Icon name="phone" size={12} />
                            {request.client_phone}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="esnaf-table-col-type">
                      <span className="esnaf-table-type">
                        {request.request_type ? {
                          appointment: '📅 Randevu',
                          quote: '💰 Fiyat Teklifi',
                          emergency: '🚨 Acil Yardım',
                          part: '🔧 Parça Talebi'
                        }[request.request_type] : '—'}
                      </span>
                    </td>
                    <td className="esnaf-table-col-service">
                      <div className="esnaf-table-service">
                        <span className="esnaf-table-service-name">{request.service_name || request.title}</span>
                        {request.description && (
                          <span className="esnaf-table-service-desc" title={request.description}>
                            {request.description.length > 50 
                              ? `${request.description.substring(0, 50)}...` 
                              : request.description}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="esnaf-table-col-vehicle">
                      <span className="esnaf-table-vehicle">
                        {request.vehicle_info || '—'}
                      </span>
                    </td>
                    <td className="esnaf-table-col-date">
                      <span className="esnaf-table-date">
                        {formatDate(request.created_at)}
                      </span>
                    </td>
                    <td className="esnaf-table-col-status">
                      <span className={`esnaf-status-badge ${request.status}`}>
                        {getStatusText(request.status)}
                      </span>
                    </td>
                    <td className="esnaf-table-col-actions" onClick={(e) => e.stopPropagation()}>
                      <div className="esnaf-table-actions">
                        {(request as any).last_offered_price != null || (request as any).last_offered_days != null ? (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setViewOfferId(request.id);
                            }}
                            className="esnaf-btn esnaf-btn-secondary esnaf-btn-sm"
                            title="Teklifi Göster"
                          >
                            <Icon name="eye" size={14} />
                            <span className="esnaf-btn-text">Teklif</span>
                          </button>
                        ) : (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setOfferForId(request.id);
                              setOfferMessage('');
                              setOfferPrice('');
                              setOfferDays('');
                              setOfferPhone(request.client_phone || '');
                              setOfferModalOpen(true);
                            }}
                            className="esnaf-btn esnaf-btn-primary esnaf-btn-sm"
                            title="Teklif Ver"
                          >
                            <span className="esnaf-btn-text">Teklif Ver</span>
                          </button>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSendMessage(request);
                          }}
                          className="esnaf-btn esnaf-btn-outline esnaf-btn-sm"
                          title="Mesaj Gönder"
                        >
                          <Icon name="message" size={14} />
                          <span className="esnaf-btn-text">Mesaj</span>
                        </button>
                        {request.status === 'pending' && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCancelClick(request.id);
                            }}
                            className="esnaf-btn esnaf-btn-red esnaf-btn-sm"
                            title="İptal Et"
                          >
                            <Icon name="x" size={14} />
                            <span className="esnaf-btn-text">İptal</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Controls */}
        {filteredRequests.length > 0 && (
          <div className="esnaf-pagination">
            <div className="esnaf-pagination-info">
              Toplam {totalCount} kayıt • Sayfa {currentPage} / {totalPages}
            </div>
            <div className="esnaf-pagination-controls">
              <button
                className="esnaf-btn esnaf-btn-outline"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage <= 1}
              >
                Önceki
              </button>
              {/* Page numbers (max 5) */}
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum: number;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }
                return (
                  <button
                    key={pageNum}
                    className={`esnaf-btn esnaf-btn-outline esnaf-pagination-page ${currentPage === pageNum ? 'active' : ''}`}
                    onClick={() => setCurrentPage(pageNum)}
                  >
                    {pageNum}
                  </button>
                );
              })}
              <button
                className="esnaf-btn esnaf-btn-outline"
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage >= totalPages}
              >
                Sonraki
              </button>
              <select
                value={pageSize}
                onChange={(e) => { setCurrentPage(1); setPageSize(Number(e.target.value)); }}
                className="esnaf-pagination-size-select"
              >
                <option value={10}>10/sayfa</option>
                <option value={15}>15/sayfa</option>
                <option value={20}>20/sayfa</option>
                <option value={30}>30/sayfa</option>
              </select>
            </div>
          </div>
        )}
      

      {/* Teklif Ver Modal */}
      {offerModalOpen && (
        <div className="esnaf-modal-overlay esnaf-modal-centered">
          <div className="esnaf-modal-popup esnaf-modal-popup-large">
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
        <div className="esnaf-modal-overlay esnaf-modal-centered" onClick={() => setViewOfferId(null)}>
          <div className="esnaf-modal-popup esnaf-modal-popup-medium" onClick={(e) => e.stopPropagation()}>
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
                <div className="esnaf-view-offer-content">
                  <div className="esnaf-view-offer-section">
                    <div className="esnaf-view-offer-section-title">Mesaj</div>
                    <div className="esnaf-view-offer-message-box">
                      {lastVendorMessage || 'Mesaj bulunamadı'}
                    </div>
                  </div>
                  
                  <div className="esnaf-view-offer-info-grid">
                    <div className="esnaf-view-offer-info-item">
                      <div className="esnaf-view-offer-info-label">Fiyat</div>
                      <div className="esnaf-view-offer-info-value">
                        {price != null ? `${formatPrice(price)} ₺` : '—'}
                      </div>
                    </div>
                    <div className="esnaf-view-offer-info-item">
                      <div className="esnaf-view-offer-info-label">Tahmini Süre</div>
                      <div className="esnaf-view-offer-info-value">
                        {days != null ? `${days} gün` : '—'}
                      </div>
                    </div>
                    <div className="esnaf-view-offer-info-item esnaf-view-offer-info-item-full">
                      <div className="esnaf-view-offer-info-label">İletişim Telefonu</div>
                      <div className="esnaf-view-offer-info-value">
                        {phone || '—'}
                      </div>
                    </div>
                  </div>
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
          <div className="esnaf-modal-popup esnaf-modal-popup-medium">
            <button onClick={() => setMessageModalOpen(false)} className="esnaf-modal-close">×</button>
            <h3 className="esnaf-modal-title">Mesaj Gönder</h3>
            
            {/* Talep Bilgileri */}
            <div className="esnaf-message-request-info">
              <div className="esnaf-message-request-header">
                <Icon name="file" size="sm" color="#666" />
                <span className="esnaf-message-request-title">
                  Talep #{messageForRequest.id}: {messageForRequest.title}
                </span>
              </div>
              <div className="esnaf-message-request-client">
                Müşteri: {messageForRequest.user?.name || messageForRequest.user?.email || 'Bilinmeyen'}
              </div>
              <div className="esnaf-message-request-desc">
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
              <div className="esnaf-offer-message">
                <label className="esnaf-offer-label">Mesajınız</label>
                <textarea
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  placeholder="Müşteriye göndermek istediğiniz mesajı yazın..."
                  required
                  maxLength={1000}
                  className="esnaf-offer-textarea esnaf-offer-textarea-medium"
                />
                <span className="esnaf-offer-counter">{messageText.length}/1000</span>
              </div>

              <div className="esnaf-message-tip">
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

      {/* Talep Detay Modal */}
      {detailModalOpen && selectedRequest && (
        <div className="esnaf-modal-overlay esnaf-modal-centered" onClick={() => setDetailModalOpen(false)}>
          <div className="esnaf-modal-popup esnaf-modal-popup-large" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setDetailModalOpen(false)} className="esnaf-modal-close">×</button>
            <h3 className="esnaf-modal-title">Talep Detayları</h3>
            
            <div className="esnaf-request-detail-content">
              <div className="esnaf-request-detail-section">
                <div className="esnaf-request-detail-header">
                  <div>
                    <h4 className="esnaf-request-detail-title">
                      #{selectedRequest.id} - {selectedRequest.title}
                    </h4>
                    <div className="esnaf-request-detail-meta">
                      <span className={`esnaf-status-badge ${selectedRequest.status}`}>
                        {getStatusText(selectedRequest.status)}
                      </span>
                      <span className="esnaf-request-detail-type">
                        {selectedRequest.request_type ? {
                          appointment: '📅 Randevu',
                          quote: '💰 Fiyat Teklifi',
                          emergency: '🚨 Acil Yardım',
                          part: '🔧 Parça Talebi'
                        }[selectedRequest.request_type] : ''}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="esnaf-request-detail-info-grid">
                  <div className="esnaf-request-detail-info-item">
                    <span className="esnaf-request-detail-label">Müşteri:</span>
                    <span className="esnaf-request-detail-value">
                      {selectedRequest.user?.name || selectedRequest.user?.email || 'Bilinmeyen'}
                    </span>
                  </div>
                  {selectedRequest.client_phone && (
                    <div className="esnaf-request-detail-info-item">
                      <span className="esnaf-request-detail-label">Telefon:</span>
                      <span className="esnaf-request-detail-value">{selectedRequest.client_phone}</span>
                    </div>
                  )}
                  {selectedRequest.service_name && (
                    <div className="esnaf-request-detail-info-item">
                      <span className="esnaf-request-detail-label">Hizmet:</span>
                      <span className="esnaf-request-detail-value">{selectedRequest.service_name}</span>
                    </div>
                  )}
                  {selectedRequest.vehicle_info && (
                    <div className="esnaf-request-detail-info-item">
                      <span className="esnaf-request-detail-label">Araç:</span>
                      <span className="esnaf-request-detail-value">{selectedRequest.vehicle_info}</span>
                    </div>
                  )}
                  <div className="esnaf-request-detail-info-item">
                    <span className="esnaf-request-detail-label">Tarih:</span>
                    <span className="esnaf-request-detail-value">{formatDate(selectedRequest.created_at)}</span>
                  </div>
                </div>

                <div className="esnaf-request-detail-description">
                  <span className="esnaf-request-detail-label">Açıklama:</span>
                  <p className="esnaf-request-detail-desc-text">{selectedRequest.description}</p>
                </div>

                {(selectedRequest as any).attachments && Array.isArray((selectedRequest as any).attachments) && (selectedRequest as any).attachments.length > 0 && (
                  <div className="esnaf-request-detail-attachments">
                    <span className="esnaf-request-detail-label">Ekler:</span>
                    <div className="esnaf-request-detail-attachment-list">
                      {(selectedRequest as any).attachments.map((url: string, i: number) => (
                        <a key={i} href={url} target="_blank" rel="noreferrer" className="esnaf-request-detail-attachment-link">
                          Ek {i+1} <Icon name="external-link" size={12} />
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="esnaf-modal-actions">
              <button onClick={() => setDetailModalOpen(false)} className="esnaf-btn esnaf-btn-outline">Kapat</button>
              {(selectedRequest as any).last_offered_price == null && (selectedRequest as any).last_offered_days == null && (
                <button
                  onClick={() => {
                    setDetailModalOpen(false);
                    setOfferForId(selectedRequest.id);
                    setOfferMessage('');
                    setOfferPrice('');
                    setOfferDays('');
                    setOfferPhone(selectedRequest.client_phone || '');
                    setOfferModalOpen(true);
                  }}
                  className="esnaf-btn esnaf-btn-primary"
                >
                  Teklif Ver
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* İptal Nedeni Modal */}
      {cancelModalOpen && cancelRequestId && (
        <div className="esnaf-modal-overlay esnaf-modal-centered" onClick={() => setCancelModalOpen(false)}>
          <div className="esnaf-modal-popup esnaf-modal-popup-medium" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setCancelModalOpen(false)} className="esnaf-modal-close">×</button>
            <h3 className="esnaf-modal-title">Talebi İptal Et</h3>
            
            <div className="esnaf-cancel-form">
              <div className="esnaf-offer-message">
                <label className="esnaf-offer-label">İptal Nedeni *</label>
                <textarea
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="Bu talebi neden iptal ettiğinizi açıklayın..."
                  required
                  maxLength={500}
                  className="esnaf-offer-textarea esnaf-offer-textarea-medium"
                  rows={4}
                />
                <span className="esnaf-offer-counter">{cancelReason.length}/500</span>
              </div>

              <div className="esnaf-message-tip">
                <strong>⚠️ Dikkat:</strong> İptal edilen talepler müşteriye bildirilecektir.
              </div>

              <div className="esnaf-modal-actions">
                <button 
                  type="button" 
                  onClick={() => {
                    setCancelModalOpen(false);
                    setCancelReason('');
                    setCancelRequestId(null);
                  }} 
                  className="esnaf-btn esnaf-btn-outline"
                >
                  Vazgeç
                </button>
                <button 
                  type="button"
                  onClick={handleCancelSubmit}
                  disabled={cancelSubmitting || !cancelReason.trim()} 
                  className="esnaf-btn esnaf-btn-red"
                >
                  {cancelSubmitting ? 'İptal Ediliyor...' : 'İptal Et'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </EsnafPanelLayout>
  );
} 