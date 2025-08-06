'use client';

import React, { useState, useEffect } from 'react';
import { useEsnaf } from '../context/EsnafContext';
import EsnafPanelLayout from '../components/EsnafPanelLayout';
import Icon from '@/app/components/ui/Icon';

interface Request {
  id: string;
  customerName: string;
  customerPhone: string;
  service: string;
  description: string;
  location: string;
  status: 'pending' | 'accepted' | 'rejected' | 'completed';
  createdAt: string;
  urgency: 'low' | 'medium' | 'high';
}

export default function TaleplerimPage() {
  const { user, loading } = useEsnaf();
  const [requests, setRequests] = useState<Request[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  // Mock data - gerçek API'den gelecek
  useEffect(() => {
    const mockRequests: Request[] = [
      {
        id: '1',
        customerName: 'Ahmet Yılmaz',
        customerPhone: '+90 532 123 45 67',
        service: 'Motor Yağı Değişimi',
        description: 'Araç motor yağı değişimi yapılması gerekiyor. 5000 km geçti.',
        location: 'Kadıköy, İstanbul',
        status: 'pending',
        createdAt: '2024-01-15T10:30:00Z',
        urgency: 'medium'
      },
      {
        id: '2',
        customerName: 'Fatma Demir',
        customerPhone: '+90 533 987 65 43',
        service: 'Fren Sistemi Kontrolü',
        description: 'Frenlerde ses geliyor, kontrol edilmesi gerekiyor.',
        location: 'Beşiktaş, İstanbul',
        status: 'accepted',
        createdAt: '2024-01-14T14:20:00Z',
        urgency: 'high'
      },
      {
        id: '3',
        customerName: 'Mehmet Kaya',
        customerPhone: '+90 534 555 44 33',
        service: 'Lastik Değişimi',
        description: '4 lastik değişimi yapılması gerekiyor.',
        location: 'Şişli, İstanbul',
        status: 'completed',
        createdAt: '2024-01-13T09:15:00Z',
        urgency: 'low'
      },
      {
        id: '4',
        customerName: 'Ayşe Özkan',
        customerPhone: '+90 535 111 22 33',
        service: 'Klima Bakımı',
        description: 'Klima soğutmuyor, bakım yapılması gerekiyor.',
        location: 'Bakırköy, İstanbul',
        status: 'rejected',
        createdAt: '2024-01-12T16:45:00Z',
        urgency: 'medium'
      }
    ];

    setTimeout(() => {
      setRequests(mockRequests);
      setIsLoading(false);
    }, 1000);
  }, []);

  const filteredRequests = requests.filter(request => {
    const matchesStatus = filterStatus === 'all' || request.status === filterStatus;
    const matchesSearch = request.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         request.service.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         request.location.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return '#f59e0b';
      case 'accepted': return '#10b981';
      case 'rejected': return '#ef4444';
      case 'completed': return '#3b82f6';
      default: return '#6b7280';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'Beklemede';
      case 'accepted': return 'Kabul Edildi';
      case 'rejected': return 'Reddedildi';
      case 'completed': return 'Tamamlandı';
      default: return 'Bilinmiyor';
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'high': return '#ef4444';
      case 'medium': return '#f59e0b';
      case 'low': return '#10b981';
      default: return '#6b7280';
    }
  };

  const getUrgencyText = (urgency: string) => {
    switch (urgency) {
      case 'high': return 'Acil';
      case 'medium': return 'Orta';
      case 'low': return 'Düşük';
      default: return 'Bilinmiyor';
    }
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

  const handleStatusChange = (requestId: string, newStatus: string) => {
    setRequests(prev => prev.map(req => 
      req.id === requestId ? { ...req, status: newStatus as any } : req
    ));
  };

  if (loading || isLoading) {
    return (
      <EsnafPanelLayout activePage="taleplerim">
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '400px',
          fontSize: '18px',
          color: '#666'
        }}>
          Yükleniyor...
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
            gap: '12px',
            alignItems: 'center'
          }}>
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
        </div>

        {/* Filters */}
        <div style={{
          display: 'flex',
          gap: '16px',
          marginBottom: '24px',
          flexWrap: 'wrap',
          alignItems: 'center'
        }}>
          {/* Search */}
          <div style={{
            position: 'relative',
            flex: '1',
            minWidth: '250px'
          }}>
            <Icon 
              name="search" 
              size="sm" 
              color="#666"
              style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                zIndex: 1
              }}
            />
            <input
              type="text"
              placeholder="Müşteri, hizmet veya konum ara..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 12px 12px 40px',
                border: '1px solid #e0e0e0',
                borderRadius: '8px',
                fontSize: '14px',
                outline: 'none',
                transition: 'border-color 0.2s'
              }}
              onFocus={(e) => e.target.style.borderColor = '#ffd600'}
              onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
            />
          </div>

          {/* Status Filter */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            style={{
              padding: '12px 16px',
              border: '1px solid #e0e0e0',
              borderRadius: '8px',
              fontSize: '14px',
              outline: 'none',
              backgroundColor: 'white',
              cursor: 'pointer',
              minWidth: '150px'
            }}
          >
            <option value="all">Tüm Durumlar</option>
            <option value="pending">Beklemede</option>
            <option value="accepted">Kabul Edildi</option>
            <option value="rejected">Reddedildi</option>
            <option value="completed">Tamamlandı</option>
          </select>
        </div>

        {/* Requests List */}
        {filteredRequests.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '60px 20px',
            color: '#666'
          }}>
            <Icon name="file" size="lg" color="#ccc" style={{ marginBottom: '16px' }} />
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
                      {request.customerName}
                    </h3>
                    <p style={{
                      fontSize: '14px',
                      color: '#666',
                      margin: '0'
                    }}>
                      {request.service}
                    </p>
                  </div>
                  
                  <div style={{
                    display: 'flex',
                    gap: '8px',
                    alignItems: 'center'
                  }}>
                    {/* Urgency Badge */}
                    <span style={{
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontSize: '11px',
                      fontWeight: '600',
                      backgroundColor: getUrgencyColor(request.urgency) + '20',
                      color: getUrgencyColor(request.urgency)
                    }}>
                      {getUrgencyText(request.urgency)}
                    </span>
                    
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
                    <span>{request.customerPhone}</span>
                  </div>
                  
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '13px',
                    color: '#666'
                  }}>
                    <Icon name="map-pin" size="sm" color="#666" />
                    <span>{request.location}</span>
                  </div>
                  
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '13px',
                    color: '#666'
                  }}>
                    <Icon name="clock" size="sm" color="#666" />
                    <span>{formatDate(request.createdAt)}</span>
                  </div>
                </div>

                {/* Actions */}
                {request.status === 'pending' && (
                  <div style={{
                    display: 'flex',
                    gap: '8px',
                    marginTop: '16px'
                  }}>
                    <button
                      onClick={() => handleStatusChange(request.id, 'accepted')}
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
                      onMouseOver={(e) => e.target.style.backgroundColor = '#059669'}
                      onMouseOut={(e) => e.target.style.backgroundColor = '#10b981'}
                    >
                      Kabul Et
                    </button>
                    
                    <button
                      onClick={() => handleStatusChange(request.id, 'rejected')}
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
                      onMouseOver={(e) => e.target.style.backgroundColor = '#dc2626'}
                      onMouseOut={(e) => e.target.style.backgroundColor = '#ef4444'}
                    >
                      Reddet
                    </button>
                  </div>
                )}

                {request.status === 'accepted' && (
                  <div style={{
                    display: 'flex',
                    gap: '8px',
                    marginTop: '16px'
                  }}>
                    <button
                      onClick={() => handleStatusChange(request.id, 'completed')}
                      style={{
                        padding: '8px 16px',
                        backgroundColor: '#3b82f6',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        fontSize: '13px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        transition: 'background-color 0.2s'
                      }}
                      onMouseOver={(e) => e.target.style.backgroundColor = '#2563eb'}
                      onMouseOut={(e) => e.target.style.backgroundColor = '#3b82f6'}
                    >
                      Tamamlandı
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </EsnafPanelLayout>
  );
} 