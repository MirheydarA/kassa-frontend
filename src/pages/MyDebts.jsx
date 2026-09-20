import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { Plus, Pencil, CircleDollarSign, Search } from 'lucide-react'
import { getMyDebts, createMyDebt } from '../api/mydebts'
import { formatMoney, formatDate, CURRENCIES } from '../lib/format'
import Modal from '../components/Modal'
import ClientAutocomplete from '../components/ClientAutocomplete'
import MoneyInput from '../components/MoneyInput'
import MyDebtEditModal from '../components/MyDebtEditModal'
import MyDebtPayModal from '../components/MyDebtPayModal'

const STATUS_LABELS = {
  open: 'Açıq',
  active: 'Açıq',
  closed: 'Bağlı',
  paid: 'Bağlı',
  partial: 'Qismən',
  partially: 'Qismən'
}

const STATUS_STYLES = {
  open: 'border border-emerald-200 bg-emerald-100 text-emerald-700',
  closed: 'border border-slate-200 bg-slate-50 text-slate-500 opacity-80',
  partial: 'border border-amber-200 bg-amber-100 text-amber-700',
  default: 'border border-border bg-surface text-muted'
}

export default function MyDebts() {
  const qc = useQueryClient()
  const navigate = useNavigate()

  const [searchInput, setSearchInput] = useState('')
  const [clientName, setClientName] = useState('')
  const [includeClosed, setIncludeClosed] = useState(false)

  const [createOpen, setCreateOpen] = useState(false)
  const [editDebt, setEditDebt] = useState(null)
  const [payDebt, setPayDebt] = useState(null)

  // Hərfləri yazdıqca deyil, son klaviş buraxılandan 1 saniyə sonra axtarış edir
  useEffect(() => {
    const t = setTimeout(() => setClientName(searchInput.trim()), 1000)
    return () => clearTimeout(t)
  }, [searchInput])

  const usdQuery = useQuery({
    queryKey: ['mydebts', 'USD', clientName, includeClosed],
    queryFn: () => getMyDebts({ currency: 'USD', clientName: clientName || undefined, includeClosed })
  })
  const rubQuery = useQuery({
    queryKey: ['mydebts', 'RUB', clientName, includeClosed],
    queryFn: () => getMyDebts({ currency: 'RUB', clientName: clientName || undefined, includeClosed })
  })

  function invalidate() {
    qc.invalidateQueries({ queryKey: ['mydebts'] })
    qc.invalidateQueries({ queryKey: ['cashbox-balance'] })
    qc.invalidateQueries({ queryKey: ['cashbox-transactions-by-day'] })
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold text-ink">Mənim borclarım</h1>
        <button className="btn-primary" onClick={() => setCreateOpen(true)}>
          <Plus size={16} /> Yeni borc götür
        </button>
      </div>

      <div className="mb-4 flex flex-wrap items-end gap-4">
        <div className="w-full max-w-xs">
          <label className="label">Müştəriyə görə axtarış</label>
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <input
              className="input !pl-9"
              placeholder="Müştəri adı…"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </div>
        </div>
        <label className="flex items-center gap-2 pb-2 text-sm text-ink">
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-border"
            checked={includeClosed}
            onChange={(e) => setIncludeClosed(e.target.checked)}
          />
          Ödənilmiş borcları da göstər
        </label>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <MyDebtColumn
          title="Dollar (USD)"
          items={usdQuery.data?.items}
          isLoading={usdQuery.isLoading}
          onRowClick={(id) => navigate(`/mydebts/${id}`)}
          onPay={setPayDebt}
          onEdit={setEditDebt}
        />
        <MyDebtColumn
          title="Rubl (RUB)"
          items={rubQuery.data?.items}
          isLoading={rubQuery.isLoading}
          onRowClick={(id) => navigate(`/mydebts/${id}`)}
          onPay={setPayDebt}
          onEdit={setEditDebt}
        />
      </div>

      <CreateMyDebtModal open={createOpen} onClose={() => setCreateOpen(false)} onDone={invalidate} />
      <MyDebtEditModal debt={editDebt} onClose={() => setEditDebt(null)} onDone={invalidate} />
      <MyDebtPayModal debt={payDebt} onClose={() => setPayDebt(null)} onDone={invalidate} />
    </div>
  )
}

function MyDebtColumn({ title, items, isLoading, onRowClick, onPay, onEdit }) {
  const list = items ?? []
  const totalRemaining = list.reduce((sum, d) => sum + Number(d.remainingAmount ?? d.amount ?? 0), 0)
  const currency = list[0]?.currency ?? (title.includes('USD') ? 'USD' : 'RUB')

  return (
    <div className="card overflow-hidden">
      <div className="border-b border-border bg-paper px-4 py-3 text-sm font-semibold text-ink">{title}</div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[480px] text-sm">
          <thead>
            <tr className="border-b border-border bg-paper text-left text-muted">
              <th className="px-4 py-3 font-medium">Müştəri</th>
              <th className="px-4 py-3 text-right font-medium">Qalıq</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {isLoading && <tr><td colSpan={4} className="px-4 py-8 text-center text-muted">Yüklənir…</td></tr>}
            {!isLoading && list.length === 0 && (
              <tr><td colSpan={4} className="px-4 py-8 text-center text-muted">Qeyd tapılmadı</td></tr>
            )}
            {list.map((debt) => {
              const rawStatus = (debt.status ?? '').toLowerCase()
              const normalizedStatus = rawStatus === 'active' || rawStatus === 'open'
                ? 'open'
                : rawStatus === 'paid' || rawStatus === 'closed'
                  ? 'closed'
                  : rawStatus === 'partial' || rawStatus === 'partially'
                    ? 'partial'
                    : rawStatus

              const statusLabel = STATUS_LABELS[rawStatus] || STATUS_LABELS[normalizedStatus] || debt.status
              const statusClassName = STATUS_STYLES[normalizedStatus] || STATUS_STYLES.default
              const rowClassName = normalizedStatus === 'closed'
                ? 'cursor-pointer border-b border-border last:border-0 align-top bg-slate-50 opacity-80 hover:opacity-100'
                : 'cursor-pointer border-b border-border last:border-0 align-top hover:bg-paper'

              return (
                <tr key={debt.id} className={rowClassName} onClick={() => onRowClick(debt.id)}>
                  <td className="px-4 py-3">
                    <div className="font-medium text-ink">{debt.clientName}</div>
                    <div className="text-xs text-muted">{formatDate(debt.createdAt)}</div>
                  </td>
                  <td className="px-4 py-3 text-right font-medium text-ink">{formatMoney(debt.remainingAmount ?? debt.amount, debt.currency)}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${statusClassName}`}>
                      {statusLabel}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <button
                        className="btn-secondary !px-2 !py-1"
                        title="Borcu qaytar"
                        onClick={(e) => { e.stopPropagation(); onPay(debt) }}
                      >
                        <CircleDollarSign size={16} />
                      </button>
                      <button
                        className="btn-secondary !px-2 !py-1"
                        title="Redaktə et"
                        onClick={(e) => { e.stopPropagation(); onEdit(debt) }}
                      >
                        <Pencil size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      <div className="border-t border-border px-4 py-3">
        <div className="rounded bg-paper px-3 py-2">
          <div className="text-xs text-muted">Ümumi qalıq borc</div>
          <div className="mt-1 text-lg font-semibold text-ink">{formatMoney(totalRemaining, currency)}</div>
        </div>
      </div>
    </div>
  )
}

function CreateMyDebtModal({ open, onClose, onDone }) {
  const [form, setForm] = useState({ clientName: '', currency: 'USD', amount: '', exchangeRate: '', note: '' })

  const mutation = useMutation({
    mutationFn: createMyDebt,
    onSuccess: () => {
      toast.success('Qeyd edildi')
      onDone()
      onClose()
      setForm({ clientName: '', currency: 'USD', amount: '', exchangeRate: '', note: '' })
    },
    onError: () => toast.error('Xəta baş verdi')
  })

  function submit(e) {
    e.preventDefault()
    mutation.mutate({
      clientName: form.clientName,
      currency: form.currency,
      amount: Number(form.amount),
      exchangeRate: form.currency === 'USD' && form.exchangeRate ? Number(form.exchangeRate) : null,
      note: form.note || null
    })
  }

  return (
    <Modal open={open} onClose={onClose} title="Yeni borc götür">
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="label">Müştəri adı</label>
          <ClientAutocomplete value={form.clientName} onChange={(v) => setForm((f) => ({ ...f, clientName: v }))} />
        </div>
        <div>
          <label className="label">Valyuta</label>
          <select className="input" value={form.currency} onChange={(e) => setForm((f) => ({ ...f, currency: e.target.value }))}>
            {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Məbləğ</label>
          <MoneyInput required value={form.amount} onChange={(v) => setForm((f) => ({ ...f, amount: v }))} />
        </div>
        {form.currency === 'USD' && (
          <div>
            <label className="label">Kurs</label>
            <input className="input" type="number" step="0.0001" value={form.exchangeRate} onChange={(e) => setForm((f) => ({ ...f, exchangeRate: e.target.value }))} />
          </div>
        )}
        <div>
          <label className="label">Qeyd</label>
          <input className="input" value={form.note} onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))} />
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" className="btn-secondary" onClick={onClose}>Ləğv et</button>
          <button type="submit" className="btn-primary" disabled={mutation.isPending}>Yadda saxla</button>
        </div>
      </form>
    </Modal>
  )
}
