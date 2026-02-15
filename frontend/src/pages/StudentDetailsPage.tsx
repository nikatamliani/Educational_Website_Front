import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { fetchStudentByUsername, updateStudent, Student } from '../api/student'
import { Button } from '../components/Button'
// import { Input } from '../components/Input' 
import './StudentDetailsPage.css'

export const StudentDetailsPage: React.FC = () => {
    const { username } = useParams<{ username: string }>()
    const navigate = useNavigate()
    const [student, setStudent] = useState<Student | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    // Edit state
    const [isEditing, setIsEditing] = useState(false)
    const [editForm, setEditForm] = useState<Partial<Student>>({})
    const [saving, setSaving] = useState(false)
    const [saveError, setSaveError] = useState<string | null>(null)
    const [file, setFile] = useState<File | null>(null)

    useEffect(() => {
        loadStudent()
    }, [username])

    const loadStudent = () => {
        if (!username) return
        setLoading(true)
        fetchStudentByUsername(username)
            .then((s) => {
                if (!s) throw new Error('Student not found')
                setStudent(s)
                setEditForm(s) // Initialize form
            })
            .catch((err) => setError(err.message))
            .finally(() => setLoading(false))
    }

    const handleEditToggle = () => {
        setIsEditing(!isEditing)
        if (!isEditing && student) {
            setEditForm(student) // Reset form on open
            setSaveError(null)
            setFile(null)
        }
    }

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target
        setEditForm(prev => ({ ...prev, [name]: value }))
    }

    const handleSave = async () => {
        if (!student || !username) return

        setSaving(true)
        setSaveError(null)
        try {
            await updateStudent(username, editForm, file || undefined)
            // Refresh data
            const updated = { ...student, ...editForm } as Student
            setStudent(updated)
            setIsEditing(false)
        } catch (err: any) {
            setSaveError(`Failed to update student: ${err.message || 'Unknown error'}`)
            console.error('Update student failed:', err)
        } finally {
            setSaving(false)
        }
    }

    if (loading) return <div className="p-4">Loading student details...</div>
    if (error) return (
        <div className="p-4">
            <div className="text-error">{error}</div>
            <button onClick={() => navigate(-1)} className="btn btn-secondary mt-4">Go Back</button>
        </div>
    )
    if (!student) return null

    return (
        <div className="student-details-page">
            <button onClick={() => navigate(-1)} className="back-btn">← Back to Students</button>

            <div className="details-card">
                <div className="details-header">
                    <div className="details-avatar">
                        {student.image ? (
                            <img src={student.image} alt={student.username} />
                        ) : (
                            <div className="details-avatar-placeholder">
                                {student.username.slice(0, 2).toUpperCase()}
                            </div>
                        )}
                    </div>
                    <div className="details-header-content">
                        <div className="details-title">
                            <h1>{student.firstName} {student.lastName}</h1>
                            <p className="details-subtitle">@{student.username}</p>
                        </div>
                        <div className="details-actions">
                            <button
                                onClick={handleEditToggle}
                                className={`btn ${isEditing ? 'btn-secondary' : 'btn-primary'}`}
                            >
                                {isEditing ? 'Cancel' : 'Edit Student'}
                            </button>
                        </div>
                    </div>
                </div>

                <div className="details-body">
                    {saveError && <div className="alert alert-error">{saveError}</div>}

                    {isEditing ? (
                        <div className="edit-form">
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
                                <label>Profile Image</label>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => {
                                        if (e.target.files && e.target.files[0]) {
                                            setFile(e.target.files[0])
                                        }
                                    }}
                                    className="form-input"
                                />
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
                        <div className="view-mode">
                            <div className="details-section">
                                <h2>Contact Information</h2>
                                <div className="info-row">
                                    <span className="info-label">Email:</span>
                                    <span className="info-value">{student.email}</span>
                                </div>
                                <div className="info-row">
                                    <span className="info-label">Phone:</span>
                                    <span className="info-value">{student.phoneNumber}</span>
                                </div>
                            </div>

                            <div className="details-section">
                                <h2>Account Information</h2>
                                <div className="info-row">
                                    <span className="info-label">User ID:</span>
                                    <span className="info-value">{student.id}</span>
                                </div>
                                <div className="info-row">
                                    <span className="info-label">Username:</span>
                                    <span className="info-value">{student.username}</span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
