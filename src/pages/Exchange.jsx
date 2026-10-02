import { Fragment, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { Plus, Pencil, ArrowRight, ArrowDownCircle, ArrowUpCircle, ChevronDown, ChevronUp } from 'lucide-react'
import {
  getExchanges,
  createExchange,
  updateExchange,
  getExchangeProfitSummary,
  getExchangeLots,
  getExchangeConsumptions,
  getLotSales
} from '../api/exchange'
import { formatMoney, formatDate } from '../lib/format'
import CurrencyBadge from '../components/CurrencyBadge'
import Pagination from '../components/Pagination'
import Modal from '../components/Modal'
import MoneyInput from '../components/MoneyInput'

// Dollar alışı: müştəri bizə USD verir, biz ona RUB veririk (RUB = USD * kurs)
// Dollar satışı: müştəri bizə RUB verir, biz ona USD veririk (USD = RUB / kurs)
const TABS = {
  sell: { key: 'sell', label: 'Dollar satışı', fromCurrency: 'RUB', toCurrency: 'USD', icon: ArrowUpCircle, tone: 'rose' },
  buy: { key: 'buy', label: 'Dollar alışı', fromCurrency: 'USD', toCurrency: 'RUB', icon: ArrowDownCircle, tone: 'emerald' }
}

const TAB_TONE = {
  emerald: {
    active: 'border-emerald-500 bg-emerald-50',
    iconActive: 'bg-emerald-500 text-white',
    labelActive: 'text-emerald-700'
  },
  rose: {
    active: 'border-rose-500 bg-rose-50',
    iconActive: 'bg-rose-500 text-white',
    labelActive: 'text-rose-700'
  }
}

// Nəticə həmişə tam ədədə yuvarlaqlaşdırılır - MoneyInput yalnız tam ədədlərlə işləyir,
// və kəsr kurs (məs. 83.2) bölündükdə uzun onluq kəsr yarada bilər.
function calcToAmount(fromCurrency, toCurrency, fromAmount, rate) {
  const amt = Number(fromAmount) || 0
  const r = Number(rate) || 0
  if (!amt || !r) return 0
  if (fromCurrency === 'RUB' && toCurrency === 'USD') return Math.round(amt / r)
  return Math.round(amt * r)
}

// Əks istiqamət: müştəri bəzən dəqiq nə qədər (məs. 5000$) istədiyini deyir - bu halda kassir
// qarşı tərəfin (verəcəyi valyutanın) məbləğini yazır, digər tərəf ondan hesablanır.
function calcFromAmount(fromCurrency, toCurrency, toAmount, rate) {
  const amt = Number(toAmount) || 0
  const r = Number(rate) || 0
  if (!amt || !r) return 0
  if (fromCurrency === 'RUB' && toCurrency === 'USD') return Math.round(amt * r)
  return Math.round(amt / r)
}

export default function Exchange() {
  const qc = useQueryClient()
  const [view, setView] = useState('transactions')
  const [tab, setTab] = useState('sell')
  const [page, setPage] = useState(1)
  const [expandedId, setExpandedId] = useState(null)
  const pageSize = 10

  const [createOpen, setCreateOpen] = useState(false)
  const [editEx, setEditEx] = useState(null)

  const activeTab = TABS[tab]

  const { data, isLoading } = useQuery({
    queryKey: ['exchange', activeTab.fromCurrency, page],
    queryFn: () => getExchanges({ fromCurrency: activeTab.fromCurrency, page, pageSize })
  })

  const { data: profitSummary } = useQuery({
    queryKey: ['exchange-profit-summary'],
    queryFn: getExchangeProfitSummary
  })

  function invalidate() {
    qc.invalidateQueries({ queryKey: ['exchange'] })
    qc.invalidateQueries({ queryKey: ['exchange-profit-summary'] })
    qc.invalidateQueries({ queryKey: ['cashbox-balance'] })
    qc.invalidateQueries({ queryKey: ['cashbox-transactions'] })
    qc.invalidateQueries({ queryKey: ['cashbox-transactions-by-day'] })
  }

  function switchTab(key) {
    setTab(key)
    setPage(1)
    setExpandedId(null)
  }

  function changePage(p) {
    setPage(p)
    setExpandedId(null)
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold text-ink">Exchange</h1>
        {view === 'transactions' && (
          <button className="btn-primary" onClick={() => setCreateOpen(true)}>
            <Plus size={16} /> Yeni mübadilə
          </button>
        )}
      </div>

      <div className="mb-6 flex gap-2 border-b border-border">
        <button
          className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px ${
            view === 'transactions' ? 'border-brand text-brand' : 'border-transparent text-muted hover:text-ink'
          }`}
          onClick={() => setView('transactions')}
        >
          Əməliyyatlar
        </button>
        <button
          className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px ${
            view === 'lots' ? 'border-brand text-brand' : 'border-transparent text-muted hover:text-ink'
          }`}
          onClick={() => setView('lots')}
        >
          Dollar ehtiyatı
        </button>
      </div>

      {view === 'lots' ? (
        <LotsSection />
      ) : (
        <>
          <div className="card mb-6 max-w-xs p-4">
            <div className="text-sm text-muted">Cəmi qazanc</div>
            <div className="mt-1 text-xl font-semibold text-brand">
              {formatMoney(profitSummary?.totalRealizedProfit ?? 0, 'RUB')}
            </div>
          </div>

          <div className="mb-6 grid grid-cols-2 gap-3 sm:max-w-md">
            {Object.values(TABS).map((t) => {
              const isActive = tab === t.key
              const tone = TAB_TONE[t.tone]
              const Icon = t.icon
              return (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => switchTab(t.key)}
                  className={`flex items-center gap-3 rounded-lg border-2 px-4 py-3 text-left transition ${
                    isActive ? tone.active : 'border-border bg-surface hover:bg-paper'
                  }`}
                >
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                    isActive ? tone.iconActive : 'bg-paper text-muted'
                  }`}>
                    <Icon size={20} />
                  </div>
                  <div>
                    <div className={`text-sm font-semibold ${isActive ? tone.labelActive : 'text-ink'}`}>
                      {t.label}
                    </div>
                    <div className="text-xs text-muted">{t.fromCurrency} → {t.toCurrency}</div>
                  </div>
                </button>
              )
            })}
          </div>

          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-sm">
              <thead>
                <tr className="border-b border-border bg-paper text-left text-muted">
                  <th className="px-4 py-3 font-medium">Tarix</th>
                  <th className="px-4 py-3 font-medium">Əməliyyat</th>
                  <th className="px-4 py-3 text-right font-medium">Kurs</th>
                  <th className="px-4 py-3 text-right font-medium">Qazanc</th>
                  <th className="px-4 py-3 font-medium">Qeyd</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {isLoading && <tr><td colSpan={7} className="px-4 py-8 text-center text-muted">Yüklənir…</td></tr>}
                {!isLoading && (data?.items?.length ?? 0) === 0 && (
                  <tr><td colSpan={7} className="px-4 py-8 text-center text-muted">Mübadilə tapılmadı</td></tr>
                )}
                {data?.items?.map((ex) => {
                  const isExpanded = expandedId === ex.id
                  return (
                    <Fragment key={ex.id}>
                      <tr className="border-b border-border last:border-0">
                        <td className="px-4 py-3 text-muted">{formatDate(ex.createdAt)}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <span>{formatMoney(ex.fromAmount, ex.fromCurrency)}</span>
                            <CurrencyBadge currency={ex.fromCurrency} />
                            <ArrowRight size={14} className="text-muted" />
                            <span>{formatMoney(ex.toAmount, ex.toCurrency)}</span>
                            <CurrencyBadge currency={ex.toCurrency} />
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right">{ex.rate}</td>
                        <td className={`px-4 py-3 text-right font-medium ${
                          ex.realizedProfit == null ? 'text-muted' : ex.realizedProfit < 0 ? 'text-danger' : 'text-brand'
                        }`}>
                          {ex.realizedProfit == null ? (
                            '—'
                          ) : (
                            <button
                              type="button"
                              className="inline-flex items-center gap-1 hover:underline"
                              title="Hansı partiyadan qarşılandığını göstər"
                              onClick={() => setExpandedId((id) => (id === ex.id ? null : ex.id))}
                            >
                              {formatMoney(ex.realizedProfit, 'RUB')}
                              {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                            </button>
                          )}
                        </td>
                        <td className="px-4 py-3 text-muted">{ex.note || '—'}</td>
                        <td className="px-4 py-3">
                          <button className="btn-secondary !px-2 !py-1" title="Redaktə et" onClick={() => setEditEx(ex)}>
                            <Pencil size={16} />
                          </button>
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr className="border-b border-border bg-paper/50 last:border-0">
                          <td colSpan={6} className="p-0">
                            <ConsumptionBreakdown exchangeId={ex.id} />
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  )
                })}
              </tbody>
            </table>
            </div>
            <Pagination page={page} pageSize={pageSize} totalCount={data?.totalCount} onPageChange={changePage} />
          </div>
        </>
      )}

      <CreateExchangeModal tabDef={activeTab} open={createOpen} onClose={() => setCreateOpen(false)} onDone={invalidate} />
      <EditExchangeModal ex={editEx} onClose={() => setEditEx(null)} onDone={invalidate} />
    </div>
  )
}

function LotsSection() {
  const [includeClosed, setIncludeClosed] = useState(false)
  const [expandedLotId, setExpandedLotId] = useState(null)

  const { data: lots, isLoading } = useQuery({
    queryKey: ['exchange-lots', includeClosed],
    queryFn: () => getExchangeLots({ includeClosed })
  })

  const totalRemaining = (lots ?? []).reduce((sum, l) => sum + Number(l.remainingAmount ?? 0), 0)

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center gap-4">
        <div className="card max-w-xs p-4">
          <div className="text-sm text-muted">Cəmi qalan dollar ehtiyatı</div>
          <div className="mt-1 text-xl font-semibold text-usd">{formatMoney(totalRemaining, 'USD')}</div>
        </div>
        <label className="flex items-center gap-2 text-sm text-muted">
          <input
            type="checkbox"
            checked={includeClosed}
            onChange={(e) => {
              setIncludeClosed(e.target.checked)
              setExpandedLotId(null)
            }}
          />
          Bağlanmış (tam satılmış) partiyaları da göstər
        </label>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[680px] text-sm">
            <thead>
              <tr className="border-b border-border bg-paper text-left text-muted">
                <th className="px-4 py-3 font-medium">Alış tarixi</th>
                <th className="px-4 py-3 text-right font-medium">Kurs</th>
                <th className="px-4 py-3 text-right font-medium">İlkin məbləğ</th>
                <th className="px-4 py-3 text-right font-medium">Qalıq</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {isLoading && <tr><td colSpan={6} className="px-4 py-8 text-center text-muted">Yüklənir…</td></tr>}
              {!isLoading && (lots?.length ?? 0) === 0 && (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-muted">Partiya yoxdur</td></tr>
              )}
              {lots?.map((lot) => {
                const isClosed = Number(lot.remainingAmount) <= 0
                const isExpanded = expandedLotId === lot.id
                return (
                  <Fragment key={lot.id}>
                    <tr className="border-b border-border last:border-0">
                      <td className="px-4 py-3 text-muted">{formatDate(lot.createdAt)}</td>
                      <td className="px-4 py-3 text-right">{lot.rate}</td>
                      <td className="px-4 py-3 text-right text-muted">{formatMoney(lot.originalAmount, 'USD')}</td>
                      <td className="px-4 py-3 text-right font-medium text-ink">{formatMoney(lot.remainingAmount, 'USD')}</td>
                      <td className="px-4 py-3">
                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          isClosed ? 'bg-paper text-muted' : 'bg-emerald-50 text-emerald-700'
                        }`}>
                          {isClosed ? 'Bağlanıb' : 'Açıq'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          className="btn-secondary !px-2 !py-1"
                          title="Satış tarixçəsi"
                          onClick={() => setExpandedLotId((id) => (id === lot.id ? null : lot.id))}
                        >
                          {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </button>
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr className="border-b border-border bg-paper/50 last:border-0">
                        <td colSpan={6} className="p-0">
                          <LotSalesBreakdown lotId={lot.id} />
                        </td>
                      </tr>
                    )}
                  </Fragment>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

// Bir partiyanın hansı satış(lar)a, nə qədər və hansı qazancla getdiyi ("bu partiyanın taleyi")
function LotSalesBreakdown({ lotId }) {
  const { data, isLoading } = useQuery({
    queryKey: ['lot-sales', lotId],
    queryFn: () => getLotSales(lotId)
  })

  if (isLoading) return <div className="px-4 py-3 text-xs text-muted">Yüklənir…</div>
  if (!data?.length) return <div className="px-4 py-3 text-xs text-muted">Bu partiyadan hələ satış edilməyib</div>

  const total = data.reduce((sum, s) => sum + Number(s.profit ?? 0), 0)

  return (
    <div className="px-4 py-3">
      <div className="space-y-1">
        {data.map((s) => (
          <div key={s.sellExchangeId} className="flex items-center justify-between text-xs">
            <span className="text-muted">
              {formatDate(s.sellCreatedAt)} — {formatMoney(s.amount, 'USD')} × {s.sellRate} kursla satılıb
            </span>
            <span className={`font-medium ${s.profit < 0 ? 'text-danger' : 'text-brand'}`}>
              {formatMoney(s.profit, 'RUB')}
            </span>
          </div>
        ))}
      </div>
      <div className="mt-2 flex items-center justify-between border-t border-border pt-2 text-xs font-semibold">
        <span>Bu partiyadan cəmi qazanc</span>
        <span className={total < 0 ? 'text-danger' : 'text-brand'}>{formatMoney(total, 'RUB')}</span>
      </div>
    </div>
  )
}

// Bir satışın hansı partiya(lar)dan, nə qədər və hansı qazancla qarşılandığı ("qəbz")
function ConsumptionBreakdown({ exchangeId }) {
  const { data, isLoading } = useQuery({
    queryKey: ['exchange-consumptions', exchangeId],
    queryFn: () => getExchangeConsumptions(exchangeId)
  })

  if (isLoading) return <div className="px-4 py-3 text-xs text-muted">Yüklənir…</div>
  if (!data?.length) return <div className="px-4 py-3 text-xs text-muted">Partiya məlumatı tapılmadı</div>

  const total = data.reduce((sum, c) => sum + Number(c.profit ?? 0), 0)

  return (
    <div className="px-4 py-3">
      <div className="space-y-1">
        {data.map((c) => (
          <div key={c.lotId} className="flex items-center justify-between text-xs">
            <span className="text-muted">
              {formatMoney(c.amount, 'USD')} — {formatDate(c.lotCreatedAt)} tarixli, {c.lotRate} kursla alınmış partiyadan
            </span>
            <span className={`font-medium ${c.profit < 0 ? 'text-danger' : 'text-brand'}`}>
              {formatMoney(c.profit, 'RUB')}
            </span>
          </div>
        ))}
      </div>
      <div className="mt-2 flex items-center justify-between border-t border-border pt-2 text-xs font-semibold">
        <span>Cəmi</span>
        <span className={total < 0 ? 'text-danger' : 'text-brand'}>{formatMoney(total, 'RUB')}</span>
      </div>
    </div>
  )
}

const EMPTY_EXCHANGE_FORM = { fromAmount: '', toAmount: '', rate: '', note: '' }

function CreateExchangeModal({ tabDef, open, onClose, onDone }) {
  const [form, setForm] = useState(EMPTY_EXCHANGE_FORM)

  const mutation = useMutation({
    mutationFn: createExchange,
    onSuccess: () => {
      toast.success('Mübadilə qeyd edildi')
      onDone()
      onClose()
      setForm(EMPTY_EXCHANGE_FORM)
    },
    onError: () => toast.error('Xəta baş verdi')
  })

  // Hər iki məbləğ sahəsi redaktə oluna bilir: hansını yazsan, digəri kursla ondan hesablanır.
  // Hamısı funksional setForm ilə - hər zaman ən son "rate"/məbləğ dəyərini oxuyur, hansı sıra ilə yazılmasından asılı olmayaraq.
  function handleFromAmountChange(v) {
    setForm((f) => {
      const toAmount = calcToAmount(tabDef.fromCurrency, tabDef.toCurrency, v, f.rate)
      return { ...f, fromAmount: v, toAmount: toAmount || '' }
    })
  }

  function handleToAmountChange(v) {
    setForm((f) => {
      const fromAmount = calcFromAmount(tabDef.fromCurrency, tabDef.toCurrency, v, f.rate)
      return { ...f, toAmount: v, fromAmount: fromAmount || '' }
    })
  }

  function handleRateChange(rateStr) {
    setForm((f) => {
      if (f.fromAmount) {
        const toAmount = calcToAmount(tabDef.fromCurrency, tabDef.toCurrency, f.fromAmount, rateStr)
        return { ...f, rate: rateStr, toAmount: toAmount || '' }
      }
      if (f.toAmount) {
        const fromAmount = calcFromAmount(tabDef.fromCurrency, tabDef.toCurrency, f.toAmount, rateStr)
        return { ...f, rate: rateStr, fromAmount: fromAmount || '' }
      }
      return { ...f, rate: rateStr }
    })
  }

  function submit(e) {
    e.preventDefault()
    mutation.mutate({
      fromCurrency: tabDef.fromCurrency,
      toCurrency: tabDef.toCurrency,
      fromAmount: Number(form.fromAmount),
      rate: Number(form.rate),
      note: form.note || null
    })
  }

  return (
    <Modal open={open} onClose={onClose} title={`Yeni: ${tabDef.label}`}>
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="label">Kurs</label>
          <input className="input" type="number" step="0.0001" required autoFocus value={form.rate} onChange={(e) => handleRateChange(e.target.value)} />
        </div>
        <div>
          <label className="label">Məbləğ ({tabDef.fromCurrency})</label>
          <MoneyInput required disabled={!form.rate} value={form.fromAmount} onChange={handleFromAmountChange} />
          <div className="mt-1 h-4 text-xs text-muted">{!form.rate ? 'Əvvəlcə kursu daxil edin' : ' '}</div>
        </div>
        <div>
          <label className="label">Məbləğ ({tabDef.toCurrency})</label>
          <MoneyInput required disabled={!form.rate} value={form.toAmount} onChange={handleToAmountChange} />
          <div className="mt-1 h-4 text-xs text-muted">{!form.rate ? 'Əvvəlcə kursu daxil edin' : ' '}</div>
        </div>
        <div>
          <label className="label">Qeyd</label>
          <input className="input" value={form.note} onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))} />
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" className="btn-secondary" onClick={onClose}>Ləğv et</button>
          <button type="submit" className="btn-primary" disabled={mutation.isPending}>Yadda saxla</button>
        </div>
      </form>
    </Modal>
  )
}

function EditExchangeModal({ ex, onClose, onDone }) {
  const [form, setForm] = useState(null)

  if (ex && !form) {
    const toAmount = calcToAmount(ex.fromCurrency, ex.toCurrency, ex.fromAmount, ex.rate)
    setForm({ fromAmount: ex.fromAmount, toAmount: toAmount || ex.toAmount, rate: ex.rate, note: ex.note ?? '' })
  }

  const mutation = useMutation({
    mutationFn: (payload) => updateExchange(ex.id, payload),
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

  // Hər iki məbləğ sahəsi redaktə oluna bilir: hansını yazsan, digəri kursla ondan hesablanır.
  function handleFromAmountChange(v) {
    setForm((f) => {
      const toAmount = calcToAmount(ex.fromCurrency, ex.toCurrency, v, f.rate)
      return { ...f, fromAmount: v, toAmount: toAmount || '' }
    })
  }

  function handleToAmountChange(v) {
    setForm((f) => {
      const fromAmount = calcFromAmount(ex.fromCurrency, ex.toCurrency, v, f.rate)
      return { ...f, toAmount: v, fromAmount: fromAmount || '' }
    })
  }

  function handleRateChange(rateStr) {
    setForm((f) => {
      if (f.fromAmount) {
        const toAmount = calcToAmount(ex.fromCurrency, ex.toCurrency, f.fromAmount, rateStr)
        return { ...f, rate: rateStr, toAmount: toAmount || '' }
      }
      if (f.toAmount) {
        const fromAmount = calcFromAmount(ex.fromCurrency, ex.toCurrency, f.toAmount, rateStr)
        return { ...f, rate: rateStr, fromAmount: fromAmount || '' }
      }
      return { ...f, rate: rateStr }
    })
  }

  function submit(e) {
    e.preventDefault()
    mutation.mutate({ fromAmount: Number(form.fromAmount), rate: Number(form.rate), note: form.note || null })
  }

  return (
    <Modal open={!!ex} onClose={close} title={`Redaktə: ${ex?.clientName ?? ''}`}>
      {form && (
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="label">Kurs</label>
            <input className="input" type="number" step="0.0001" required value={form.rate} onChange={(e) => handleRateChange(e.target.value)} />
          </div>
          <div>
            <label className="label">Məbləğ ({ex?.fromCurrency})</label>
            <MoneyInput required disabled={!form.rate} value={form.fromAmount} onChange={handleFromAmountChange} />
            <div className="mt-1 h-4 text-xs text-muted">{!form.rate ? 'Əvvəlcə kursu daxil edin' : ' '}</div>
          </div>
          <div>
            <label className="label">Məbləğ ({ex?.toCurrency})</label>
            <MoneyInput required disabled={!form.rate} value={form.toAmount} onChange={handleToAmountChange} />
            <div className="mt-1 h-4 text-xs text-muted">{!form.rate ? 'Əvvəlcə kursu daxil edin' : ' '}</div>
          </div>
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
