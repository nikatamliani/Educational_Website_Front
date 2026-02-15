import { useEffect, useState, FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { fetchMyProfile, updateMyProfile, UserProfile } from '../api/profile'
import { useAuth } from '../context/AuthContext'
import { Button } from '../components/Button'
import ErrorMessage from '../components/ErrorMessage'
import { useToast } from '../context/ToastContext'

export function ProfilePage() {
    const navigate = useNavigate()
    const { user } = useAuth()
    const role = user?.role ?? 'student'

    const [profile, setProfile] = useState<UserProfile | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    // Shared editable fields
    const [firstName, setFirstName] = useState('')
    const [lastName, setLastName] = useState('')
    const [email, setEmail] = useState('')
    const [phone, setPhone] = useState('')
    const [image, setImage] = useState('')
    const [imageFile, setImageFile] = useState<File | null>(null)

    // Teacher-only fields
    const [department, setDepartment] = useState('')
    const [bio, setBio] = useState('')

    // Password change
    const [newPassword, setNewPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')

    const [saving, setSaving] = useState(false)
    const { showToast } = useToast()

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
                    if (data._role === 'teacher') {
                        setDepartment(data.department ?? '')
                        setBio(data.bio ?? '')
                    }
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

    const loadProfile = () => {
        setLoading(true)
        setError(null)
        fetchMyProfile()
            .then((data) => {
                setProfile(data)
                setFirstName(data.firstName ?? '')
                setLastName(data.lastName ?? '')
                setEmail(data.email ?? '')
                setPhone(data.phoneNumber ?? '')
                setImage(data.image ?? '')
                if (data._role === 'teacher') {
                    setDepartment(data.department ?? '')
                    setBio(data.bio ?? '')
                }
            })
            .catch((err) => setError(err.message || 'Failed to load profile'))
            .finally(() => setLoading(false))
    }

    // ESC → back
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') navigate(-1) }
        window.addEventListener('keydown', onKey)
        return () => window.removeEventListener('keydown', onKey)
    }, [navigate])

    const handleSave = async (e: FormEvent) => {
        e.preventDefault()
        if (!profile) return

        if (newPassword && newPassword !== confirmPassword) {
            showToast('Passwords do not match.', 'error')
            return
        }
        if (newPassword && newPassword.length < 4) {
            showToast('Password must be at least 4 characters.', 'error')
            return
        }

        const shared = {
            id: profile.id,
            username: profile.username,
            firstName,
            lastName,
            email,
            phoneNumber: phone,
            image: image || null,
            password: newPassword || undefined,
        }

        setSaving(true)
        try {
            if (role === 'teacher') {
                await updateMyProfile({ ...shared, department, bio }, 'teacher', imageFile || undefined)
            } else {
                await updateMyProfile(shared, 'student', imageFile || undefined)
            }

            showToast('Profile updated successfully!', 'success')

            // Reload profile to get new image URL
            const updated = await fetchMyProfile()
            setProfile(updated)
            setImage(updated.image ?? '')
            setImageFile(null)
            setNewPassword('')
            setConfirmPassword('')
        } catch (err: any) {
            showToast(err.message || 'Failed to update profile', 'error')
        } finally {
            setSaving(false)
        }
    }

    if (loading) return <div className="page-container"><div className="courses-message">Loading profile…</div></div>
    if (error || !profile) {
        return (
            <div className="page-container">
                <ErrorMessage
                    message={error || 'Profile not found'}
                    onRetry={loadProfile}
                    title="Could Not Load Profile"
                />
            </div>
        )
    }

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

    const focusHandler = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) =>
        e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.6)'
    const blurHandler = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) =>
        e.currentTarget.style.borderColor = 'rgba(148, 163, 184, 0.25)'

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
                        <span style={{
                            marginLeft: '0.75rem',
                            fontSize: '0.75rem',
                            padding: '0.15rem 0.5rem',
                            borderRadius: '9999px',
                            background: role === 'teacher' ? 'rgba(168, 85, 247, 0.15)' : 'rgba(59, 130, 246, 0.15)',
                            color: role === 'teacher' ? '#c084fc' : '#93c5fd',
                            fontWeight: 600,
                            textTransform: 'capitalize',
                        }}>
                            {role}
                        </span>
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
                            <input style={inputStyle} value={firstName} onChange={(e) => setFirstName(e.target.value)} onFocus={focusHandler} onBlur={blurHandler} />
                        </div>
                        <div>
                            <label style={labelStyle}>Last Name</label>
                            <input style={inputStyle} value={lastName} onChange={(e) => setLastName(e.target.value)} onFocus={focusHandler} onBlur={blurHandler} />
                        </div>
                    </div>

                    <div style={{ marginBottom: '1rem' }}>
                        <label style={labelStyle}>Email</label>
                        <input type="email" style={inputStyle} value={email} onChange={(e) => setEmail(e.target.value)} onFocus={focusHandler} onBlur={blurHandler} />
                    </div>

                    <div style={{ marginBottom: '1rem' }}>
                        <label style={labelStyle}>Phone Number</label>
                        <input style={inputStyle} value={phone} onChange={(e) => setPhone(e.target.value)} onFocus={focusHandler} onBlur={blurHandler} />
                    </div>

                    <div>
                        <label style={labelStyle}>Profile Image</label>
                        <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                            style={inputStyle}
                        />
                    </div>
                </div>

                {/* Teacher-only section */}
                {role === 'teacher' && (
                    <div style={{
                        background: 'rgba(30, 41, 59, 0.6)', border: '1px solid rgba(148, 163, 184, 0.15)',
                        borderRadius: '1rem', padding: '1.5rem', marginBottom: '1.5rem',
                    }}>
                        <h2 style={{ fontSize: '1.15rem', marginBottom: '1.25rem', color: '#e5e7eb' }}>Teaching Information</h2>

                        <div style={{ marginBottom: '1rem' }}>
                            <label style={labelStyle}>Department</label>
                            <input style={inputStyle} value={department} onChange={(e) => setDepartment(e.target.value)} onFocus={focusHandler} onBlur={blurHandler} />
                        </div>

                        <div>
                            <label style={labelStyle}>Bio</label>
                            <textarea
                                style={{ ...inputStyle, minHeight: '5rem', resize: 'vertical' }}
                                value={bio}
                                onChange={(e) => setBio(e.target.value)}
                                onFocus={focusHandler}
                                onBlur={blurHandler}
                                placeholder="Tell students about yourself…"
                            />
                        </div>
                    </div>
                )}

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
                            <input type="password" style={inputStyle} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="••••••" onFocus={focusHandler} onBlur={blurHandler} />
                        </div>
                        <div>
                            <label style={labelStyle}>Confirm Password</label>
                            <input type="password" style={inputStyle} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="••••••" onFocus={focusHandler} onBlur={blurHandler} />
                        </div>
                    </div>
                </div>



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
