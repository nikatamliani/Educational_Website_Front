import { useEffect, useState } from 'react'
import { fetchStudentAssignments, type Assignment } from '../api/assignments'
import { AssignmentCard } from '../components/AssignmentCard'

type Tab = 'upcoming' | 'submitted' | 'returned'

export function AssignmentsPage() {
    const [assignments, setAssignments] = useState<Assignment[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [activeTab, setActiveTab] = useState<Tab>('upcoming')

    useEffect(() => {
        let isMounted = true

        async function loadAssignments() {
            try {
                setLoading(true)
                const data = await fetchStudentAssignments()
                if (isMounted) {
                    setAssignments(data)
                }
            } catch (err) {
                if (isMounted) {
                    setError('Failed to load assignments.')
                }
            } finally {
                if (isMounted) {
                    setLoading(false)
                }
            }
        }

        loadAssignments()

        return () => {
            isMounted = false
        }
    }, [])

    const filteredAssignments = assignments.filter((a) => a.status === activeTab)

    return (
        <div className="width-full">
            <h1 className="page-title">Assignments</h1>
            <p className="page-description">
                Track your upcoming deadlines and graded work.
            </p>

            <div className="student-nav" style={{ marginBottom: '1.5rem' }}>
                <button
                    className={`student-nav-item ${activeTab === 'upcoming' ? 'student-nav-item-active' : ''}`}
                    onClick={() => setActiveTab('upcoming')}
                >
                    Upcoming
                </button>
                <button
                    className={`student-nav-item ${activeTab === 'submitted' ? 'student-nav-item-active' : ''}`}
                    onClick={() => setActiveTab('submitted')}
                >
                    Submitted
                </button>
                <button
                    className={`student-nav-item ${activeTab === 'returned' ? 'student-nav-item-active' : ''}`}
                    onClick={() => setActiveTab('returned')}
                >
                    Returned
                </button>
            </div>

            <div className="courses-section">
                {loading && <div className="courses-message">Loading assignments...</div>}
                {error && <div className="courses-message courses-message-error">{error}</div>}

                {!loading && !error && filteredAssignments.length === 0 && (
                    <div className="courses-message">
                        No {activeTab} assignments found.
                    </div>
                )}

                {!loading && !error && filteredAssignments.length > 0 && (
                    <div className="courses-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
                        {filteredAssignments.map((assignment) => (
                            <AssignmentCard key={assignment.id} assignment={assignment} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
