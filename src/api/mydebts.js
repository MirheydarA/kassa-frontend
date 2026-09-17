import { apiClient } from './client'

export async function getMyDebts({ currency, page = 1, pageSize = 10 } = {}) {
  const { data } = await apiClient.get('/api/mydebts', { params: { currency, page, pageSize } })
  return data // MyDebtDtoPagedResult
}

export async function createMyDebt(payload) {
  // { clientName, currency, amount, exchangeRate, note }
  const { data } = await apiClient.post('/api/mydebts', payload)
  return data
}

export async function updateMyDebt(id, payload) {
  // { amount, exchangeRate, note }
  const { data } = await apiClient.put(`/api/mydebts/${id}`, payload)
  return data
}

export async function addMyDebtPayment(id, payload) {
  // { amount, note }
  const { data } = await apiClient.post(`/api/mydebts/${id}/payments`, payload)
  return data
}
