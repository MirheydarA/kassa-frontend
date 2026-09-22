export function formatMoney(value, currency) {
  const n = Number(value ?? 0)
  const sign = n < 0 ? '-' : ''
  const formatted = Math.abs(n).toLocaleString('az-AZ', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
  if (currency === 'USD') return `${sign}$${formatted}`
  if (currency === 'RUB') return `${sign}${formatted} ₽`
  return `${sign}${formatted}`
}

export function formatDate(value) {
  if (!value) return '—'
  const d = new Date(value)
  return d.toLocaleString('az-AZ', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

export const CURRENCIES = ['USD', 'RUB']

// Pul məbləği sahələri üçün: yalnız tam ədədlər (kopek/sent yoxdur).
// "480.000" kimi bir dəyər 480000 kimi şərh olunur (nöqtə/vergül minlik ayırıcı kimi baxılır, kəsr kimi yox).
export function digitsOnly(value) {
  return String(value ?? '').replace(/[^\d]/g, '')
}

export function formatThousands(digits) {
  const clean = digitsOnly(digits)
  if (!clean) return ''
  return Number(clean).toLocaleString('en-US')
}

export function toMoneyNumber(value) {
  const digits = digitsOnly(value)
  return digits ? Number(digits) : ''
}
