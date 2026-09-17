import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { Plus, Pencil, CircleDollarSign } from 'lucide-react'
import { getMyDebts, createMyDebt, updateMyDebt, addMyDebtPayment } from '../api/mydebts'
import { formatMoney, formatDate, CURRENCIES } from '../lib/format'
import CurrencyBadge from '../components/CurrencyBadge'
import Pagination from '../components/Pagination'
import Modal from '../components/Modal'
import ClientAutocomplete from '../components/ClientAutocomplete'
import MoneyInput from '../components/MoneyInput'

export default function MyDebts() {
  const qc = useQueryClient()
  const [currency, setCurrency] = useState('')
  const [page, setPage] = useState(1)
  const pageSize = 10

  const [createOpen, setCreateOpen] = useState(false)
  const [editDebt, setEditDebt] = useState(null)
  const [payDebt, setPayDebt] = useState(null)

  const { data, isLoading } = useQuery({
    queryKey: ['mydebts', currency, page],
    queryFn: () => getMyDebts({ currency: currency || undefined, page, pageSize })
  })

  function invalidate() {
    qc.invalidateQueries({ queryKey: ['mydebts'] })
    qc.invalidateQueries({ queryKey: ['cashbox-balance'] })
    qc.invalidateQueries({ queryKey: ['cashbox-transactions'] })
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold text-ink">Mənim borclarım</h1>
        <button className="btn-primary" onClick={() => setCreateOpen(true)}>
          <Plus size={16} /> Yeni borc götür
        </button>
      </div>

      <div className="mb-4">
        <label className="label">Valyuta</label>
        <select className="input !w-40" value={currency} onChange={(e) => { setPage(1); setCurrency(e.target.value) }}>
          <option value="">Hamısı</option>
          {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
        <table className="w-full min-w-[700px] text-sm">
          <thead>
            <tr className="border-b border-border bg-paper text-left text-muted">
              <th className="px-4 py-3 font-medium">Tarix</th>
              <th className="px-4 py-3 font-medium">Müştəri</th>
              <th className="px-4 py-3 font-medium">Valyuta</th>
              <th className="px-4 py-3 text-right font-medium">Məbləğ</th>
              <th className="px-4 py-3 text-right font-medium">Qalıq</th>
              <th className="px-4 py-3 font-medium">Qeyd</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {isLoading && <tr><td colSpan={7} className="px-4 py-8 text-center text-muted">Yüklənir…</td></tr>}
            {!isLoading && (data?.items?.length ?? 0) === 0 && (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-muted">Qeyd tapılmadı</td></tr>
            )}
            {data?.items?.map((d) => (
              <tr key={d.id} className="border-b border-border last:border-0">
                <td className="px-4 py-3 text-muted">{formatDate(d.createdAt)}</td>
                <td className="px-4 py-3 font-medium text-ink">{d.clientName}</td>
                <td className="px-4 py-3"><CurrencyBadge currency={d.currency} /></td>
                <td className="px-4 py-3 text-right">{formatMoney(d.amount, d.currency)}{d.exchangeRate ? <span className="ml-2 text-xs text-muted">kurs: {d.exchangeRate}</span> : null}</td>
                <td className="px-4 py-3 text-right font-medium text-ink">{formatMoney(d.remainingAmount ?? d.amount, d.currency)}</td>
                <td className="px-4 py-3 text-muted">{d.note || '—'}</td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-2">
                    <button className="btn-secondary !px-2 !py-1" title="Borcu qaytar" onClick={() => setPayDebt(d)}>
                      <CircleDollarSign size={16} />
                    </button>
                    <button className="btn-secondary !px-2 !py-1" title="Redaktə et" onClick={() => setEditDebt(d)}>
                      <Pencil size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
        <Pagination page={page} pageSize={pageSize} totalCount={data?.totalCount} onPageChange={setPage} />
      </div>

      <CreateMyDebtModal open={createOpen} onClose={() => setCreateOpen(false)} onDone={invalidate} />
      <EditMyDebtModal debt={editDebt} onClose={() => setEditDebt(null)} onDone={invalidate} />
      <PayMyDebtModal debt={payDebt} onClose={() => setPayDebt(null)} onDone={invalidate} />
    </div>
  )
}

function PayMyDebtModal({ debt, onClose, onDone }) {
  const [form, setForm] = useState({ amount: '', note: '' })

  const mutation = useMutation({
    mutationFn: (payload) => addMyDebtPayment(debt.id, payload),
    onSuccess: () => {
      toast.success('Borc qaytarıldı')
      onDone()
      close()
    },
    onError: (err) => toast.error(err?.response?.data?.message || 'Xəta baş verdi')
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
    <Modal open={!!debt} onClose={close} title={`Borcu qaytar: ${debt?.clientName ?? ''}`}>
      {debt && (
        <form onSubmit={submit} className="space-y-4">
          <div className="rounded bg-paper px-3 py-2 text-sm text-muted">
            Qalıq: <span className="font-medium text-ink">{formatMoney(debt.remainingAmount ?? debt.amount, debt.currency)}</span>
          </div>
          <div>
            <label className="label">Qaytarılan məbləğ</label>
            <MoneyInput required value={form.amount} onChange={(v) => setForm((f) => ({ ...f, amount: v }))} />
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

function EditMyDebtModal({ debt, onClose, onDone }) {
  const [form, setForm] = useState(null)

  if (debt && !form) {
    setForm({ amount: debt.amount, exchangeRate: debt.exchangeRate ?? '', note: debt.note ?? '' })
  }

  const mutation = useMutation({
    mutationFn: (payload) => updateMyDebt(debt.id, payload),
    onSuccess: () => {
      toast.success('Yeniləndi')
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
    <Modal open={!!debt} onClose={close} title={`Redaktə: ${debt?.clientName ?? ''}`}>
      {form && (
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="label">Məbləğ</label>
            <MoneyInput required value={form.amount} onChange={(v) => setForm((f) => ({ ...f, amount: v }))} />
          </div>
          {debt?.currency === 'USD' && (
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
