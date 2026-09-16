import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { Plus, Pencil, Search } from 'lucide-react'
import { getClients, createClient, updateClient } from '../api/clients'
import Modal from '../components/Modal'

export default function Clients() {
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [createOpen, setCreateOpen] = useState(false)
  const [editClient, setEditClient] = useState(null)

  const { data: clients = [], isLoading } = useQuery({
    queryKey: ['clients-page', search],
    queryFn: () => getClients(search || undefined)
  })

  function invalidate() {
    qc.invalidateQueries({ queryKey: ['clients-page'] })
    qc.invalidateQueries({ queryKey: ['clients'] })
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold text-ink">Müştərilər</h1>
        <button className="btn-primary" onClick={() => setCreateOpen(true)}>
          <Plus size={16} /> Yeni müştəri
        </button>
      </div>

      <div className="mb-4 relative w-full max-w-sm">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
        <input className="input !pl-9" placeholder="Axtar…" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
        <table className="w-full min-w-[420px] text-sm">
          <thead>
            <tr className="border-b border-border bg-paper text-left text-muted">
              <th className="px-4 py-3 font-medium">Ad</th>
              <th className="px-4 py-3 font-medium">Telefon</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {isLoading && <tr><td colSpan={3} className="px-4 py-8 text-center text-muted">Yüklənir…</td></tr>}
            {!isLoading && clients.length === 0 && (
              <tr><td colSpan={3} className="px-4 py-8 text-center text-muted">Müştəri tapılmadı</td></tr>
            )}
            {clients.map((c) => (
              <tr key={c.id} className="border-b border-border last:border-0">
                <td className="px-4 py-3 font-medium text-ink">{c.name}</td>
                <td className="px-4 py-3 text-muted">{c.phone || '—'}</td>
                <td className="px-4 py-3">
                  <button className="btn-secondary !px-2 !py-1" onClick={() => setEditClient(c)}>
                    <Pencil size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </div>

      <CreateClientModal open={createOpen} onClose={() => setCreateOpen(false)} onDone={invalidate} />
      <EditClientModal client={editClient} onClose={() => setEditClient(null)} onDone={invalidate} />
    </div>
  )
}

function CreateClientModal({ open, onClose, onDone }) {
  const [form, setForm] = useState({ name: '', phone: '' })

  const mutation = useMutation({
    mutationFn: createClient,
    onSuccess: () => {
      toast.success('Müştəri əlavə edildi')
      onDone()
      onClose()
      setForm({ name: '', phone: '' })
    },
    onError: () => toast.error('Xəta baş verdi')
  })

  function submit(e) {
    e.preventDefault()
    mutation.mutate({ name: form.name, phone: form.phone || null })
  }

  return (
    <Modal open={open} onClose={onClose} title="Yeni müştəri">
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="label">Ad</label>
          <input className="input" required value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
        </div>
        <div>
          <label className="label">Telefon</label>
          <input className="input" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} />
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" className="btn-secondary" onClick={onClose}>Ləğv et</button>
          <button type="submit" className="btn-primary" disabled={mutation.isPending}>Yadda saxla</button>
        </div>
      </form>
    </Modal>
  )
}

function EditClientModal({ client, onClose, onDone }) {
  const [form, setForm] = useState(null)

  if (client && !form) {
    setForm({ name: client.name, phone: client.phone ?? '' })
  }

  const mutation = useMutation({
    mutationFn: (payload) => updateClient(client.id, payload),
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
    mutation.mutate({ name: form.name, phone: form.phone || null })
  }

  return (
    <Modal open={!!client} onClose={close} title="Müştərini redaktə et">
      {form && (
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="label">Ad</label>
            <input className="input" required value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
          </div>
          <div>
            <label className="label">Telefon</label>
            <input className="input" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} />
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
