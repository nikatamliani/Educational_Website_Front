import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { fetchCourseById, type Course } from '../api/courses'
import { request } from '../api/client'
import { Button } from '../components/Button'

// ── Minimal DTO shapes ──────────────────────────────────────────────

interface AssignmentDto {
    id: number
    courseId: number
    title: string
    description: string
    deadline: string
}

interface AssignmentResultDto {
    assignmentId: number
    studentId: number
    grade: number | null
    feedback: string | null
    assignmentTitle: string | null
    courseName: string | null
}

interface QuizDto {
    id: number
    courseId: number
    title: string
    startDate: string
    endDate: string
    quizQuestionDtos: { id: number }[]
}

interface QuizSubmissionDto {
    id: number
    quizId: number
    score: number | null
    submittedAt: string
}

// ── Graded items ────────────────────────────────────────────────────

interface AssignmentGrade {
    id: number
    title: string
    deadline: string
    grade: number | null
    feedback: string | null
}

interface QuizGrade {
    id: number
    title: string
    totalQuestions: number
    score: number | null
}

function authHeaders(): Record<string, string> {
    const token = localStorage.getItem('authToken')
    return token ? { Authorization: `Bearer ${token}` } : {}
}

export function CourseGradesPage() {
    const { id } = useParams<{ id: string }>()
    const navigate = useNavigate()

    const [course, setCourse] = useState<Course | null>(null)
    const [assignmentGrades, setAssignmentGrades] = useState<AssignmentGrade[]>([])
    const [quizGrades, setQuizGrades] = useState<QuizGrade[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        let isMounted = true

        async function load() {
            if (!id) return
            const courseId = parseInt(id, 10)
            if (isNaN(courseId)) { setError('Invalid course ID'); setLoading(false); return }

            try {
                setLoading(true)

                const [courseData, assignments, quizzes] = await Promise.all([
                    fetchCourseById(courseId),
                    request<AssignmentDto[]>(`/api/assignment/course/${courseId}`, { method: 'GET', headers: authHeaders() }),
                    request<QuizDto[]>(`/api/quiz/course/${courseId}`, { method: 'GET', headers: authHeaders() }),
                ])

                // Fetch results for each assignment (my-result returns 404 if no result yet)
                const aGrades: AssignmentGrade[] = await Promise.all(
                    assignments.map(async (a) => {
                        try {
                            const result = await request<AssignmentResultDto>(
                                `/api/assignment/my-result/${a.id}`,
                                { method: 'GET', headers: authHeaders() }
                            )
                            return { id: a.id, title: a.title, deadline: a.deadline, grade: result.grade, feedback: result.feedback }
                        } catch {
                            return { id: a.id, title: a.title, deadline: a.deadline, grade: null, feedback: null }
                        }
                    })
                )

                // Fetch submissions for each quiz
                const qGrades: QuizGrade[] = await Promise.all(
                    quizzes.map(async (q) => {
                        try {
                            const sub = await request<QuizSubmissionDto>(
                                `/api/quiz/${q.id}/my-submission`,
                                { method: 'GET', headers: authHeaders() }
                            )
                            return { id: q.id, title: q.title, totalQuestions: q.quizQuestionDtos?.length ?? 0, score: sub.score }
                        } catch {
                            return { id: q.id, title: q.title, totalQuestions: q.quizQuestionDtos?.length ?? 0, score: null }
                        }
                    })
                )

                if (isMounted) {
                    setCourse(courseData)
                    setAssignmentGrades(aGrades)
                    setQuizGrades(qGrades)
                }
            } catch (err) {
                if (isMounted) setError(err instanceof Error ? err.message : 'Failed to load grades.')
            } finally {
                if (isMounted) setLoading(false)
            }
        }

        load()
        return () => { isMounted = false }
    }, [id])

    // ESC → back
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') navigate('/grades') }
        window.addEventListener('keydown', onKey)
        return () => window.removeEventListener('keydown', onKey)
    }, [navigate])

    // ── Totals ──────────────────────────────────────────────────────
    const gradedAssignments = assignmentGrades.filter((a) => a.grade !== null)
    const totalAssignmentScore = gradedAssignments.reduce((sum, a) => sum + (a.grade ?? 0), 0)

    const gradedQuizzes = quizGrades.filter((q) => q.score !== null)
    const totalQuizScore = gradedQuizzes.reduce((sum, q) => sum + (q.score ?? 0), 0)
    const totalQuizMax = gradedQuizzes.reduce((sum, q) => sum + q.totalQuestions, 0)

    if (loading) return <div className="page-container"><div className="courses-message">Loading grades…</div></div>
    if (error || !course) return <div className="page-container"><div className="courses-message courses-message-error">{error || 'Course not found'}</div></div>

    return (
        <div className="page-container">
            <Button
                onClick={() => navigate('/grades')}
                variant="ghost"
                style={{ paddingLeft: 0, marginTop: '2rem' }}
            >
                ← All Courses
            </Button>

            <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '0.5rem' }}>{course.title}</h1>
            <p style={{ color: '#9ca3af', marginBottom: '2rem', fontSize: '1rem' }}>Grade overview</p>

            {/* ── Summary cards ────────────────────────────────── */}
            <div style={{
                display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: '1rem', marginBottom: '2.5rem',
            }}>
                {/* Assignment total */}
                <div style={{
                    background: 'rgba(30, 41, 59, 0.6)', border: '1px solid rgba(148, 163, 184, 0.15)',
                    borderRadius: '1rem', padding: '1.25rem',
                }}>
                    <p style={{ margin: 0, fontSize: '0.85rem', color: '#9ca3af' }}>Assignments Graded</p>
                    <p style={{ margin: '0.25rem 0 0', fontSize: '1.8rem', fontWeight: 700, color: '#f59e0b' }}>
                        {gradedAssignments.length}<span style={{ fontSize: '1rem', color: '#9ca3af' }}>/{assignmentGrades.length}</span>
                    </p>
                    {gradedAssignments.length > 0 && (
                        <p style={{ margin: '0.25rem 0 0', fontSize: '0.9rem', color: '#d1d5db' }}>
                            Total: {totalAssignmentScore.toFixed(1)} pts
                        </p>
                    )}
                </div>

                {/* Quiz total */}
                <div style={{
                    background: 'rgba(30, 41, 59, 0.6)', border: '1px solid rgba(148, 163, 184, 0.15)',
                    borderRadius: '1rem', padding: '1.25rem',
                }}>
                    <p style={{ margin: 0, fontSize: '0.85rem', color: '#9ca3af' }}>Quizzes Completed</p>
                    <p style={{ margin: '0.25rem 0 0', fontSize: '1.8rem', fontWeight: 700, color: '#8b5cf6' }}>
                        {gradedQuizzes.length}<span style={{ fontSize: '1rem', color: '#9ca3af' }}>/{quizGrades.length}</span>
                    </p>
                    {gradedQuizzes.length > 0 && (
                        <p style={{ margin: '0.25rem 0 0', fontSize: '0.9rem', color: '#d1d5db' }}>
                            Total: {totalQuizScore}/{totalQuizMax}
                        </p>
                    )}
                </div>
            </div>

            {/* ── Assignment grades ───────────────────────────── */}
            <section style={{ marginBottom: '2.5rem' }}>
                <h2 style={{ fontSize: '1.3rem', marginBottom: '1rem', color: '#e5e7eb' }}>
                    📝 Assignment Scores
                </h2>
                {assignmentGrades.length === 0 ? (
                    <p style={{ color: '#9ca3af', fontSize: '0.9rem' }}>No assignments in this course.</p>
                ) : (
                    <div style={{
                        background: 'rgba(30, 41, 59, 0.5)', border: '1px solid rgba(148, 163, 184, 0.12)',
                        borderRadius: '0.75rem', overflow: 'hidden',
                    }}>
                        {/* Table header */}
                        <div style={{
                            display: 'grid', gridTemplateColumns: '1fr 120px 120px',
                            padding: '0.75rem 1.25rem', fontSize: '0.8rem', color: '#9ca3af',
                            borderBottom: '1px solid rgba(148, 163, 184, 0.1)',
                            fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em',
                        }}>
                            <span>Assignment</span>
                            <span style={{ textAlign: 'center' }}>Due Date</span>
                            <span style={{ textAlign: 'right' }}>Grade</span>
                        </div>

                        {assignmentGrades.map((a, i) => (
                            <div
                                key={a.id}
                                style={{
                                    display: 'grid', gridTemplateColumns: '1fr 120px 120px',
                                    padding: '0.85rem 1.25rem', alignItems: 'center',
                                    borderBottom: i < assignmentGrades.length - 1 ? '1px solid rgba(148, 163, 184, 0.06)' : 'none',
                                }}
                            >
                                <span style={{ color: '#e5e7eb', fontSize: '0.95rem' }}>{a.title}</span>
                                <span style={{ textAlign: 'center', color: '#9ca3af', fontSize: '0.85rem' }}>
                                    {new Date(a.deadline).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                </span>
                                <span style={{ textAlign: 'right' }}>
                                    {a.grade !== null ? (
                                        <span style={{
                                            padding: '0.2rem 0.6rem', borderRadius: '9999px',
                                            backgroundColor: 'rgba(245, 158, 11, 0.15)',
                                            color: '#fcd34d', fontSize: '0.9rem', fontWeight: 600,
                                            border: '1px solid rgba(245, 158, 11, 0.3)',
                                        }}>
                                            {a.grade}
                                        </span>
                                    ) : (
                                        <span style={{ color: '#6b7280', fontSize: '0.85rem' }}>—</span>
                                    )}
                                </span>
                            </div>
                        ))}
                    </div>
                )}
            </section>

            {/* ── Quiz grades ─────────────────────────────────── */}
            <section style={{ marginBottom: '2.5rem' }}>
                <h2 style={{ fontSize: '1.3rem', marginBottom: '1rem', color: '#e5e7eb' }}>
                    🧩 Quiz Scores
                </h2>
                {quizGrades.length === 0 ? (
                    <p style={{ color: '#9ca3af', fontSize: '0.9rem' }}>No quizzes in this course.</p>
                ) : (
                    <div style={{
                        background: 'rgba(30, 41, 59, 0.5)', border: '1px solid rgba(148, 163, 184, 0.12)',
                        borderRadius: '0.75rem', overflow: 'hidden',
                    }}>
                        {/* Table header */}
                        <div style={{
                            display: 'grid', gridTemplateColumns: '1fr 120px 120px',
                            padding: '0.75rem 1.25rem', fontSize: '0.8rem', color: '#9ca3af',
                            borderBottom: '1px solid rgba(148, 163, 184, 0.1)',
                            fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em',
                        }}>
                            <span>Quiz</span>
                            <span style={{ textAlign: 'center' }}>Questions</span>
                            <span style={{ textAlign: 'right' }}>Score</span>
                        </div>

                        {quizGrades.map((q, i) => (
                            <div
                                key={q.id}
                                style={{
                                    display: 'grid', gridTemplateColumns: '1fr 120px 120px',
                                    padding: '0.85rem 1.25rem', alignItems: 'center',
                                    borderBottom: i < quizGrades.length - 1 ? '1px solid rgba(148, 163, 184, 0.06)' : 'none',
                                }}
                            >
                                <span style={{ color: '#e5e7eb', fontSize: '0.95rem' }}>{q.title}</span>
                                <span style={{ textAlign: 'center', color: '#9ca3af', fontSize: '0.85rem' }}>
                                    {q.totalQuestions}
                                </span>
                                <span style={{ textAlign: 'right' }}>
                                    {q.score !== null ? (
                                        <span style={{
                                            padding: '0.2rem 0.6rem', borderRadius: '9999px',
                                            backgroundColor: q.score === q.totalQuestions
                                                ? 'rgba(16, 185, 129, 0.15)'
                                                : 'rgba(139, 92, 246, 0.15)',
                                            color: q.score === q.totalQuestions ? '#6ee7b7' : '#c4b5fd',
                                            fontSize: '0.9rem', fontWeight: 600,
                                            border: `1px solid ${q.score === q.totalQuestions
                                                ? 'rgba(16, 185, 129, 0.3)'
                                                : 'rgba(139, 92, 246, 0.3)'}`,
                                        }}>
                                            {q.score}/{q.totalQuestions}
                                        </span>
                                    ) : (
                                        <span style={{ color: '#6b7280', fontSize: '0.85rem' }}>—</span>
                                    )}
                                </span>
                            </div>
                        ))}
                    </div>
                )}
            </section>
        </div>
    )
}
