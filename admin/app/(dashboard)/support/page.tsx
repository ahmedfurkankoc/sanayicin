'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import {
  listSupportTickets,
  type SupportTicket,
} from '../../api/admin'
import { usePermissions } from '../../contexts/AuthContext'
import Pagination from '../../components/Pagination'

export default function SupportPage() {
  const { canRead } = usePermissions()
  const canReadSupport = canRead('support')

  const [tickets, setTickets] = useState<SupportTicket[]>([])
  const [ticketTotal, setTicketTotal] = useState(0)
  const [ticketPage, setTicketPage] = useState(1)
  const [ticketPageSize, setTicketPageSize] = useState(10)
  const [ticketSearch, setTicketSearch] = useState('')
  const [ticketStatus, setTicketStatus] = useState<string>('')
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc')

  // Selection removed: navigate to detail page instead

  useEffect(() => {
    if (!canReadSupport) return
    let cancelled = false
    const loadTickets = async () => {
      try {
        setTicketTotal(0)
        const res = await listSupportTickets({
          page: ticketPage,
          page_size: ticketPageSize,
          search: ticketSearch || undefined,
          status: ticketStatus || undefined,
        })
        if (cancelled) return
        setTickets(res.items)
        setTicketTotal(res.count)
        // nothing else to do here
      } catch {
        if (cancelled) return
        // ignore errors
      }
    }
    loadTickets()
    return () => { cancelled = true }
  }, [canReadSupport, ticketPage, ticketPageSize, ticketSearch, ticketStatus])

  const sortedTickets = useMemo(() => {
    const priority: Record<string, number> = { open: 0, pending: 1, resolved: 2, closed: 3 }
    const byDate = (a: SupportTicket, b: SupportTicket) => {
      const ta = new Date(a.created_at).getTime()
      const tb = new Date(b.created_at).getTime()
      return sortOrder === 'desc' ? (tb - ta) : (ta - tb)
    }
    const arr = [...tickets]
    // When showing all statuses, put 'open' (cevaplanmadi) first
    if (!ticketStatus) {
      arr.sort((a, b) => {
        const pa = priority[a.status] ?? 99
        const pb = priority[b.status] ?? 99
        if (pa !== pb) return pa - pb
        return byDate(a, b)
      })
      return arr
    }
    // Otherwise keep selected status list, sort by date only
    arr.sort(byDate)
    return arr
  }, [tickets, ticketStatus, sortOrder])
  

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
      {/* Tickets list */}
      <div className="bg-white rounded-lg shadow p-4 flex flex-col">
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
            <option value="open">Cevaplanmadı</option>
            <option value="pending">Cevaplandı</option>
            <option value="resolved">Çözüldü</option>
            <option value="closed">Kapalı</option>
          </select>
          <select
            className="border border-gray-300 rounded px-2 py-2 text-sm"
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value as 'desc' | 'asc')}
            title="Sıralama"
          >
            <option value="desc">Yeni → Eski</option>
            <option value="asc">Eski → Yeni</option>
          </select>
        </div>
        <div className="overflow-y-auto divide-y divide-gray-200" style={{ maxHeight: 600 }}>
          {sortedTickets.map((t) => {
            // Show strictly by DB status to avoid confusion
            const key = (t.status === 'open' ? 'cevaplanmadi' : t.status === 'pending' ? 'beklemede' : t.status === 'resolved' ? 'cozuldu' : 'kapali') as 'cevaplanmadi' | 'beklemede' | 'cozuldu' | 'kapali'
            const label = key === 'cevaplanmadi' ? 'Cevaplanmadı' : key === 'beklemede' ? 'Cevaplandı' : key === 'cozuldu' ? 'Çözüldü' : 'Kapalı'
            const badgeClass = key === 'cevaplanmadi' ? 'bg-red-100 text-red-700' : key === 'beklemede' ? 'bg-yellow-100 text-yellow-700' : key === 'cozuldu' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'
            return (
              <Link href={`/support/${t.id}`} key={t.id} className="block w-full px-3 py-2 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="font-medium text-gray-900 truncate">{t.subject}</div>
                  <span className={`text-xs px-2 py-1 rounded ${badgeClass}`}>{label}</span>
                </div>
                <div className="text-xs text-gray-500 truncate">Kod: {t.public_id || '-'}</div>
                <div className="text-xs text-gray-400">{new Date(t.created_at).toLocaleString()}</div>
              </Link>
            )
          })}
          {tickets.length === 0 && (
            <div className="text-sm text-gray-500 px-3 py-6">Kayıt yok</div>
          )}
        </div>
        {/* Pagination */}
        <div className="mt-3">
          <Pagination
            currentPage={ticketPage}
            totalPages={Math.max(1, Math.ceil(ticketTotal / ticketPageSize))}
            totalCount={ticketTotal}
            pageSize={ticketPageSize}
            onPageChange={setTicketPage}
            onPageSizeChange={(size) => { setTicketPageSize(size); setTicketPage(1) }}
            itemName="talep"
          />
        </div>
      </div>
      
    </div>
  )
}


