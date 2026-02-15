import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { fetchAllTeachers, Teacher } from '../api/teacher'
import ErrorMessage from '../components/ErrorMessage'
import './StudentsPage.css' // Reuse styles for now

export const TeachersPage: React.FC = () => {
    const [teachers, setTeachers] = useState<Teacher[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [searchQuery, setSearchQuery] = useState('')

    useEffect(() => {
        loadTeachers()
    }, [])

    const loadTeachers = () => {
        setLoading(true)
        setError(null)
        fetchAllTeachers()
            .then(data => {
                setTeachers(data)
            })
            .catch((err) => {
                const message = err instanceof Error ? err.message : 'Failed to load teachers'
                setError(message)
            })
            .finally(() => setLoading(false))
    }

    const filteredTeachers = teachers.filter(teacher => {
        const fName = (teacher.firstName || '').toLowerCase()
        const lName = (teacher.lastName || '').toLowerCase()
        // Support both username and userName from backend DTO
        const uName = (teacher.username || (teacher as any).userName || '').toLowerCase()
        const query = searchQuery.toLowerCase()

        return fName.includes(query) || lName.includes(query) || uName.includes(query)
    })

    if (loading) return <div className="p-4">Loading teachers...</div>
    if (error) return (
        <div className="p-4">
            <ErrorMessage
                message={error}
                onRetry={loadTeachers}
                title="Failed to Load Teachers"
            />
        </div>
    )

    return (
        <div className="students-page">
            <h1 className="page-title">Teachers</h1>

            {/* Search bar */}
            <div className="search-container">
                <span className="search-icon">🔍</span>
                <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search teachers by name..."
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

            {filteredTeachers.length === 0 ? (
                <div className="no-results">
                    <p>No teachers found match your search.</p>
                </div>
            ) : (
                <div className="students-grid">
                    {filteredTeachers.map((teacher: Teacher) => {
                        // Use already normalized username (api layer ensures this is at least String(id))
                        const uName = teacher.username;
                        const fName = teacher.firstName || 'Unknown';
                        const lName = teacher.lastName || '';

                        // Use original case to improve direct endpoint hit rates
                        const linkUsername = uName;

                        return (
                            <Link to={`/teachers/${linkUsername}`} key={teacher.id} className="student-card-link">
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
                                        <p className="student-username">ID: {teacher.id}</p>
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
