'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  listSupportTickets,
  listSupportMessages,
  sendSupportMessage,
  updateSupportTicket,
  type SupportTicket,
  type SupportMessage,
} from '../../api/admin'
import { usePermissions } from '../../contexts/AuthContext'

export default function SupportPage() {
  const { canRead, canWrite } = usePermissions()
  const canReadSupport = canRead('support')
  const canWriteSupport = canWrite('support')

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Ticket list state
  const [tickets, setTickets] = useState<SupportTicket[]>([])
  const [ticketTotal, setTicketTotal] = useState(0)
  const [ticketPage, setTicketPage] = useState(1)
  const [ticketPageSize, setTicketPageSize] = useState(10)
  const [ticketSearch, setTicketSearch] = useState('')
  const [ticketStatus, setTicketStatus] = useState<string>('')

  // Selection
  const [activeTicket, setActiveTicket] = useState<SupportTicket | null>(null)
  const [messages, setMessages] = useState<SupportMessage[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [updatingTicket, setUpdatingTicket] = useState(false)

  useEffect(() => {
    if (!canReadSupport) return
    let cancelled = false
    const loadTickets = async () => {
      try {
        setLoading(true)
        setError(null)
        const res = await listSupportTickets({
          page: ticketPage,
          page_size: ticketPageSize,
          search: ticketSearch || undefined,
          status: ticketStatus || undefined,
        })
        if (cancelled) return
        setTickets(res.items)
        setTicketTotal(res.count)
        // Keep active ticket in list or reset
        if (activeTicket) {
          const found = res.items.find((t) => t.id === activeTicket.id)
          if (!found) setActiveTicket(null)
        }
      } catch (e: any) {
        if (cancelled) return
        setError(e?.response?.data?.detail || 'Destek talepleri yüklenemedi')
      } finally {
        if (cancelled) return
        setLoading(false)
      }
    }
    loadTickets()
    return () => { cancelled = true }
  }, [canReadSupport, ticketPage, ticketPageSize, ticketSearch, ticketStatus])

  useEffect(() => {
    let cancelled = false
    const loadMessages = async () => {
      if (!activeTicket) return
      try {
        const res = await listSupportMessages(activeTicket.id)
        if (cancelled) return
        setMessages(res)
      } catch (e) {
        // ignore
      }
    }
    loadMessages()
    return () => { cancelled = true }
  }, [activeTicket])

  if (!canReadSupport) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Destek</h1>
        <p className="text-gray-600">Bu sayfayı görüntüleme yetkiniz yok.</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Tickets list */}
      <div className="lg:col-span-1 bg-white rounded-lg shadow p-4 flex flex-col">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-gray-900">Talepler</h2>
        </div>
        <div className="flex items-center gap-2 mb-3">
          <input
            type="text"
            placeholder="Ara (konu, e-posta)..."
            className="border border-gray-300 rounded px-3 py-2 w-full"
            value={ticketSearch}
            onChange={(e) => { setTicketSearch(e.target.value); setTicketPage(1) }}
          />
          <select
            className="border border-gray-300 rounded px-2 py-2 text-sm"
            value={ticketStatus}
            onChange={(e) => { setTicketStatus(e.target.value); setTicketPage(1) }}
          >
            <option value="">Durum (hepsi)</option>
            <option value="open">Açık</option>
            <option value="pending">Beklemede</option>
            <option value="resolved">Çözüldü</option>
            <option value="closed">Kapalı</option>
          </select>
        </div>
        <div className="overflow-y-auto divide-y divide-gray-200" style={{ maxHeight: 600 }}>
          {tickets.map((t) => (
            <button
              key={t.id}
              className={`w-full text-left px-3 py-2 hover:bg-gray-50 ${activeTicket?.id === t.id ? 'bg-gray-50' : ''}`}
              onClick={() => setActiveTicket(t)}
            >
              <div className="flex items-center justify-between">
                <div className="font-medium text-gray-900 truncate">{t.subject}</div>
                <span className={`text-xs px-2 py-1 rounded ${
                  t.status === 'open' ? 'bg-green-100 text-green-700' :
                  t.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                  t.status === 'resolved' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'
                }`}>{t.status}</span>
              </div>
              <div className="text-xs text-gray-500 truncate">{t.user_email || '-'}</div>
              <div className="text-xs text-gray-400">{new Date(t.created_at).toLocaleString()}</div>
            </button>
          ))}
          {tickets.length === 0 && (
            <div className="text-sm text-gray-500 px-3 py-6">Kayıt yok</div>
          )}
        </div>
        {/* Pagination */}
        <div className="mt-3 flex items-center justify-between">
          <div className="text-sm text-gray-600">Toplam {ticketTotal} kayıt</div>
          <div className="flex items-center gap-2">
            <select
              className="border border-gray-300 rounded px-2 py-1 text-sm"
              value={ticketPageSize}
              onChange={(e) => { setTicketPageSize(Number(e.target.value)); setTicketPage(1) }}
            >
              {[10, 20, 50].map((n) => (
                <option key={n} value={n}>{n}/sayfa</option>
              ))}
            </select>
            <button className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50 disabled:opacity-50" disabled={ticketPage <= 1} onClick={() => setTicketPage((p) => Math.max(1, p - 1))}>Önceki</button>
            <span className="text-sm text-gray-700">Sayfa {ticketPage} / {Math.max(1, Math.ceil(ticketTotal / ticketPageSize))}</span>
            <button className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50 disabled:opacity-50" disabled={ticketPage >= Math.ceil(ticketTotal / ticketPageSize)} onClick={() => setTicketPage((p) => p + 1)}>Sonraki</button>
          </div>
        </div>
      </div>

      {/* Ticket detail + messages */}
      <div className="lg:col-span-2 bg-white rounded-lg shadow p-6 flex flex-col min-h-[600px]">
        {activeTicket ? (
          <>
            <div className="flex items-start justify-between mb-4">
              <div className="space-y-1">
                <h3 className="text-lg font-semibold text-gray-900">{activeTicket.subject}</h3>
                <div className="text-sm text-gray-600">
                  <span className="font-medium">Kullanıcı:</span> {activeTicket.user_name || activeTicket.user_email || '-'}
                </div>
                <div className="text-xs text-gray-500">{new Date(activeTicket.created_at).toLocaleString()}</div>
              </div>
              <div className="flex items-center gap-2">
                <select
                  className="border border-gray-300 rounded px-2 py-1 text-sm"
                  value={activeTicket.status}
                  disabled={!canWriteSupport || updatingTicket}
                  onChange={async (e) => {
                    const next = e.target.value as SupportTicket['status']
                    try {
                      setUpdatingTicket(true)
                      const updated = await updateSupportTicket(activeTicket.id, { status: next })
                      setActiveTicket(updated)
                      setTickets((prev) => prev.map(t => t.id === updated.id ? updated : t))
                    } catch (_) {
                      // ignore
                    } finally {
                      setUpdatingTicket(false)
                    }
                  }}
                >
                  <option value="open">Açık</option>
                  <option value="pending">Beklemede</option>
                  <option value="resolved">Çözüldü</option>
                  <option value="closed">Kapalı</option>
                </select>
                <button
                  className="px-3 py-1 rounded btn-danger"
                  disabled={!canWriteSupport}
                  onClick={async () => {
                    if (!confirm('Talebi kapatmak istediğinize emin misiniz?')) return
                    try {
                      setUpdatingTicket(true)
                      const updated = await updateSupportTicket(activeTicket.id, { status: 'closed' })
                      setActiveTicket(updated)
                      setTickets((prev) => prev.map(t => t.id === updated.id ? updated : t))
                    } catch (_) {
                      // ignore
                    } finally {
                      setUpdatingTicket(false)
                    }
                  }}
                >Kapat</button>
              </div>
            </div>

            {/* Ticket initial message (if any) */}
            {activeTicket.message && (
              <div className="mb-4 border rounded p-4 bg-gray-50">
                <div className="text-sm text-gray-800 whitespace-pre-wrap">{activeTicket.message}</div>
              </div>
            )}

            <div className="flex-1 overflow-y-auto space-y-4 border rounded p-4">
              {messages.map((m) => (
                <div key={m.id} className="flex flex-col">
                  <div className="text-sm text-gray-700 whitespace-pre-wrap">{m.content}</div>
                  <div className="text-xs text-gray-500 mt-1">{m.user_email || 'Sistem'} • {new Date(m.created_at).toLocaleString()}</div>
                </div>
              ))}
              {messages.length === 0 && (
                <div className="text-sm text-gray-500">Henüz mesaj yok</div>
              )}
            </div>

            <div className="mt-4 flex items-center gap-3">
              <textarea
                className="flex-1 border border-gray-300 rounded px-3 py-2"
                rows={3}
                placeholder="Mesaj yazın..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
              />
              <button
                disabled={!canWriteSupport || !newMessage.trim() || sending}
                className="bg-[color:var(--yellow)] text-[color:var(--black)] font-medium rounded px-4 py-2 disabled:opacity-50"
                onClick={async () => {
                  if (!activeTicket || !newMessage.trim()) return
                  try {
                    setSending(true)
                    const created = await sendSupportMessage(activeTicket.id, newMessage.trim())
                    setMessages((prev) => [...prev, created])
                    setNewMessage('')
                  } catch (_) {
                    // ignore
                  } finally {
                    setSending(false)
                  }
                }}
              >Gönder</button>
            </div>
          </>
        ) : (
          <div className="text-sm text-gray-500">Soldan bir talep seçin</div>
        )}
      </div>
    </div>
  )
}


