'use client';

import { useEffect, useRef } from 'react';
import { getAuthToken } from '@/app/utils/api';

type GlobalWSEvents = 'open' | 'close' | 'error' | 'message.new' | 'conversation.update' | 'notification.new' | 'typing.start' | 'typing.stop';

declare global {
  interface Window {
    __globalWS?: WebSocket | null;
    __globalWSEmitter?: EventTarget;
    __globalWSReadyState?: number;
    __globalWSReconnectTimeout?: ReturnType<typeof setTimeout> | null;
    __globalWSHeartbeatInterval?: ReturnType<typeof setInterval> | null;
    __globalWSEventQueue?: any[];
    __globalWSLastMessageAt?: number;
  }
}

function ensureConnection() {
  if (typeof window === 'undefined') return;
  if (window.__globalWS && window.__globalWS.readyState === WebSocket.OPEN) return;
  if (!window.__globalWSEmitter) window.__globalWSEmitter = new EventTarget();

  const vendorToken = getAuthToken('vendor');
  const clientToken = getAuthToken('client');
  const token = vendorToken || clientToken;
  if (!token) return;

  const wsUrl = process.env.NEXT_PUBLIC_WS_URL || (
    process.env.NEXT_PUBLIC_API_URL
      ? process.env.NEXT_PUBLIC_API_URL.replace('https://', 'wss://').replace('http://', 'ws://').replace('/api', '')
      : 'ws://localhost:8000'
  );
  try {
    const ws = new WebSocket(`${wsUrl}/ws/chat/global/?token=${encodeURIComponent(token)}`);
    window.__globalWS = ws;
    window.__globalWSReadyState = ws.readyState;
    window.__globalWSLastMessageAt = Date.now();

    ws.onopen = () => {
      window.__globalWSReadyState = ws.readyState;
      window.__globalWSEmitter?.dispatchEvent(new CustomEvent('open'));
    };
    ws.onclose = () => {
      window.__globalWSReadyState = ws.readyState;
      window.__globalWSEmitter?.dispatchEvent(new CustomEvent('close'));
      // Exponential backoff reconnect
      if (window.__globalWSReconnectTimeout) clearTimeout(window.__globalWSReconnectTimeout);
      if (window.__globalWSHeartbeatInterval) clearInterval(window.__globalWSHeartbeatInterval);
      window.__globalWSReconnectTimeout = setTimeout(() => {
        ensureConnection();
      }, 2000);
    };
    ws.onerror = () => {
      window.__globalWSEmitter?.dispatchEvent(new CustomEvent('error'));
    };
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        const name: GlobalWSEvents = data?.event;
        window.__globalWSLastMessageAt = Date.now();
        const throttle = (process.env.NEXT_PUBLIC_WS_THROTTLE || 'true') === 'true';
        const hidden = typeof document !== 'undefined' && document.hidden;
        if (name) {
          if (throttle && hidden) {
            if (!window.__globalWSEventQueue) window.__globalWSEventQueue = [];
            window.__globalWSEventQueue.push({ name, data });
          } else {
            window.__globalWSEmitter?.dispatchEvent(new CustomEvent(name, { detail: data }));
          }
        }
      } catch (_) {}
    };

    // Heartbeat + watchdog
    const intervalMs = Number(process.env.NEXT_PUBLIC_WS_HEARTBEAT_MS || 30000);
    if (window.__globalWSHeartbeatInterval) clearInterval(window.__globalWSHeartbeatInterval);
    window.__globalWSHeartbeatInterval = setInterval(() => {
      try {
        if (!window.__globalWS || window.__globalWS.readyState !== WebSocket.OPEN) return;
        // send lightweight ping
        window.__globalWS.send(JSON.stringify({ event: 'ping', t: Date.now() }));
        // watchdog: if we haven't received any message in 3*interval, force reconnect
        const last = window.__globalWSLastMessageAt || 0;
        if (Date.now() - last > intervalMs * 3) {
          try { window.__globalWS.close(); } catch {}
        }
      } catch (_) {}
    }, intervalMs);
  } catch (_) {}
}

export function useGlobalWS() {
  const emitterRef = useRef<EventTarget | null>(null);

  useEffect(() => {
    ensureConnection();
    if (!window.__globalWSEmitter) window.__globalWSEmitter = new EventTarget();
    emitterRef.current = window.__globalWSEmitter;
    // visibility flush
    const onVis = () => {
      const throttle = (process.env.NEXT_PUBLIC_WS_THROTTLE || 'true') === 'true';
      if (!throttle) return;
      if (!document.hidden && window.__globalWSEventQueue && window.__globalWSEventQueue.length) {
        const q = window.__globalWSEventQueue.splice(0, window.__globalWSEventQueue.length);
        for (const evt of q) {
          emitterRef.current?.dispatchEvent(new CustomEvent(evt.name, { detail: evt.data }));
        }
      }
    };
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', onVis);
    }
    return () => {
      // don't close socket here; shared
      if (typeof document !== 'undefined') {
        document.removeEventListener('visibilitychange', onVis);
      }
    };
  }, []);

  const on = (event: GlobalWSEvents, handler: (e: CustomEvent<any>) => void) => {
    emitterRef.current?.addEventListener(event, handler as EventListener);
  };
  const off = (event: GlobalWSEvents, handler: (e: CustomEvent<any>) => void) => {
    emitterRef.current?.removeEventListener(event, handler as EventListener);
  };

  return {
    on,
    off,
    readyState: typeof window !== 'undefined' ? (window.__globalWSReadyState ?? 0) : 0,
  };
}


