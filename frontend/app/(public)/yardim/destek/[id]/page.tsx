"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { api } from "@/app/utils/api";
import { iconMapping } from "@/app/utils/iconMapping";

export default function SupportTicketDetailPage() {
  const router = useRouter();
  const params = useParams();
  const ticketId = params.id as string;
  
  const [loading, setLoading] = useState(true);
  const [ticket, setTicket] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadTicketDetails = async () => {
    try {
      setLoading(true);
      const res = await api.getSupportTicketDetails(ticketId);
      setTicket(res.data);
      setMessages(res.data?.messages || []);
    } catch (e: any) {
      if (e?.response?.status === 404) {
        setError('Destek talebi bulunamadı');
      } else {
        setError('Detaylar yüklenemedi');
      }
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticket || !newMessage.trim()) return;
    
    setSendingMessage(true);
    try {
      await api.sendSupportMessage(ticket.id, newMessage);
      setNewMessage("");
      // Mesajları yeniden yükle
      await loadTicketDetails();
    } catch (e: any) {
      console.error('Mesaj gönderilemedi:', e);
    } finally {
      setSendingMessage(false);
    }
  };

  useEffect(() => {
    if (ticketId) {
      loadTicketDetails();
    }
  }, [ticketId]);

  if (loading) {
    return (
      <div className="support-detail-loading">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="support-detail-error">
        <div className="error-content">
          <h2>Hata</h2>
          <p>{error}</p>
          <button 
            className="btn-primary" 
            onClick={() => router.push('/yardim/destek?tab=tickets')}
          >
            Destek Taleplerine Dön
          </button>
        </div>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="support-detail-error">
        <div className="error-content">
          <h2>Destek Talebi Bulunamadı</h2>
          <p>Bu destek talebi mevcut değil veya erişim yetkiniz yok.</p>
          <button 
            className="btn-primary" 
            onClick={() => router.push('/yardim/destek?tab=tickets')}
          >
            Destek Taleplerine Dön
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Breadcrumb ve Tab Navigation */}
      <section className="sp-page">
        <div className="sp-container">
          <div className="sp-header">
            <div className="sp-breadcrumb">
              <a href="/yardim" className="sp-crumb">Destek</a>
              <span className="sp-crumb-sep">›</span>
              <a href="/yardim/destek?tab=tickets" className="sp-crumb">Destek Talepleri</a>
              <span className="sp-crumb-sep">›</span>
              <span className="sp-crumb-current">{ticket.subject || 'Destek Talebi'}</span>
            </div>
            <a href="/yardim" className="btn-dark">Yardım Merkezine Dön</a>
          </div>
          <div className="sp-grid">
            <aside className="sp-sidebar">
              <button type="button" className="sp-nav-btn active" onClick={() => router.push('/yardim/destek?tab=tickets')}>Tüm Destek Talepleri</button>
              <button type="button" className="sp-nav-btn" onClick={() => router.push('/yardim/destek?tab=new')}>Yeni Destek Talebi Oluştur</button>
            </aside>
            <div className="sp-content">
              <div className="support-detail-page">
                {/* Ticket Header */}
                <div className="support-detail-header">
                  <div className="ticket-info">
                    <h1>{ticket.subject || 'Destek Talebi'}</h1>
                    <div className="ticket-meta">
                      <span className="ticket-code">Kod: {ticket.public_id}</span>
                      <span className={`ticket-status ${ticket.status === 'open' ? 'status-open' : 'status-closed'}`}>
                        {ticket.status === 'open' ? 'Açık' : 'Kapalı'}
                      </span>
                    </div>
                    <div className="ticket-date">
                      Oluşturulma: {new Date(ticket.created_at).toLocaleDateString('tr-TR', { 
                        day: '2-digit', 
                        month: 'long', 
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                  </div>
                </div>

                {/* Orijinal Mesaj */}
                <div className="support-detail-messages">
                  <h3>Orijinal Talep</h3>
                  <div className="original-message">
                    <div className="message user-message">
                      <div className="message-avatar">S</div>
                      <div className="message-content-wrapper">
                        <div className="message-header">
                          <span className="message-sender">Siz</span>
                          <span className="message-time">
                            {new Date(ticket.created_at).toLocaleDateString('tr-TR', { 
                              day: '2-digit', 
                              month: 'long', 
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>
                        <div className="message-content">{ticket.message}</div>
                      </div>
                    </div>
                  </div>

                  {/* Yanıtlar */}
                  <h3>Yanıtlar</h3>
                  <div className="messages-container">
                    {messages.length === 0 ? (
                      <div className="no-messages">
                        <p>Henüz yanıt yok.</p>
                      </div>
                    ) : (
                      <div className="messages-list">
                        {messages.map((message, idx) => (
                          <div key={idx} className={`message ${message.is_admin ? 'admin-message' : 'user-message'}`}>
                            <div className="message-avatar">
                              {message.is_admin ? 'D' : 'S'}
                            </div>
                            <div className="message-content-wrapper">
                              <div className="message-header">
                                <span className="message-sender">
                                  {message.is_admin ? 'Destek Ekibi' : 'Siz'}
                                </span>
                                <span className="message-time">
                                  {new Date(message.created_at).toLocaleDateString('tr-TR', { 
                                    day: '2-digit', 
                                    month: 'long', 
                                    year: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </span>
                              </div>
                              <div className="message-content">{message.content}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Reply Form */}
                    {ticket.status === 'open' && (
                      <form onSubmit={sendMessage} className="message-form">
                        <div className="form-group">
                          <label htmlFor="message">Yanıtınız</label>
                          <textarea
                            id="message"
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            placeholder="Mesajınızı buraya yazabilirsiniz..."
                            rows={4}
                            required
                          />
                        </div>
                        <div className="form-actions">
                          <button 
                            type="submit" 
                            className="btn-primary"
                            disabled={sendingMessage || !newMessage.trim()}
                          >
                            {sendingMessage ? 'Gönderiliyor...' : 'Yeni Mesaj Gönder'}
                          </button>
                        </div>
                      </form>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
