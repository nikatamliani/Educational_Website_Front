import React, { useEffect, useState } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { fetchAssignmentById, submitAssignment, Assignment } from '../api/assignments'
import { Button } from '../components/Button'
import ErrorMessage from '../components/ErrorMessage'
import { useToast } from '../context/ToastContext'

export const AssignmentDetailsPage: React.FC = () => {
    const { id } = useParams<{ id: string }>()
    const navigate = useNavigate()
    const location = useLocation()
    const { showToast } = useToast()
    const fromCourseId = (location.state as { fromCourseId?: number } | null)?.fromCourseId
    const fromTab = (location.state as { fromTab?: string } | null)?.fromTab

    const goBack = () => {
        if (fromCourseId) {
            navigate(`/my-courses/${fromCourseId}`)
        } else {
            navigate('/assignments', { state: { restoreTab: fromTab } })
        }
    }
    const [assignment, setAssignment] = useState<Assignment | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [submissionContent, setSubmissionContent] = useState('')
    const [submitting, setSubmitting] = useState(false)

    useEffect(() => {
        loadAssignment()
    }, [id])

    const loadAssignment = async () => {
        if (!id) return
        setLoading(true)
        setError(null)
        try {
            const data = await fetchAssignmentById(parseInt(id, 10))
            if (data) {
                setAssignment(data)
            } else {
                setError('Assignment not found')
            }
        } catch (err: any) {
            setError(err.message || 'Failed to load assignment')
        } finally {
            setLoading(false)
        }
    }

    // ESC key → go back
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') goBack()
        }
        window.addEventListener('keydown', onKey)
        return () => window.removeEventListener('keydown', onKey)
    })

    const handleSubmit = async () => {
        if (!assignment || !submissionContent.trim()) return

        setSubmitting(true)
        try {
            await submitAssignment(assignment.id, submissionContent)
            // Refresh assignment to separate status update
            const updated = await fetchAssignmentById(assignment.id)
            if (updated) {
                setAssignment(updated)
            }
            setSubmissionContent('')
            showToast('Assignment submitted successfully', 'success')
        } catch (err: any) {
            console.error('Failed to submit assignment:', err)
            showToast(err.message || 'Failed to submit assignment', 'error')
        } finally {
            setSubmitting(false)
        }
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'upcoming': return '#f59e0b'
            case 'submitted': return '#3b82f6'
            case 'returned': return '#10b981'
            case 'past_due': return '#ef4444'
            default: return '#9ca3af'
        }
    }

    if (loading) {
        return (
            <div className="container" style={{ padding: '2rem', textAlign: 'center', color: 'white' }}>
                Loading assignment details...
            </div>
        )
    }

    if (!assignment) {
        return (
            <div className="p-4">
                {error ? (
                    <ErrorMessage
                        message={error}
                        onRetry={loadAssignment}
                        title="Failed to Load Assignment"
                    />
                ) : (
                    <div style={{ textAlign: 'center', color: 'white' }}>
                        Assignment not found.
                    </div>
                )}
                <div style={{ textAlign: 'center', marginTop: '1rem' }}>
                    <Button onClick={goBack}>Back</Button>
                </div>
            </div>
        )
    }

    return (
        <div className="container" style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
            <Button
                onClick={goBack}
                style={{ marginBottom: '1rem', background: 'transparent', border: '1px solid #374151' }}
            >
                ← {fromCourseId ? 'Back to Course' : 'Back to List'}
            </Button>

            <div className="card" style={{ padding: '2rem', backgroundColor: '#1f2937', borderRadius: '0.75rem', border: '1px solid #374151' }}>
                <div style={{ borderLeft: `4px solid ${getStatusColor(assignment.status)}`, paddingLeft: '1rem', marginBottom: '1.5rem' }}>
                    <h1 style={{ fontSize: '1.8rem', fontWeight: 'bold', color: 'white', marginBottom: '0.5rem' }}>
                        {assignment.title}
                    </h1>
                    <p style={{ color: '#9ca3af' }}>{assignment.courseTitle}</p>
                </div>

                <div
                    style={{
                        display: 'flex',
                        gap: '1rem',
                        marginBottom: '2rem',
                        flexWrap: 'wrap',
                        fontSize: '0.9rem'
                    }}
                >
                    <span style={{
                        padding: '0.25rem 0.75rem',
                        borderRadius: '9999px',
                        backgroundColor: '#374151',
                        color: '#e5e7eb'
                    }}>
                        Due: {new Date(assignment.dueDate).toLocaleString()}
                    </span>

                    <span style={{
                        padding: '0.25rem 0.75rem',
                        borderRadius: '9999px',
                        backgroundColor:
                            assignment.status === 'returned' ? 'rgba(16, 185, 129, 0.2)' :
                                assignment.status === 'submitted' ? 'rgba(59, 130, 246, 0.2)' :
                                    assignment.status === 'past_due' ? 'rgba(239, 68, 68, 0.2)' :
                                        'rgba(245, 158, 11, 0.2)',
                        color:
                            assignment.status === 'returned' ? '#6ee7b7' :
                                assignment.status === 'submitted' ? '#93c5fd' :
                                    assignment.status === 'past_due' ? '#fca5a5' :
                                        '#fcd34d',
                        border: `1px solid ${getStatusColor(assignment.status)}`
                    }}>
                        Status: {assignment.status === 'past_due' ? '🔒 Past Due' : assignment.status.charAt(0).toUpperCase() + assignment.status.slice(1)}
                    </span>

                    {assignment.grade !== undefined && (
                        <span style={{
                            padding: '0.25rem 0.75rem',
                            borderRadius: '9999px',
                            backgroundColor: 'rgba(16, 185, 129, 0.1)',
                            color: '#6ee7b7',
                            fontWeight: 'bold'
                        }}>
                            Grade: {assignment.grade} / {assignment.maxGrade || 100}
                        </span>
                    )}
                </div>

                <div style={{ marginBottom: '2rem', color: '#d1d5db', lineHeight: '1.6' }}>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: '600', color: 'white', marginBottom: '0.5rem' }}>Description</h3>
                    <p style={{ whiteSpace: 'pre-wrap' }}>{assignment.description}</p>
                </div>

                {assignment.content && (
                    <div style={{ marginBottom: '2rem', color: '#d1d5db', lineHeight: '1.6' }}>
                        <h3 style={{ fontSize: '1.2rem', fontWeight: '600', color: 'white', marginBottom: '0.5rem' }}>Instructions</h3>
                        <div style={{ whiteSpace: 'pre-wrap' }}>{assignment.content}</div>
                    </div>
                )}

                {assignment.feedback && (
                    <div style={{
                        marginBottom: '2rem',
                        padding: '1rem',
                        backgroundColor: 'rgba(16, 185, 129, 0.1)',
                        border: '1px solid rgba(16, 185, 129, 0.2)',
                        borderRadius: '0.5rem'
                    }}>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: '600', color: '#6ee7b7', marginBottom: '0.5rem' }}>Feedback</h3>
                        <p style={{ color: '#d1d5db', fontStyle: 'italic' }}>"{assignment.feedback}"</p>
                    </div>
                )}

                {/* Submission Area */}
                <div style={{ marginTop: '2rem', paddingTop: '2rem', borderTop: '1px solid #374151' }}>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: '600', color: 'white', marginBottom: '1rem' }}>
                        {assignment.status === 'returned' ? 'Submission (Returned)' :
                            assignment.status === 'past_due' ? 'Submission (Past Due)' :
                                assignment.status === 'submitted' ? 'Update Submission' : 'Your Submission'}
                    </h3>

                    {assignment.status === 'returned' ? (
                        <>
                            <p style={{ color: '#9ca3af', marginBottom: '1rem' }}>This assignment has been graded. No further submissions are allowed.</p>
                            {assignment.submissionContent && (
                                <div style={{
                                    padding: '1rem',
                                    borderRadius: '0.5rem',
                                    backgroundColor: '#111827',
                                    border: '1px solid #374151',
                                    color: '#d1d5db',
                                    whiteSpace: 'pre-wrap'
                                }}>
                                    <h4 style={{ fontSize: '0.9rem', color: '#9ca3af', marginBottom: '0.5rem' }}>Your Submission:</h4>
                                    {assignment.submissionContent}
                                </div>
                            )}
                        </>
                    ) : assignment.status === 'past_due' ? (
                        <div style={{
                            padding: '1.25rem',
                            borderRadius: '0.75rem',
                            border: '1px solid rgba(239, 68, 68, 0.3)',
                            background: 'rgba(239, 68, 68, 0.1)',
                            textAlign: 'center',
                        }}>
                            <p style={{ color: '#fca5a5', fontSize: '1.1rem', fontWeight: '600', margin: '0 0 0.5rem 0' }}>
                                🔒 This assignment is past due
                            </p>
                            <p style={{ color: '#9ca3af', margin: 0 }}>
                                The deadline was {new Date(assignment.dueDate).toLocaleString()}. Submissions are no longer accepted.
                            </p>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {assignment.submissionContent && (
                                <div style={{
                                    marginBottom: '1rem',
                                    padding: '1rem',
                                    borderRadius: '0.5rem',
                                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                                    border: '1px solid rgba(59, 130, 246, 0.2)',
                                    color: '#d1d5db',
                                    whiteSpace: 'pre-wrap'
                                }}>
                                    <h4 style={{ fontSize: '0.9rem', color: '#93c5fd', marginBottom: '0.5rem' }}>Current Submission:</h4>
                                    {assignment.submissionContent}
                                </div>
                            )}
                            <textarea
                                value={submissionContent}
                                onChange={(e) => setSubmissionContent(e.target.value)}
                                placeholder="Type your submission content here..."
                                style={{
                                    width: '100%',
                                    minHeight: '150px',
                                    padding: '1rem',
                                    borderRadius: '0.5rem',
                                    backgroundColor: '#111827',
                                    border: '1px solid #4b5563',
                                    color: 'white',
                                    fontFamily: 'inherit',
                                    resize: 'vertical'
                                }}
                            />
                            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                                <Button
                                    onClick={handleSubmit}
                                    disabled={submitting || !submissionContent.trim()}
                                    variant="primary"
                                >
                                    {submitting ? 'Submitting...' : 'Submit Assignment'}
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
