import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { Plus, Pencil, ArrowRight, ArrowDownCircle, ArrowUpCircle } from 'lucide-react'
import { getExchanges, createExchange, updateExchange, getExchangeProfitSummary } from '../api/exchange'
import { formatMoney, formatDate } from '../lib/format'
import CurrencyBadge from '../components/CurrencyBadge'
import Pagination from '../components/Pagination'
import Modal from '../components/Modal'
import ClientAutocomplete from '../components/ClientAutocomplete'
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
  const [tab, setTab] = useState('sell')
  const [page, setPage] = useState(1)
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
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold text-ink">Exchange</h1>
        <button className="btn-primary" onClick={() => setCreateOpen(true)}>
          <Plus size={16} /> Yeni mübadilə
        </button>
      </div>

      <div className="card mb-6 max-w-xs p-4">
        <div className="text-sm text-muted">Cəmi realizə olunmuş qazanc</div>
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
              <th className="px-4 py-3 font-medium">Müştəri</th>
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
            {data?.items?.map((ex) => (
              <tr key={ex.id} className="border-b border-border last:border-0">
                <td className="px-4 py-3 text-muted">{formatDate(ex.createdAt)}</td>
                <td className="px-4 py-3 font-medium text-ink">{ex.clientName}</td>
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
                  {ex.realizedProfit == null ? '—' : formatMoney(ex.realizedProfit, 'RUB')}
                </td>
                <td className="px-4 py-3 text-muted">{ex.note || '—'}</td>
                <td className="px-4 py-3">
                  <button className="btn-secondary !px-2 !py-1" title="Redaktə et" onClick={() => setEditEx(ex)}>
                    <Pencil size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
        <Pagination page={page} pageSize={pageSize} totalCount={data?.totalCount} onPageChange={setPage} />
      </div>

      <CreateExchangeModal tabDef={activeTab} open={createOpen} onClose={() => setCreateOpen(false)} onDone={invalidate} />
      <EditExchangeModal ex={editEx} onClose={() => setEditEx(null)} onDone={invalidate} />
    </div>
  )
}

const EMPTY_EXCHANGE_FORM = { clientName: '', fromAmount: '', toAmount: '', rate: '', note: '' }

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
      clientName: form.clientName,
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
          <label className="label">Müştəri adı (məcburi deyil)</label>
          <ClientAutocomplete
            value={form.clientName}
            onChange={(v) => setForm((f) => ({ ...f, clientName: v }))}
            placeholder="Müştəri adı (istəyə bağlı)"
          />
        </div>
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
