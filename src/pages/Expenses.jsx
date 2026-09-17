import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { Plus, Pencil } from 'lucide-react'
import { getExpenses, createExpense, updateExpense } from '../api/expenses'
import { formatMoney, formatDate } from '../lib/format'
import Modal from '../components/Modal'
import MoneyInput from '../components/MoneyInput'

function dayKey(dateStr) {
  const d = new Date(dateStr)
  return d.toLocaleDateString('az-AZ', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

export default function Expenses() {
  const qc = useQueryClient()
  const [dayPage, setDayPage] = useState(1)

  const [createOpen, setCreateOpen] = useState(false)
  const [editExp, setEditExp] = useState(null)

  // Bütün xərcləri gətiririk ki, günlərə görə qruplaşdıraq (UI ağır cədvəldə donmasın deyə səhifə gün-gün göstərilir)
  const { data, isLoading } = useQuery({
    queryKey: ['expenses'],
    queryFn: () => getExpenses({ page: 1, pageSize: 1000 })
  })

  const allItems = data?.items ?? []

  const dayGroups = []
  for (const item of allItems) {
    const key = dayKey(item.createdAt)
    let group = dayGroups.find((g) => g.key === key)
    if (!group) {
      group = { key, items: [] }
      dayGroups.push(group)
    }
    group.items.push(item)
  }

  const totalDayPages = Math.max(1, dayGroups.length)
  const currentDayGroup = dayGroups[dayPage - 1]
  const visibleItems = currentDayGroup?.items ?? []

  function invalidate() {
    qc.invalidateQueries({ queryKey: ['expenses'] })
    qc.invalidateQueries({ queryKey: ['cashbox-balance'] })
    qc.invalidateQueries({ queryKey: ['cashbox-transactions'] })
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold text-ink">Xərclər</h1>
        <button className="btn-primary" onClick={() => setCreateOpen(true)}>
          <Plus size={16} /> Yeni xərc
        </button>
      </div>
      <p className="mb-4 text-sm text-muted">Xərclər yalnız rubl kassasından çıxılır.</p>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
        <table className="w-full min-w-[520px] text-sm">
          <thead>
            <tr className="border-b border-border bg-paper text-left text-muted">
              <th className="px-4 py-3 font-medium">Tarix</th>
              <th className="px-4 py-3 font-medium">Qeyd</th>
              <th className="px-4 py-3 text-right font-medium">Məbləğ</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {isLoading && <tr><td colSpan={4} className="px-4 py-8 text-center text-muted">Yüklənir…</td></tr>}
            {!isLoading && allItems.length === 0 && (
              <tr><td colSpan={4} className="px-4 py-8 text-center text-muted">Xərc tapılmadı</td></tr>
            )}
            {!isLoading && allItems.length > 0 && (
              <tr className="bg-paper">
                <td colSpan={4} className="px-4 py-2 text-xs font-semibold uppercase tracking-wide text-muted">
                  {currentDayGroup?.key ?? '—'}
                </td>
              </tr>
            )}
            {visibleItems.map((exp) => (
              <tr key={exp.id} className="border-b border-border last:border-0">
                <td className="px-4 py-3 text-muted">{formatDate(exp.createdAt)}</td>
                <td className="px-4 py-3 text-ink">{exp.description || '—'}</td>
                <td className="px-4 py-3 text-right font-medium text-danger">{formatMoney(exp.amount, 'RUB')}</td>
                <td className="px-4 py-3">
                  <button className="btn-secondary !px-2 !py-1" title="Redaktə et" onClick={() => setEditExp(exp)}>
                    <Pencil size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>

        <div className="flex items-center justify-between border-t border-border px-4 py-3 text-sm text-muted">
          <span>{dayGroups.length} gün</span>
          <div className="flex items-center gap-1">
            {/* dayGroups[0] ən son gündür (bu gün), böyük indeks daha köhnə günə uyğundur */}
            <button
              className="btn-secondary !px-2 !py-1"
              disabled={dayPage >= totalDayPages}
              onClick={() => setDayPage((p) => Math.min(totalDayPages, p + 1))}
            >
              Əvvəlki gün
            </button>
            <span className="px-2 text-ink">{dayGroups.length === 0 ? 0 : dayPage} / {totalDayPages}</span>
            <button
              className="btn-secondary !px-2 !py-1"
              disabled={dayPage <= 1}
              onClick={() => setDayPage((p) => Math.max(1, p - 1))}
            >
              Növbəti gün
            </button>
          </div>
        </div>
      </div>

      <CreateExpenseModal open={createOpen} onClose={() => setCreateOpen(false)} onDone={invalidate} />
      <EditExpenseModal exp={editExp} onClose={() => setEditExp(null)} onDone={invalidate} />
    </div>
  )
}

function CreateExpenseModal({ open, onClose, onDone }) {
  const [form, setForm] = useState({ amount: '', description: '' })

  const mutation = useMutation({
    mutationFn: createExpense,
    onSuccess: () => {
      toast.success('Xərc qeyd edildi')
      onDone()
      onClose()
      setForm({ amount: '', description: '' })
    },
    onError: () => toast.error('Xəta baş verdi')
  })

  function submit(e) {
    e.preventDefault()
    mutation.mutate({ amount: Number(form.amount), description: form.description || null })
  }

  return (
    <Modal open={open} onClose={onClose} title="Yeni xərc">
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="label">Məbləğ (RUB)</label>
          <MoneyInput required value={form.amount} onChange={(v) => setForm((f) => ({ ...f, amount: v }))} />
        </div>
        <div>
          <label className="label">Qeyd</label>
          <input className="input" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" className="btn-secondary" onClick={onClose}>Ləğv et</button>
          <button type="submit" className="btn-primary" disabled={mutation.isPending}>Yadda saxla</button>
        </div>
      </form>
    </Modal>
  )
}

function EditExpenseModal({ exp, onClose, onDone }) {
  const [form, setForm] = useState(null)

  if (exp && !form) {
    setForm({ amount: exp.amount, description: exp.description ?? '' })
  }

  const mutation = useMutation({
    mutationFn: (payload) => updateExpense(exp.id, payload),
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
    mutation.mutate({ amount: Number(form.amount), description: form.description || null })
  }

  return (
    <Modal open={!!exp} onClose={close} title="Xərci redaktə et">
      {form && (
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="label">Məbləğ (RUB)</label>
            <MoneyInput required value={form.amount} onChange={(v) => setForm((f) => ({ ...f, amount: v }))} />
          </div>
          <div>
            <label className="label">Qeyd</label>
            <input className="input" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
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
