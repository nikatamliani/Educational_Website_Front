import { useEffect, useState, FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { fetchMyProfile, updateMyProfile, UserProfile } from '../api/profile'
import { Button } from '../components/Button'

export function ProfilePage() {
    const navigate = useNavigate()

    const [profile, setProfile] = useState<UserProfile | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    // Editable fields
    const [firstName, setFirstName] = useState('')
    const [lastName, setLastName] = useState('')
    const [email, setEmail] = useState('')
    const [phone, setPhone] = useState('')
    const [image, setImage] = useState('')

    // Password change
    const [newPassword, setNewPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')

    const [saving, setSaving] = useState(false)
    const [successMsg, setSuccessMsg] = useState('')
    const [errorMsg, setErrorMsg] = useState('')

    useEffect(() => {
        let mounted = true
        async function load() {
            try {
                const data = await fetchMyProfile()
                if (mounted) {
                    setProfile(data)
                    setFirstName(data.firstName ?? '')
                    setLastName(data.lastName ?? '')
                    setEmail(data.email ?? '')
                    setPhone(data.phoneNumber ?? '')
                    setImage(data.image ?? '')
                }
            } catch (err) {
                if (mounted) setError(err instanceof Error ? err.message : 'Failed to load profile')
            } finally {
                if (mounted) setLoading(false)
            }
        }
        load()
        return () => { mounted = false }
    }, [])

    // ESC → back
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') navigate(-1) }
        window.addEventListener('keydown', onKey)
        return () => window.removeEventListener('keydown', onKey)
    }, [navigate])

    const handleSave = async (e: FormEvent) => {
        e.preventDefault()
        if (!profile) return

        setErrorMsg('')
        setSuccessMsg('')

        if (newPassword && newPassword !== confirmPassword) {
            setErrorMsg('Passwords do not match.')
            return
        }
        if (newPassword && newPassword.length < 4) {
            setErrorMsg('Password must be at least 4 characters.')
            return
        }

        setSaving(true)
        try {
            await updateMyProfile({
                id: profile.id,
                username: profile.username,
                firstName,
                lastName,
                email,
                phoneNumber: phone,
                image: image || null,
                password: newPassword || undefined,
            })
            setSuccessMsg('Profile updated successfully!')
            setNewPassword('')
            setConfirmPassword('')
        } catch (err) {
            setErrorMsg(err instanceof Error ? err.message : 'Failed to update profile')
        } finally {
            setSaving(false)
        }
    }

    if (loading) return <div className="page-container"><div className="courses-message">Loading profile…</div></div>
    if (error || !profile) return <div className="page-container"><div className="courses-message courses-message-error">{error || 'Profile not found'}</div></div>

    const inputStyle: React.CSSProperties = {
        width: '100%',
        padding: '0.65rem 0.85rem',
        borderRadius: '0.6rem',
        border: '1px solid rgba(148, 163, 184, 0.25)',
        background: 'rgba(15, 23, 42, 0.6)',
        color: '#e5e7eb',
        fontSize: '0.95rem',
        outline: 'none',
        transition: 'border-color 0.2s',
    }

    const labelStyle: React.CSSProperties = {
        display: 'block',
        marginBottom: '0.35rem',
        fontSize: '0.85rem',
        color: '#9ca3af',
        fontWeight: 500,
    }

    const initials = (profile.firstName?.[0] ?? '') + (profile.lastName?.[0] ?? '')

    return (
        <div className="page-container" style={{ maxWidth: '640px', margin: '0 auto' }}>

            {/* Avatar & header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', marginBottom: '2rem', marginTop: '2rem' }}>
                {profile.image ? (
                    <img
                        src={profile.image}
                        alt="Avatar"
                        style={{
                            width: '5rem', height: '5rem', borderRadius: '50%',
                            objectFit: 'cover', border: '3px solid rgba(59, 130, 246, 0.4)',
                        }}
                    />
                ) : (
                    <div style={{
                        width: '5rem', height: '5rem', borderRadius: '50%',
                        background: 'linear-gradient(135deg, #3b82f6, #6366f1)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '1.6rem', fontWeight: 700, color: '#fff',
                        border: '3px solid rgba(59, 130, 246, 0.4)',
                    }}>
                        {initials || '?'}
                    </div>
                )}
                <div>
                    <h1 style={{ margin: 0, fontSize: '1.6rem', fontWeight: 700 }}>
                        {profile.firstName} {profile.lastName}
                    </h1>
                    <p style={{ margin: '0.2rem 0 0', color: '#9ca3af', fontSize: '0.95rem' }}>
                        @{profile.username}
                    </p>
                </div>
            </div>

            {/* Profile form */}
            <form onSubmit={handleSave}>

                <div style={{
                    background: 'rgba(30, 41, 59, 0.6)', border: '1px solid rgba(148, 163, 184, 0.15)',
                    borderRadius: '1rem', padding: '1.5rem', marginBottom: '1.5rem',
                }}>
                    <h2 style={{ fontSize: '1.15rem', marginBottom: '1.25rem', color: '#e5e7eb' }}>Personal Information</h2>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                        <div>
                            <label style={labelStyle}>First Name</label>
                            <input
                                style={inputStyle}
                                value={firstName}
                                onChange={(e) => setFirstName(e.target.value)}
                                onFocus={(e) => e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.6)'}
                                onBlur={(e) => e.currentTarget.style.borderColor = 'rgba(148, 163, 184, 0.25)'}
                            />
                        </div>
                        <div>
                            <label style={labelStyle}>Last Name</label>
                            <input
                                style={inputStyle}
                                value={lastName}
                                onChange={(e) => setLastName(e.target.value)}
                                onFocus={(e) => e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.6)'}
                                onBlur={(e) => e.currentTarget.style.borderColor = 'rgba(148, 163, 184, 0.25)'}
                            />
                        </div>
                    </div>

                    <div style={{ marginBottom: '1rem' }}>
                        <label style={labelStyle}>Email</label>
                        <input
                            type="email"
                            style={inputStyle}
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            onFocus={(e) => e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.6)'}
                            onBlur={(e) => e.currentTarget.style.borderColor = 'rgba(148, 163, 184, 0.25)'}
                        />
                    </div>

                    <div style={{ marginBottom: '1rem' }}>
                        <label style={labelStyle}>Phone Number</label>
                        <input
                            style={inputStyle}
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            onFocus={(e) => e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.6)'}
                            onBlur={(e) => e.currentTarget.style.borderColor = 'rgba(148, 163, 184, 0.25)'}
                        />
                    </div>

                    <div>
                        <label style={labelStyle}>Profile Image URL</label>
                        <input
                            style={inputStyle}
                            value={image}
                            onChange={(e) => setImage(e.target.value)}
                            placeholder="https://example.com/avatar.jpg"
                            onFocus={(e) => e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.6)'}
                            onBlur={(e) => e.currentTarget.style.borderColor = 'rgba(148, 163, 184, 0.25)'}
                        />
                    </div>
                </div>

                {/* Password section */}
                <div style={{
                    background: 'rgba(30, 41, 59, 0.6)', border: '1px solid rgba(148, 163, 184, 0.15)',
                    borderRadius: '1rem', padding: '1.5rem', marginBottom: '1.5rem',
                }}>
                    <h2 style={{ fontSize: '1.15rem', marginBottom: '1.25rem', color: '#e5e7eb' }}>Change Password</h2>
                    <p style={{ color: '#9ca3af', fontSize: '0.85rem', marginBottom: '1rem' }}>Leave blank to keep your current password.</p>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div>
                            <label style={labelStyle}>New Password</label>
                            <input
                                type="password"
                                style={inputStyle}
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                placeholder="••••••"
                                onFocus={(e) => e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.6)'}
                                onBlur={(e) => e.currentTarget.style.borderColor = 'rgba(148, 163, 184, 0.25)'}
                            />
                        </div>
                        <div>
                            <label style={labelStyle}>Confirm Password</label>
                            <input
                                type="password"
                                style={inputStyle}
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="••••••"
                                onFocus={(e) => e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.6)'}
                                onBlur={(e) => e.currentTarget.style.borderColor = 'rgba(148, 163, 184, 0.25)'}
                            />
                        </div>
                    </div>
                </div>

                {/* Messages */}
                {errorMsg && (
                    <div style={{
                        padding: '0.65rem 1rem', borderRadius: '0.5rem', marginBottom: '1rem',
                        background: 'rgba(239, 68, 68, 0.12)', border: '1px solid rgba(239, 68, 68, 0.3)',
                        color: '#fca5a5', fontSize: '0.9rem',
                    }}>
                        {errorMsg}
                    </div>
                )}
                {successMsg && (
                    <div style={{
                        padding: '0.65rem 1rem', borderRadius: '0.5rem', marginBottom: '1rem',
                        background: 'rgba(16, 185, 129, 0.12)', border: '1px solid rgba(16, 185, 129, 0.3)',
                        color: '#6ee7b7', fontSize: '0.9rem',
                    }}>
                        {successMsg}
                    </div>
                )}

                {/* Actions */}
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <Button
                        type="submit"
                        disabled={saving}
                        style={{
                            padding: '0.6rem 1.5rem',
                            background: 'linear-gradient(135deg, #3b82f6, #6366f1)',
                            border: 'none', borderRadius: '0.6rem',
                            color: '#fff', fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer',
                            opacity: saving ? 0.7 : 1,
                        }}
                    >
                        {saving ? 'Saving…' : 'Save Changes'}
                    </Button>
                    <Button
                        type="button"
                        onClick={() => navigate(-1)}
                        variant="ghost"
                    >
                        Cancel
                    </Button>
                </div>
            </form>
        </div>
    )
}
