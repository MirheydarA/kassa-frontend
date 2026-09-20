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

// Gün-gün səhifələmə: hər çağırış bir günün bütün hərəkətlərini qaytarır (backend tərəfdən, frontend-i yükləməmək üçün)
export async function getCashBoxTransactionsByDay({ currency, type, from, to, dayPage = 1 } = {}) {
  const { data } = await apiClient.get('/api/cashbox/transactions/by-day', {
    params: { currency, type, from, to, dayPage }
  })
  return data // CashBoxDayResultDto { date, items, dayPage, totalDays }
}

export async function revertTransaction(id, password) {
  const { data } = await apiClient.post(`/api/cashbox/transactions/${id}/revert`, { password })
  return data
}

export async function adjustBalance({ currency, newAmount, password }) {
  const { data } = await apiClient.put('/api/cashbox/balance', { currency, newAmount, password })
  return data // CashBoxBalanceDto
}
