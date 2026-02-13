import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
    fetchQuizById,
    fetchMyQuizSubmission,
    submitQuiz,
    QuizDto,
    QuizSubmissionDto,
} from '../api/quizzes'
import { Button } from '../components/Button'

export const QuizDetailsPage: React.FC = () => {
    const { id } = useParams<{ id: string }>()
    const navigate = useNavigate()

    const [quiz, setQuiz] = useState<QuizDto | null>(null)
    const [submission, setSubmission] = useState<QuizSubmissionDto | null>(null)
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

            // Check if student already has a submission (uses auth context)
            if (quizData) {
                const sub = await fetchMyQuizSubmission(quizData.id)
                if (sub) setSubmission(sub)
            }
            setLoading(false)
        }
        load()
    }, [id])

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
                <Button onClick={() => navigate('/quizzes')}>Back to Quizzes</Button>
            </div>
        )
    }

    const isReturned = !!submission
    const statusColor = isReturned ? '#10b981' : '#f59e0b'

    // Build a map of questionId -> submission answer for returned quizzes
    const submissionMap: Record<number, { selectedOption: string; correct: boolean }> = {}
    if (submission?.questionSubmissions) {
        for (const qs of submission.questionSubmissions) {
            submissionMap[qs.questionId] = {
                selectedOption: qs.selectedOption,
                correct: qs.correct,
            }
        }
    }

    return (
        <div className="container" style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
            <Button
                onClick={() => navigate('/quizzes')}
                style={{ marginBottom: '1rem', background: 'transparent', border: '1px solid #374151' }}
            >
                ← Back to Quizzes
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
                        backgroundColor: isReturned ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                        color: isReturned ? '#6ee7b7' : '#fcd34d',
                        border: `1px solid ${statusColor}`
                    }}>
                        {isReturned ? 'Graded' : 'Upcoming'}
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
                    </div>
                )}

                {/* Questions */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
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
                                    border: sub
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
                                    {sub && (
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

                                        let optionStyle: React.CSSProperties = {
                                            display: 'flex', alignItems: 'center', gap: '0.75rem',
                                            padding: '0.75rem 1rem', borderRadius: '0.5rem',
                                            cursor: isReturned ? 'default' : 'pointer',
                                            transition: 'all 0.15s ease',
                                            border: '1px solid #374151',
                                            backgroundColor: '#1f2937',
                                            color: '#d1d5db',
                                        }

                                        if (isReturned && sub) {
                                            if (sub.selectedOption === opt.key) {
                                                optionStyle = {
                                                    ...optionStyle,
                                                    backgroundColor: sub.correct
                                                        ? 'rgba(16,185,129,0.15)'
                                                        : 'rgba(239,68,68,0.15)',
                                                    borderColor: sub.correct ? '#10b981' : '#ef4444',
                                                    color: sub.correct ? '#6ee7b7' : '#fca5a5',
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
                                                    if (!isReturned) {
                                                        (e.currentTarget as HTMLElement).style.borderColor = '#6b7280'
                                                    }
                                                }}
                                                onMouseLeave={(e) => {
                                                    if (!isReturned && !isSelected) {
                                                        (e.currentTarget as HTMLElement).style.borderColor = '#374151'
                                                    }
                                                }}
                                            >
                                                <input
                                                    type="radio"
                                                    name={`question-${question.id}`}
                                                    value={opt.key}
                                                    checked={isSelected}
                                                    disabled={isReturned}
                                                    onChange={() => handleOptionSelect(question.id, opt.key)}
                                                    style={{ display: 'none' }}
                                                />
                                                <span style={{
                                                    width: '1.75rem', height: '1.75rem', borderRadius: '50%',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    fontSize: '0.8rem', fontWeight: '600', flexShrink: 0,
                                                    border: isSelected
                                                        ? isReturned
                                                            ? sub?.correct
                                                                ? '2px solid #10b981'
                                                                : '2px solid #ef4444'
                                                            : '2px solid #3b82f6'
                                                        : '2px solid #4b5563',
                                                    backgroundColor: isSelected
                                                        ? isReturned
                                                            ? sub?.correct
                                                                ? 'rgba(16,185,129,0.3)'
                                                                : 'rgba(239,68,68,0.3)'
                                                            : 'rgba(59,130,246,0.3)'
                                                        : 'transparent',
                                                    color: isSelected ? 'white' : '#9ca3af',
                                                }}>
                                                    {opt.key}
                                                </span>
                                                <span>{opt.text}</span>
                                            </label>
                                        )
                                    })}
                                </div>
                            </div>
                        )
                    })}
                </div>

                {/* Submit area */}
                {!isReturned && (
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
