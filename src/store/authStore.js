import { create } from 'zustand'

const STORAGE_KEY = 'kassa_auth'

function loadInitial() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { token: null, username: null, expiresAt: null }
    return JSON.parse(raw)
  } catch {
    return { token: null, username: null, expiresAt: null }
  }
}

export const useAuthStore = create((set) => ({
  ...loadInitial(),
  isAuthenticated: () => !!loadInitial().token,
  login: ({ token, username, expiresAt }) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ token, username, expiresAt }))
    set({ token, username, expiresAt })
  },
  logout: () => {
    localStorage.removeItem(STORAGE_KEY)
    set({ token: null, username: null, expiresAt: null })
  }
}))
