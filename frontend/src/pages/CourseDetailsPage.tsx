import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { fetchCourseById, fetchMyCourses, fetchTeacherCourses } from '../api/courses'
import { fetchAssignmentsByCourseId, type CourseAssignment } from '../api/assignments'
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
                        // For teachers, check if this is their course
                        const teacherCourses = await fetchTeacherCourses()
                        const owns = teacherCourses.some((c) => c.id === courseData.id)
                        if (isMounted) {
                            setIsOwnCourse(owns)
                        }
                    } else {
                        // For students, check enrollment
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
                        assignments.length === 0 ? (
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
                                        </div>
                                    </article>
                                ))}
                            </div>
                        )
                    )}

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
