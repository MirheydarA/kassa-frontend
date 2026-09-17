import { apiClient } from './client'

export async function getExchanges({ fromCurrency, page = 1, pageSize = 10 } = {}) {
  const { data } = await apiClient.get('/api/exchange', { params: { fromCurrency, page, pageSize } })
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
