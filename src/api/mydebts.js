import { apiClient } from './client'

export async function getMyDebts({ currency, clientName, includeClosed = false, page = 1, pageSize = 1000 } = {}) {
  const { data } = await apiClient.get('/api/mydebts', {
    params: { currency, clientName, includeClosed, page, pageSize }
  })
  return data // MyDebtDtoPagedResult
}

export async function getMyDebt(id) {
  const { data } = await apiClient.get(`/api/mydebts/${id}`)
  return data // MyDebtDto
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
