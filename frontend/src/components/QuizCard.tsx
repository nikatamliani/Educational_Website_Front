import React from 'react'
import { Quiz } from '../api/quizzes'
import { useNavigate } from 'react-router-dom'

interface QuizCardProps {
    quiz: Quiz
}

export const QuizCard: React.FC<QuizCardProps> = ({ quiz }) => {
    const navigate = useNavigate()

    const getStatusColor = () => {
        return quiz.status === 'returned' ? '#10b981' : '#f59e0b'
    }

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString(undefined, {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        })
    }

    return (
        <article
            className="course-card"
            onClick={() => navigate(`/quiz/${quiz.id}`)}
            style={{
                display: 'flex',
                cursor: 'pointer',
                flexDirection: 'column',
                gap: '0.5rem',
                position: 'relative',
                overflow: 'hidden',
            }}
        >
            <div
                style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '4px',
                    height: '100%',
                    backgroundColor: getStatusColor(),
                }}
            />
            <div style={{ marginLeft: '0.5rem' }}>
                <p style={{ fontSize: '0.8rem', color: '#9ca3af', marginBottom: '0.2rem' }}>
                    {quiz.courseTitle}
                </p>
                <h3 className="course-title" style={{ fontSize: '1.1rem' }}>
                    {quiz.title}
                </h3>
                <p className="course-description" style={{ fontSize: '0.9rem' }}>
                    {quiz.questionCount} question{quiz.questionCount !== 1 ? 's' : ''}
                </p>

                <div className="course-meta" style={{ marginTop: '0.8rem' }}>
                    {quiz.status === 'upcoming' && (
                        <>
                            <span className="course-pill" style={{ borderColor: '#f59e0b', color: '#fcd34d' }}>
                                Opens: {formatDate(quiz.startDate)}
                            </span>
                            <span className="course-pill" style={{ borderColor: '#f59e0b', color: '#fcd34d' }}>
                                Due: {formatDate(quiz.endDate)}
                            </span>
                        </>
                    )}

                    {quiz.status === 'returned' && (
                        <>
                            <span className="course-pill" style={{ borderColor: '#10b981', color: '#6ee7b7' }}>
                                Score: {quiz.score}/{quiz.totalQuestions}
                            </span>
                            {quiz.submittedAt && (
                                <span className="course-pill" style={{ borderColor: '#10b981', color: '#6ee7b7' }}>
                                    Submitted: {formatDate(quiz.submittedAt)}
                                </span>
                            )}
                        </>
                    )}
                </div>
            </div>
        </article>
    )
}
