import { apiClient } from './client'

export async function getExchanges({ fromCurrency, page = 1, pageSize = 10, current = false } = {}) {
  const { data } = await apiClient.get('/api/exchange', { params: { fromCurrency, page, pageSize, current } })
  return data // ExchangeDtoPagedResult
}

export async function createExchange(payload) {
  // { clientName, fromCurrency, toCurrency, fromAmount, rate, note }
  const { data } = await apiClient.post('/api/exchange', payload)
  return data
}

export async function updateExchange(id, payload) {
  // { fromAmount, rate, note }
  const { data } = await apiClient.put(`/api/exchange/${id}`, payload)
  return data
}

export async function getExchangeProfitSummary() {
  const { data } = await apiClient.get('/api/exchange/profit-summary')
  return data // { totalRealizedProfit }
}

export async function getExchangeLots({ includeClosed = false } = {}) {
  const { data } = await apiClient.get('/api/exchange/lots', { params: { includeClosed } })
  return data // CurrencyLotDto[], ən köhnədən yeniyə sıralanıb
}

export async function getExchangeConsumptions(exchangeId) {
  const { data } = await apiClient.get(`/api/exchange/${exchangeId}/consumptions`)
  return data // LotConsumptionDetailDto[] - bu satışın hansı partiya(lar)dan qarşılandığı
}

export async function getLotSales(lotId) {
  const { data } = await apiClient.get(`/api/exchange/lots/${lotId}/sales`)
  return data // LotSaleDetailDto[] - bu partiyanın hansı satış(lar)a getdiyi
}
