import { apiClient } from './client'

export async function getLoans({ status, currency, page = 1, pageSize = 10 } = {}) {
  const { data } = await apiClient.get('/api/loans', {
    params: { status, currency, page, pageSize }
  })
  return data // LoanDtoPagedResult
}

export async function createLoan(payload) {
  // { clientName, currency, amount, exchangeRate, note }
  const { data } = await apiClient.post('/api/loans', payload)
  return data
}

export async function updateLoan(id, payload) {
  // { amount, exchangeRate, note }
  const { data } = await apiClient.put(`/api/loans/${id}`, payload)
  return data
}

export async function addLoanPayment(id, payload) {
  // { amount, note }
  const { data } = await apiClient.post(`/api/loans/${id}/payments`, payload)
  return data
}
