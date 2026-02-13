import { useEffect, useState } from 'react'
import { fetchStudentQuizzes, type Quiz } from '../api/quizzes'
import { QuizCard } from '../components/QuizCard'

type Tab = 'upcoming' | 'returned'

export function QuizzesPage() {
    const [quizzes, setQuizzes] = useState<Quiz[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [activeTab, setActiveTab] = useState<Tab>('upcoming')

    useEffect(() => {
        let isMounted = true

        async function loadQuizzes() {
            try {
                setLoading(true)
                const data = await fetchStudentQuizzes()
                if (isMounted) {
                    setQuizzes(data)
                }
            } catch (err) {
                if (isMounted) {
                    setError('Failed to load quizzes.')
                }
            } finally {
                if (isMounted) {
                    setLoading(false)
                }
            }
        }

        loadQuizzes()

        return () => {
            isMounted = false
        }
    }, [])

    const filteredQuizzes = quizzes.filter((q) => q.status === activeTab)

    return (
        <div className="width-full">
            <h1 className="page-title">Quizzes</h1>
            <p className="page-description">
                Take upcoming quizzes and review your results.
            </p>

            <div className="student-nav" style={{ marginBottom: '1.5rem' }}>
                <button
                    className={`student-nav-item ${activeTab === 'upcoming' ? 'student-nav-item-active' : ''}`}
                    onClick={() => setActiveTab('upcoming')}
                >
                    Upcoming
                </button>
                <button
                    className={`student-nav-item ${activeTab === 'returned' ? 'student-nav-item-active' : ''}`}
                    onClick={() => setActiveTab('returned')}
                >
                    Returned
                </button>
            </div>

            <div className="courses-section">
                {loading && <div className="courses-message">Loading quizzes...</div>}
                {error && <div className="courses-message courses-message-error">{error}</div>}

                {!loading && !error && filteredQuizzes.length === 0 && (
                    <div className="courses-message">
                        No {activeTab} quizzes found.
                    </div>
                )}

                {!loading && !error && filteredQuizzes.length > 0 && (
                    <div className="courses-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
                        {filteredQuizzes.map((quiz) => (
                            <QuizCard key={quiz.id} quiz={quiz} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
