import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Pencil, CircleDollarSign } from 'lucide-react'
import { getLoan } from '../api/loans'
import { formatMoney, formatDate } from '../lib/format'
import CurrencyBadge from '../components/CurrencyBadge'
import LoanEditModal from '../components/LoanEditModal'
import LoanPayModal from '../components/LoanPayModal'

const STATUS_LABELS = { Open: 'Açıq', PartiallyPaid: 'Qismən', Closed: 'Bağlı' }
const STATUS_STYLES = {
  Open: 'border border-emerald-200 bg-emerald-100 text-emerald-700',
  Closed: 'border border-slate-200 bg-slate-50 text-slate-500',
  PartiallyPaid: 'border border-amber-200 bg-amber-100 text-amber-700'
}

export default function LoanDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const qc = useQueryClient()

  const [editOpen, setEditOpen] = useState(false)
  const [payOpen, setPayOpen] = useState(false)

  const { data: loan, isLoading } = useQuery({
    queryKey: ['loan', id],
    queryFn: () => getLoan(id)
  })

  function invalidate() {
    qc.invalidateQueries({ queryKey: ['loan', id] })
    qc.invalidateQueries({ queryKey: ['loans'] })
    qc.invalidateQueries({ queryKey: ['cashbox-balance'] })
    qc.invalidateQueries({ queryKey: ['cashbox-transactions-by-day'] })
  }

  if (isLoading) return <div className="text-muted">Yüklənir…</div>
  if (!loan) return <div className="text-muted">Borc tapılmadı</div>

  const statusClass = STATUS_STYLES[loan.status] || STATUS_STYLES.Open
  const statusLabel = STATUS_LABELS[loan.status] || loan.status

  return (
    <div>
      <button className="mb-6 flex items-center gap-2 text-sm text-muted hover:text-ink" onClick={() => navigate('/loans')}>
        <ArrowLeft size={16} /> Borc ver siyahısına qayıt
      </button>

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-ink">{loan.clientName}</h1>
          <div className="mt-1 text-sm text-muted">{formatDate(loan.createdAt)}</div>
        </div>
        <div className="flex gap-2">
          {loan.status !== 'Closed' && (
            <button className="btn-secondary" onClick={() => setPayOpen(true)}>
              <CircleDollarSign size={16} /> Ödəniş qeyd et
            </button>
          )}
          <button className="btn-secondary" onClick={() => setEditOpen(true)}>
            <Pencil size={16} /> Redaktə et
          </button>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="card p-4">
          <div className="text-xs text-muted">Valyuta</div>
          <div className="mt-1"><CurrencyBadge currency={loan.currency} /></div>
        </div>
        <div className="card p-4">
          <div className="text-xs text-muted">Məbləğ</div>
          <div className="mt-1 font-semibold text-ink">{formatMoney(loan.amount, loan.currency)}</div>
        </div>
        <div className="card p-4">
          <div className="text-xs text-muted">Qalıq</div>
          <div className="mt-1 font-semibold text-ink">{formatMoney(loan.remainingAmount, loan.currency)}</div>
        </div>
        <div className="card p-4">
          <div className="text-xs text-muted">Status</div>
          <div className="mt-1">
            <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${statusClass}`}>{statusLabel}</span>
          </div>
        </div>
      </div>

      {(loan.exchangeRate || loan.note) && (
        <div className="mb-6 card p-4 text-sm">
          {loan.exchangeRate && <div className="text-muted">Kurs: <span className="text-ink">{loan.exchangeRate}</span></div>}
          {loan.note && <div className="mt-1 text-muted">Qeyd: <span className="text-ink">{loan.note}</span></div>}
        </div>
      )}

      <div className="card overflow-hidden">
        <div className="border-b border-border bg-paper px-4 py-3 text-sm font-semibold text-ink">Ödənişlər</div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-paper text-left text-muted">
                <th className="px-4 py-3 font-medium">Tarix</th>
                <th className="px-4 py-3 text-right font-medium">Məbləğ</th>
                <th className="px-4 py-3 font-medium">Qeyd</th>
              </tr>
            </thead>
            <tbody>
              {(loan.payments ?? []).length === 0 && (
                <tr><td colSpan={3} className="px-4 py-8 text-center text-muted">Ödəniş yoxdur</td></tr>
              )}
              {(loan.payments ?? []).map((p) => (
                <tr key={p.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3 text-muted">{formatDate(p.createdAt)}</td>
                  <td className="px-4 py-3 text-right font-medium text-brand">{formatMoney(p.amount, loan.currency)}</td>
                  <td className="px-4 py-3 text-muted">{p.note || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <LoanEditModal loan={editOpen ? loan : null} onClose={() => setEditOpen(false)} onDone={invalidate} />
      <LoanPayModal loan={payOpen ? loan : null} onClose={() => setPayOpen(false)} onDone={invalidate} />
    </div>
  )
}
