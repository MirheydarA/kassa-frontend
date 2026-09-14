import { useEffect, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getClients } from '../api/clients'

/**
 * Sərbəst mətn field-i kimi işləyir (clientName API-yə string kimi gedir),
 * amma mövcud müştərilər arasından axtarıb seçməyə imkan verir.
 */
export default function ClientAutocomplete({ value, onChange, placeholder = 'Müştəri adı' }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  const { data: clients = [] } = useQuery({
    queryKey: ['clients', value],
    queryFn: () => getClients(value),
    enabled: open
  })

  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  return (
    <div className="relative" ref={ref}>
      <input
        className="input"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setOpen(true)}
      />
      {open && clients.length > 0 && (
        <div className="absolute z-10 mt-1 w-full max-h-48 overflow-auto card shadow-lg">
          {clients.map((c) => (
            <button
              type="button"
              key={c.id}
              className="block w-full px-3 py-2 text-left text-sm hover:bg-paper"
              onClick={() => {
                onChange(c.name)
                setOpen(false)
              }}
            >
              {c.name}
              {c.phone && <span className="ml-2 text-xs text-muted">{c.phone}</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
