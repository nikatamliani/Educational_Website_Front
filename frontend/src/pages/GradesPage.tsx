import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { fetchMyCourses, type Course } from '../api/courses'
import { useAuth } from '../context/AuthContext'

export function GradesPage() {
    const navigate = useNavigate()
    const { user } = useAuth()
    const isTeacher = user?.role === 'teacher'

    const [courses, setCourses] = useState<Course[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        let isMounted = true
        async function load() {
            try {
                setLoading(true)
                const data = await fetchMyCourses()
                if (isMounted) setCourses(data)
            } catch (err) {
                if (isMounted) setError(err instanceof Error ? err.message : 'Failed to load courses.')
            } finally {
                if (isMounted) setLoading(false)
            }
        }
        load()
        return () => { isMounted = false }
    }, [])

    if (isTeacher) {
        return (
            <div className="page-container">
                <h1 className="page-title">Grades</h1>
                <p className="page-description">Grade tracking is only available for students.</p>
            </div>
        )
    }

    return (
        <div className="width-full">
            <h1 className="page-title">My Grades</h1>
            <p className="page-description">
                Select a course to view your assignment and quiz scores.
            </p>

            {loading && <div className="courses-message">Loading courses…</div>}
            {error && !loading && <div className="courses-message courses-message-error">{error}</div>}
            {!loading && !error && courses.length === 0 && (
                <div className="courses-message">You are not enrolled in any courses.</div>
            )}

            {!loading && !error && courses.length > 0 && (
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                    gap: '1rem',
                }}>
                    {courses.map((course) => (
                        <div
                            key={course.id}
                            onClick={() => navigate(`/grades/${course.id}`)}
                            style={{
                                background: 'rgba(30, 41, 59, 0.6)',
                                border: '1px solid rgba(148, 163, 184, 0.15)',
                                borderRadius: '1rem',
                                padding: '1.5rem',
                                cursor: 'pointer',
                                transition: 'border-color 0.2s, transform 0.15s',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '1rem',
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.5)'
                                e.currentTarget.style.transform = 'translateY(-2px)'
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.borderColor = 'rgba(148, 163, 184, 0.15)'
                                e.currentTarget.style.transform = 'translateY(0)'
                            }}
                        >
                            <span style={{
                                width: '3rem', height: '3rem', borderRadius: '0.75rem',
                                background: 'linear-gradient(135deg, #3b82f6, #6366f1)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: '1.2rem', flexShrink: 0,
                            }}>
                                📊
                            </span>
                            <div>
                                <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 600, color: '#e5e7eb' }}>
                                    {course.title}
                                </h3>
                                <p style={{ margin: '0.25rem 0 0', fontSize: '0.85rem', color: '#9ca3af' }}>
                                    View assignment & quiz scores →
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
