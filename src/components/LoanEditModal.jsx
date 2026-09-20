import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { updateLoan } from '../api/loans'
import Modal from './Modal'
import MoneyInput from './MoneyInput'

export default function LoanEditModal({ loan, onClose, onDone }) {
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
            <MoneyInput required value={form.amount} onChange={(v) => setForm((f) => ({ ...f, amount: v }))} />
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
