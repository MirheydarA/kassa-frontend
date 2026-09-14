import { apiClient } from './client'

export async function getExpenses({ page = 1, pageSize = 10 } = {}) {
  const { data } = await apiClient.get('/api/expenses', { params: { page, pageSize } })
  return data // ExpenseDtoPagedResult
}

export async function createExpense(payload) {
  // { amount, description }
  const { data } = await apiClient.post('/api/expenses', payload)
  return data
}

export async function updateExpense(id, payload) {
  const { data } = await apiClient.put(`/api/expenses/${id}`, payload)
  return data
}
