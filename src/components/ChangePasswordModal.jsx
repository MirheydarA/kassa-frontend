import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { Eye, EyeOff } from 'lucide-react'
import { changePassword } from '../api/auth'
import Modal from './Modal'

const EMPTY_FORM = { currentPassword: '', newPassword: '', confirmPassword: '' }

export default function ChangePasswordModal({ open, onClose }) {
  const [form, setForm] = useState(EMPTY_FORM)
  const [show, setShow] = useState({ current: false, next: false, confirm: false })

  const mutation = useMutation({
    mutationFn: () => changePassword(form.currentPassword, form.newPassword),
    onSuccess: () => {
      toast.success('Şifrə uğurla dəyişdirildi')
      close()
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || 'Xəta baş verdi')
    }
  })

  function close() {
    setForm(EMPTY_FORM)
    setShow({ current: false, next: false, confirm: false })
    onClose()
  }

  function submit(e) {
    e.preventDefault()
    if (form.newPassword !== form.confirmPassword) {
      toast.error('Yeni şifrələr uyğun gəlmir')
      return
    }
    if (form.newPassword.length < 6) {
      toast.error('Yeni şifrə ən azı 6 simvol olmalıdır')
      return
    }
    mutation.mutate()
  }

  function field(key, label, visKey) {
    return (
      <div>
        <label className="label">{label}</label>
        <div className="relative">
          <input
            className="input !pr-10"
            type={show[visKey] ? 'text' : 'password'}
            required
            value={form[key]}
            onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
          />
          <button
            type="button"
            tabIndex={-1}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-ink"
            onClick={() => setShow((s) => ({ ...s, [visKey]: !s[visKey] }))}
            aria-label="Şifrəni göstər/gizlət"
          >
            {show[visKey] ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
      </div>
    )
  }

  return (
    <Modal open={open} onClose={close} title="Şifrəni dəyiş">
      <form onSubmit={submit} className="space-y-4">
        {field('currentPassword', 'Cari şifrə', 'current')}
        {field('newPassword', 'Yeni şifrə', 'next')}
        {field('confirmPassword', 'Yeni şifrə (təkrar)', 'confirm')}
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" className="btn-secondary" onClick={close}>Ləğv et</button>
          <button type="submit" className="btn-primary" disabled={mutation.isPending}>Yadda saxla</button>
        </div>
      </form>
    </Modal>
  )
}
