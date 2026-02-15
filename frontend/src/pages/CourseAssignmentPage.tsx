import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
    fetchTeacherSubmissions,
    fetchTeacherResults,
    fetchAssignmentsByCourseId,
    saveAssignmentResult,
    type CourseAssignment,
    type AssignmentSubmissionResponse,
    type AssignmentResultResponse,
} from '../api/assignments'
import { Button } from '../components/Button'
import { useAuth } from '../context/AuthContext'

type Tab = 'not_graded' | 'graded'

function studentFullName(firstName: string | null, lastName: string | null, fallback: string) {
    const name = [firstName, lastName].filter(Boolean).join(' ')
    return name || fallback
}

export function CourseAssignmentPage() {
    const { courseId, assignmentId } = useParams<{ courseId: string; assignmentId: string }>()
    const navigate = useNavigate()
    const { user } = useAuth()
    const isTeacher = user?.role === 'teacher'

    const [assignment, setAssignment] = useState<CourseAssignment | null>(null)
    const [submissions, setSubmissions] = useState<AssignmentSubmissionResponse[]>([])
    const [results, setResults] = useState<AssignmentResultResponse[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [tab, setTab] = useState<Tab>('not_graded')

    // Grading modal state
    const [gradingSubmission, setGradingSubmission] = useState<AssignmentSubmissionResponse | null>(null)
    const [gradeValue, setGradeValue] = useState('')
    const [feedbackValue, setFeedbackValue] = useState('')
    const [submitting, setSubmitting] = useState(false)
    const [gradeError, setGradeError] = useState<string | null>(null)

    const cId = parseInt(courseId ?? '', 10)
    const aId = parseInt(assignmentId ?? '', 10)

    const loadData = async () => {
        try {
            setLoading(true)
            setError(null)

            const [allAssignments, allSubs, allRes] = await Promise.all([
                fetchAssignmentsByCourseId(cId),
                fetchTeacherSubmissions(),
                fetchTeacherResults(),
            ])

            const found = allAssignments.find((a) => a.id === aId) ?? null
            setAssignment(found)
            setSubmissions(allSubs.filter((s) => s.assignmentId === aId))
            setResults(allRes.filter((r) => r.assignmentId === aId))
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load data.')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (!isNaN(cId) && !isNaN(aId)) {
            loadData()
        }
    }, [cId, aId])

    const openGrading = (sub: AssignmentSubmissionResponse) => {
        setGradingSubmission(sub)
        setGradeValue('')
        setFeedbackValue('')
        setGradeError(null)
    }

    const closeGrading = () => {
        setGradingSubmission(null)
        setGradeValue('')
        setFeedbackValue('')
        setGradeError(null)
    }

    const handleGradeSubmit = async () => {
        if (!gradingSubmission) return

        const grade = parseFloat(gradeValue)
        if (isNaN(grade) || grade < 0 || grade > 100) {
            setGradeError('Grade must be a number between 0 and 100.')
            return
        }

        try {
            setSubmitting(true)
            setGradeError(null)
            await saveAssignmentResult({
                assignmentId: gradingSubmission.assignmentId,
                studentId: gradingSubmission.studentId,
                grade,
                feedback: feedbackValue.trim(),
            })
            await loadData()
            closeGrading()
        } catch {
            setGradeError('Failed to save grade. Please try again.')
        } finally {
            setSubmitting(false)
        }
    }

    if (!isTeacher) {
        return (
            <div className="page-container">
                <div className="courses-message">This page is only accessible to teachers.</div>
            </div>
        )
    }

    if (loading) return <div className="page-container"><div className="courses-message">Loading...</div></div>
    if (error) return <div className="page-container"><div className="courses-message courses-message-error">{error}</div></div>

    return (
        <div className="width-full">
            <Button
                onClick={() => navigate(-1)}
                variant="ghost"
                style={{ paddingLeft: 0, marginTop: '2rem', marginBottom: '0.5rem' }}
            >
                ← Back to Course
            </Button>

            {/* Assignment header */}
            {assignment && (
                <div style={{ marginBottom: '2rem' }}>
                    <h1 className="page-title" style={{ marginBottom: '0.25rem' }}>{assignment.title}</h1>
                    {assignment.description && (
                        <p style={{ color: '#9ca3af', fontSize: '0.95rem', lineHeight: '1.6', marginBottom: '0.5rem' }}>
                            {assignment.description}
                        </p>
                    )}
                    <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.85rem', color: '#6b7280' }}>
                        {assignment.startDate && (
                            <span>Start: {new Date(assignment.startDate).toLocaleDateString()}</span>
                        )}
                        {assignment.deadline && (
                            <span style={{ color: '#f59e0b' }}>
                                Deadline: {new Date(assignment.deadline).toLocaleDateString()}
                            </span>
                        )}
                    </div>
                </div>
            )}

            {/* Tabs */}
            <div className="student-nav" style={{ marginBottom: '1.5rem' }}>
                <button
                    className={`student-nav-item ${tab === 'not_graded' ? 'student-nav-item-active' : ''}`}
                    onClick={() => setTab('not_graded')}
                >
                    Not Graded ({submissions.length})
                </button>
                <button
                    className={`student-nav-item ${tab === 'graded' ? 'student-nav-item-active' : ''}`}
                    onClick={() => setTab('graded')}
                >
                    Graded ({results.length})
                </button>
            </div>

            <div className="courses-section">
                {/* Not Graded tab */}
                {tab === 'not_graded' && (
                    submissions.length === 0 ? (
                        <div className="courses-message">No ungraded submissions for this assignment.</div>
                    ) : (
                        <div className="courses-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))' }}>
                            {submissions.map((sub, idx) => (
                                <article
                                    key={`sub-${sub.studentId}-${idx}`}
                                    className="course-card"
                                    onClick={() => openGrading(sub)}
                                    style={{
                                        display: 'flex', flexDirection: 'column', gap: '0.5rem',
                                        position: 'relative', overflow: 'hidden', cursor: 'pointer',
                                        transition: 'transform 0.15s, box-shadow 0.15s',
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.transform = 'translateY(-2px)'
                                        e.currentTarget.style.boxShadow = '0 8px 25px rgba(0,0,0,0.3)'
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.transform = ''
                                        e.currentTarget.style.boxShadow = ''
                                    }}
                                >
                                    <div style={{ position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', backgroundColor: '#f59e0b' }} />
                                    <div style={{ marginLeft: '0.75rem' }}>
                                        <p style={{ fontSize: '0.95rem', color: '#e5e7eb', marginBottom: '0.25rem', fontWeight: 500 }}>
                                            {studentFullName(sub.studentFirstName, sub.studentLastName, `Student #${sub.studentId}`)}
                                        </p>
                                        {sub.studentUsername && (
                                            <p style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.4rem' }}>
                                                @{sub.studentUsername}
                                            </p>
                                        )}
                                        {sub.content && (
                                            <div style={{
                                                background: 'rgba(255,255,255,0.05)', borderRadius: '6px',
                                                padding: '0.5rem 0.75rem', fontSize: '0.85rem',
                                                marginBottom: '0.5rem', overflow: 'hidden',
                                            }}>
                                                {(() => {
                                                    // Remove any accidental quotes from the string
                                                    const url = sub.content.replace(/['"]+/g, '').trim();

                                                    return (
                                                        <a
                                                            href={url}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            style={{ color: '#60a5fa', textDecoration: 'underline', fontWeight: 500 }}
                                                            onClick={(e) => e.stopPropagation()} // Important: stops the card's onClick from firing
                                                        >
                                                            View Submission
                                                        </a>
                                                    );
                                                })()}
                                            </div>
                                        )}
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <span className="course-pill" style={{ borderColor: '#f59e0b', color: '#fcd34d', fontSize: '0.75rem' }}>
                                                ○ Needs Grading
                                            </span>
                                            <span style={{ fontSize: '0.75rem', color: '#6366f1', fontWeight: 500 }}>
                                                Click to grade →
                                            </span>
                                        </div>
                                    </div>
                                </article>
                            ))}
                        </div>
                    )
                )}

                {/* Graded tab */}
                {tab === 'graded' && (
                    results.length === 0 ? (
                        <div className="courses-message">No graded submissions for this assignment.</div>
                    ) : (
                        <div className="courses-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))' }}>
                            {results.map((res, idx) => (
                                <article
                                    key={`res-${res.studentId}-${idx}`}
                                    className="course-card"
                                    style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', position: 'relative', overflow: 'hidden' }}
                                >
                                    <div style={{ position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', backgroundColor: '#10b981' }} />
                                    <div style={{ marginLeft: '0.75rem' }}>
                                        <p style={{ fontSize: '0.95rem', color: '#e5e7eb', marginBottom: '0.25rem', fontWeight: 500 }}>
                                            {studentFullName(res.studentFirstName, res.studentLastName, `Student #${res.studentId}`)}
                                        </p>
                                        {res.studentUsername && (
                                            <p style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.4rem' }}>
                                                @{res.studentUsername}
                                            </p>
                                        )}
                                        <div style={{ display: 'flex', gap: '1rem', fontSize: '0.85rem', marginBottom: '0.4rem' }}>
                                            <span style={{ color: '#10b981' }}>
                                                Grade: <strong>{res.grade}</strong>
                                            </span>
                                        </div>
                                        {res.feedback && (
                                            <div style={{
                                                background: 'rgba(255,255,255,0.05)', borderRadius: '6px',
                                                padding: '0.5rem 0.75rem', fontSize: '0.85rem', color: '#d1d5db',
                                                marginBottom: '0.5rem', maxHeight: '4em', overflow: 'hidden',
                                            }}>
                                                {res.feedback}
                                            </div>
                                        )}
                                        <span className="course-pill" style={{ borderColor: '#10b981', color: '#6ee7b7', fontSize: '0.75rem' }}>
                                            ✓ Graded
                                        </span>
                                    </div>
                                </article>
                            ))}
                        </div>
                    )
                )}
            </div>

            {/* Grading Modal */}
            {gradingSubmission && (
                <div
                    style={{
                        position: 'fixed', inset: 0, zIndex: 1000,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
                    }}
                    onClick={(e) => { if (e.target === e.currentTarget) closeGrading() }}
                >
                    <div style={{
                        background: '#1e1e2e', borderRadius: '16px', padding: '2rem',
                        width: '90%', maxWidth: '480px', boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
                        border: '1px solid rgba(255,255,255,0.08)',
                    }}>
                        <h2 style={{ fontSize: '1.25rem', color: '#f1f5f9', marginBottom: '0.25rem' }}>
                            Grade Submission
                        </h2>
                        <p style={{ fontSize: '0.85rem', color: '#9ca3af', marginBottom: '1.5rem' }}>
                            {studentFullName(gradingSubmission.studentFirstName, gradingSubmission.studentLastName, `Student #${gradingSubmission.studentId}`)}
                            {gradingSubmission.studentUsername && ` (@${gradingSubmission.studentUsername})`}
                        </p>

                        {gradingSubmission.content && (
                            <div style={{ marginBottom: '1.5rem' }}>
                                <label style={{ fontSize: '0.8rem', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '0.4rem' }}>
                                    Submission Content
                                </label>
                                <div style={{
                                    background: 'rgba(255,255,255,0.05)', borderRadius: '8px',
                                    padding: '0.75rem 1rem', fontSize: '0.9rem', color: '#e5e7eb',
                                    maxHeight: '8em', overflow: 'auto', lineHeight: '1.5',
                                    border: '1px solid rgba(255,255,255,0.06)',
                                }}>
                                    {(() => {
                                        if (!gradingSubmission.content) return null
                                        // Trim, then remove surrounding quotes, then trim again
                                        const clean = gradingSubmission.content.trim().replace(/^["']+|["']+$/g, '').trim()
                                        const isUrl = clean.startsWith('http') || clean.startsWith('/')

                                        return isUrl ? (
                                            <a href={clean} target="_blank" rel="noopener noreferrer" style={{ color: '#60a5fa', textDecoration: 'underline' }}>
                                                View Submission
                                            </a>
                                        ) : (
                                            gradingSubmission.content
                                        )
                                    })()}
                                </div>
                            </div>
                        )}

                        {/* Grade input */}
                        <div style={{ marginBottom: '1rem' }}>
                            <label htmlFor="grade-input" style={{
                                fontSize: '0.8rem', color: '#9ca3af', textTransform: 'uppercase',
                                letterSpacing: '0.5px', display: 'block', marginBottom: '0.4rem',
                            }}>
                                Grade (0–100)
                            </label>
                            <input
                                id="grade-input"
                                type="number"
                                min={0}
                                max={100}
                                value={gradeValue}
                                onChange={(e) => setGradeValue(e.target.value)}
                                placeholder="e.g. 85"
                                style={{
                                    width: '100%', padding: '0.6rem 0.75rem', borderRadius: '8px',
                                    border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.05)',
                                    color: '#f1f5f9', fontSize: '0.95rem', outline: 'none',
                                }}
                            />
                        </div>

                        {/* Feedback input */}
                        <div style={{ marginBottom: '1.25rem' }}>
                            <label htmlFor="feedback-input" style={{
                                fontSize: '0.8rem', color: '#9ca3af', textTransform: 'uppercase',
                                letterSpacing: '0.5px', display: 'block', marginBottom: '0.4rem',
                            }}>
                                Feedback (optional)
                            </label>
                            <textarea
                                id="feedback-input"
                                value={feedbackValue}
                                onChange={(e) => setFeedbackValue(e.target.value)}
                                placeholder="Write your feedback here..."
                                rows={3}
                                style={{
                                    width: '100%', padding: '0.6rem 0.75rem', borderRadius: '8px',
                                    border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.05)',
                                    color: '#f1f5f9', fontSize: '0.95rem', outline: 'none', resize: 'vertical',
                                }}
                            />
                        </div>

                        {gradeError && (
                            <p style={{ color: '#ef4444', fontSize: '0.85rem', marginBottom: '0.75rem' }}>
                                {gradeError}
                            </p>
                        )}

                        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                            <Button variant="ghost" onClick={closeGrading} disabled={submitting}>
                                Cancel
                            </Button>
                            <Button onClick={handleGradeSubmit} disabled={submitting}>
                                {submitting ? 'Saving...' : 'Save Grade'}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
