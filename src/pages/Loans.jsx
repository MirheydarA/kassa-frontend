import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { Plus, Pencil, CircleDollarSign } from 'lucide-react'
import { getLoans, createLoan, updateLoan, addLoanPayment } from '../api/loans'
import { formatMoney, formatDate, CURRENCIES } from '../lib/format'
import CurrencyBadge from '../components/CurrencyBadge'
import Pagination from '../components/Pagination'
import Modal from '../components/Modal'
import ClientAutocomplete from '../components/ClientAutocomplete'

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

export default function Loans() {
  const qc = useQueryClient()
  const [filters, setFilters] = useState({ status: '', currency: '' })
  const [page, setPage] = useState(1)
  const pageSize = 10

  const [createOpen, setCreateOpen] = useState(false)
  const [editLoan, setEditLoan] = useState(null)
  const [payLoan, setPayLoan] = useState(null)

  const { data, isLoading } = useQuery({
    queryKey: ['loans', filters, page],
    queryFn: () => getLoans({ ...filters, page, pageSize })
  })

  function invalidate() {
    qc.invalidateQueries({ queryKey: ['loans'] })
    qc.invalidateQueries({ queryKey: ['cashbox-balance'] })
    qc.invalidateQueries({ queryKey: ['cashbox-transactions'] })
  }

  function updateFilter(key, val) {
    setPage(1)
    setFilters((f) => ({ ...f, [key]: val }))
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold text-ink">Borc ver</h1>
        <button className="btn-primary" onClick={() => setCreateOpen(true)}>
          <Plus size={16} /> Yeni borc
        </button>
      </div>

      <div className="mb-4 flex flex-wrap items-end gap-3">
        <div>
          <label className="label">Valyuta</label>
          <select className="input !w-40" value={filters.currency} onChange={(e) => updateFilter('currency', e.target.value)}>
            <option value="">Hamısı</option>
            {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Status</label>
          <select className="input !w-44" value={filters.status} onChange={(e) => updateFilter('status', e.target.value)}>
            <option value="">Hamısı</option>
            {Object.entries(STATUS_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-sm">
          <thead>
            <tr className="border-b border-border bg-paper text-left text-muted">
              <th className="px-4 py-3 font-medium">Tarix</th>
              <th className="px-4 py-3 font-medium">Müştəri</th>
              <th className="px-4 py-3 font-medium">Valyuta</th>
              <th className="px-4 py-3 text-right font-medium">Məbləğ</th>
              <th className="px-4 py-3 text-right font-medium">Qalıq</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {isLoading && <tr><td colSpan={7} className="px-4 py-8 text-center text-muted">Yüklənir…</td></tr>}
            {!isLoading && (data?.items?.length ?? 0) === 0 && (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-muted">Borc tapılmadı</td></tr>
            )}
            {data?.items?.map((loan) => {
              const rawStatus = (loan.status ?? '').toLowerCase()
              const normalizedStatus = rawStatus === 'active' || rawStatus === 'open'
                ? 'open'
                : rawStatus === 'paid' || rawStatus === 'closed'
                  ? 'closed'
                  : rawStatus === 'partial' || rawStatus === 'partially'
                    ? 'partial'
                    : rawStatus

              const statusLabel = STATUS_LABELS[rawStatus] || STATUS_LABELS[normalizedStatus] || loan.status
              const statusClassName = STATUS_STYLES[normalizedStatus] || STATUS_STYLES.default
              const rowClassName = normalizedStatus === 'closed' ? 'border-b border-border last:border-0 align-top bg-slate-50 opacity-80' : 'border-b border-border last:border-0 align-top'

              return (
                <tr key={loan.id} className={rowClassName}>
                  <td className="px-4 py-3 text-muted">{formatDate(loan.createdAt)}</td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-ink">{loan.clientName}</div>
                    {loan.note && <div className="text-xs text-muted">{loan.note}</div>}
                    {loan.exchangeRate && <div className="text-xs text-muted">Kurs: {loan.exchangeRate}</div>}
                  </td>
                  <td className="px-4 py-3"><CurrencyBadge currency={loan.currency} /></td>
                  <td className="px-4 py-3 text-right">{formatMoney(loan.amount, loan.currency)}</td>
                  <td className="px-4 py-3 text-right font-medium text-ink">{formatMoney(loan.remainingAmount, loan.currency)}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${statusClassName}`}>
                      {statusLabel}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <button className="btn-secondary !px-2 !py-1" title="Ödəniş qeyd et" onClick={() => setPayLoan(loan)}>
                        <CircleDollarSign size={16} />
                      </button>
                      <button className="btn-secondary !px-2 !py-1" title="Redaktə et" onClick={() => setEditLoan(loan)}>
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
        <Pagination page={page} pageSize={pageSize} totalCount={data?.totalCount} onPageChange={setPage} />
      </div>

      <CreateLoanModal open={createOpen} onClose={() => setCreateOpen(false)} onDone={invalidate} />
      <EditLoanModal loan={editLoan} onClose={() => setEditLoan(null)} onDone={invalidate} />
      <PayLoanModal loan={payLoan} onClose={() => setPayLoan(null)} onDone={invalidate} />
    </div>
  )
}

function CreateLoanModal({ open, onClose, onDone }) {
  const [form, setForm] = useState({ clientName: '', currency: 'USD', amount: '', exchangeRate: '', note: '' })

  const mutation = useMutation({
    mutationFn: createLoan,
    onSuccess: () => {
      toast.success('Borc qeyd edildi')
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
    <Modal open={open} onClose={onClose} title="Yeni borc ver">
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
          <input className="input" type="number" step="0.01" required value={form.amount} onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))} />
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

function EditLoanModal({ loan, onClose, onDone }) {
  const [form, setForm] = useState(null)

  if (loan && !form) {
    setForm({ amount: loan.amount, exchangeRate: loan.exchangeRate ?? '', note: loan.note ?? '' })
  }

  const mutation = useMutation({
    mutationFn: (payload) => updateLoan(loan.id, payload),
    onSuccess: () => {
      toast.success('Borc yeniləndi')
      onDone()
      close()
    },
    onError: () => toast.error('Xəta baş verdi')
  })

  function close() {
    setForm(null)
    onClose()
  }

  function submit(e) {
    e.preventDefault()
    mutation.mutate({
      amount: Number(form.amount),
      exchangeRate: form.exchangeRate ? Number(form.exchangeRate) : null,
      note: form.note || null
    })
  }

  return (
    <Modal open={!!loan} onClose={close} title={`Redaktə: ${loan?.clientName ?? ''}`}>
      {form && (
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="label">Məbləğ</label>
            <input className="input" type="number" step="0.01" required value={form.amount} onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))} />
          </div>
          {loan?.currency === 'USD' && (
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
            <button type="button" className="btn-secondary" onClick={close}>Ləğv et</button>
            <button type="submit" className="btn-primary" disabled={mutation.isPending}>Yadda saxla</button>
          </div>
        </form>
      )}
    </Modal>
  )
}

function PayLoanModal({ loan, onClose, onDone }) {
  const [form, setForm] = useState({ amount: '', note: '' })

  const mutation = useMutation({
    mutationFn: (payload) => addLoanPayment(loan.id, payload),
    onSuccess: () => {
      toast.success('Ödəniş qeyd edildi')
      onDone()
      close()
    },
    onError: () => toast.error('Xəta baş verdi')
  })

  function close() {
    setForm({ amount: '', note: '' })
    onClose()
  }

  function submit(e) {
    e.preventDefault()
    mutation.mutate({ amount: Number(form.amount), note: form.note || null })
  }

  return (
    <Modal open={!!loan} onClose={close} title={`Ödəniş: ${loan?.clientName ?? ''}`}>
      {loan && (
        <form onSubmit={submit} className="space-y-4">
          <div className="rounded bg-paper px-3 py-2 text-sm text-muted">
            Qalıq: <span className="font-medium text-ink">{formatMoney(loan.remainingAmount, loan.currency)}</span>
          </div>
          <div>
            <label className="label">Qaytarılan məbləğ</label>
            <input
              className="input"
              type="number"
              step="0.01"
              max={loan.remainingAmount}
              required
              value={form.amount}
              onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
            />
          </div>
          <div>
            <label className="label">Qeyd</label>
            <input className="input" value={form.note} onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))} />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" className="btn-secondary" onClick={close}>Ləğv et</button>
            <button type="submit" className="btn-primary" disabled={mutation.isPending}>Yadda saxla</button>
          </div>
        </form>
      )}
    </Modal>
  )
}
