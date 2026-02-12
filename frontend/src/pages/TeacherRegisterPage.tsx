import { FormEvent, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { registerTeacher } from '../api/auth'

export function TeacherRegisterPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    username: '',
    password: '',
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    department: '',
    bio: '',
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

    if (
      !form.username ||
      !form.password ||
      !form.firstName ||
      !form.email ||
      !form.department
    ) {
      setError(
        'Please fill in at least username, password, first name, email and department.',
      )
      return
    }

    try {
      setLoading(true)
      await registerTeacher({
        username: form.username,
        password: form.password,
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        phoneNumber: form.phoneNumber,
        department: form.department,
        bio: form.bio || undefined,
        image: form.image || undefined,
      })

      setSuccess('Teacher registered successfully. You can now log in.')
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
      <h1 className="auth-title">Teacher registration</h1>
      <p className="auth-description">
        Create a teacher account to manage courses, lessons and assessments.
      </p>

      <form className="form" onSubmit={handleSubmit}>
        <div className="form-grid">
          <label className="form-field">
            <span className="form-label">Username *</span>
            <input
              type="text"
              className="form-input"
              value={form.username}
              onChange={(e) => updateField('username', e.target.value)}
            />
          </label>

          <label className="form-field">
            <span className="form-label">Password *</span>
            <input
              type="password"
              className="form-input"
              value={form.password}
              onChange={(e) => updateField('password', e.target.value)}
            />
          </label>
        </div>

        <div className="form-grid">
          <label className="form-field">
            <span className="form-label">First name *</span>
            <input
              type="text"
              className="form-input"
              value={form.firstName}
              onChange={(e) => updateField('firstName', e.target.value)}
            />
          </label>

          <label className="form-field">
            <span className="form-label">Last name</span>
            <input
              type="text"
              className="form-input"
              value={form.lastName}
              onChange={(e) => updateField('lastName', e.target.value)}
            />
          </label>
        </div>

        <div className="form-grid">
          <label className="form-field">
            <span className="form-label">Email *</span>
            <input
              type="email"
              className="form-input"
              value={form.email}
              onChange={(e) => updateField('email', e.target.value)}
            />
          </label>

          <label className="form-field">
            <span className="form-label">Phone</span>
            <input
              type="tel"
              className="form-input"
              value={form.phoneNumber}
              onChange={(e) => updateField('phoneNumber', e.target.value)}
            />
          </label>
        </div>

        <div className="form-grid">
          <label className="form-field">
            <span className="form-label">Department *</span>
            <input
              type="text"
              className="form-input"
              value={form.department}
              onChange={(e) => updateField('department', e.target.value)}
            />
          </label>

          <label className="form-field">
            <span className="form-label">Profile image URL</span>
            <input
              type="url"
              className="form-input"
              value={form.image}
              onChange={(e) => updateField('image', e.target.value)}
            />
          </label>
        </div>

        <label className="form-field">
          <span className="form-label">Short bio</span>
          <textarea
            className="form-input form-textarea"
            rows={3}
            value={form.bio}
            onChange={(e) => updateField('bio', e.target.value)}
          />
        </label>

        {error && <div className="form-error">{error}</div>}
        {success && <div className="form-success">{success}</div>}

        <button className="btn btn-primary" type="submit" disabled={loading}>
          {loading ? 'Creating account…' : 'Register as teacher'}
        </button>
      </form>
    </div>
  )
}

