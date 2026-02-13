import { useEffect, useState } from 'react'
import {
    fetchStudentAssignments,
    fetchTeacherSubmissions,
    fetchTeacherResults,
    saveAssignmentResult,
    type Assignment,
    type AssignmentSubmissionResponse,
    type AssignmentResultResponse,
} from '../api/assignments'
import { AssignmentCard } from '../components/AssignmentCard'
import { useAuth } from '../context/AuthContext'

type StudentTab = 'upcoming' | 'submitted' | 'returned'
type TeacherTab = 'not_graded' | 'graded'

function studentFullName(firstName: string | null, lastName: string | null, fallback: string) {
    const name = [firstName, lastName].filter(Boolean).join(' ')
    return name || fallback
}

export function AssignmentsPage() {
    const { user } = useAuth()
    const isTeacher = user?.role === 'teacher'

    const [studentAssignments, setStudentAssignments] = useState<Assignment[]>([])
    const [submissions, setSubmissions] = useState<AssignmentSubmissionResponse[]>([])
    const [results, setResults] = useState<AssignmentResultResponse[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [studentTab, setStudentTab] = useState<StudentTab>('upcoming')
    const [teacherTab, setTeacherTab] = useState<TeacherTab>('not_graded')

    // Grading modal state
    const [gradingSubmission, setGradingSubmission] = useState<AssignmentSubmissionResponse | null>(null)
    const [gradeValue, setGradeValue] = useState('')
    const [feedbackValue, setFeedbackValue] = useState('')
    const [submitting, setSubmitting] = useState(false)
    const [gradeError, setGradeError] = useState<string | null>(null)

    const loadTeacherData = async () => {
        const [subs, res] = await Promise.all([
            fetchTeacherSubmissions(),
            fetchTeacherResults(),
        ])
        setSubmissions(subs)
        setResults(res)
    }

    useEffect(() => {
        let isMounted = true

        async function loadData() {
            try {
                setLoading(true)
                if (isTeacher) {
                    await loadTeacherData()
                } else {
                    const data = await fetchStudentAssignments()
                    if (isMounted) setStudentAssignments(data)
                }
            } catch (err) {
                if (isMounted) setError('Failed to load assignments.')
            } finally {
                if (isMounted) setLoading(false)
            }
        }

        loadData()
        return () => { isMounted = false }
    }, [isTeacher])

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
            await loadTeacherData()
            closeGrading()
        } catch (err) {
            setGradeError('Failed to save grade. Please try again.')
        } finally {
            setSubmitting(false)
        }
    }

    // Student view
    if (!isTeacher) {
        const filtered = studentAssignments.filter((a) => a.status === studentTab)

        return (
            <div className="width-full">
                <h1 className="page-title">Assignments</h1>
                <p className="page-description">
                    Track your upcoming deadlines and graded work.
                </p>

                <div className="student-nav" style={{ marginBottom: '1.5rem' }}>
                    <button
                        className={`student-nav-item ${studentTab === 'upcoming' ? 'student-nav-item-active' : ''}`}
                        onClick={() => setStudentTab('upcoming')}
                    >
                        Upcoming
                    </button>
                    <button
                        className={`student-nav-item ${studentTab === 'submitted' ? 'student-nav-item-active' : ''}`}
                        onClick={() => setStudentTab('submitted')}
                    >
                        Submitted
                    </button>
                    <button
                        className={`student-nav-item ${studentTab === 'returned' ? 'student-nav-item-active' : ''}`}
                        onClick={() => setStudentTab('returned')}
                    >
                        Returned
                    </button>
                </div>

                <div className="courses-section">
                    {loading && <div className="courses-message">Loading assignments...</div>}
                    {error && <div className="courses-message courses-message-error">{error}</div>}

                    {!loading && !error && filtered.length === 0 && (
                        <div className="courses-message">No {studentTab} assignments found.</div>
                    )}

                    {!loading && !error && filtered.length > 0 && (
                        <div className="courses-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
                            {filtered.map((assignment) => (
                                <AssignmentCard key={assignment.id} assignment={assignment} />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        )
    }

    // Teacher view
    return (
        <div className="width-full">
            <h1 className="page-title">Assignment Submissions</h1>
            <p className="page-description">
                Review and grade student submissions for your courses.
            </p>

            <div className="student-nav" style={{ marginBottom: '1.5rem' }}>
                <button
                    className={`student-nav-item ${teacherTab === 'not_graded' ? 'student-nav-item-active' : ''}`}
                    onClick={() => setTeacherTab('not_graded')}
                >
                    Not Graded ({submissions.length})
                </button>
                <button
                    className={`student-nav-item ${teacherTab === 'graded' ? 'student-nav-item-active' : ''}`}
                    onClick={() => setTeacherTab('graded')}
                >
                    Graded ({results.length})
                </button>
            </div>

            <div className="courses-section">
                {loading && <div className="courses-message">Loading submissions...</div>}
                {error && <div className="courses-message courses-message-error">{error}</div>}

                {/* Not Graded tab */}
                {!loading && !error && teacherTab === 'not_graded' && (
                    submissions.length === 0 ? (
                        <div className="courses-message">No ungraded submissions found.</div>
                    ) : (
                        <div className="courses-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))' }}>
                            {submissions.map((sub, idx) => (
                                <article
                                    key={`sub-${sub.assignmentId}-${sub.studentId}-${idx}`}
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
                                        <h3 className="course-title" style={{ fontSize: '1.05rem', marginBottom: '0.3rem' }}>
                                            {sub.assignmentTitle || `Assignment #${sub.assignmentId}`}
                                        </h3>
                                        {sub.courseName && (
                                            <p style={{ fontSize: '0.8rem', color: '#818cf8', marginBottom: '0.25rem' }}>
                                                {sub.courseName}
                                            </p>
                                        )}
                                        <p style={{ fontSize: '0.85rem', color: '#9ca3af', marginBottom: '0.25rem' }}>
                                            {studentFullName(sub.studentFirstName, sub.studentLastName, `Student #${sub.studentId}`)}
                                        </p>
                                        {sub.studentUsername && (
                                            <p style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.4rem' }}>
                                                @{sub.studentUsername}
                                            </p>
                                        )}
                                        {sub.assignmentDeadline && (
                                            <p style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.4rem' }}>
                                                Deadline: {new Date(sub.assignmentDeadline).toLocaleDateString()}
                                            </p>
                                        )}
                                        {sub.content && (
                                            <div style={{
                                                background: 'rgba(255,255,255,0.05)', borderRadius: '6px',
                                                padding: '0.5rem 0.75rem', fontSize: '0.85rem', color: '#d1d5db',
                                                marginBottom: '0.5rem', maxHeight: '4em', overflow: 'hidden',
                                            }}>
                                                {sub.content}
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
                {!loading && !error && teacherTab === 'graded' && (
                    results.length === 0 ? (
                        <div className="courses-message">No graded submissions found.</div>
                    ) : (
                        <div className="courses-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))' }}>
                            {results.map((res, idx) => (
                                <article
                                    key={`res-${res.assignmentId}-${res.studentId}-${idx}`}
                                    className="course-card"
                                    style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', position: 'relative', overflow: 'hidden' }}
                                >
                                    <div style={{ position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', backgroundColor: '#10b981' }} />
                                    <div style={{ marginLeft: '0.75rem' }}>
                                        <h3 className="course-title" style={{ fontSize: '1.05rem', marginBottom: '0.3rem' }}>
                                            {res.assignmentTitle || `Assignment #${res.assignmentId}`}
                                        </h3>
                                        {res.courseName && (
                                            <p style={{ fontSize: '0.8rem', color: '#818cf8', marginBottom: '0.25rem' }}>
                                                {res.courseName}
                                            </p>
                                        )}
                                        <p style={{ fontSize: '0.85rem', color: '#9ca3af', marginBottom: '0.25rem' }}>
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
                        <p style={{ fontSize: '0.9rem', color: '#e5e7eb', marginBottom: '0.15rem' }}>
                            {gradingSubmission.assignmentTitle || `Assignment #${gradingSubmission.assignmentId}`}
                        </p>
                        {gradingSubmission.courseName && (
                            <p style={{ fontSize: '0.8rem', color: '#818cf8', marginBottom: '0.15rem' }}>
                                {gradingSubmission.courseName}
                            </p>
                        )}
                        <p style={{ fontSize: '0.85rem', color: '#9ca3af', marginBottom: '1.5rem' }}>
                            {studentFullName(gradingSubmission.studentFirstName, gradingSubmission.studentLastName, `Student #${gradingSubmission.studentId}`)}
                            {gradingSubmission.studentUsername && ` (@${gradingSubmission.studentUsername})`}
                        </p>

                        {/* Submission content preview */}
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
                                    {gradingSubmission.content}
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
                                min="0"
                                max="100"
                                step="any"
                                value={gradeValue}
                                onChange={(e) => setGradeValue(e.target.value)}
                                placeholder="e.g. 85"
                                style={{
                                    width: '100%', padding: '0.6rem 0.75rem', borderRadius: '8px',
                                    border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.05)',
                                    color: '#f1f5f9', fontSize: '1rem', outline: 'none',
                                    boxSizing: 'border-box',
                                }}
                                onFocus={(e) => e.currentTarget.style.borderColor = '#6366f1'}
                                onBlur={(e) => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'}
                                autoFocus
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
                                placeholder="Write feedback for the student..."
                                rows={3}
                                style={{
                                    width: '100%', padding: '0.6rem 0.75rem', borderRadius: '8px',
                                    border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.05)',
                                    color: '#f1f5f9', fontSize: '0.9rem', outline: 'none', resize: 'vertical',
                                    fontFamily: 'inherit', boxSizing: 'border-box',
                                }}
                                onFocus={(e) => e.currentTarget.style.borderColor = '#6366f1'}
                                onBlur={(e) => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'}
                            />
                        </div>

                        {gradeError && (
                            <p style={{ color: '#f87171', fontSize: '0.85rem', marginBottom: '1rem' }}>
                                {gradeError}
                            </p>
                        )}

                        {/* Actions */}
                        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                            <button
                                onClick={closeGrading}
                                disabled={submitting}
                                style={{
                                    padding: '0.5rem 1.25rem', borderRadius: '8px',
                                    border: '1px solid rgba(255,255,255,0.12)', background: 'transparent',
                                    color: '#9ca3af', fontSize: '0.9rem', cursor: 'pointer',
                                }}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleGradeSubmit}
                                disabled={submitting || !gradeValue}
                                style={{
                                    padding: '0.5rem 1.25rem', borderRadius: '8px', border: 'none',
                                    background: submitting || !gradeValue
                                        ? 'rgba(99,102,241,0.4)'
                                        : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                                    color: '#fff', fontSize: '0.9rem', fontWeight: 600,
                                    cursor: submitting || !gradeValue ? 'not-allowed' : 'pointer',
                                    transition: 'opacity 0.15s',
                                }}
                            >
                                {submitting ? 'Saving...' : 'Submit Grade'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
