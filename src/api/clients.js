import { apiClient } from './client'

export async function getClients(search) {
  const { data } = await apiClient.get('/api/clients', { params: search ? { search } : {} })
  return data // ClientDto[]
}

export async function createClient(payload) {
  const { data } = await apiClient.post('/api/clients', payload)
  return data
}

export async function updateClient(id, payload) {
  const { data } = await apiClient.put(`/api/clients/${id}`, payload)
  return data
}
