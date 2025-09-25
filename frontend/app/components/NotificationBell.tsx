'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { iconMapping } from '@/app/utils/iconMapping';
import { useGlobalWS } from '@/app/hooks/useGlobalWS';
import { api } from '@/app/utils/api';

interface NotificationItem {
  title: string;
  message: string;
  link?: string;
}

type NotificationBellProps = {
  iconColor?: string;
};

export default function NotificationBell({ iconColor = 'var(--black)' }: NotificationBellProps) {
  const [show, setShow] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unread, setUnread] = useState<number>(0);
  const globalWS = useGlobalWS();
  const router = useRouter();
  const btnRef = useRef<HTMLButtonElement | null>(null);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  // Map backend payload to UI notification
  const mapNotificationPayload = (payload: any): NotificationItem => {
    const kind = payload?.kind as string | undefined;
    switch (kind) {
      case 'appointment_confirmed':
        return { title: 'Randevun onaylandı', message: payload?.vendor_name ? `${payload.vendor_name} randevunu onayladı.` : 'Randevunuz onaylandı.', link: '/musteri/taleplerim' };
      case 'appointment_rejected':
        return { title: 'Randevu reddedildi', message: payload?.vendor_name ? `${payload.vendor_name} randevunu reddetti.` : 'Randevunuz reddedildi.', link: '/musteri/taleplerim' };
      case 'appointment_cancelled':
        return { title: 'Randevu iptal edildi', message: payload?.vendor_name ? `${payload.vendor_name} randevuyu iptal etti.` : 'Randevunuz iptal edildi.', link: '/musteri/taleplerim' };
      case 'vendor_offer_sent':
        return { title: 'Yeni teklif', message: payload?.vendor_name ? `${payload.vendor_name} bir teklif gönderdi.` : 'Size yeni bir teklif geldi.', link: '/musteri/mesajlar' };
      case 'service_request_created':
        return { title: 'Yeni talep oluşturuldu', message: payload?.title || 'Yeni bir hizmet talebi oluşturuldu.', link: '/musteri/taleplerim' };
      default:
        return { title: payload?.title || 'Bildirim', message: payload?.message || '', link: payload?.link };
    }
  };

  // Subscribe global WS notifications and message events
  useEffect(() => {
    const push = (item: NotificationItem) => {
      setNotifications(prev => [item, ...prev].slice(0, 20));
      setUnread((u) => Math.min(9999, u + 1));
    };

    const onNotif = (e: CustomEvent<any>) => {
      const payload = e.detail?.data || {};
      push(mapNotificationPayload(payload));
    };

    const onMessage = (e: CustomEvent<any>) => {
      const payload = e.detail?.data || {};
      push({
        title: 'Yeni mesaj',
        message: payload?.content ? String(payload.content) : 'Yeni bir mesajınız var.',
        link: '/musteri/mesajlar'
      });
    };

    globalWS.on('notification.new', onNotif as any);
    globalWS.on('message.new', onMessage as any);
    return () => {
      globalWS.off('notification.new', onNotif as any);
      globalWS.off('message.new', onMessage as any);
    };
  }, [globalWS]);

  // Outside click close
  useEffect(() => {
    const handler = (event: MouseEvent) => {
      const target = event.target as Node;
      if (btnRef.current && btnRef.current.contains(target)) return;
      if (dropdownRef.current && dropdownRef.current.contains(target)) return;
      setShow(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleToggle = () => {
    setShow((v) => {
      const next = !v;
      if (next) setUnread(0); // açınca hepsini okundu say
      return next;
    });
  };

  return (
    <div style={{ position: 'relative', display: 'inline-flex' }}>
      <button
        ref={btnRef}
        onClick={handleToggle}
        aria-label="Bildirimler"
        style={{
          background: 'transparent',
          border: 'none',
          color: iconColor,
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 40,
          height: 40,
          borderRadius: 10,
          position: 'relative',
          cursor: 'pointer'
        }}
      >
        {React.createElement(iconMapping.bell, { size: 20, color: iconColor })}
        {unread > 0 && (
          <span style={{
            position: 'absolute', top: -6, right: -6,
            background: '#ef4444', color: '#fff', borderRadius: 999,
            padding: '2px 6px', fontSize: 10, fontWeight: 800,
            minWidth: 16, height: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1
          }}>
            {unread > 99 ? '99+' : unread}
          </span>
        )}
      </button>
      {show && (
        <div
          ref={dropdownRef}
          style={{
            position: 'absolute', top: '100%', right: 0,
            background: '#fff', border: '1px solid #e9ecef', borderRadius: 12,
            boxShadow: '0 8px 24px rgba(0,0,0,0.08)', padding: '8px 0',
            zIndex: 1000, minWidth: 280, marginTop: 6
          }}
        >
          <div style={{ padding: '12px 16px', borderBottom: '1px solid #e9ecef', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
            <strong style={{ color: 'var(--black)' }}>Bildirimler</strong>
            {notifications.length > 0 && (
              <button
                onClick={async () => {
                  try {
                    // Eğer mesaj payload'larında id varsa backend'e gönder
                    const ids = notifications
                      .map((n) => (n as any).id)
                      .filter((v) => typeof v === 'number');
                    if (ids.length) await api.clearNotifications(ids);
                  } catch {}
                  setNotifications([]);
                  setUnread(0);
                }}
                style={{ background: 'transparent', border: 'none', color: '#64748b', fontSize: 12, cursor: 'pointer' }}
              >
                Tümünü sil
              </button>
            )}
          </div>
          <div style={{ maxHeight: 360, overflowY: 'auto' }}>
            {notifications.length === 0 ? (
              <div style={{ padding: 16, fontSize: 13, color: '#475569' }}>Henüz bildiriminiz yok</div>
            ) : (
              notifications.map((n, i) => (
                <div
                  key={i}
                  onClick={() => { if (n.link) router.push(n.link); }}
                  style={{ cursor: n.link ? 'pointer' : 'default', padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 2 }}
                >
                  <div style={{ fontWeight: 600, color: '#0f172a' }}>{n.title}</div>
                  <div style={{ fontSize: 12, color: '#475569' }}>{n.message}</div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}


