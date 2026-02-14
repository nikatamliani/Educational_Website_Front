import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { fetchAllStudents, Student } from '../api/student'
import './StudentsPage.css'

export const StudentsPage: React.FC = () => {
    const [students, setStudents] = useState<Student[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        fetchAllStudents()
            .then(setStudents)
            .catch(() => setError('Failed to load students'))
            .finally(() => setLoading(false))
    }, [])

    if (loading) return <div className="p-4">Loading students...</div>
    if (error) return <div className="p-4 text-error">{error}</div>

    return (
        <div className="students-page">
            <h1 className="page-title">Students</h1>
            <div className="students-grid">
                {students.map((student) => (
                    <Link to={`/students/${student.username}`} key={student.id} className="student-card-link">
                        <div className="student-card">
                            <div className="student-avatar">
                                {student.image ? (
                                    <img src={student.image} alt={student.username} />
                                ) : (
                                    <div className="avatar-placeholder">
                                        {student.username.slice(0, 2).toUpperCase()}
                                    </div>
                                )}
                            </div>
                            <div className="student-info">
                                <h3>{student.firstName} {student.lastName}</h3>
                                <p className="student-username">@{student.username}</p>
                                <p className="student-email">{student.email}</p>
                            </div>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    )
}
