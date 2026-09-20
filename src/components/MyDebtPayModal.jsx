import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { addMyDebtPayment } from '../api/mydebts'
import { formatMoney } from '../lib/format'
import Modal from './Modal'
import MoneyInput from './MoneyInput'

export default function MyDebtPayModal({ debt, onClose, onDone }) {
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
