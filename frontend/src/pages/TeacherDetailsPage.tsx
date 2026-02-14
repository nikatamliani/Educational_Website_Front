import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { fetchTeacherByUsername, Teacher } from '../api/teacher'
import './StudentDetailsPage.css' // Reuse styles

export const TeacherDetailsPage: React.FC = () => {
    const { username } = useParams<{ username: string }>()
    const navigate = useNavigate()
    const [teacher, setTeacher] = useState<Teacher | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        if (!username) return

        fetchTeacherByUsername(username)
            .then((t) => {
                console.log('Fetched teacher details:', t)
                if (!t) throw new Error('Teacher not found')
                setTeacher(t)
            })
            .catch((err) => setError(err.message))
            .finally(() => setLoading(false))
    }, [username])

    if (loading) return <div className="p-4">Loading teacher details...</div>
    if (error) return (
        <div className="p-4">
            <div className="text-error">{error}</div>
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
                    <div className="details-title">
                        <h1>{teacher.firstName} {teacher.lastName}</h1>
                        <p className="details-subtitle">@{teacher.username}</p>
                        <span className="badge badge-primary" style={{ marginTop: '0.5rem', display: 'inline-block', padding: '0.25rem 0.5rem', background: '#e0e7ff', color: '#4338ca', borderRadius: '4px', fontSize: '0.875rem' }}>
                            {teacher.department}
                        </span>
                    </div>
                </div>

                <div className="details-body">
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

                    {/* Add more sections as needed, e.g., Courses Taught */}
                </div>
            </div>
        </div>
    )
}
