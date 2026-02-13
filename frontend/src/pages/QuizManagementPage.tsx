import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
    fetchQuizById,
    saveQuiz,
    saveQuestion,
    deleteQuestion,
    type QuizDto,
    type QuizQuestionDto
} from '../api/quizzes'
import { Button } from '../components/Button'
import { QuizForm } from '../components/QuizForm'
import { QuestionForm } from '../components/QuestionForm'

export function QuizManagementPage() {
    const { courseId, quizId } = useParams<{ courseId: string, quizId: string }>()
    const navigate = useNavigate()

    const [quiz, setQuiz] = useState<QuizDto | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    // UI State
    const [isEditingDetails, setIsEditingDetails] = useState(false)
    const [isAddingQuestion, setIsAddingQuestion] = useState(false)
    const [editingQuestionId, setEditingQuestionId] = useState<number | null>(null)

    useEffect(() => {
        loadQuiz()
    }, [quizId])

    const loadQuiz = async () => {
        if (!quizId) return
        try {
            setLoading(true)
            const data = await fetchQuizById(parseInt(quizId))
            if (!data) throw new Error('Quiz not found')
            setQuiz(data)
        } catch (err) {
            setError('Failed to load quiz')
        } finally {
            setLoading(false)
        }
    }

    const handleSaveQuizDetails = async (data: Partial<QuizDto>) => {
        if (!quiz) return
        try {
            const updated = await saveQuiz({ ...data, id: quiz.id, courseId: quiz.courseId })
            setQuiz(updated)
            setIsEditingDetails(false)
        } catch (err) {
            alert('Failed to update quiz details')
        }
    }

    const handleSaveQuestion = async (data: Partial<QuizQuestionDto>) => {
        if (!quiz) return
        try {
            await saveQuestion({ ...data, quizId: quiz.id })
            // Refresh quiz to get updated questions
            await loadQuiz()
            setIsAddingQuestion(false)
            setEditingQuestionId(null)
        } catch (err) {
            alert('Failed to save question')
        }
    }

    const handleDeleteQuestion = async (id: number) => {
        if (!confirm('Delete this question?')) return
        try {
            await deleteQuestion(id)
            await loadQuiz()
        } catch (err) {
            alert('Failed to delete question')
        }
    }

    if (loading) return <div className="page-container"><div className="courses-message">Loading...</div></div>
    if (error || !quiz) return <div className="page-container"><div className="courses-message courses-message-error">{error}</div></div>

    return (
        <div className="page-container">
            <Button
                onClick={() => navigate(`/course/${courseId}`)}
                variant="ghost"
                style={{ paddingLeft: 0, marginTop: '2rem', marginBottom: '1rem' }}
            >
                ← Back to Course
            </Button>

            <div className="course-header">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                        <h1 className="course-title">{quiz.title}</h1>
                        <div style={{ display: 'flex', gap: '2rem', color: '#94a3b8', fontSize: '0.9rem' }}>
                            <span>Start: {new Date(quiz.startDate).toLocaleString()}</span>
                            <span>End: {new Date(quiz.endDate).toLocaleString()}</span>
                        </div>
                    </div>
                    <Button onClick={() => setIsEditingDetails(true)}>Edit Details</Button>
                </div>
            </div>

            {isEditingDetails && (
                <div style={{ marginBottom: '2rem' }}>
                    <QuizForm
                        initialData={quiz}
                        onSubmit={handleSaveQuizDetails}
                        onCancel={() => setIsEditingDetails(false)}
                        submitLabel="Update Quiz"
                    />
                </div>
            )}

            <div className="course-section">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <h2>Questions ({quiz.quizQuestionDtos?.length || 0})</h2>
                    {!isAddingQuestion && !editingQuestionId && (
                        <Button onClick={() => setIsAddingQuestion(true)}>+ Add Question</Button>
                    )}
                </div>

                {isAddingQuestion && (
                    <QuestionForm
                        onSubmit={handleSaveQuestion}
                        onCancel={() => setIsAddingQuestion(false)}
                    />
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {quiz.quizQuestionDtos?.map((q, index) => (
                        <div key={q.id}>
                            {editingQuestionId === q.id ? (
                                <QuestionForm
                                    initialData={q}
                                    onSubmit={handleSaveQuestion}
                                    onCancel={() => setEditingQuestionId(null)}
                                />
                            ) : (
                                <div style={{
                                    background: 'rgba(30, 41, 59, 0.4)',
                                    border: '1px solid rgba(148, 163, 184, 0.1)',
                                    borderRadius: '0.75rem',
                                    padding: '1.5rem',
                                    position: 'relative'
                                }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                                        <h4 style={{ margin: 0, fontSize: '1.1rem', color: '#e5e7eb' }}>
                                            {index + 1}. {q.question}
                                        </h4>
                                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                                            <Button
                                                variant="ghost"
                                                onClick={() => setEditingQuestionId(q.id)}
                                                style={{ color: '#fbbf24', borderColor: 'rgba(251, 191, 36, 0.3)' }}
                                            >
                                                Edit
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                onClick={() => handleDeleteQuestion(q.id)}
                                                style={{ color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.3)' }}
                                            >
                                                Delete
                                            </Button>
                                        </div>
                                    </div>

                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                                        {[
                                            { label: 'A', text: q.optionA },
                                            { label: 'B', text: q.optionB },
                                            { label: 'C', text: q.optionC },
                                            { label: 'D', text: q.optionD }
                                        ].map((opt) => (
                                            <div key={opt.label} style={{
                                                padding: '0.5rem 1rem',
                                                borderRadius: '0.5rem',
                                                background: q.correctOption === opt.label ? 'rgba(34, 197, 94, 0.2)' : 'rgba(15, 23, 42, 0.4)',
                                                border: `1px solid ${q.correctOption === opt.label ? 'rgba(34, 197, 94, 0.4)' : 'transparent'}`,
                                                color: q.correctOption === opt.label ? '#4ade80' : '#94a3b8',
                                                fontSize: '0.9rem'
                                            }}>
                                                <span style={{ fontWeight: 'bold', marginRight: '0.5rem' }}>{opt.label}:</span>
                                                {opt.text}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}

                    {!quiz.quizQuestionDtos?.length && !isAddingQuestion && (
                        <div className="courses-message" style={{ textAlign: 'center', padding: '2rem' }}>
                            No questions added yet.
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
