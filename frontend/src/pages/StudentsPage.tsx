import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { fetchAllStudents, Student } from '../api/student'
import ErrorMessage from '../components/ErrorMessage'
import './StudentsPage.css'

export const StudentsPage: React.FC = () => {
    const [students, setStudents] = useState<Student[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [searchQuery, setSearchQuery] = useState('')

    useEffect(() => {
        loadStudents()
    }, [])

    const loadStudents = () => {
        setLoading(true)
        setError(null)
        fetchAllStudents()
            .then(setStudents)
            .catch((err) => {
                const message = err instanceof Error ? err.message : 'Failed to load students'
                setError(message)
            })
            .finally(() => setLoading(false))
    }

    const filteredStudents = students.filter(student => {
        const fName = (student.firstName || '').toLowerCase()
        const lName = (student.lastName || '').toLowerCase()
        // Support both username and userName from backend DTO
        const uName = (student.username || (student as any).userName || '').toLowerCase()
        const query = searchQuery.toLowerCase()

        return fName.includes(query) || lName.includes(query) || uName.includes(query)
    })

    if (loading) return <div className="p-4">Loading students...</div>
    if (error) return (
        <div className="p-4">
            <ErrorMessage
                message={error}
                onRetry={loadStudents}
                title="Failed to Load Students"
            />
        </div>
    )

    return (
        <div className="students-page">
            <h1 className="page-title">Students</h1>

            {/* Search bar */}
            <div className="search-container">
                <span className="search-icon">🔍</span>
                <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search students by name..."
                    className="search-input"
                />
                {searchQuery && (
                    <button
                        onClick={() => setSearchQuery('')}
                        className="clear-search"
                        title="Clear search"
                    >
                        ✕
                    </button>
                )}
            </div>

            <div className="students-grid">
                {filteredStudents.length > 0 ? (
                    filteredStudents.map((student: Student) => {
                        // Use already normalized username (api layer ensures this is at least String(id))
                        const uName = student.username
                        const fName = student.firstName || 'Unknown'
                        const lName = student.lastName || ''

                        // Use original case to improve direct endpoint hit rates
                        const linkUsername = uName;

                        return (
                            <Link to={`/students/${linkUsername}`} key={student.id} className="student-card-link">
                                <div className="student-card">
                                    <div className="student-avatar">
                                        {student.image ? (
                                            <img src={student.image} alt={uName} />
                                        ) : (
                                            <div className="avatar-placeholder">
                                                {uName.slice(0, 2).toUpperCase()}
                                            </div>
                                        )}
                                    </div>
                                    <div className="student-info">
                                        <h3>{fName} {lName}</h3>
                                        <p className="student-username">username: {uName}</p>
                                    </div>
                                </div>
                            </Link>
                        )
                    })
                ) : (
                    <div className="no-results">No students match your search.</div>
                )}
            </div>
        </div>
    )
}
