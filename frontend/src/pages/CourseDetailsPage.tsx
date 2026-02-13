import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { fetchCourseById, fetchMyCourses, fetchTeacherCourses } from '../api/courses'
import { fetchAssignmentsByCourseId, createAssignment, deleteAssignment, type CourseAssignment, type CreateAssignmentPayload } from '../api/assignments'
import { fetchQuizzesByCourseId, type CourseQuiz } from '../api/quizzes'
import { enrollInCourse, deleteCourse, type Course } from '../api/courses'
import { Button } from '../components/Button'
import { useAuth } from '../context/AuthContext'

type TeacherCourseTab = 'assignments' | 'quizzes'

export function CourseDetailsPage() {
    const { id } = useParams<{ id: string }>()
    const navigate = useNavigate()
    const { isAuthenticated, user } = useAuth()
    const isTeacher = user?.role === 'teacher'

    const [course, setCourse] = useState<Course | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [enrolling, setEnrolling] = useState(false)
    const [isEnrolled, setIsEnrolled] = useState(false)
    const [isOwnCourse, setIsOwnCourse] = useState(false)

    // Teacher tabs state
    const [teacherTab, setTeacherTab] = useState<TeacherCourseTab>('assignments')
    const [assignments, setAssignments] = useState<CourseAssignment[]>([])
    const [quizzes, setQuizzes] = useState<CourseQuiz[]>([])
    const [tabLoading, setTabLoading] = useState(false)

    // Create assignment form state
    const [showCreateForm, setShowCreateForm] = useState(false)
    const [creating, setCreating] = useState(false)
    const [createError, setCreateError] = useState<string | null>(null)
    const [newAssignment, setNewAssignment] = useState<CreateAssignmentPayload>({
        courseId: 0,
        title: '',
        description: '',
        content: '',
        startDate: '',
        deadline: '',
    })

    useEffect(() => {
        let isMounted = true

        async function loadData() {
            if (!id) return

            try {
                setLoading(true)
                const courseId = parseInt(id, 10)
                if (isNaN(courseId)) {
                    throw new Error('Invalid course ID')
                }

                const courseData = await fetchCourseById(courseId)

                if (isAuthenticated) {
                    if (isTeacher) {
                        const teacherCourses = await fetchTeacherCourses()
                        const owns = teacherCourses.some((c) => c.id === courseData.id)
                        if (isMounted) {
                            setIsOwnCourse(owns)
                        }
                    } else {
                        const myCourses = await fetchMyCourses()
                        if (isMounted) {
                            setIsEnrolled(myCourses.some((c) => c.id === courseData.id))
                        }
                    }
                }

                if (isMounted) {
                    setCourse(courseData)
                }
            } catch (err) {
                if (isMounted) {
                    const message = err instanceof Error ? err.message : 'Failed to load course details.'
                    setError(message)
                }
            } finally {
                if (isMounted) {
                    setLoading(false)
                }
            }
        }

        loadData()

        return () => {
            isMounted = false
        }
    }, [id, isAuthenticated, isTeacher])

    // Load tab data when teacher tab changes or course loads
    useEffect(() => {
        if (!isOwnCourse || !course) return

        let isMounted = true

        async function loadTabData() {
            setTabLoading(true)
            try {
                if (teacherTab === 'assignments') {
                    const data = await fetchAssignmentsByCourseId(course!.id)
                    if (isMounted) setAssignments(data)
                } else {
                    const data = await fetchQuizzesByCourseId(course!.id)
                    if (isMounted) setQuizzes(data)
                }
            } catch (err) {
                console.error('Failed to load tab data:', err)
            } finally {
                if (isMounted) setTabLoading(false)
            }
        }

        loadTabData()
        return () => { isMounted = false }
    }, [isOwnCourse, course, teacherTab])

    const handleEnroll = async () => {
        if (!course) return
        if (!isAuthenticated) {
            navigate('/login')
            return
        }

        try {
            setEnrolling(true)
            await enrollInCourse(course.id)
            setIsEnrolled(true)
            alert('Successfully enrolled!')
            navigate('/my-courses')
        } catch (err) {
            console.error(err)
            alert('Failed to enroll. Please try again.')
        } finally {
            setEnrolling(false)
        }
    }

    const handleDelete = async () => {
        if (!course || !isOwnCourse) return

        if (window.confirm('Are you sure you want to delete this course? This action cannot be undone and will delete all associated assignments and quizzes.')) {
            try {
                await deleteCourse(course.id)
                alert('Course deleted successfully.')
                navigate('/my-courses')
            } catch (err) {
                console.error(err)
                alert('Failed to delete course. Please try again.')
            }
        }
    }

    const handleCreateAssignment = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!course || !newAssignment.title.trim()) return

        try {
            setCreating(true)
            setCreateError(null)
            await createAssignment({
                ...newAssignment,
                courseId: course.id,
                startDate: newAssignment.startDate || undefined,
                deadline: newAssignment.deadline || undefined,
            })
            // Refresh assignment list
            const data = await fetchAssignmentsByCourseId(course.id)
            setAssignments(data)
            // Reset form
            setNewAssignment({ courseId: 0, title: '', description: '', content: '', startDate: '', deadline: '' })
            setShowCreateForm(false)
        } catch (err) {
            setCreateError(err instanceof Error ? err.message : 'Failed to create assignment.')
        } finally {
            setCreating(false)
        }
    }

    const resetCreateForm = () => {
        setShowCreateForm(false)
        setCreateError(null)
        setNewAssignment({ courseId: 0, title: '', description: '', content: '', startDate: '', deadline: '' })
    }

    const handleDeleteAssignment = async (e: React.MouseEvent, assignmentId: number) => {
        e.stopPropagation() // Prevent card click
        if (!window.confirm('Are you sure you want to delete this assignment?')) return

        try {
            await deleteAssignment(assignmentId)
            // Refresh list
            const data = await fetchAssignmentsByCourseId(course!.id)
            setAssignments(data)
        } catch (err) {
            console.error(err)
            alert('Failed to delete assignment')
        }
    }

    if (loading) return <div className="page-container"><div className="courses-message">Loading...</div></div>
    if (error || !course) return <div className="page-container"><div className="courses-message courses-message-error">{error || 'Course not found'}</div></div>

    return (
        <div className="page-container">
            <Button
                onClick={() => navigate(-1)}
                variant="ghost"
                className="mb-4"
                style={{ paddingLeft: 0, marginTop: '2rem' }}
            >
                ← Back
            </Button>

            <div className="course-details">
                <h1 className="course-title-large">{course.title}</h1>

                <div className="course-info-grid">
                    <div className="course-main-content">
                        <section className="course-section">
                            <h2>About this course</h2>
                            <p style={{ lineHeight: '1.6', color: '#e5e7eb' }}>{course.description}</p>
                        </section>

                        {course.syllabus && (
                            <section className="course-section">
                                <h2>Syllabus</h2>
                                <div className="syllabus-content" style={{ whiteSpace: 'pre-line', color: '#e5e7eb', lineHeight: '1.6' }}>
                                    {course.syllabus}
                                </div>
                            </section>
                        )}
                    </div>

                    <div className="course-sidebar">
                        <div className="course-card-mini">
                            <div className="price-tag">
                                {course.price === 0 || course.price === null ? 'Free' : `$${course.price}`}
                            </div>

                            <div className="course-meta-list">
                                {course.duration && (
                                    <div className="meta-item">
                                        <span className="label">Duration:</span>
                                        <span className="value">{course.duration} weeks</span>
                                    </div>
                                )}
                                {course.startDate && (
                                    <div className="meta-item">
                                        <span className="label">Starts:</span>
                                        <span className="value">{new Date(course.startDate).toLocaleDateString()}</span>
                                    </div>
                                )}
                            </div>

                            <div className="enroll-action">
                                {isTeacher ? (
                                    isOwnCourse ? (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                            <Button variant="outline" className="full-width" disabled>
                                                Your Course
                                            </Button>
                                            <Button
                                                className="full-width"
                                                variant="outline"
                                                onClick={handleDelete}
                                                style={{ borderColor: '#ef4444', color: '#ef4444' }}
                                            >
                                                Delete Course
                                            </Button>
                                        </div>
                                    ) : (
                                        <Button variant="outline" className="full-width" disabled>
                                            View Only
                                        </Button>
                                    )
                                ) : isEnrolled ? (
                                    <Button variant="outline" className="full-width" disabled>
                                        Already Enrolled
                                    </Button>
                                ) : (
                                    <Button
                                        className="full-width"
                                        onClick={handleEnroll}
                                        disabled={enrolling}
                                    >
                                        {enrolling ? 'Enrolling...' : 'Register Now'}
                                    </Button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Teacher: Assignments & Quizzes tabs */}
            {isOwnCourse && (
                <div style={{ marginTop: '2.5rem' }}>
                    <div className="student-nav" style={{ marginBottom: '1.5rem' }}>
                        <button
                            className={`student-nav-item ${teacherTab === 'assignments' ? 'student-nav-item-active' : ''}`}
                            onClick={() => setTeacherTab('assignments')}
                        >
                            Assignments ({assignments.length})
                        </button>
                        <button
                            className={`student-nav-item ${teacherTab === 'quizzes' ? 'student-nav-item-active' : ''}`}
                            onClick={() => setTeacherTab('quizzes')}
                        >
                            Quizzes ({quizzes.length})
                        </button>
                    </div>

                    {tabLoading && <div className="courses-message">Loading...</div>}

                    {/* Assignments tab */}
                    {!tabLoading && teacherTab === 'assignments' && (
                        <>
                            {/* Create Assignment button */}
                            <div style={{ marginBottom: '1.5rem' }}>
                                {!showCreateForm ? (
                                    <Button onClick={() => setShowCreateForm(true)}>
                                        + Create Assignment
                                    </Button>
                                ) : (
                                    <form
                                        onSubmit={handleCreateAssignment}
                                        style={{
                                            background: 'rgba(30, 41, 59, 0.7)',
                                            border: '1px solid rgba(99, 102, 241, 0.3)',
                                            borderRadius: '0.75rem',
                                            padding: '1.5rem',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            gap: '1rem',
                                        }}
                                    >
                                        <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 600, color: '#e5e7eb' }}>
                                            New Assignment
                                        </h3>

                                        {createError && (
                                            <div style={{
                                                color: '#fca5a5', background: 'rgba(239, 68, 68, 0.1)',
                                                border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '0.5rem',
                                                padding: '0.75rem', fontSize: '0.9rem',
                                            }}>
                                                {createError}
                                            </div>
                                        )}

                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                                            <label style={{ fontSize: '0.85rem', color: '#9ca3af', fontWeight: 500 }}>Title *</label>
                                            <input
                                                type="text"
                                                required
                                                value={newAssignment.title}
                                                onChange={(e) => setNewAssignment((p) => ({ ...p, title: e.target.value }))}
                                                placeholder="Assignment title"
                                                style={{
                                                    padding: '0.65rem 0.85rem', borderRadius: '0.5rem',
                                                    border: '1px solid rgba(148, 163, 184, 0.25)', background: 'rgba(15, 23, 42, 0.6)',
                                                    color: '#e5e7eb', fontSize: '0.95rem', outline: 'none',
                                                }}
                                            />
                                        </div>

                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                                            <label style={{ fontSize: '0.85rem', color: '#9ca3af', fontWeight: 500 }}>Description</label>
                                            <textarea
                                                rows={3}
                                                value={newAssignment.description}
                                                onChange={(e) => setNewAssignment((p) => ({ ...p, description: e.target.value }))}
                                                placeholder="Brief description of the assignment"
                                                style={{
                                                    padding: '0.65rem 0.85rem', borderRadius: '0.5rem',
                                                    border: '1px solid rgba(148, 163, 184, 0.25)', background: 'rgba(15, 23, 42, 0.6)',
                                                    color: '#e5e7eb', fontSize: '0.95rem', outline: 'none', resize: 'vertical',
                                                    fontFamily: 'inherit',
                                                }}
                                            />
                                        </div>

                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                                            <label style={{ fontSize: '0.85rem', color: '#9ca3af', fontWeight: 500 }}>Content / Instructions</label>
                                            <textarea
                                                rows={4}
                                                value={newAssignment.content}
                                                onChange={(e) => setNewAssignment((p) => ({ ...p, content: e.target.value }))}
                                                placeholder="Detailed instructions for students"
                                                style={{
                                                    padding: '0.65rem 0.85rem', borderRadius: '0.5rem',
                                                    border: '1px solid rgba(148, 163, 184, 0.25)', background: 'rgba(15, 23, 42, 0.6)',
                                                    color: '#e5e7eb', fontSize: '0.95rem', outline: 'none', resize: 'vertical',
                                                    fontFamily: 'inherit',
                                                }}
                                            />
                                        </div>

                                        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', flex: 1, minWidth: '200px' }}>
                                                <label style={{ fontSize: '0.85rem', color: '#9ca3af', fontWeight: 500 }}>Start Date</label>
                                                <input
                                                    type="datetime-local"
                                                    value={newAssignment.startDate}
                                                    onChange={(e) => setNewAssignment((p) => ({ ...p, startDate: e.target.value }))}
                                                    style={{
                                                        padding: '0.65rem 0.85rem', borderRadius: '0.5rem',
                                                        border: '1px solid rgba(148, 163, 184, 0.25)', background: 'rgba(15, 23, 42, 0.6)',
                                                        color: '#e5e7eb', fontSize: '0.95rem', outline: 'none',
                                                        colorScheme: 'dark',
                                                    }}
                                                />
                                            </div>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', flex: 1, minWidth: '200px' }}>
                                                <label style={{ fontSize: '0.85rem', color: '#9ca3af', fontWeight: 500 }}>Deadline</label>
                                                <input
                                                    type="datetime-local"
                                                    value={newAssignment.deadline}
                                                    onChange={(e) => setNewAssignment((p) => ({ ...p, deadline: e.target.value }))}
                                                    style={{
                                                        padding: '0.65rem 0.85rem', borderRadius: '0.5rem',
                                                        border: '1px solid rgba(148, 163, 184, 0.25)', background: 'rgba(15, 23, 42, 0.6)',
                                                        color: '#e5e7eb', fontSize: '0.95rem', outline: 'none',
                                                        colorScheme: 'dark',
                                                    }}
                                                />
                                            </div>
                                        </div>

                                        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                                            <Button type="submit" disabled={creating || !newAssignment.title.trim()}>
                                                {creating ? 'Creating…' : 'Create Assignment'}
                                            </Button>
                                            <Button variant="ghost" type="button" onClick={resetCreateForm} disabled={creating}>
                                                Cancel
                                            </Button>
                                        </div>
                                    </form>
                                )}
                            </div>

                            {assignments.length === 0 ? (
                                <div className="courses-message">No assignments for this course yet.</div>
                            ) : (
                                <div className="courses-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))' }}>
                                    {assignments.map((a) => (
                                        <article
                                            key={a.id}
                                            className="course-card"
                                            onClick={() => navigate(`/course/${course!.id}/assignment/${a.id}`)}
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
                                            <div style={{ position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', backgroundColor: '#6366f1' }} />
                                            <div style={{ marginLeft: '0.75rem' }}>
                                                <h3 className="course-title" style={{ fontSize: '1.05rem', marginBottom: '0.3rem' }}>
                                                    {a.title}
                                                </h3>
                                                {a.description && (
                                                    <p style={{ fontSize: '0.85rem', color: '#9ca3af', marginBottom: '0.4rem', lineHeight: '1.5' }}>
                                                        {a.description.length > 120 ? a.description.slice(0, 120) + '…' : a.description}
                                                    </p>
                                                )}
                                                <div style={{ display: 'flex', gap: '1rem', fontSize: '0.8rem', color: '#6b7280', flexWrap: 'wrap' }}>
                                                    {a.startDate && (
                                                        <span>Start: {new Date(a.startDate).toLocaleDateString()}</span>
                                                    )}
                                                    {a.deadline && (
                                                        <span style={{ color: '#f59e0b' }}>
                                                            Deadline: {new Date(a.deadline).toLocaleDateString()}
                                                        </span>
                                                    )}
                                                </div>

                                                <div style={{ marginTop: '0.8rem', display: 'flex', justifyContent: 'flex-end' }}>
                                                    <Button
                                                        variant="ghost"
                                                        onClick={(e) => handleDeleteAssignment(e, a.id)}
                                                        style={{
                                                            color: '#ef4444',
                                                            padding: '0.3rem 0.6rem',
                                                            fontSize: '0.85rem',
                                                            height: 'auto',
                                                            borderColor: 'rgba(239, 68, 68, 0.3)',
                                                            borderWidth: '1px',
                                                            borderStyle: 'solid'
                                                        }}
                                                    >
                                                        Delete
                                                    </Button>
                                                </div>
                                            </div>
                                        </article>
                                    ))}
                                </div>
                            )}
                        </>)
                    }

                    {/* Quizzes tab */}
                    {!tabLoading && teacherTab === 'quizzes' && (
                        quizzes.length === 0 ? (
                            <div className="courses-message">No quizzes for this course yet.</div>
                        ) : (
                            <div className="courses-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))' }}>
                                {quizzes.map((q) => (
                                    <article
                                        key={q.id}
                                        className="course-card"
                                        style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', position: 'relative', overflow: 'hidden' }}
                                    >
                                        <div style={{ position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', backgroundColor: '#8b5cf6' }} />
                                        <div style={{ marginLeft: '0.75rem' }}>
                                            <h3 className="course-title" style={{ fontSize: '1.05rem', marginBottom: '0.3rem' }}>
                                                {q.title}
                                            </h3>
                                            <div style={{ display: 'flex', gap: '1rem', fontSize: '0.8rem', color: '#6b7280', flexWrap: 'wrap' }}>
                                                {q.startDate && (
                                                    <span>Start: {new Date(q.startDate).toLocaleDateString()}</span>
                                                )}
                                                {q.endDate && (
                                                    <span style={{ color: '#f59e0b' }}>
                                                        End: {new Date(q.endDate).toLocaleDateString()}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </article>
                                ))}
                            </div>
                        )
                    )}
                </div>
            )}
        </div>
    )
}
