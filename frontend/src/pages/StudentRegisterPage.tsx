import { FormEvent, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { registerStudent } from '../api/auth'
import { Input } from '../components/Input'
import { Button } from '../components/Button'

export function StudentRegisterPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    username: '',
    password: '',
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    image: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  function updateField<K extends keyof typeof form>(field: K, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    if (!form.username || !form.password || !form.firstName || !form.email) {
      setError('Please fill in at least username, password, first name and email.')
      return
    }

    try {
      setLoading(true)
      await registerStudent({
        username: form.username,
        password: form.password,
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        phoneNumber: form.phoneNumber,
        image: form.image || undefined,
      })

      setSuccess('Student registered successfully. You can now log in.')
      setTimeout(() => navigate('/login'), 1000)
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : 'Registration failed. Please try again.'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-card">
      <h1 className="auth-title">Student registration</h1>
      <p className="auth-description">
        Create a student account to enroll in courses and take quizzes.
      </p>

      <form className="form" onSubmit={handleSubmit}>
        <div className="form-grid">
          <Input
            label="Username *"
            type="text"
            value={form.username}
            onChange={(e) => updateField('username', e.target.value)}
          />

          <Input
            label="Password *"
            type="password"
            value={form.password}
            onChange={(e) => updateField('password', e.target.value)}
          />
        </div>

        <div className="form-grid">
          <Input
            label="First name *"
            type="text"
            value={form.firstName}
            onChange={(e) => updateField('firstName', e.target.value)}
          />

          <Input
            label="Last name"
            type="text"
            value={form.lastName}
            onChange={(e) => updateField('lastName', e.target.value)}
          />
        </div>

        <div className="form-grid">
          <Input
            label="Email *"
            type="email"
            value={form.email}
            onChange={(e) => updateField('email', e.target.value)}
          />

          <Input
            label="Phone"
            type="tel"
            value={form.phoneNumber}
            onChange={(e) => updateField('phoneNumber', e.target.value)}
          />
        </div>

        <Input
          label="Profile image URL"
          type="url"
          value={form.image}
          onChange={(e) => updateField('image', e.target.value)}
        />

        {error && <div className="form-error">{error}</div>}
        {success && <div className="form-success">{success}</div>}

        <Button type="submit" isLoading={loading}>
          Register as student
        </Button>
      </form>
    </div>
  )
}

