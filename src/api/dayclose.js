import { apiClient } from './client'

export async function getLatestDayClose() {
  const { data } = await apiClient.get('/api/dayclose/latest')
  return data // { closedAt: string | null }
}

export async function closeDay() {
  const { data } = await apiClient.post('/api/dayclose')
  return data // { closedAt: string }
}
