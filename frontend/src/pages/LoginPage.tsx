import { FormEvent, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { login } from '../api/auth'

export function LoginPage() {
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)

    if (!username || !password) {
      setError('Please enter both username and password.')
      return
    }

    try {
      setLoading(true)
      const result = await login({ username, password })

      localStorage.setItem('authToken', result.token)
      localStorage.setItem('authUsername', result.username)
      localStorage.setItem('authRoles', JSON.stringify(result.roles ?? []))

      navigate('/')
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Login failed. Please try again.'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-card">
      <h1 className="auth-title">Login</h1>
      <p className="auth-description">
        Sign in to access your courses, assignments and quizzes.
      </p>

      <form className="form" onSubmit={handleSubmit}>
        <label className="form-field">
          <span className="form-label">Username</span>
          <input
            type="text"
            className="form-input"
            autoComplete="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
        </label>

        <label className="form-field">
          <span className="form-label">Password</span>
          <input
            type="password"
            className="form-input"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>

        {error && <div className="form-error">{error}</div>}

        <button className="btn btn-primary" type="submit" disabled={loading}>
          {loading ? 'Signing in…' : 'Login'}
        </button>
      </form>
    </div>
  )
}

