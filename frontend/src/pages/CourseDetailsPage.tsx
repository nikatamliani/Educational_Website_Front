import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
    fetchCourseById,
    fetchMyCourses,
    fetchTeacherCourses,
    enrollInCourse,
    type Course,
} from '../api/courses'
import { Button } from '../components/Button'
import { useAuth } from '../context/AuthContext'
import './CalendarPage.css' // Reusing calendar styles for grid
import './StudentDetailsPage.css'

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
    const [isOwnCourse, setIsOwnCourse] = useState(false) // Keeping this state but unused for now to avoid breaking if logic depends on it, but I should remove it if unused.

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
                        try {
                            const teacherCourses = await fetchTeacherCourses()
                            const owns = teacherCourses.some((c) => c.id === courseData.id)
                            if (isMounted) {
                                setIsOwnCourse(owns)
                            }
                        } catch (e) {
                            console.error('Failed to check course ownership', e)
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
    }, [id, isAuthenticated, isTeacher, user?.username])

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

    if (loading) return <div className="page-container"><div className="courses-message">Loading...</div></div>
    if (error || !course) return <div className="page-container"><div className="courses-message courses-message-error">{error || 'Course not found'}</div></div>

    return (
        <div className="page-container">
            <button
                onClick={() => navigate(-1)}
                style={{
                    background: 'none',
                    border: 'none',
                    color: '#94a3b8',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    fontSize: '0.95rem',
                    padding: '0.5rem 0',
                    marginBottom: '1.5rem',
                    marginTop: '2rem',
                    transition: 'color 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.color = '#e5e7eb'}
                onMouseLeave={(e) => e.currentTarget.style.color = '#94a3b8'}
            >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M19 12H5M12 19l-7-7 7-7" />
                </svg>
                Back
            </button>

            <div className="course-header">
                <h1 className="course-title" style={{ fontSize: '3rem', fontWeight: '800', letterSpacing: '-0.025em', marginBottom: '1rem', lineHeight: '1.1' }}>{course.title}</h1>
            </div>

            <div className="course-details">
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
        </div>
    )
}
