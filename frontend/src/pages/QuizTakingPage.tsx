import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
    fetchQuizById,
    submitQuiz,
    fetchMyQuizSubmission,
    type QuizDto,
    type QuizSubmissionDto
} from '../api/quizzes'
import { Button } from '../components/Button'

export function QuizTakingPage() {
    const { courseId, quizId } = useParams<{ courseId: string, quizId: string }>()
    const navigate = useNavigate()

    const [quiz, setQuiz] = useState<QuizDto | null>(null)
    const [submission, setSubmission] = useState<QuizSubmissionDto | null>(null)
    const [loading, setLoading] = useState(true)
    const [submitting, setSubmitting] = useState(false)
    const [error, setError] = useState<string | null>(null)

    // Answers state: Map questionId -> selectedOption
    const [answers, setAnswers] = useState<Record<number, string>>({})

    useEffect(() => {
        loadData()
    }, [quizId])

    const loadData = async () => {
        if (!quizId) return
        try {
            setLoading(true)
            const quizData = await fetchQuizById(parseInt(quizId))
            if (!quizData) throw new Error('Quiz not found')
            setQuiz(quizData)

            // Check if already submitted
            const sub = await fetchMyQuizSubmission(parseInt(quizId))
            if (sub) setSubmission(sub)

        } catch (err) {
            setError('Failed to load quiz')
        } finally {
            setLoading(false)
        }
    }

    const handleOptionSelect = (questionId: number, option: string) => {
        if (submission) return // Already submitted
        setAnswers(prev => ({ ...prev, [questionId]: option }))
    }

    const handleSubmit = async () => {
        if (!quiz) return

        // Ensure all questions answered? Optional, but good UX.
        const unanswered = quiz.quizQuestionDtos.filter(q => !answers[q.id])
        if (unanswered.length > 0) {
            if (!confirm(`You have not answered ${unanswered.length} questions. Submit anyway?`)) return
        }

        try {
            setSubmitting(true)
            const payload = Object.entries(answers).map(([qId, opt]) => ({
                questionId: parseInt(qId),
                selectedOption: opt
            }))

            const result = await submitQuiz(quiz.id, payload)
            setSubmission(result)
            window.scrollTo(0, 0)
        } catch (err) {
            alert('Failed to submit quiz. Please try again.')
        } finally {
            setSubmitting(false)
        }
    }

    if (loading) return <div className="page-container"><div className="courses-message">Loading...</div></div>
    if (error || !quiz) return <div className="page-container"><div className="courses-message courses-message-error">{error}</div></div>

    // If submitted, show results
    if (submission) {
        return (
            <div className="page-container">
                <Button
                    onClick={() => navigate(`/course/${courseId}`)}
                    variant="ghost"
                    style={{ paddingLeft: 0, marginTop: '2rem', marginBottom: '1rem' }}
                >
                    ← Back to Course
                </Button>

                <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
                    <h1 className="course-title" style={{ marginBottom: '1rem' }}>{quiz.title} Results</h1>
                    <div style={{
                        fontSize: '3rem', fontWeight: 800,
                        color: submission.score && submission.score >= 70 ? '#4ade80' : '#fbbf24'
                    }}>
                        {submission.score}%
                    </div>
                    <p style={{ color: '#94a3b8' }}>Submitted on {new Date(submission.submittedAt).toLocaleString()}</p>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                    {quiz.quizQuestionDtos.map((q, index) => {
                        const userAns = submission.questionSubmissions.find(qs => qs.questionId === q.id)
                        const isCorrect = userAns?.correct
                        console.log(userAns);

                        return (
                            <div key={q.id} style={{
                                background: 'rgba(30, 41, 59, 0.4)',
                                border: `1px solid ${isCorrect ? 'rgba(34, 197, 94, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                                borderRadius: '0.75rem',
                                padding: '1.5rem'
                            }}>
                                <h4 style={{ margin: '0 0 1rem 0', fontSize: '1.1rem', color: '#e5e7eb' }}>
                                    {index + 1}. {q.question}
                                </h4>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                                    {[
                                        { label: 'A', text: q.optionA },
                                        { label: 'B', text: q.optionB },
                                        { label: 'C', text: q.optionC },
                                        { label: 'D', text: q.optionD }
                                    ].map((opt) => {
                                        const isSelected = userAns?.selectedOption === opt.label

                                        // Note: Backend now returns correctOption in the submission DTO.


                                        let bg = 'rgba(15, 23, 42, 0.4)'
                                        let borderColor = 'transparent'

                                        if (isSelected) {
                                            if (isCorrect) {
                                                bg = 'rgba(34, 197, 94, 0.2)'
                                                borderColor = 'rgba(34, 197, 94, 0.5)'
                                            } else {
                                                bg = 'rgba(239, 68, 68, 0.2)'
                                                borderColor = 'rgba(239, 68, 68, 0.5)'
                                            }
                                        }

                                        // Highlight the correct answer if the user got it wrong (or didn't answer)
                                        const isActuallyCorrect = userAns?.correctOption === opt.label
                                        if (isActuallyCorrect && !isCorrect) {
                                            bg = 'rgba(34, 197, 94, 0.1)'
                                            borderColor = 'rgba(34, 197, 94, 0.3)'
                                        }

                                        return (
                                            <div key={opt.label} style={{
                                                padding: '0.75rem 1rem',
                                                borderRadius: '0.5rem',
                                                background: bg,
                                                border: `1px solid ${borderColor}`,
                                                color: isSelected ? 'white' : '#94a3b8',
                                            }}>
                                                <span style={{ fontWeight: 'bold', marginRight: '0.5rem' }}>{opt.label}.</span>
                                                {opt.text}
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>
        )
    }

    // Quiz Taking UI
    return (
        <div className="page-container">
            <Button
                onClick={() => navigate(`/course/${courseId}`)}
                variant="ghost"
                style={{ paddingLeft: 0, marginTop: '2rem', marginBottom: '1rem' }}
            >
                ← Cancel
            </Button>

            <div className="course-header">
                <h1 className="course-title">{quiz.title}</h1>
                <p style={{ color: '#94a3b8' }}>
                    Questions: {quiz.quizQuestionDtos.length} • Due: {new Date(quiz.endDate).toLocaleString()}
                </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', marginBottom: '3rem' }}>
                {quiz.quizQuestionDtos.map((q, index) => (
                    <div key={q.id} style={{
                        background: 'rgba(30, 41, 59, 0.4)',
                        border: '1px solid rgba(148, 163, 184, 0.1)',
                        borderRadius: '0.75rem',
                        padding: '1.5rem'
                    }}>
                        <h4 style={{ margin: '0 0 1rem 0', fontSize: '1.1rem', color: '#e5e7eb' }}>
                            {index + 1}. {q.question}
                        </h4>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            {[
                                { label: 'A', text: q.optionA },
                                { label: 'B', text: q.optionB },
                                { label: 'C', text: q.optionC },
                                { label: 'D', text: q.optionD }
                            ].map((opt) => (
                                <label key={opt.label} style={{
                                    display: 'flex', alignItems: 'center', gap: '1rem',
                                    padding: '0.75rem 1rem',
                                    borderRadius: '0.5rem',
                                    background: answers[q.id] === opt.label ? 'rgba(99, 102, 241, 0.2)' : 'rgba(15, 23, 42, 0.4)',
                                    border: `1px solid ${answers[q.id] === opt.label ? 'rgba(99, 102, 241, 0.5)' : 'rgba(148, 163, 184, 0.1)'}`,
                                    cursor: 'pointer',
                                    transition: 'all 0.2s'
                                }}>
                                    <input
                                        type="radio"
                                        name={`q-${q.id}`}
                                        value={opt.label}
                                        checked={answers[q.id] === opt.label}
                                        onChange={() => handleOptionSelect(q.id, opt.label)}
                                        style={{ accentColor: '#6366f1', width: '1.2rem', height: '1.2rem' }}
                                    />
                                    <span style={{ color: 'white' }}>{opt.text}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '4rem' }}>
                <Button
                    onClick={handleSubmit}
                    disabled={submitting}
                    style={{ fontSize: '1.2rem', padding: '1rem 3rem' }}
                >
                    {submitting ? 'Submitting...' : 'Submit Quiz'}
                </Button>
            </div>
        </div>
    )
}
