import { apiClient } from './client'

export async function login(username, password) {
  const { data } = await apiClient.post('/api/auth/login', { username, password })
  return data // { token, username, expiresAt }
}

export async function changePassword(currentPassword, newPassword) {
  const { data } = await apiClient.post('/api/auth/change-password', {
    currentPassword,
    newPassword
  })
  return data
}
