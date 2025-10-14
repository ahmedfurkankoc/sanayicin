'use client'

import { useEffect, useRef, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
  getSupportTicket,
  listSupportMessages,
  sendSupportMessage,
  updateSupportTicket,
  type SupportTicket,
  type SupportMessage,
} from '../../../api/admin'
import { usePermissions } from '../../../contexts/AuthContext'

export default function SupportDetailPage() {
  const params = useParams()
  const router = useRouter()
  const ticketId = Number(params?.id)

  const { canRead, canWrite } = usePermissions()
  const canReadSupport = canRead('support')
  const canWriteSupport = canWrite('support')

  const [ticket, setTicket] = useState<SupportTicket | null>(null)
  const [loadingTicket, setLoadingTicket] = useState(true)
  const [messages, setMessages] = useState<SupportMessage[]>([])
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [newMessage, setNewMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [updating, setUpdating] = useState(false)

  const messagesEndRef = useRef<HTMLDivElement | null>(null)
  const messagesScrollRef = useRef<HTMLDivElement | null>(null)

  const loadAll = async () => {
    if (!ticketId || Number.isNaN(ticketId)) return
    try {
      setLoadingTicket(true)
      const t = await getSupportTicket(ticketId)
      setTicket(t)
    } finally {
      setLoadingTicket(false)
    }
    try {
      setLoadingMessages(true)
      const m = await listSupportMessages(ticketId)
      setMessages(m)
    } finally {
      setLoadingMessages(false)
    }
  }

  useEffect(() => {
    if (!canReadSupport) return
    loadAll()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canReadSupport, ticketId])

  useEffect(() => {
    if (!messagesScrollRef.current) return
    messagesScrollRef.current.scrollTo({ top: messagesScrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages.length])

  if (!canReadSupport) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Destek</h1>
        <p className="text-gray-600">Bu sayfayı görüntüleme yetkiniz yok.</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button className="text-sm text-gray-600 hover:underline" onClick={() => router.push('/support')}>{'←'} Listeye dön</button>
          <h1 className="text-2xl font-bold text-gray-900">Talep #{ticket?.public_id || '—'}</h1>
        </div>
        {ticket && (
          <div className="flex items-center gap-2">
            <select
              className="border border-gray-300 rounded px-2 py-1 text-sm"
              value={ticket.status}
              disabled={!canWriteSupport || updating}
              onChange={async (e) => {
                const next = e.target.value as SupportTicket['status']
                try {
                  setUpdating(true)
                  const updated = await updateSupportTicket(ticket.id, { status: next })
                  setTicket(updated)
                } finally {
                  setUpdating(false)
                }
              }}
            >
              <option value="open">Açık</option>
              <option value="pending">Beklemede</option>
              <option value="resolved">Çözüldü</option>
              <option value="closed">Kapalı</option>
            </select>
          </div>
        )}
      </div>

      <div className="bg-white rounded-lg shadow p-6 min-h-[600px] flex flex-col">
        {loadingTicket && (
          <div className="animate-pulse space-y-3">
            <div className="h-5 bg-gray-200 rounded w-1/3" />
            <div className="h-4 bg-gray-100 rounded w-2/3" />
          </div>
        )}
        {ticket && (
          <>
            <div className="mb-4">
              <div className="text-lg font-semibold text-gray-900">{ticket.subject}</div>
              <div className="text-sm text-gray-600"><span className="font-medium">Kullanıcı:</span> {ticket.user_name || ticket.user_email || '-'}</div>
              <div className="text-xs text-gray-400">{new Date(ticket.created_at).toLocaleString()}</div>
              {ticket.message && (
                <div className="mt-3 text-sm text-gray-800 whitespace-pre-wrap bg-gray-50 border rounded p-3">{ticket.message}</div>
              )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div ref={messagesScrollRef} className="lg:col-span-2 flex-1 overflow-y-auto space-y-4 border rounded p-4">
              {loadingMessages && (
                <div className="space-y-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className={`flex ${i % 2 === 0 ? 'justify-start' : 'justify-end'}`}>
                      <div className="max-w-[70%] p-3 rounded-lg bg-gray-100 animate-pulse">
                        <div className="h-3 bg-gray-200 rounded w-11/12 mb-2" />
                        <div className="h-3 bg-gray-200 rounded w-2/3" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {!loadingMessages && messages.map((m) => {
                const isAdmin = m.sender_user === null
                return (
                  <div key={m.id} className={`flex ${isAdmin ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[75%] p-3 rounded-lg shadow-sm whitespace-pre-wrap ${
                      isAdmin ? 'bg-[color:var(--yellow)] text-[color:var(--black)]' : 'bg-gray-100 text-gray-800'
                    }`}>
                      <div className="text-sm">{m.content}</div>
                      <div className={`mt-1 text-[11px] ${isAdmin ? 'text-[color:var(--black)]/70' : 'text-gray-500'}`}>{m.user_email || 'Sistem'} • {new Date(m.created_at).toLocaleString()}</div>
                    </div>
                  </div>
                )
              })}
              {!loadingMessages && messages.length === 0 && (
                <div className="text-sm text-gray-500">Henüz mesaj yok</div>
              )}
              <div ref={messagesEndRef} />
              </div>
              <aside className="lg:col-span-1">
                <div className="border rounded-lg p-4 bg-gray-50">
                  <div className="text-sm font-semibold text-gray-800 mb-3">Talep Sahibi</div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between gap-3"><span className="text-gray-500">Ad</span><span className="font-medium text-gray-900">{ticket.user_name || '-'}</span></div>
                    <div className="flex justify-between gap-3"><span className="text-gray-500">E-posta</span><span className="font-medium text-gray-900 break-all">{ticket.user_email || '-'}</span></div>
                    <div className="flex justify-between gap-3"><span className="text-gray-500">Rol</span><span className="font-medium text-gray-900 uppercase">-</span></div>
                  </div>
                  <div className="h-px bg-gray-200 my-3" />
                  <div className="text-sm font-semibold text-gray-800 mb-2">Talep Bilgileri</div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between gap-3"><span className="text-gray-500">Kod</span><span className="font-medium text-gray-900">{ticket.public_id || '-'}</span></div>
                    <div className="flex justify-between gap-3"><span className="text-gray-500">Kategori</span><span className="font-medium text-gray-900">-</span></div>
                    <div className="flex justify-between gap-3"><span className="text-gray-500">Öncelik</span><span className="font-medium text-gray-900 capitalize">normal</span></div>
                    <div className="flex justify-between gap-3"><span className="text-gray-500">Oluşturma</span><span className="font-medium text-gray-900">{new Date(ticket.created_at).toLocaleString()}</span></div>
                  </div>
                </div>
              </aside>
            </div>

            <div className="mt-4 flex items-start gap-3">
              <textarea
                className="flex-1 border border-gray-300 rounded px-3 py-2"
                rows={3}
                placeholder="Mesaj yazın..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={async (e) => {
                  const isEnter = e.key === 'Enter'
                  const withShift = e.shiftKey
                  const withCtrl = e.ctrlKey || e.metaKey
                  if (isEnter && !withShift && !withCtrl) {
                    e.preventDefault()
                    if (!canWriteSupport || !newMessage.trim() || sending) return
                    if (!ticket) return
                    try {
                      setSending(true)
                      const created = await sendSupportMessage(ticket.id, newMessage.trim())
                      setMessages((prev) => [...prev, created])
                      setNewMessage('')
                    } finally {
                      setSending(false)
                    }
                  }
                }}
              />
              <div className="flex flex-col items-end gap-2 min-w-[120px]">
                <button
                  disabled={!canWriteSupport || !newMessage.trim() || sending}
                  className="bg-[color:var(--yellow)] text-[color:var(--black)] font-medium rounded px-4 py-2 disabled:opacity-50"
                  onClick={async () => {
                    if (!ticket || !newMessage.trim()) return
                    try {
                      setSending(true)
                      const created = await sendSupportMessage(ticket.id, newMessage.trim())
                      setMessages((prev) => [...prev, created])
                      setNewMessage('')
                    } finally {
                      setSending(false)
                    }
                  }}
                >Gönder</button>
                <div className="text-[11px] text-gray-500">Enter: Gönder • Shift/CTRL+Enter: Satır</div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

