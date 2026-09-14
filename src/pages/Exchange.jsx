import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { Plus, Pencil, ArrowRight } from 'lucide-react'
import { getExchanges, createExchange, updateExchange } from '../api/exchange'
import { formatMoney, formatDate, CURRENCIES } from '../lib/format'
import CurrencyBadge from '../components/CurrencyBadge'
import Pagination from '../components/Pagination'
import Modal from '../components/Modal'
import ClientAutocomplete from '../components/ClientAutocomplete'

function otherCurrency(c) {
  return c === 'USD' ? 'RUB' : 'USD'
}

export default function Exchange() {
  const qc = useQueryClient()
  const [page, setPage] = useState(1)
  const pageSize = 10

  const [createOpen, setCreateOpen] = useState(false)
  const [editEx, setEditEx] = useState(null)

  const { data, isLoading } = useQuery({
    queryKey: ['exchange', page],
    queryFn: () => getExchanges({ page, pageSize })
  })

  function invalidate() {
    qc.invalidateQueries({ queryKey: ['exchange'] })
    qc.invalidateQueries({ queryKey: ['cashbox-balance'] })
    qc.invalidateQueries({ queryKey: ['cashbox-transactions'] })
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-ink">Exchange</h1>
        <button className="btn-primary" onClick={() => setCreateOpen(true)}>
          <Plus size={16} /> Yeni mübadilə
        </button>
      </div>

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-paper text-left text-muted">
              <th className="px-4 py-3 font-medium">Tarix</th>
              <th className="px-4 py-3 font-medium">Müştəri</th>
              <th className="px-4 py-3 font-medium">Əməliyyat</th>
              <th className="px-4 py-3 text-right font-medium">Kurs</th>
              <th className="px-4 py-3 font-medium">Qeyd</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {isLoading && <tr><td colSpan={6} className="px-4 py-8 text-center text-muted">Yüklənir…</td></tr>}
            {!isLoading && (data?.items?.length ?? 0) === 0 && (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-muted">Mübadilə tapılmadı</td></tr>
            )}
            {data?.items?.map((ex) => (
              <tr key={ex.id} className="border-b border-border last:border-0">
                <td className="px-4 py-3 text-muted">{formatDate(ex.createdAt)}</td>
                <td className="px-4 py-3 font-medium text-ink">{ex.clientName}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span>{formatMoney(ex.fromAmount, ex.fromCurrency)}</span>
                    <CurrencyBadge currency={ex.fromCurrency} />
                    <ArrowRight size={14} className="text-muted" />
                    <span>{formatMoney(ex.toAmount, ex.toCurrency)}</span>
                    <CurrencyBadge currency={ex.toCurrency} />
                  </div>
                </td>
                <td className="px-4 py-3 text-right">{ex.rate}</td>
                <td className="px-4 py-3 text-muted">{ex.note || '—'}</td>
                <td className="px-4 py-3">
                  <button className="btn-secondary !px-2 !py-1" title="Redaktə et" onClick={() => setEditEx(ex)}>
                    <Pencil size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <Pagination page={page} pageSize={pageSize} totalCount={data?.totalCount} onPageChange={setPage} />
      </div>

      <CreateExchangeModal open={createOpen} onClose={() => setCreateOpen(false)} onDone={invalidate} />
      <EditExchangeModal ex={editEx} onClose={() => setEditEx(null)} onDone={invalidate} />
    </div>
  )
}

function CreateExchangeModal({ open, onClose, onDone }) {
  const [form, setForm] = useState({ clientName: '', fromCurrency: 'USD', fromAmount: '', rate: '', note: '' })

  const mutation = useMutation({
    mutationFn: createExchange,
    onSuccess: () => {
      toast.success('Mübadilə qeyd edildi')
      onDone()
      onClose()
      setForm({ clientName: '', fromCurrency: 'USD', fromAmount: '', rate: '', note: '' })
    },
    onError: () => toast.error('Xəta baş verdi')
  })

  function submit(e) {
    e.preventDefault()
    mutation.mutate({
      clientName: form.clientName,
      fromCurrency: form.fromCurrency,
      toCurrency: otherCurrency(form.fromCurrency),
      fromAmount: Number(form.fromAmount),
      rate: Number(form.rate),
      note: form.note || null
    })
  }

  return (
    <Modal open={open} onClose={onClose} title="Yeni mübadilə">
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="label">Müştəri adı</label>
          <ClientAutocomplete value={form.clientName} onChange={(v) => setForm((f) => ({ ...f, clientName: v }))} />
        </div>
        <div>
          <label className="label">Client bunu verir</label>
          <select className="input" value={form.fromCurrency} onChange={(e) => setForm((f) => ({ ...f, fromCurrency: e.target.value }))}>
            {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div className="text-sm text-muted">Əvəzində alır: <span className="font-medium text-ink">{otherCurrency(form.fromCurrency)}</span></div>
        <div>
          <label className="label">Məbləğ ({form.fromCurrency})</label>
          <input className="input" type="number" step="0.01" required value={form.fromAmount} onChange={(e) => setForm((f) => ({ ...f, fromAmount: e.target.value }))} />
        </div>
        <div>
          <label className="label">Kurs</label>
          <input className="input" type="number" step="0.0001" required value={form.rate} onChange={(e) => setForm((f) => ({ ...f, rate: e.target.value }))} />
        </div>
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

function EditExchangeModal({ ex, onClose, onDone }) {
  const [form, setForm] = useState(null)

  if (ex && !form) {
    setForm({ fromAmount: ex.fromAmount, rate: ex.rate, note: ex.note ?? '' })
  }

  const mutation = useMutation({
    mutationFn: (payload) => updateExchange(ex.id, payload),
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
    mutation.mutate({ fromAmount: Number(form.fromAmount), rate: Number(form.rate), note: form.note || null })
  }

  return (
    <Modal open={!!ex} onClose={close} title={`Redaktə: ${ex?.clientName ?? ''}`}>
      {form && (
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="label">Məbləğ ({ex?.fromCurrency})</label>
            <input className="input" type="number" step="0.01" required value={form.fromAmount} onChange={(e) => setForm((f) => ({ ...f, fromAmount: e.target.value }))} />
          </div>
          <div>
            <label className="label">Kurs</label>
            <input className="input" type="number" step="0.0001" required value={form.rate} onChange={(e) => setForm((f) => ({ ...f, rate: e.target.value }))} />
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
