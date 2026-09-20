import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { Eye, EyeOff } from 'lucide-react'
import { adjustBalance } from '../api/cashbox'
import Modal from './Modal'
import MoneyInput from './MoneyInput'

export default function EditBalanceModal({ currency, currentAmount, onClose, onDone }) {
  const [amount, setAmount] = useState(null)
  const [password, setPassword] = useState('')
  const [show, setShow] = useState(false)

  const open = !!currency

  if (open && amount === null) {
    setAmount(currentAmount ?? '')
  }

  const mutation = useMutation({
    mutationFn: () => adjustBalance({ currency, newAmount: Number(amount), password }),
    onSuccess: () => {
      toast.success('Kassa balansı yeniləndi')
      onDone()
      close()
    },
    onError: (err) => toast.error(err?.response?.data?.message || 'Xəta baş verdi')
  })

  function close() {
    setAmount(null)
    setPassword('')
    setShow(false)
    onClose()
  }

  function submit(e) {
    e.preventDefault()
    mutation.mutate()
  }

  return (
    <Modal open={open} onClose={close} title={`Kassa balansını redaktə et (${currency})`}>
      {open && (
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="label">Yeni balans ({currency})</label>
            <MoneyInput required value={amount} onChange={setAmount} />
          </div>
          <div>
            <label className="label">Şifrə</label>
            <div className="relative">
              <input
                className="input !pr-10"
                type={show ? 'text' : 'password'}
                required
                autoFocus
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                tabIndex={-1}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-ink"
                onClick={() => setShow((s) => !s)}
                aria-label="Şifrəni göstər/gizlət"
              >
                {show ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
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
