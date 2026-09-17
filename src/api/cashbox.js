import { apiClient } from './client'

export async function getCashBoxBalance() {
  const { data } = await apiClient.get('/api/cashbox/balance')
  return data // { usd, rub }
}

export async function getCashBoxTransactions({ currency, type, from, to, page = 1, pageSize = 15 } = {}) {
  const { data } = await apiClient.get('/api/cashbox/transactions', {
    params: { currency, type, from, to, page, pageSize }
  })
  return data // CashBoxTransactionDtoPagedResult
}

export async function revertTransaction(id, password) {
  const { data } = await apiClient.post(`/api/cashbox/transactions/${id}/revert`, { password })
  return data
}
