import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { fetchTeacherByUsername, updateTeacher, Teacher } from '../api/teacher'
import { Button } from '../components/Button'
import ErrorMessage from '../components/ErrorMessage'
import { useToast } from '../context/ToastContext'
import './StudentDetailsPage.css' // Reuse styles

export const TeacherDetailsPage: React.FC = () => {
    const { username } = useParams<{ username: string }>()
    const navigate = useNavigate()
    const { showToast } = useToast()
    const [teacher, setTeacher] = useState<Teacher | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    // Edit state
    const [isEditing, setIsEditing] = useState(false)
    const [editForm, setEditForm] = useState<Partial<Teacher & { password?: string }>>({})
    const [saving, setSaving] = useState(false)
    const [saveError, setSaveError] = useState<string | null>(null)

    useEffect(() => {
        loadTeacher()
    }, [username])

    const loadTeacher = () => {
        if (!username) return
        setLoading(true)
        setError(null)
        fetchTeacherByUsername(username)
            .then((t) => {
                if (!t) throw new Error(`Teacher "${username}" not found. Please verify the username or link.`)
                setTeacher(t)
                setEditForm(t) // Initialize form
            })
            .catch((err) => {
                setError(err.message || 'Failed to load teacher details')
            })
            .finally(() => setLoading(false))
    }

    const handleEditToggle = () => {
        setIsEditing(!isEditing)
        if (!isEditing && teacher) {
            setEditForm(teacher) // Reset form on open
            setSaveError(null)
        }
    }

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target
        setEditForm(prev => ({ ...prev, [name]: value }))
    }

    const handleSave = async () => {
        if (!teacher || !username) return

        setSaving(true)
        setSaveError(null)
        try {
            await updateTeacher(username, editForm)
            // Refresh data
            const updated = { ...teacher, ...editForm } as Teacher
            setTeacher(updated)
            setIsEditing(false)
            showToast('Teacher updated successfully', 'success')
        } catch (err: any) {
            setSaveError(`Failed to update teacher: ${err.message || 'Unknown error'}`)
            console.error('Update teacher failed:', err)
        } finally {
            setSaving(false)
        }
    }

    if (loading) return <div className="p-4">Loading teacher details...</div>
    if (error) return (
        <div className="p-4">
            <ErrorMessage
                message={error}
                onRetry={loadTeacher}
                title="Failed to Load Teacher"
            />
            <button onClick={() => navigate(-1)} className="btn btn-secondary mt-4">Go Back</button>
        </div>
    )
    if (!teacher) return null

    return (
        <div className="student-details-page">
            <button onClick={() => navigate(-1)} className="back-btn">← Back to Teachers</button>

            <div className="details-card">
                <div className="details-header">
                    <div className="details-avatar">
                        {teacher.image ? (
                            <img src={teacher.image} alt={teacher.username} />
                        ) : (
                            <div className="details-avatar-placeholder">
                                {teacher.username.slice(0, 2).toUpperCase()}
                            </div>
                        )}
                    </div>
                    <div className="details-header-content">
                        <div className="details-title">
                            <h1>{teacher.firstName} {teacher.lastName}</h1>
                            <p className="details-subtitle">@{teacher.username}</p>
                            <span className="badge badge-primary" style={{ marginTop: '0.5rem', display: 'inline-block', padding: '0.25rem 0.5rem', background: '#e0e7ff', color: '#4338ca', borderRadius: '4px', fontSize: '0.875rem' }}>
                                {teacher.department}
                            </span>
                        </div>
                        <div className="details-actions">
                            <button
                                onClick={handleEditToggle}
                                className={`btn ${isEditing ? 'btn-secondary' : 'btn-primary'}`}
                            >
                                {isEditing ? 'Cancel' : 'Edit Teacher'}
                            </button>
                        </div>
                    </div>
                </div>

                <div className="details-body">
                    {saveError && (
                        <div style={{ marginBottom: '1.5rem' }}>
                            <ErrorMessage message={saveError} title="Save Failed" />
                        </div>
                    )}

                    {isEditing ? (
                        <div className="edit-form">
                            <div className="form-grid">
                                <div className="form-group">
                                    <label>First Name</label>
                                    <input
                                        name="firstName"
                                        value={editForm.firstName || ''}
                                        onChange={handleInputChange}
                                        className="form-input"
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Last Name</label>
                                    <input
                                        name="lastName"
                                        value={editForm.lastName || ''}
                                        onChange={handleInputChange}
                                        className="form-input"
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Email</label>
                                    <input
                                        name="email"
                                        value={editForm.email || ''}
                                        onChange={handleInputChange}
                                        className="form-input"
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Phone Details</label>
                                    <input
                                        name="phoneNumber"
                                        value={editForm.phoneNumber || ''}
                                        onChange={handleInputChange}
                                        className="form-input"
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Department</label>
                                    <input
                                        name="department"
                                        value={editForm.department || ''}
                                        onChange={handleInputChange}
                                        className="form-input"
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Image URL</label>
                                    <input
                                        name="image"
                                        value={editForm.image || ''}
                                        onChange={handleInputChange}
                                        className="form-input"
                                        placeholder="https://"
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label>Biography</label>
                                <textarea
                                    name="bio"
                                    value={editForm.bio || ''}
                                    onChange={handleInputChange}
                                    className="form-input"
                                    rows={4}
                                />
                            </div>

                            <div className="form-group">
                                <label>New Password (Optional)</label>
                                <input
                                    name="password"
                                    type="password"
                                    onChange={handleInputChange}
                                    className="form-input"
                                    placeholder="Enter new password to change it"
                                />
                                <small className="form-info">Leave blank to keep current password</small>
                            </div>

                            <div className="form-actions">
                                <Button
                                    onClick={handleSave}
                                    disabled={saving}
                                    style={{ marginTop: '1rem' }}
                                >
                                    {saving ? 'Saving...' : 'Save Changes'}
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <>
                            <div className="details-section">
                                <h2>Contact Information</h2>
                                <div className="info-row">
                                    <span className="info-label">Email:</span>
                                    <span className="info-value">{teacher.email}</span>
                                </div>
                                <div className="info-row">
                                    <span className="info-label">Phone:</span>
                                    <span className="info-value">{teacher.phoneNumber}</span>
                                </div>
                            </div>

                            {teacher.bio && (
                                <div className="details-section">
                                    <h2>Biography</h2>
                                    <p>{teacher.bio}</p>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    )
}
