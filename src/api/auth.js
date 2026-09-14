import { apiClient } from './client'

export async function login(username, password) {
  const { data } = await apiClient.post('/api/auth/login', { username, password })
  return data // { token, username, expiresAt }
}
