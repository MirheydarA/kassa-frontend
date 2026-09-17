import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { RotateCcw, Eye, EyeOff } from 'lucide-react'
import { revertTransaction } from '../api/cashbox'
import Modal from './Modal'

export default function RevertTransactionButton({ transactionId, onDone }) {
  const [open, setOpen] = useState(false)
  const [password, setPassword] = useState('')
  const [show, setShow] = useState(false)

  const mutation = useMutation({
    mutationFn: () => revertTransaction(transactionId, password),
    onSuccess: () => {
      toast.success('Əməliyyat geri qaytarıldı')
      close()
      onDone?.()
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || 'Xəta baş verdi')
    }
  })

  function close() {
    setOpen(false)
    setPassword('')
    setShow(false)
  }

  function submit(e) {
    e.preventDefault()
    mutation.mutate()
  }

  return (
    <>
      <button
        type="button"
        className="btn-secondary !px-2 !py-1 text-danger"
        title="Geri qaytar"
        onClick={() => setOpen(true)}
      >
        <RotateCcw size={16} />
      </button>

      <Modal open={open} onClose={close} title="Əməliyyatı geri qaytar">
        <form onSubmit={submit} className="space-y-4">
          <p className="text-sm text-muted">
            Bu əməliyyat silinəcək və kassa balansı əvvəlki vəziyyətinə qaytarılacaq. Davam etmək üçün şifrənizi daxil edin.
          </p>
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
            <button type="submit" className="btn-primary" disabled={mutation.isPending}>Geri qaytar</button>
          </div>
        </form>
      </Modal>
    </>
  )
}
