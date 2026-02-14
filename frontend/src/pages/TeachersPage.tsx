import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { fetchAllTeachers, Teacher } from '../api/teacher'
import './StudentsPage.css' // Reuse styles for now

export const TeachersPage: React.FC = () => {
    const [teachers, setTeachers] = useState<Teacher[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        fetchAllTeachers()
            .then(data => {
                console.log('Teachers list data:', data)
                setTeachers(data)
            })
            .catch(() => setError('Failed to load teachers'))
            .finally(() => setLoading(false))
    }, [])

    if (loading) return <div className="p-4">Loading teachers...</div>
    if (error) return <div className="p-4 text-error">{error}</div>

    return (
        <div className="students-page">
            <h1 className="page-title">Teachers</h1>
            {teachers.length === 0 ? (
                <div className="empty-state">
                    <p>No teachers found.</p>
                </div>
            ) : (
                <div className="students-grid">
                    {teachers.map((teacher: any) => {
                        const uName = teacher.username || teacher.userName || 'unknown';
                        const fName = teacher.firstName || 'Unknown';
                        const lName = teacher.lastName || '';

                        return (
                            <Link to={`/teachers/${uName}`} key={teacher.id} className="student-card-link">
                                <div className="student-card">
                                    <div className="student-avatar">
                                        {teacher.image ? (
                                            <img src={teacher.image} alt={uName} />
                                        ) : (
                                            <div className="avatar-placeholder">
                                                {uName.slice(0, 2).toUpperCase()}
                                            </div>
                                        )}
                                    </div>
                                    <div className="student-info">
                                        <h3>{fName} {lName}</h3>
                                        <p className="student-username">@{uName}</p>
                                        <p className="student-email">{teacher.email || 'No email'}</p>
                                        <p className="student-email" style={{ marginTop: '0.5rem', color: 'var(--primary-color)' }}>{teacher.department || 'No department'}</p>
                                    </div>
                                </div>
                            </Link>
                        );
                    })}
                </div>
            )}
        </div>
    )
}
