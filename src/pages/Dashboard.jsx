import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { getCashBoxBalance, getCashBoxTransactionsByDay } from '../api/cashbox'
import { formatMoney, formatDate, CURRENCIES } from '../lib/format'
import CurrencyBadge from '../components/CurrencyBadge'
import RevertTransactionButton from '../components/RevertTransactionButton'

const TYPE_LABELS = {
  loan: 'Borc verildi',
  loan_payment: 'Borc qaytarıldı',
  mydebt: 'Mən borc götürdüm',
  mydebt_payment: 'Mənim borcum qaytarıldı',
  exchange_in: 'Exchange (daxil)',
  exchange_out: 'Exchange (xaric)',
  expense: 'Xərc'
}

function formatDayKey(dateStr) {
  if (!dateStr) return '—'
  const d = new Date(dateStr)
  return d.toLocaleDateString('az-AZ', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

export default function Dashboard() {
  const qc = useQueryClient()
  const [filters, setFilters] = useState({ currency: '', type: '', from: '', to: '' })
  const [dayPage, setDayPage] = useState(1)

  function invalidate() {
    qc.invalidateQueries({ queryKey: ['cashbox-balance'] })
    qc.invalidateQueries({ queryKey: ['cashbox-transactions-by-day'] })
    qc.invalidateQueries({ queryKey: ['loans'] })
    qc.invalidateQueries({ queryKey: ['mydebts'] })
    qc.invalidateQueries({ queryKey: ['exchange'] })
    qc.invalidateQueries({ queryKey: ['expenses'] })
  }

  const { data: balance } = useQuery({
    queryKey: ['cashbox-balance'],
    queryFn: getCashBoxBalance,
    refetchInterval: 30_000
  })

  // Gün-gün: backend bir çağırışda yalnız bir günün hərəkətlərini qaytarır (böyük datasetlərdə frontend-i yükləməmək üçün)
  const { data, isLoading } = useQuery({
    queryKey: ['cashbox-transactions-by-day', filters, dayPage],
    queryFn: () =>
      getCashBoxTransactionsByDay({
        currency: filters.currency || undefined,
        type: filters.type || undefined,
        from: filters.from || undefined,
        to: filters.to || undefined,
        dayPage
      })
  })

  const totalDayPages = Math.max(1, data?.totalDays ?? 1)

  function updateFilter(key, val) {
    setDayPage(1)
    setFilters((f) => ({ ...f, [key]: val }))
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold text-ink">Kassa</h1>

      <div className="mb-8 grid grid-cols-2 gap-4">
        <div className="card p-4 sm:p-5">
          <div className="text-sm text-muted">Dollar kassası</div>
          <div className="mt-1 text-xl font-semibold text-usd sm:text-3xl">{formatMoney(balance?.usd, 'USD')}</div>
        </div>
        <div className="card p-4 sm:p-5">
          <div className="text-sm text-muted">Rubl kassası</div>
          <div className="mt-1 text-xl font-semibold text-rub sm:text-3xl">{formatMoney(balance?.rub, 'RUB')}</div>
        </div>
      </div>

      <div className="mb-4 flex flex-wrap items-end gap-3">
        <div>
          <label className="label">Valyuta</label>
          <select className="input !w-40" value={filters.currency} onChange={(e) => updateFilter('currency', e.target.value)}>
            <option value="">Hamısı</option>
            {CURRENCIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Tip</label>
          <select className="input !w-48" value={filters.type} onChange={(e) => updateFilter('type', e.target.value)}>
            <option value="">Hamısı</option>
            {Object.entries(TYPE_LABELS).map(([val, label]) => (
              <option key={val} value={val}>{label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Tarixdən</label>
          <input type="date" className="input !w-40" value={filters.from} onChange={(e) => updateFilter('from', e.target.value)} />
        </div>
        <div>
          <label className="label">Tarixə</label>
          <input type="date" className="input !w-40" value={filters.to} onChange={(e) => updateFilter('to', e.target.value)} />
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-sm">
          <thead>
            <tr className="border-b border-border bg-paper text-left text-muted">
              <th className="px-4 py-3 font-medium">Tarix</th>
              <th className="px-4 py-3 font-medium">Valyuta</th>
              <th className="px-4 py-3 font-medium">Tip</th>
              <th className="px-4 py-3 font-medium">Mənbə</th>
              <th className="px-4 py-3 font-medium">Qeyd</th>
              <th className="px-4 py-3 text-right font-medium">Məbləğ</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-muted">Yüklənir…</td></tr>
            )}
            {!isLoading && (data?.items?.length ?? 0) === 0 && (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-muted">Əməliyyat tapılmadı</td></tr>
            )}
            {!isLoading && (data?.items?.length ?? 0) > 0 && (
              <tr className="bg-paper">
                <td colSpan={7} className="px-4 py-2 text-xs font-semibold uppercase tracking-wide text-muted">
                  {formatDayKey(data?.date)}
                </td>
              </tr>
            )}
            {data?.items?.map((tx) => (
              <tr key={tx.id} className="border-b border-border last:border-0">
                <td className="px-4 py-3 text-muted">{formatDate(tx.createdAt)}</td>
                <td className="px-4 py-3"><CurrencyBadge currency={tx.currency} /></td>
                <td className="px-4 py-3">{TYPE_LABELS[tx.type] || tx.type}</td>
                <td className="px-4 py-3 text-muted">{tx.source || '—'}</td>
                <td className="px-4 py-3 text-muted">{tx.description || '—'}</td>
                <td className={`px-4 py-3 text-right font-medium ${tx.amount < 0 ? 'text-danger' : 'text-brand'}`}>
                  {tx.amount > 0 ? '+' : ''}{formatMoney(tx.amount, tx.currency)}
                </td>
                <td className="px-4 py-3">
                  <RevertTransactionButton transactionId={tx.id} onDone={invalidate} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>

        <div className="flex items-center justify-between border-t border-border px-4 py-3 text-sm text-muted">
          <span>{data?.totalDays ?? 0} gün</span>
          <div className="flex items-center gap-1">
            {/* dayPage=1 ən son gündür (bu gün), böyük dayPage daha köhnə günə uyğundur */}
            <button
              className="btn-secondary !px-2 !py-1"
              disabled={dayPage >= totalDayPages}
              onClick={() => setDayPage((p) => Math.min(totalDayPages, p + 1))}
            >
              Əvvəlki gün
            </button>
            <span className="px-2 text-ink">{(data?.totalDays ?? 0) === 0 ? 0 : dayPage} / {totalDayPages}</span>
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
    </div>
  )
}
