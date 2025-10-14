"use client";

import React, { useEffect, useMemo, useState, Suspense } from "react";
// Navbar/Footer layout'ta render ediliyor
import { useRouter, useSearchParams } from "next/navigation";
import { api } from "@/app/utils/api";
import { iconMapping } from "@/app/utils/iconMapping";

function MyTickets() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [tickets, setTickets] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [unauthorized, setUnauthorized] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await api.getMySupportTickets();
        if (mounted) setTickets(res.data || []);
      } catch (e: any) {
        if (mounted) {
          if (e?.response?.status === 401) {
            setUnauthorized(true);
          } else {
            setError('Talepler yüklenemedi');
          }
        }
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  if (loading) return <div className="u-max-720"><p>Yükleniyor...</p></div>;
  if (unauthorized) return (
    <div className="u-max-720">
      <p>Destek taleplerini görmek için giriş yapmalısın.</p>
      <a href="/musteri/giris" className="btn-dark u-inline-block u-mt-8">Giriş Yap</a>
    </div>
  );
  if (error) return <div className="u-max-720"><p>{error}</p></div>;

  return (
    <div className="u-max-720">
      <h1 className="sp-title">Tüm Destek Talepleri</h1>
      {tickets.length === 0 ? (
        <p>Henüz bir talebiniz yok.</p>
      ) : (
        <div className="support-list">
          {tickets.map((t) => {
            const created = new Date(t.created_at);
            const dateText = created.toLocaleDateString('tr-TR', { day: '2-digit', month: 'long', year: 'numeric' });
            const timeText = created.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit', hour12: false });
            return (
            <div 
              key={t.id} 
              className="support-item" 
              onClick={() => router.push(`/yardim/destek/${t.id}`)}
              style={{ cursor: 'pointer' }}
            >
              <div className="support-item-left">
                <div className="support-item-date">{dateText}</div>
                <div className="support-item-time-minor">{timeText}</div>
              </div>
              <div className="support-item-center">
                <div className="support-item-title">{t.subject || 'Konu belirtilmemiş'}</div>
                <div className="support-item-meta-row">
                  <span className="support-item-code">Kod: {t.public_id}</span>
                </div>
              </div>
              <div className="support-item-right">
                {(() => {
                  const key = t.status === 'open' ? 'cevaplanmadi' : (t.status === 'pending' ? 'cevaplandi' : (t.status === 'resolved' ? 'cozuldu' : 'kapali'))
                  const label = key === 'cevaplanmadi' ? 'Cevaplanmadı' : key === 'cevaplandi' ? 'Cevaplandı' : key === 'cozuldu' ? 'Çözüldü' : 'Kapalı'
                  const cls = key === 'cevaplanmadi' ? 'status-red' : key === 'cevaplandi' ? 'status-green' : key === 'cozuldu' ? 'status-blue' : 'status-gray'
                  return (
                    <span className={`ticket-status ${cls}`}>{label}</span>
                  )
                })()}
              </div>
            </div>
          )})}
        </div>
      )}
    </div>
  );
}

function SupportHubContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTab = useMemo(() => {
    const t = searchParams.get('tab');
    return (t === 'tickets' || t === 'new') ? (t as 'tickets' | 'new') : 'new';
  }, [searchParams]);
  const [activeTab, setActiveTab] = useState<'new' | 'tickets'>(initialTab);

  const [ticketSubmitting, setTicketSubmitting] = useState(false);
  const [ticketId, setTicketId] = useState<string | null>(null);
  const [form, setForm] = useState({
    role: "client" as "client" | "vendor" | "unknown",
    subject: "",
    category: "",
    message: "",
    attachment: null as File | null,
  });
  const [newTicketStep, setNewTicketStep] = useState<'choose' | 'compose'>('choose');

  useEffect(() => {
    // keep URL in sync with tab
    const params = new URLSearchParams(Array.from(searchParams.entries()));
    params.set('tab', activeTab);
    const qs = params.toString();
    const url = `/yardim/destek${qs ? `?${qs}` : ''}`;
    window.history.replaceState(null, '', url);
  }, [activeTab, searchParams]);

  return (
    <>
      <section className="sp-page">
        <div className="sp-container">
          <div className="sp-header">
            <div className="sp-breadcrumb"><a href="/yardim" className="sp-crumb">Destek</a><span className="sp-crumb-sep">›</span><span className="sp-crumb-current">{activeTab === 'new' ? 'Yeni Destek Talebi' : 'Destek Talepleri'}</span></div>
            <a href="/yardim" className="btn-dark">Yardım Merkezine Dön</a>
          </div>
          <div className="sp-grid">
            <aside className="sp-sidebar">
              <button type="button" className={`sp-nav-btn ${activeTab === 'tickets' ? 'active' : ''}`} onClick={() => setActiveTab('tickets')}>Tüm Destek Talepleri</button>
              <button type="button" className={`sp-nav-btn ${activeTab === 'new' ? 'active' : ''}`} onClick={() => setActiveTab('new')}>Yeni Destek Talebi Oluştur</button>
            </aside>
            <div className="sp-content">
              {activeTab === 'tickets' && (
                <MyTickets />
              )}
              {activeTab === 'new' && (
                <div>
                  <div className="sp-section"><h1 className="sp-title">Yeni Destek Talebi</h1><p className="sp-lead">Hangi konuda yardıma ihtiyacın var?</p></div>
                  <div className="sp-card">
                    {newTicketStep === 'choose' && (
                      <div>
                        <div className="sp-topics">
                          {[
                            'Hesabımla ilgili yardıma ihtiyacım var',
                            "Sanayicin'le ilgili sorularım var",
                            'Teknik sorun bildirmek istiyorum',
                            'Aradığım hizmeti bulmakla ilgili sorun yaşıyorum',
                            'Diğer konularla ilgili yardıma ihtiyacım var',
                            'Aldığım hizmetle ilgili sorun yaşıyorum',
                          ].map((topic) => (
                            <button key={topic} type="button" className="sp-topic-btn"
                              onClick={() => {
                                setForm({ ...form, category: topic, subject: topic });
                                setNewTicketStep('compose');
                              }}
                            >{topic}</button>
                          ))}
                        </div>
                      </div>
                    )}

                    {newTicketStep === 'compose' && (
                      <form className="sp-form"
                        onSubmit={async (e) => {
                          e.preventDefault();
                          setTicketSubmitting(true);
                          try {
                            const fd = new FormData();
                            fd.append('role', form.role);
                            if (form.subject) fd.append('subject', form.subject);
                            if (form.category) fd.append('category', form.category);
                            fd.append('message', form.message);
                            if (form.attachment) fd.append('attachment', form.attachment);
                            const res = await api.createSupportTicket(fd);
                            const pid = res?.data?.public_id;
                            setTicketId(pid || null);
                            setForm({ role: 'client', subject: '', category: '', message: '', attachment: null });
                            setNewTicketStep('choose');
                          } catch (err: any) {
                            if (err?.response?.status === 401) {
                              router.push('/musteri/giris');
                              return;
                            }
                          } finally {
                            setTicketSubmitting(false);
                          }
                        }}
                      >
                        <div className="formGroup">
                          <label>Konu</label>
                          <input type="text" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} />
                          <div className="form-help">Seçtiğin başlıkla dolduruldu, istersen düzenleyebilirsin.</div>
                        </div>
                        <div className="formGroup">
                          <label>Mesaj</label>
                          <textarea required rows={5} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} />
                        </div>
                        <div className="formGroup">
                          <label>Dosya Ekle (opsiyonel)</label>
                          <input type="file" onChange={(e) => setForm({ ...form, attachment: e.target.files?.[0] || null })} />
                        </div>
                        
                        <div className="sp-actions"><button type="button" className="sp-secondary" onClick={() => setNewTicketStep('choose')}>Geri</button><button className="sp-primary" disabled={ticketSubmitting || !form.message} type="submit">{ticketSubmitting ? 'Gönderiliyor...' : 'Destek Talebi Oluştur'}</button></div>
                        {ticketId && (
                          <p className="u-mt-10">Talebiniz oluşturuldu. Takip kodu: <b>{ticketId}</b></p>
                        )}
                      </form>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

export default function SupportHubPage() {
  return (
    <Suspense fallback={<div className="u-max-720"><p>Yükleniyor...</p></div>}>
      <SupportHubContent />
    </Suspense>
  );
}

