export function formatMoney(value, currency) {
  const n = Number(value ?? 0)
  const formatted = n.toLocaleString('az-AZ', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  if (currency === 'USD') return `$${formatted}`
  if (currency === 'RUB') return `${formatted} ₽`
  return formatted
}

export function formatDate(value) {
  if (!value) return '—'
  const d = new Date(value)
  return d.toLocaleString('az-AZ', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

export const CURRENCIES = ['USD', 'RUB']
