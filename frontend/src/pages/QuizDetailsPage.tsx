import React, { useEffect, useState } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import {
    fetchQuizById,
    fetchMyQuizSubmission,
    fetchAllQuizSubmissions,
    submitQuiz,
    QuizDto,
    QuizSubmissionDto,
} from '../api/quizzes'
import { Button } from '../components/Button'
import { useAuth } from '../context/AuthContext'

export const QuizDetailsPage: React.FC = () => {
    const { id } = useParams<{ id: string }>()
    const navigate = useNavigate()
    const location = useLocation()
    const { user } = useAuth()
    const isTeacher = user?.role === 'teacher'
    const fromCourseId = (location.state as { fromCourseId?: number } | null)?.fromCourseId

    const goBack = () => {
        if (fromCourseId) {
            navigate(`/my-courses/${fromCourseId}`)
        } else {
            navigate('/quizzes')
        }
    }

    const [quiz, setQuiz] = useState<QuizDto | null>(null)
    const [submission, setSubmission] = useState<QuizSubmissionDto | null>(null)
    const [allSubmissions, setAllSubmissions] = useState<QuizSubmissionDto[]>([])
    const [expandedSubmission, setExpandedSubmission] = useState<number | null>(null)
    const [loading, setLoading] = useState(true)
    const [submitting, setSubmitting] = useState(false)
    const [justSubmitted, setJustSubmitted] = useState(false)

    // Map of questionId -> selected option (A/B/C/D)
    const [answers, setAnswers] = useState<Record<number, string>>({})

    useEffect(() => {
        if (!id) return

        const load = async () => {
            setLoading(true)
            const quizData = await fetchQuizById(parseInt(id, 10))
            setQuiz(quizData)

            if (quizData && isTeacher) {
                // Teacher: always fetch all submissions (backend handles authorization)
                const subs = await fetchAllQuizSubmissions(quizData.id)
                setAllSubmissions(subs)
            } else if (quizData) {
                // Student: check own submission
                const sub = await fetchMyQuizSubmission(quizData.id)
                if (sub) setSubmission(sub)
            }
            setLoading(false)
        }
        load()
    }, [id])

    // ESC key → go back
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') goBack()
        }
        window.addEventListener('keydown', onKey)
        return () => window.removeEventListener('keydown', onKey)
    })

    const handleOptionSelect = (questionId: number, option: string) => {
        setAnswers((prev) => ({ ...prev, [questionId]: option }))
    }

    const handleSubmit = async () => {
        if (!quiz) return

        const unanswered = quiz.quizQuestionDtos.filter((q) => !answers[q.id])
        if (unanswered.length > 0) {
            alert(`Please answer all questions. ${unanswered.length} remaining.`)
            return
        }

        setSubmitting(true)
        try {
            const answerList = Object.entries(answers).map(([qId, option]) => ({
                questionId: parseInt(qId, 10),
                selectedOption: option,
            }))
            const result = await submitQuiz(quiz.id, answerList)
            setSubmission(result)
            setJustSubmitted(true)
        } catch (error) {
            console.error('Failed to submit quiz:', error)
            alert('Failed to submit quiz. Please try again.')
        } finally {
            setSubmitting(false)
        }
    }


    if (loading) {
        return (
            <div className="container" style={{ padding: '2rem', textAlign: 'center', color: 'white' }}>
                Loading quiz...
            </div>
        )
    }

    if (!quiz) {
        return (
            <div className="container" style={{ padding: '2rem', textAlign: 'center', color: 'white' }}>
                Quiz not found.
                <br />
                <Button onClick={goBack}>Back</Button>
            </div>
        )
    }

    const now = new Date()
    const startDate = quiz ? new Date(quiz.startDate) : new Date()
    const endDate = quiz ? new Date(quiz.endDate) : new Date()
    const isPastDeadline = now > endDate

    // ── Teacher View ──────────────────────────────────────────────────
    if (isTeacher) {
        return (
            <div className="container" style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
                <Button
                    onClick={goBack}
                    style={{ marginBottom: '1rem', background: 'transparent', border: '1px solid #374151' }}
                >
                    ← Back to Quizzes
                </Button>

                <div className="card" style={{ padding: '2rem', backgroundColor: '#1f2937', borderRadius: '0.75rem', border: '1px solid #374151' }}>
                    <div style={{ borderLeft: `4px solid ${isPastDeadline ? '#10b981' : '#f59e0b'}`, paddingLeft: '1rem', marginBottom: '1.5rem' }}>
                        <h1 style={{ fontSize: '1.8rem', fontWeight: 'bold', color: 'white', marginBottom: '0.5rem' }}>
                            {quiz.title}
                        </h1>
                        <p style={{ color: '#9ca3af' }}>
                            {quiz.quizQuestionDtos.length} question{quiz.quizQuestionDtos.length !== 1 ? 's' : ''}
                        </p>
                    </div>

                    <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', flexWrap: 'wrap', fontSize: '0.9rem' }}>
                        <span style={{ padding: '0.25rem 0.75rem', borderRadius: '9999px', backgroundColor: '#374151', color: '#e5e7eb' }}>
                            Opens: {startDate.toLocaleString()}
                        </span>
                        <span style={{ padding: '0.25rem 0.75rem', borderRadius: '9999px', backgroundColor: '#374151', color: '#e5e7eb' }}>
                            Due: {endDate.toLocaleString()}
                        </span>
                        <span style={{
                            padding: '0.25rem 0.75rem', borderRadius: '9999px',
                            backgroundColor: isPastDeadline ? 'rgba(16,185,129,0.2)' : 'rgba(245,158,11,0.2)',
                            color: isPastDeadline ? '#6ee7b7' : '#fcd34d',
                            border: `1px solid ${isPastDeadline ? '#10b981' : '#f59e0b'}`
                        }}>
                            {isPastDeadline ? 'Graded' : 'Upcoming'}
                        </span>
                    </div>

                    {/* Upcoming: show quiz preview with correct answers */}
                    {!isPastDeadline && (
                        <>
                            <h3 style={{ color: '#e5e7eb', marginBottom: '1rem', fontSize: '1.1rem' }}>📋 Quiz Preview — Answer Key</h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                {quiz.quizQuestionDtos.map((question, index) => {
                                    const options = [
                                        { key: 'A', text: question.optionA },
                                        { key: 'B', text: question.optionB },
                                        { key: 'C', text: question.optionC },
                                        { key: 'D', text: question.optionD },
                                    ]
                                    return (
                                        <div key={question.id} style={{ padding: '1.25rem', backgroundColor: '#111827', borderRadius: '0.75rem', border: '1px solid #374151' }}>
                                            <h4 style={{ color: 'white', fontWeight: '600', margin: '0 0 1rem 0' }}>
                                                {index + 1}. {question.question}
                                            </h4>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                                {options.map((opt) => {
                                                    const isCorrect = question.correctOption === opt.key
                                                    return (
                                                        <div key={opt.key} style={{
                                                            display: 'flex', alignItems: 'center', gap: '0.75rem',
                                                            padding: '0.75rem 1rem', borderRadius: '0.5rem',
                                                            border: isCorrect ? '1px solid #10b981' : '1px solid #374151',
                                                            backgroundColor: isCorrect ? 'rgba(16,185,129,0.15)' : '#1f2937',
                                                            color: isCorrect ? '#6ee7b7' : '#d1d5db',
                                                        }}>
                                                            <span style={{
                                                                width: '1.75rem', height: '1.75rem', borderRadius: '50%',
                                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                                fontSize: '0.8rem', fontWeight: '600', flexShrink: 0,
                                                                border: isCorrect ? '2px solid #10b981' : '2px solid #4b5563',
                                                                backgroundColor: isCorrect ? 'rgba(16,185,129,0.3)' : 'transparent',
                                                                color: isCorrect ? 'white' : '#9ca3af',
                                                            }}>
                                                                {opt.key}
                                                            </span>
                                                            <span style={{ flex: 1 }}>{opt.text}</span>
                                                            {isCorrect && (
                                                                <span style={{ color: '#4ade80', fontSize: '0.75rem', fontWeight: 600 }}>✓ Correct</span>
                                                            )}
                                                        </div>
                                                    )
                                                })}
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </>
                    )}

                    {/* Graded: show student submissions list */}
                    {isPastDeadline && (
                        <>
                            <h3 style={{ color: '#e5e7eb', marginBottom: '1rem', fontSize: '1.1rem' }}>
                                📊 Student Submissions ({allSubmissions.length})
                            </h3>
                            {allSubmissions.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '2rem', color: '#9ca3af' }}>
                                    No submissions received for this quiz.
                                </div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                    {allSubmissions.map((sub) => {
                                        const isExpanded = expandedSubmission === sub.id
                                        const scorePercent = sub.score !== null
                                            ? Math.round((sub.score / quiz.quizQuestionDtos.length) * 100)
                                            : null

                                        return (
                                            <div key={sub.id} style={{
                                                backgroundColor: '#111827', borderRadius: '0.75rem',
                                                border: '1px solid #374151', overflow: 'hidden'
                                            }}>
                                                {/* Submission row header */}
                                                <div
                                                    style={{
                                                        display: 'flex', alignItems: 'center', padding: '1rem 1.25rem',
                                                        cursor: 'pointer', gap: '1rem',
                                                    }}
                                                    onClick={() => setExpandedSubmission(isExpanded ? null : sub.id)}
                                                >
                                                    <span style={{ fontSize: '1.25rem' }}>{isExpanded ? '▾' : '▸'}</span>
                                                    <div style={{ flex: 1 }}>
                                                        <p style={{ color: 'white', fontWeight: 600, margin: 0 }}>
                                                            {sub.studentName ?? `Student #${sub.studentId}`}
                                                        </p>
                                                        <p style={{ color: '#9ca3af', fontSize: '0.8rem', margin: '0.2rem 0 0 0' }}>
                                                            Submitted: {new Date(sub.submittedAt).toLocaleString()}
                                                        </p>
                                                    </div>
                                                    <div style={{ textAlign: 'right' }}>
                                                        <span style={{
                                                            fontSize: '1.2rem', fontWeight: 700,
                                                            color: scorePercent !== null && scorePercent >= 70 ? '#4ade80' : '#fbbf24'
                                                        }}>
                                                            {sub.score}/{quiz.quizQuestionDtos.length}
                                                        </span>
                                                        {scorePercent !== null && (
                                                            <p style={{ color: '#9ca3af', fontSize: '0.75rem', margin: 0 }}>{scorePercent}%</p>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Expanded: show per-question answers */}
                                                {isExpanded && (
                                                    <div style={{ padding: '0 1.25rem 1.25rem', borderTop: '1px solid #374151' }}>
                                                        {quiz.quizQuestionDtos.map((question, qIndex) => {
                                                            const qs = sub.questionSubmissions.find(s => s.questionId === question.id)
                                                            const options = [
                                                                { key: 'A', text: question.optionA },
                                                                { key: 'B', text: question.optionB },
                                                                { key: 'C', text: question.optionC },
                                                                { key: 'D', text: question.optionD },
                                                            ]

                                                            return (
                                                                <div key={question.id} style={{ marginTop: '1rem' }}>
                                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                                                        <h5 style={{ color: '#e5e7eb', margin: 0, fontSize: '0.95rem' }}>
                                                                            {qIndex + 1}. {question.question}
                                                                        </h5>
                                                                        {qs && (
                                                                            <span style={{
                                                                                padding: '0.1rem 0.4rem', borderRadius: '9999px', fontSize: '0.7rem',
                                                                                backgroundColor: qs.correct ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)',
                                                                                color: qs.correct ? '#6ee7b7' : '#fca5a5',
                                                                                border: `1px solid ${qs.correct ? '#10b981' : '#ef4444'}`,
                                                                            }}>
                                                                                {qs.correct ? '✓' : '✗'}
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.35rem', fontSize: '0.85rem' }}>
                                                                        {options.map((opt) => {
                                                                            const isStudentChoice = qs?.selectedOption === opt.key
                                                                            const isCorrectOption = question.correctOption === opt.key
                                                                            let bg = '#1f2937'
                                                                            let border = '#374151'
                                                                            let textColor = '#9ca3af'

                                                                            if (isCorrectOption) {
                                                                                bg = 'rgba(16,185,129,0.12)'
                                                                                border = '#10b981'
                                                                                textColor = '#6ee7b7'
                                                                            }
                                                                            if (isStudentChoice && !qs?.correct) {
                                                                                bg = 'rgba(239,68,68,0.12)'
                                                                                border = '#ef4444'
                                                                                textColor = '#fca5a5'
                                                                            }

                                                                            return (
                                                                                <div key={opt.key} style={{
                                                                                    padding: '0.4rem 0.6rem', borderRadius: '0.35rem',
                                                                                    border: `1px solid ${border}`, backgroundColor: bg,
                                                                                    color: textColor, display: 'flex', alignItems: 'center', gap: '0.4rem',
                                                                                }}>
                                                                                    <strong>{opt.key}.</strong>
                                                                                    <span style={{ flex: 1 }}>{opt.text}</span>
                                                                                    {isCorrectOption && <span style={{ fontSize: '0.7rem', color: '#4ade80' }}>✓</span>}
                                                                                    {isStudentChoice && !qs?.correct && <span style={{ fontSize: '0.7rem', color: '#f87171' }}>✗</span>}
                                                                                </div>
                                                                            )
                                                                        })}
                                                                    </div>
                                                                    <div style={{
                                                                        marginTop: '0.35rem', fontSize: '0.75rem', color: '#9ca3af',
                                                                        display: 'flex', justifyContent: 'space-between',
                                                                    }}>
                                                                        <span>Selected: <strong style={{ color: qs?.correct ? '#6ee7b7' : '#fca5a5' }}>{qs?.selectedOption ?? 'N/A'}</strong></span>
                                                                        <span>Correct: <strong style={{ color: '#6ee7b7' }}>{question.correctOption}</strong></span>
                                                                    </div>
                                                                </div>
                                                            )
                                                        })}
                                                    </div>
                                                )}
                                            </div>
                                        )
                                    })}
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        )
    }

    // ── Student View ──────────────────────────────────────────────────
    const showFullReview = isPastDeadline // Only show full answers (green/red) after deadline

    const isReturned = !!submission
    const isLocked = !isReturned && isPastDeadline // Lock if not submitted and past deadline
    const statusColor = isLocked ? '#ef4444' : isReturned ? '#10b981' : '#f59e0b'

    // Build a map of questionId -> submission answer for returned quizzes
    const submissionMap: Record<number, { selectedOption: string; correct: boolean; correctOption?: string }> = {}
    if (submission?.questionSubmissions) {
        for (const qs of submission.questionSubmissions) {
            submissionMap[qs.questionId] = {
                selectedOption: qs.selectedOption,
                correct: qs.correct,
                correctOption: qs.correctOption,
            }
        }
    }

    return (
        <div className="container" style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
            <Button
                onClick={goBack}
                style={{ marginBottom: '1rem', background: 'transparent', border: '1px solid #374151' }}
            >
                ← {fromCourseId ? 'Back to Course' : 'Back to Quizzes'}
            </Button>

            <div className="card" style={{ padding: '2rem', backgroundColor: '#1f2937', borderRadius: '0.75rem', border: '1px solid #374151' }}>
                {/* Header */}
                <div style={{ borderLeft: `4px solid ${statusColor}`, paddingLeft: '1rem', marginBottom: '1.5rem' }}>
                    <h1 style={{ fontSize: '1.8rem', fontWeight: 'bold', color: 'white', marginBottom: '0.5rem' }}>
                        {quiz.title}
                    </h1>
                    <p style={{ color: '#9ca3af' }}>
                        {quiz.quizQuestionDtos.length} question{quiz.quizQuestionDtos.length !== 1 ? 's' : ''}
                    </p>
                </div>

                {/* Meta pills */}
                <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', flexWrap: 'wrap', fontSize: '0.9rem' }}>
                    <span style={{
                        padding: '0.25rem 0.75rem', borderRadius: '9999px',
                        backgroundColor: '#374151', color: '#e5e7eb'
                    }}>
                        Opens: {new Date(quiz.startDate).toLocaleString()}
                    </span>
                    <span style={{
                        padding: '0.25rem 0.75rem', borderRadius: '9999px',
                        backgroundColor: '#374151', color: '#e5e7eb'
                    }}>
                        Due: {new Date(quiz.endDate).toLocaleString()}
                    </span>

                    {isReturned && (
                        <span style={{
                            padding: '0.25rem 0.75rem', borderRadius: '9999px',
                            backgroundColor: 'rgba(16, 185, 129, 0.2)', color: '#6ee7b7',
                            fontWeight: 'bold', border: '1px solid #10b981'
                        }}>
                            Score: {submission!.score} / {quiz.quizQuestionDtos.length}
                        </span>
                    )}

                    <span style={{
                        padding: '0.25rem 0.75rem', borderRadius: '9999px',
                        backgroundColor: isLocked ? 'rgba(239, 68, 68, 0.2)' : isReturned ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                        color: isLocked ? '#fca5a5' : isReturned ? '#6ee7b7' : '#fcd34d',
                        border: `1px solid ${statusColor}`
                    }}>
                        {isLocked ? '🔒 Past Due' : isReturned ? 'Graded' : 'Upcoming'}
                    </span>
                </div>

                {/* Just-submitted result banner */}
                {justSubmitted && submission && (
                    <div style={{
                        marginBottom: '2rem', padding: '1.25rem', textAlign: 'center',
                        borderRadius: '0.75rem', border: '1px solid #10b981',
                        background: 'linear-gradient(135deg, rgba(16,185,129,0.15), rgba(16,185,129,0.05))',
                    }}>
                        <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#6ee7b7', margin: 0 }}>
                            🎉 Quiz Submitted!
                        </p>
                        <p style={{ fontSize: '2rem', fontWeight: 'bold', color: 'white', margin: '0.5rem 0' }}>
                            {submission.score} / {quiz.quizQuestionDtos.length}
                        </p>
                        <p style={{ color: '#9ca3af', margin: 0 }}>
                            {submission.score === quiz.quizQuestionDtos.length
                                ? 'Perfect score! 🌟'
                                : `You got ${submission.score} out of ${quiz.quizQuestionDtos.length} correct.`}
                        </p>
                        {!showFullReview && (
                            <p style={{ color: '#d1d5db', marginTop: '0.5rem', fontSize: '0.9rem' }}>
                                Full results (correct answers) will be available after the deadline: {endDate.toLocaleString()}
                            </p>
                        )}
                    </div>
                )}

                {/* Locked / Past Due Banner */}
                {isLocked && (
                    <div style={{
                        marginBottom: '2rem', padding: '1.25rem', textAlign: 'center',
                        borderRadius: '0.75rem', border: '1px solid rgba(239, 68, 68, 0.3)',
                        background: 'rgba(239, 68, 68, 0.1)',
                    }}>
                        <p style={{ color: '#fca5a5', fontSize: '1.2rem', fontWeight: 'bold', margin: '0' }}>
                            🔒 This quiz is past due
                        </p>
                        <p style={{ color: '#9ca3af', marginTop: '0.5rem' }}>
                            The deadline was {endDate.toLocaleString()}. Starting new attempts is no longer allowed.
                        </p>
                    </div>
                )}

                {/* Questions */}
                {isReturned && !showFullReview ? (
                    <div style={{ padding: '3rem', textAlign: 'center', color: '#9ca3af', borderTop: '1px solid #374151', borderBottom: '1px solid #374151' }}>
                        <p style={{ fontSize: '1.1rem' }}>
                            Questions and answers are hidden until the quiz closes on <strong>{endDate.toLocaleString()}</strong>.
                        </p>
                        <p style={{ fontSize: '0.9rem', marginTop: '0.5rem', opacity: 0.8 }}>
                            You scored {submission!.score} / {quiz.quizQuestionDtos.length}
                        </p>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', opacity: isLocked ? 0.6 : 1, pointerEvents: isLocked ? 'none' : 'auto' }}>
                        {quiz.quizQuestionDtos.map((question, index) => {
                            const sub = submissionMap[question.id]
                            const options = [
                                { key: 'A', text: question.optionA },
                                { key: 'B', text: question.optionB },
                                { key: 'C', text: question.optionC },
                                { key: 'D', text: question.optionD },
                            ]

                            return (
                                <div
                                    key={question.id}
                                    style={{
                                        padding: '1.25rem',
                                        backgroundColor: '#111827',
                                        borderRadius: '0.75rem',
                                        border: sub && showFullReview
                                            ? sub.correct
                                                ? '1px solid rgba(16,185,129,0.3)'
                                                : '1px solid rgba(239,68,68,0.3)'
                                            : '1px solid #374151',
                                    }}
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                                        <h4 style={{ color: 'white', fontWeight: '600', margin: 0 }}>
                                            {index + 1}. {question.question}
                                        </h4>
                                        {sub && showFullReview && (
                                            <span style={{
                                                flexShrink: 0, marginLeft: '0.75rem',
                                                padding: '0.15rem 0.5rem', borderRadius: '9999px', fontSize: '0.75rem',
                                                backgroundColor: sub.correct ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)',
                                                color: sub.correct ? '#6ee7b7' : '#fca5a5',
                                                border: `1px solid ${sub.correct ? '#10b981' : '#ef4444'}`,
                                            }}>
                                                {sub.correct ? '✓ Correct' : '✗ Wrong'}
                                            </span>
                                        )}
                                    </div>

                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                        {options.map((opt) => {
                                            const isSelected = isReturned
                                                ? sub?.selectedOption === opt.key
                                                : answers[question.id] === opt.key
                                            const isCorrectOption = showFullReview && sub?.correctOption === opt.key

                                            let optionStyle: React.CSSProperties = {
                                                display: 'flex', alignItems: 'center', gap: '0.75rem',
                                                padding: '0.75rem 1rem', borderRadius: '0.5rem',
                                                cursor: isReturned || isLocked ? 'default' : 'pointer',
                                                transition: 'all 0.15s ease',
                                                border: '1px solid #374151',
                                                backgroundColor: '#1f2937',
                                                color: '#d1d5db',
                                            }

                                            if (isReturned && sub && showFullReview) {
                                                // Always highlight the correct option in green
                                                if (isCorrectOption) {
                                                    optionStyle = {
                                                        ...optionStyle,
                                                        backgroundColor: 'rgba(16,185,129,0.15)',
                                                        borderColor: '#10b981',
                                                        color: '#6ee7b7',
                                                    }
                                                }
                                                // Highlight wrong selection in red
                                                if (isSelected && !sub.correct) {
                                                    optionStyle = {
                                                        ...optionStyle,
                                                        backgroundColor: 'rgba(239,68,68,0.15)',
                                                        borderColor: '#ef4444',
                                                        color: '#fca5a5',
                                                    }
                                                }
                                            } else if (isSelected) {
                                                optionStyle = {
                                                    ...optionStyle,
                                                    backgroundColor: 'rgba(59,130,246,0.15)',
                                                    borderColor: '#3b82f6',
                                                    color: '#93c5fd',
                                                }
                                            }

                                            return (
                                                <label
                                                    key={opt.key}
                                                    style={optionStyle}
                                                    onMouseEnter={(e) => {
                                                        if (!isReturned && !isLocked) {
                                                            (e.currentTarget as HTMLElement).style.borderColor = '#6b7280'
                                                        }
                                                    }}
                                                    onMouseLeave={(e) => {
                                                        if (!isReturned && !isLocked && !isSelected) {
                                                            (e.currentTarget as HTMLElement).style.borderColor = '#374151'
                                                        }
                                                    }}
                                                >
                                                    <input
                                                        type="radio"
                                                        name={`question-${question.id}`}
                                                        value={opt.key}
                                                        checked={isSelected}
                                                        disabled={isReturned || isLocked}
                                                        onChange={() => handleOptionSelect(question.id, opt.key)}
                                                        style={{ display: 'none' }}
                                                    />
                                                    <span style={{
                                                        width: '1.75rem', height: '1.75rem', borderRadius: '50%',
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                        fontSize: '0.8rem', fontWeight: '600', flexShrink: 0,
                                                        border: isCorrectOption
                                                            ? '2px solid #10b981'
                                                            : isSelected
                                                                ? isReturned && showFullReview
                                                                    ? sub?.correct
                                                                        ? '2px solid #10b981'
                                                                        : '2px solid #ef4444'
                                                                    : '2px solid #3b82f6'
                                                                : '2px solid #4b5563',
                                                        backgroundColor: isCorrectOption
                                                            ? 'rgba(16,185,129,0.3)'
                                                            : isSelected
                                                                ? isReturned && showFullReview
                                                                    ? sub?.correct
                                                                        ? 'rgba(16,185,129,0.3)'
                                                                        : 'rgba(239,68,68,0.3)'
                                                                    : 'rgba(59,130,246,0.3)'
                                                                : 'transparent',
                                                        color: isSelected || isCorrectOption ? 'white' : '#9ca3af',
                                                    }}>
                                                        {opt.key}
                                                    </span>
                                                    <span style={{ flex: 1 }}>{opt.text}</span>
                                                    {showFullReview && isCorrectOption && (
                                                        <span style={{ color: '#4ade80', fontSize: '0.75rem', fontWeight: 600 }}>✓ Correct</span>
                                                    )}
                                                    {showFullReview && isSelected && !sub?.correct && (
                                                        <span style={{ color: '#f87171', fontSize: '0.75rem', fontWeight: 600 }}>✗ Your answer</span>
                                                    )}
                                                </label>
                                            )
                                        })}
                                    </div>

                                    {/* Answer summary bar */}
                                    {showFullReview && sub && (
                                        <div style={{
                                            marginTop: '0.5rem',
                                            padding: '0.4rem 0.75rem',
                                            borderRadius: '0.5rem',
                                            background: sub.correct ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)',
                                            fontSize: '0.8rem',
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                        }}>
                                            <span style={{ color: '#9ca3af' }}>
                                                Your answer: <strong style={{ color: sub.correct ? '#6ee7b7' : '#fca5a5' }}>{sub.selectedOption}</strong>
                                            </span>
                                            <span style={{ color: '#9ca3af' }}>
                                                Correct answer: <strong style={{ color: '#6ee7b7' }}>{sub.correctOption ?? '—'}</strong>
                                            </span>
                                        </div>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                )}

                {/* Submit area */}
                {!isReturned && !isLocked && (
                    <div style={{
                        marginTop: '2rem', paddingTop: '2rem', borderTop: '1px solid #374151',
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    }}>
                        <p style={{ color: '#9ca3af', margin: 0 }}>
                            {Object.keys(answers).length}/{quiz.quizQuestionDtos.length} answered
                        </p>
                        <Button
                            onClick={handleSubmit}
                            disabled={submitting || Object.keys(answers).length === 0}
                            variant="primary"
                        >
                            {submitting ? 'Submitting...' : 'Submit Quiz'}
                        </Button>
                    </div>
                )}

                {/* Returned info */}
                {isReturned && !justSubmitted && submission && (
                    <div style={{
                        marginTop: '2rem', paddingTop: '2rem', borderTop: '1px solid #374151',
                        textAlign: 'center',
                    }}>
                        <p style={{ color: '#9ca3af', margin: 0 }}>
                            Submitted on {new Date(submission.submittedAt).toLocaleString()}
                            {' · '}
                            Score: <strong style={{ color: '#6ee7b7' }}>{submission.score}/{quiz.quizQuestionDtos.length}</strong>
                        </p>
                    </div>
                )}
            </div>
        </div>
    )
}
