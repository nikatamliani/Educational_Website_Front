import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { fetchCourseById, unenrollFromCourse, type Course } from '../api/courses'
import { fetchLessonsByCourse, type LessonDto } from '../api/lessons'
import { request } from '../api/client'
import { Button } from '../components/Button'

interface AssignmentDto {
    id: number
    courseId: number
    title: string
    description: string
    deadline: string
}

interface QuizDto {
    id: number
    courseId: number
    title: string
    startDate: string
    endDate: string
    quizQuestionDtos: { id: number }[]
}

function authHeaders(): Record<string, string> {
    const token = localStorage.getItem('authToken')
    return token ? { Authorization: `Bearer ${token}` } : {}
}

export function EnrolledCoursePage() {
    const { id } = useParams<{ id: string }>()
    const navigate = useNavigate()

    const [course, setCourse] = useState<Course | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const [lessons, setLessons] = useState<LessonDto[]>([])
    const [assignments, setAssignments] = useState<AssignmentDto[]>([])
    const [quizzes, setQuizzes] = useState<QuizDto[]>([])
    const [expandedLesson, setExpandedLesson] = useState<number | null>(null)
    const [unenrolling, setUnenrolling] = useState(false)

    useEffect(() => {
        let isMounted = true

        async function loadData() {
            if (!id) return
            const courseId = parseInt(id, 10)
            if (isNaN(courseId)) { setError('Invalid course ID'); setLoading(false); return }

            try {
                setLoading(true)
                const [courseData, lessonData, assignmentData, quizData] = await Promise.all([
                    fetchCourseById(courseId),
                    fetchLessonsByCourse(courseId),
                    request<AssignmentDto[]>(`/api/assignment/course/${courseId}`, { method: 'GET', headers: authHeaders() }),
                    request<QuizDto[]>(`/api/quiz/course/${courseId}`, { method: 'GET', headers: authHeaders() }),
                ])

                if (isMounted) {
                    setCourse(courseData)
                    setLessons(lessonData)
                    setAssignments(assignmentData)
                    setQuizzes(quizData)
                }
            } catch (err) {
                if (isMounted) setError(err instanceof Error ? err.message : 'Failed to load course.')
            } finally {
                if (isMounted) setLoading(false)
            }
        }

        loadData()
        return () => { isMounted = false }
    }, [id])

    // ESC key → back to My Courses
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') navigate('/my-courses')
        }
        window.addEventListener('keydown', onKey)
        return () => window.removeEventListener('keydown', onKey)
    }, [navigate])

    const handleUnenroll = async () => {
        if (!course) return
        if (!window.confirm('Are you sure you want to unenroll from this course?')) return

        try {
            setUnenrolling(true)
            await unenrollFromCourse(course.id)
            navigate('/my-courses')
        } catch {
            alert('Failed to unenroll. Please try again.')
        } finally {
            setUnenrolling(false)
        }
    }

    const formatDate = (date: string | null) => {
        if (!date) return '—'
        return new Date(date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
    }

    const formatDateTime = (date: string | null) => {
        if (!date) return '—'
        return new Date(date).toLocaleString(undefined, {
            month: 'short', day: 'numeric', year: 'numeric',
            hour: '2-digit', minute: '2-digit',
        })
    }

    if (loading) return <div className="page-container"><div className="courses-message">Loading...</div></div>
    if (error || !course) return <div className="page-container"><div className="courses-message courses-message-error">{error || 'Course not found'}</div></div>

    return (
        <div className="page-container">
            <Button
                onClick={() => navigate('/my-courses')}
                variant="ghost"
                style={{ paddingLeft: 0, marginTop: '2rem' }}
            >
                ← My Courses
            </Button>

            {/* Header row */}
            <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem',
            }}>
                <h1 style={{ fontSize: '2.2rem', fontWeight: 700, margin: 0 }}>{course.title}</h1>
                <Button
                    variant="outline"
                    onClick={handleUnenroll}
                    disabled={unenrolling}
                    style={{ borderColor: 'rgba(239, 68, 68, 0.5)', color: '#fca5a5' }}
                >
                    {unenrolling ? 'Unenrolling…' : 'Unenroll'}
                </Button>
            </div>

            {/* ── Lessons ──────────────────────────────────────── */}
            <section style={{ marginBottom: '2.5rem' }}>
                <h2 style={{ fontSize: '1.4rem', marginBottom: '1rem', color: '#e5e7eb' }}>
                    📚 Lessons
                    <span style={{ fontSize: '0.85rem', color: '#9ca3af', marginLeft: '0.5rem' }}>
                        ({lessons.length})
                    </span>
                </h2>
                {lessons.length === 0 ? (
                    <p style={{ color: '#9ca3af', fontSize: '0.9rem' }}>No lessons available yet.</p>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {lessons.map((lesson) => {
                            const isExpanded = expandedLesson === lesson.id
                            return (
                                <div
                                    key={lesson.id}
                                    style={{
                                        background: 'rgba(30, 41, 59, 0.6)',
                                        border: '1px solid rgba(148, 163, 184, 0.15)',
                                        borderRadius: '0.75rem',
                                        overflow: 'hidden',
                                        transition: 'border-color 0.2s',
                                        borderColor: isExpanded ? 'rgba(59, 130, 246, 0.4)' : 'rgba(148, 163, 184, 0.15)',
                                    }}
                                >
                                    <button
                                        onClick={() => setExpandedLesson(isExpanded ? null : lesson.id)}
                                        style={{
                                            width: '100%', textAlign: 'left', padding: '1rem 1.25rem',
                                            background: 'none', border: 'none', color: '#e5e7eb',
                                            cursor: 'pointer', display: 'flex', alignItems: 'center',
                                            justifyContent: 'space-between', fontSize: '1rem', fontWeight: 500,
                                        }}
                                    >
                                        <span>{lesson.title}</span>
                                        <span style={{
                                            transform: isExpanded ? 'rotate(180deg)' : 'rotate(0)',
                                            transition: 'transform 0.2s', fontSize: '0.8rem', color: '#9ca3af',
                                        }}>
                                            ▼
                                        </span>
                                    </button>

                                    {isExpanded && (
                                        <div style={{
                                            padding: '0 1.25rem 1.25rem',
                                            borderTop: '1px solid rgba(148, 163, 184, 0.1)',
                                        }}>
                                            {lesson.content && (
                                                <p style={{
                                                    color: '#d1d5db', lineHeight: '1.7', whiteSpace: 'pre-line',
                                                    marginTop: '1rem', marginBottom: '1rem', fontSize: '0.95rem',
                                                }}>
                                                    {lesson.content}
                                                </p>
                                            )}
                                            <div style={{
                                                display: 'flex', gap: '1.5rem', flexWrap: 'wrap',
                                                fontSize: '0.85rem', color: '#9ca3af',
                                            }}>
                                                {lesson.startDate && <span>Start: {formatDateTime(lesson.startDate)}</span>}
                                                {lesson.endDate && <span>End: {formatDateTime(lesson.endDate)}</span>}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                )}
            </section>

            {/* ── Assignments ──────────────────────────────────── */}
            <section style={{ marginBottom: '2.5rem' }}>
                <h2 style={{ fontSize: '1.4rem', marginBottom: '1rem', color: '#e5e7eb' }}>
                    📝 Assignments
                    <span style={{ fontSize: '0.85rem', color: '#9ca3af', marginLeft: '0.5rem' }}>
                        ({assignments.length})
                    </span>
                </h2>
                {assignments.length === 0 ? (
                    <p style={{ color: '#9ca3af', fontSize: '0.9rem' }}>No assignments available yet.</p>
                ) : (
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                        gap: '1rem',
                    }}>
                        {assignments.map((a) => (
                            <div
                                key={a.id}
                                onClick={() => navigate(`/assignment/${a.id}`, { state: { fromCourseId: course.id } })}
                                style={{
                                    background: 'rgba(30, 41, 59, 0.6)',
                                    border: '1px solid rgba(148, 163, 184, 0.15)',
                                    borderLeft: '3px solid #f59e0b',
                                    borderRadius: '0.75rem',
                                    padding: '1rem 1.25rem',
                                    cursor: 'pointer',
                                    transition: 'border-color 0.2s, transform 0.15s',
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.borderColor = 'rgba(245, 158, 11, 0.5)'
                                    e.currentTarget.style.transform = 'translateY(-2px)'
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.borderColor = 'rgba(148, 163, 184, 0.15)'
                                    e.currentTarget.style.borderLeftColor = '#f59e0b'
                                    e.currentTarget.style.transform = 'translateY(0)'
                                }}
                            >
                                <h3 style={{ margin: '0 0 0.5rem', fontSize: '1rem', fontWeight: 600, color: '#e5e7eb' }}>
                                    {a.title}
                                </h3>
                                <p style={{ margin: 0, fontSize: '0.85rem', color: '#9ca3af' }}>
                                    Due: {formatDate(a.deadline)}
                                </p>
                            </div>
                        ))}
                    </div>
                )}
            </section>

            {/* ── Quizzes ─────────────────────────────────────── */}
            <section style={{ marginBottom: '2.5rem' }}>
                <h2 style={{ fontSize: '1.4rem', marginBottom: '1rem', color: '#e5e7eb' }}>
                    🧩 Quizzes
                    <span style={{ fontSize: '0.85rem', color: '#9ca3af', marginLeft: '0.5rem' }}>
                        ({quizzes.length})
                    </span>
                </h2>
                {quizzes.length === 0 ? (
                    <p style={{ color: '#9ca3af', fontSize: '0.9rem' }}>No quizzes available yet.</p>
                ) : (
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                        gap: '1rem',
                    }}>
                        {quizzes.map((q) => (
                            <div
                                key={q.id}
                                onClick={() => navigate(`/quiz/${q.id}`, { state: { fromCourseId: course.id } })}
                                style={{
                                    background: 'rgba(30, 41, 59, 0.6)',
                                    border: '1px solid rgba(148, 163, 184, 0.15)',
                                    borderLeft: '3px solid #8b5cf6',
                                    borderRadius: '0.75rem',
                                    padding: '1rem 1.25rem',
                                    cursor: 'pointer',
                                    transition: 'border-color 0.2s, transform 0.15s',
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.borderColor = 'rgba(139, 92, 246, 0.5)'
                                    e.currentTarget.style.transform = 'translateY(-2px)'
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.borderColor = 'rgba(148, 163, 184, 0.15)'
                                    e.currentTarget.style.borderLeftColor = '#8b5cf6'
                                    e.currentTarget.style.transform = 'translateY(0)'
                                }}
                            >
                                <h3 style={{ margin: '0 0 0.5rem', fontSize: '1rem', fontWeight: 600, color: '#e5e7eb' }}>
                                    {q.title}
                                </h3>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#9ca3af' }}>
                                    <span>{q.quizQuestionDtos?.length ?? 0} questions</span>
                                    <span>Due: {formatDate(q.endDate)}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </section>
        </div>
    )
}
