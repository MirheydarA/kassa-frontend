import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { login } from '../api/auth'
import { useAuthStore } from '../store/authStore'

export default function Login() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const setAuth = useAuthStore((s) => s.login)
  const navigate = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    try {
      const data = await login(username, password)
      setAuth(data)
      navigate('/')
    } catch (err) {
      toast.error('Giriş uğursuz oldu. İstifadəçi adı və ya şifrə yanlışdır.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-paper px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center">
          <div className="mb-3 flex h-11 w-11 items-center justify-center rounded bg-brand text-lg font-semibold text-white">K</div>
          <h1 className="text-xl font-semibold text-ink">Kassa-ya giriş</h1>
        </div>
        <form onSubmit={handleSubmit} className="card p-6">
          <div className="mb-4">
            <label className="label">İstifadəçi adı</label>
            <input
              className="input"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoFocus
              required
            />
          </div>
          <div className="mb-6">
            <label className="label">Şifrə</label>
            <input
              className="input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="btn-primary w-full" disabled={loading}>
            {loading ? 'Yoxlanılır…' : 'Daxil ol'}
          </button>
        </form>
      </div>
    </div>
  )
}
