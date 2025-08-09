'use client';

export type ChatWSClientOptions = {
  baseWsUrl?: string; // e.g. ws://localhost:8000
  conversationId: number;
  authToken?: string | null;
  guestToken?: string | null;
  onOpen?: () => void;
  onClose?: (e?: CloseEvent) => void;
  onMessage?: (event: { event: string; data: any }) => void;
};

export class ChatWSClient {
  private socket?: WebSocket;
  private opts: ChatWSClientOptions;
  private reconnectAttempts = 0;
  private closedByUser = false;

  constructor(opts: ChatWSClientOptions) {
    this.opts = opts;
  }

  private resolveBase(): string {
    // 1) Explicit option wins
    if (this.opts.baseWsUrl) return this.opts.baseWsUrl;
    // 2) Env: derive from NEXT_PUBLIC_WS_URL or NEXT_PUBLIC_API_URL
    const wsEnv = (process.env.NEXT_PUBLIC_WS_URL as string | undefined)?.trim();
    if (wsEnv) return wsEnv.replace(/^http/, 'ws');
    const apiEnv = (process.env.NEXT_PUBLIC_API_URL as string | undefined)?.trim();
    if (apiEnv) {
      try {
        const u = new URL(apiEnv);
        const origin = `${u.protocol.replace('http', 'ws')}//${u.host}`; // drop path like /api
        return origin;
      } catch {}
    }
    // 3) Fallback to current origin
    if (typeof window !== 'undefined') return window.location.origin.replace('http', 'ws');
    return 'ws://localhost:8000';
  }

  connect() {
    const base = this.resolveBase();
    const qs = this.opts.authToken
      ? `token=${encodeURIComponent(this.opts.authToken)}`
      : this.opts.guestToken
      ? `guest=${encodeURIComponent(this.opts.guestToken)}`
      : '';
    const url = `${base}/ws/chat/${this.opts.conversationId}/${qs ? `?${qs}` : ''}`;
    this.socket = new WebSocket(url);

    this.socket.onopen = () => {
      this.reconnectAttempts = 0;
      this.opts.onOpen?.();
    };
    this.socket.onmessage = (ev) => {
      try {
        const data = JSON.parse(ev.data);
        this.opts.onMessage?.(data);
      } catch {}
    };
    this.socket.onclose = (ev) => {
      if (typeof window !== 'undefined') {
        console.warn('WS closed', { code: ev.code, reason: ev.reason });
      }
      this.opts.onClose?.(ev);
      if (!this.closedByUser) {
        this.reconnect();
      }
    };
  }

  reconnect() {
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 15000);
    this.reconnectAttempts += 1;
    setTimeout(() => this.connect(), delay);
  }

  sendMessage(content: string) {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) return;
    this.socket.send(JSON.stringify({ event: 'message.send', data: { content } }));
  }

  typing(isTyping: boolean) {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) return;
    this.socket.send(JSON.stringify({ event: isTyping ? 'typing.start' : 'typing.stop' }));
  }

  close() {
    this.closedByUser = true;
    this.socket?.close();
  }

  isOpen(): boolean {
    return !!this.socket && this.socket.readyState === WebSocket.OPEN;
  }
}


