import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { fetchCourseById, fetchMyCourses, enrollInCourse, type Course } from '../api/courses'
import { Button } from '../components/Button'
import { useAuth } from '../context/AuthContext'

export function CourseDetailsPage() {
    const { id } = useParams<{ id: string }>()
    const navigate = useNavigate()
    const { isAuthenticated } = useAuth()
    const [course, setCourse] = useState<Course | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [enrolling, setEnrolling] = useState(false)
    const [isEnrolled, setIsEnrolled] = useState(false)

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

                const [courseData, myCourses] = await Promise.all([
                    fetchCourseById(courseId),
                    isAuthenticated ? fetchMyCourses() : Promise.resolve([]),
                ])

                if (isMounted) {
                    setCourse(courseData)
                    setIsEnrolled(myCourses.some((c) => c.id === courseData.id))
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
    }, [id, isAuthenticated])

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
            // Optionally show a success message or redirect
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
            <Button
                onClick={() => navigate('/')}
                variant="ghost"
                className="mb-4"
                style={{ paddingLeft: 0, marginTop: '2rem' }}
            >
                ← Back to Courses
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
                                {isEnrolled ? (
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
