import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getCashBoxBalance, getCashBoxTransactions } from '../api/cashbox'
import { formatMoney, formatDate, CURRENCIES } from '../lib/format'
import CurrencyBadge from '../components/CurrencyBadge'
import Pagination from '../components/Pagination'

const TYPE_LABELS = {
  loan: 'Borc verildi',
  loan_payment: 'Borc qaytarıldı',
  mydebt: 'Mən borc götürdüm',
  exchange_in: 'Exchange (daxil)',
  exchange_out: 'Exchange (xaric)',
  expense: 'Xərc'
}

export default function Dashboard() {
  const [filters, setFilters] = useState({ currency: '', type: '', from: '', to: '' })
  const [page, setPage] = useState(1)
  const pageSize = 15

  const { data: balance } = useQuery({
    queryKey: ['cashbox-balance'],
    queryFn: getCashBoxBalance,
    refetchInterval: 30_000
  })

  const { data, isLoading } = useQuery({
    queryKey: ['cashbox-transactions', filters, page],
    queryFn: () =>
      getCashBoxTransactions({
        currency: filters.currency || undefined,
        type: filters.type || undefined,
        from: filters.from || undefined,
        to: filters.to || undefined,
        page,
        pageSize
      })
  })

  function updateFilter(key, val) {
    setPage(1)
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
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-muted">Yüklənir…</td></tr>
            )}
            {!isLoading && (data?.items?.length ?? 0) === 0 && (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-muted">Əməliyyat tapılmadı</td></tr>
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
              </tr>
            ))}
          </tbody>
        </table>
        </div>
        <Pagination page={page} pageSize={pageSize} totalCount={data?.totalCount} onPageChange={setPage} />
      </div>
    </div>
  )
}
