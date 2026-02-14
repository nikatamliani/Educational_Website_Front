import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
    fetchCourseById,
    fetchMyCourses,
    fetchTeacherCourses,
    enrollInCourse,
    deleteCourse,
    updateCourse, // Added updateCourse
    type Course,
} from '../api/courses'
import {
    fetchAssignmentsByCourseId,
    createAssignment,
    updateAssignment,
    deleteAssignment,
    type CourseAssignment,
    type CreateAssignmentPayload,
} from '../api/assignments'
import { fetchQuizzesByCourseId, saveQuiz, deleteQuiz, type CourseQuiz, type QuizDto } from '../api/quizzes'
import {
    fetchLessonsByCourse,
    createLesson,
    updateLesson,
    deleteLesson,
    type LessonDto
} from '../api/lessons'

import { Button } from '../components/Button'
import { useAuth } from '../context/AuthContext'
import { CourseForm } from '../components/CourseForm'
import { QuizForm } from '../components/QuizForm'

type TeacherCourseTab = 'assignments' | 'quizzes' | 'lessons'


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
    const [lessons, setLessons] = useState<LessonDto[]>([])
    const [tabLoading, setTabLoading] = useState(false)

    // Create/Edit assignment form state
    const [showCreateForm, setShowCreateForm] = useState(false)
    const [editingAssignmentId, setEditingAssignmentId] = useState<number | null>(null)
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

    // Quiz Creation State
    const [showQuizForm, setShowQuizForm] = useState(false)
    const [creatingQuiz, setCreatingQuiz] = useState(false)
    const [createQuizError, setCreateQuizError] = useState<string | null>(null)
    const [editingQuizId, setEditingQuizId] = useState<number | null>(null)

    // Lesson Creation State
    const [showLessonForm, setShowLessonForm] = useState(false)
    const [creatingLesson, setCreatingLesson] = useState(false)
    const [createLessonError, setCreateLessonError] = useState<string | null>(null)
    const [editingLessonId, setEditingLessonId] = useState<number | null>(null)
    const [newLesson, setNewLesson] = useState<Partial<LessonDto>>({
        title: '',
        content: '',
        startDate: undefined,
        endDate: undefined,
    })

    // Edit Course State
    const [isEditingCourse, setIsEditingCourse] = useState(false)
    const [courseEditError, setCourseEditError] = useState<string | null>(null)
    const [isDeletingCourse, setIsDeletingCourse] = useState(false)
    const [isUpdatingCourse, setIsUpdatingCourse] = useState(false)

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
                } else if (teacherTab === 'quizzes') {
                    const data = await fetchQuizzesByCourseId(course!.id)
                    if (isMounted) setQuizzes(data)
                } else if (teacherTab === 'lessons') {
                    const data = await fetchLessonsByCourse(course!.id)
                    if (isMounted) setLessons(data)
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

    // Course Management Handlers
    const handleEditCourseSubmit = async (data: Partial<Course>) => {
        if (!course) return
        try {
            setIsUpdatingCourse(true)
            setCourseEditError(null)
            const updated = await updateCourse({ ...data, id: course.id })
            setCourse(updated)
            setIsEditingCourse(false)
        } catch (err) {
            setCourseEditError(err instanceof Error ? err.message : 'Failed to update course')
        } finally {
            setIsUpdatingCourse(false)
        }
    }

    const handleDeleteCourse = async () => {
        if (!course || !window.confirm('Are you sure you want to delete this course? This action cannot be undone and will delete all associated assignments and quizzes.')) return
        try {
            setIsDeletingCourse(true)
            await deleteCourse(course.id)
            alert('Course deleted successfully.')
            navigate('/my-courses')
        } catch (err) {
            alert(err instanceof Error ? err.message : 'Failed to delete course')
            setIsDeletingCourse(false)
        }
    }

    const handleCreateAssignment = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!course || !newAssignment.title.trim()) return

        try {
            setCreating(true)
            setCreateError(null)

            const payload = {
                ...newAssignment,
                courseId: course.id,
                startDate: newAssignment.startDate || undefined,
                deadline: newAssignment.deadline || undefined,
            }

            if (editingAssignmentId) {
                await updateAssignment(editingAssignmentId, payload)
            } else {
                await createAssignment(payload)
            }

            // Refresh assignment list
            const data = await fetchAssignmentsByCourseId(course.id)
            setAssignments(data)
            resetCreateForm()
        } catch (err) {
            setCreateError(err instanceof Error ? err.message : 'Failed to save assignment.')
        } finally {
            setCreating(false)
        }
    }

    const handleEditAssignment = (e: React.MouseEvent, assignment: CourseAssignment) => {
        e.stopPropagation()
        setEditingAssignmentId(assignment.id)
        setNewAssignment({
            courseId: assignment.courseId,
            title: assignment.title,
            description: assignment.description || '',
            content: assignment.content || '',
            startDate: assignment.startDate || '',
            deadline: assignment.deadline || '',
        })
        setShowCreateForm(true)
        setCreateError(null)
        // Scroll to form
        window.scrollTo({ top: 0, behavior: 'smooth' })
    }

    const resetCreateForm = () => {
        setShowCreateForm(false)
        setEditingAssignmentId(null)
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



    const handleCreateQuiz = async (data: Partial<QuizDto>) => {
        if (!course) return
        try {
            setCreatingQuiz(true)
            setCreateQuizError(null)
            await saveQuiz({ ...data, courseId: course.id, id: editingQuizId || 0 })

            // Refresh
            const quizData = await fetchQuizzesByCourseId(course.id)
            setQuizzes(quizData)
            setShowQuizForm(false)
            setEditingQuizId(null)
        } catch (err) {
            setCreateQuizError('Failed to create quiz')
        } finally {
            setCreatingQuiz(false)
        }
    }

    const handleEditQuiz = (e: React.MouseEvent, quiz: CourseQuiz) => {
        e.stopPropagation()
        setEditingQuizId(quiz.id)
        // Since QuizForm takes initialData (not fully implemented in previous code but assumed based on pattern), 
        // OR we just pass the quiz object if the form supports it. 
        // The existing QuizForm in the file might need checking, but for now we set the editing ID 
        // and show the form. The form should handle the "edit" mode if we pass the data.
        // Wait, I need to see QuizForm to know if I can pass initial data. 
        // Assuming standard pattern:
        // Note: The previous code for QuizForm usage was:
        /*
        <QuizForm
            onSubmit={handleCreateQuiz}
            onCancel={() => setShowQuizForm(false)}
            isLoading={creatingQuiz}
            error={createQuizError}
        />
        */
        // I'll need to check QuizForm to see if it accepts initialData.
        // For now I'll assume it does or I'll fix it later.
        setShowQuizForm(true)
    }

    const handleDeleteQuiz = async (e: React.MouseEvent, quizId: number) => {
        e.stopPropagation()
        if (!window.confirm('Are you sure you want to delete this quiz?')) return

        try {
            await deleteQuiz(quizId)
            // Refresh list
            const quizData = await fetchQuizzesByCourseId(course!.id)
            setQuizzes(quizData)
        } catch (err) {
            console.error(err)
            alert('Failed to delete quiz')
        }
    }

    const handleQuizClick = (quizId: number) => {
        if (isOwnCourse) {
            // Teacher mode: clicking opens edit or view? 
            // The requirement says "Quizzes also lack editing functionality". 
            // And "each listed lesson should have edit and delete functionalities".
            // So for quiz, I'll add an Edit button on the card, and maybe clicking the card goes to questions management.
            navigate(`/course/${course?.id}/quiz/${quizId}/edit`)
        } else {
            navigate(`/course/${course?.id}/quiz/${quizId}/take`)
        }
    }

    // --- Lesson Handlers ---

    const handleCreateLesson = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!course || !newLesson.title?.trim()) return

        try {
            setCreatingLesson(true)
            setCreateLessonError(null)

            const payload: Partial<LessonDto> = {
                ...newLesson,
                courseId: course.id,
                id: editingLessonId || 0
            }

            if (editingLessonId) {
                await updateLesson(payload)
            } else {
                await createLesson(payload)
            }

            const data = await fetchLessonsByCourse(course.id)
            setLessons(data)
            resetLessonForm()
        } catch (err) {
            setCreateLessonError(err instanceof Error ? err.message : 'Failed to save lesson')
        } finally {
            setCreatingLesson(false)
        }
    }

    const handleEditLesson = (e: React.MouseEvent, lesson: LessonDto) => {
        e.stopPropagation()
        setEditingLessonId(lesson.id)
        setNewLesson({
            title: lesson.title,
            content: lesson.content,
            startDate: lesson.startDate,
            endDate: lesson.endDate
        })
        setShowLessonForm(true)
    }

    const handleDeleteLesson = async (e: React.MouseEvent, lessonId: number) => {
        e.stopPropagation()
        if (!window.confirm('Are you sure you want to delete this lesson?')) return
        try {
            await deleteLesson(lessonId)
            const data = await fetchLessonsByCourse(course!.id)
            setLessons(data)
        } catch (err) {
            console.error(err)
            alert('Failed to delete lesson')
        }
    }

    const resetLessonForm = () => {
        setShowLessonForm(false)
        setEditingLessonId(null)
        setCreateLessonError(null)
        setNewLesson({ title: '', content: '', startDate: undefined, endDate: undefined })
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

            {/* Course Info / Edit Form */}
            {isEditingCourse && course ? (
                <div style={{ marginBottom: '2rem' }}>
                    <CourseForm
                        initialData={course}
                        onSubmit={handleEditCourseSubmit}
                        onCancel={() => setIsEditingCourse(false)}
                        isLoading={isUpdatingCourse}
                        error={courseEditError}
                        submitLabel="Update Course"
                    />
                </div>
            ) : (
                <div className="course-header">
                    <h1 className="course-title" style={{ fontSize: '3rem', fontWeight: '800', letterSpacing: '-0.025em', marginBottom: '1rem', lineHeight: '1.1' }}>{course.title}</h1>

                    {isOwnCourse && ( // Changed from isTeacher to isOwnCourse for accuracy
                        <div style={{ marginTop: '1rem', display: 'flex', gap: '1rem' }}>
                            <Button onClick={() => setIsEditingCourse(true)}>Edit Course</Button>
                            <Button
                                onClick={handleDeleteCourse}
                                style={{ background: 'rgba(239, 68, 68, 0.2)', border: '1px solid rgba(239, 68, 68, 0.5)', color: '#fca5a5' }}
                                disabled={isDeletingCourse}
                            >
                                {isDeletingCourse ? 'Deleting...' : 'Delete Course'}
                            </Button>
                        </div>
                    )}
                </div>
            )}

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
                        <button
                            className={`student-nav-item ${teacherTab === 'lessons' ? 'student-nav-item-active' : ''}`}
                            onClick={() => setTeacherTab('lessons')}
                        >
                            Lessons ({lessons.length})
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
                                            {editingAssignmentId ? 'Edit Assignment' : 'New Assignment'}
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
                                                {creating ? 'Saving…' : (editingAssignmentId ? 'Update Assignment' : 'Create Assignment')}
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

                                                <div style={{ marginTop: '0.8rem', display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                                                    <Button
                                                        variant="ghost"
                                                        onClick={(e) => handleEditAssignment(e, a)}
                                                        style={{
                                                            color: '#fbbf24',
                                                            padding: '0.3rem 0.6rem',
                                                            fontSize: '0.85rem',
                                                            height: 'auto',
                                                            borderColor: 'rgba(251, 191, 36, 0.3)',
                                                            borderWidth: '1px',
                                                            borderStyle: 'solid'
                                                        }}
                                                    >
                                                        Edit
                                                    </Button>
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
                        <>
                            <div style={{ marginBottom: '1.5rem' }}>
                                {!showQuizForm ? (
                                    <Button onClick={() => {
                                        setEditingQuizId(null)
                                        setShowQuizForm(true)
                                    }}>
                                        + Create Quiz
                                    </Button>
                                ) : (
                                    <QuizForm
                                        initialData={(() => {
                                            const q = quizzes.find(q => q.id === editingQuizId)
                                            if (!q) return undefined
                                            return {
                                                ...q,
                                                startDate: q.startDate ?? undefined,
                                                endDate: q.endDate ?? undefined
                                            }
                                        })()}
                                        onSubmit={handleCreateQuiz}
                                        onCancel={() => {
                                            setShowQuizForm(false)
                                            setEditingQuizId(null)
                                        }}
                                        isLoading={creatingQuiz}
                                        error={createQuizError}
                                    />
                                )}
                            </div>

                            {quizzes.length === 0 ? (
                                <div className="courses-message">No quizzes for this course yet.</div>
                            ) : (
                                <div className="courses-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))' }}>
                                    {quizzes.map((q) => (
                                        <article
                                            key={q.id}
                                            className="course-card"
                                            onClick={() => handleQuizClick(q.id)}
                                            style={{
                                                display: 'flex', flexDirection: 'column', gap: '0.5rem',
                                                position: 'relative', overflow: 'hidden', cursor: 'pointer',
                                                transition: 'transform 0.15s, box-shadow 0.15s'
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

                                                <div style={{ marginTop: '0.8rem', display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                                                    <Button
                                                        variant="ghost"
                                                        onClick={(e) => handleEditQuiz(e, q)}
                                                        style={{
                                                            color: '#fbbf24',
                                                            padding: '0.3rem 0.6rem',
                                                            fontSize: '0.85rem',
                                                            height: 'auto',
                                                            borderColor: 'rgba(251, 191, 36, 0.3)',
                                                            borderWidth: '1px',
                                                            borderStyle: 'solid'
                                                        }}
                                                    >
                                                        Edit
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        onClick={(e) => handleDeleteQuiz(e, q.id)}
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
                        </>
                    )}

                    {/* Lessons tab */}
                    {!tabLoading && teacherTab === 'lessons' && (
                        <>
                            <div style={{ marginBottom: '1.5rem' }}>
                                {!showLessonForm ? (
                                    <Button onClick={() => setShowLessonForm(true)}>
                                        + Create Lesson
                                    </Button>
                                ) : (
                                    <form
                                        onSubmit={handleCreateLesson}
                                        style={{
                                            background: 'rgba(30, 41, 59, 0.7)',
                                            border: '1px solid rgba(16, 185, 129, 0.3)',
                                            borderRadius: '0.75rem',
                                            padding: '1.5rem',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            gap: '1rem',
                                        }}
                                    >
                                        <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 600, color: '#e5e7eb' }}>
                                            {editingLessonId ? 'Edit Lesson' : 'New Lesson'}
                                        </h3>

                                        {createLessonError && (
                                            <div style={{
                                                color: '#fca5a5', background: 'rgba(239, 68, 68, 0.1)',
                                                border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '0.5rem',
                                                padding: '0.75rem', fontSize: '0.9rem',
                                            }}>
                                                {createLessonError}
                                            </div>
                                        )}

                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                                            <label style={{ fontSize: '0.85rem', color: '#9ca3af', fontWeight: 500 }}>Title *</label>
                                            <input
                                                type="text"
                                                required
                                                value={newLesson.title}
                                                onChange={(e) => setNewLesson((p) => ({ ...p, title: e.target.value }))}
                                                placeholder="Lesson title"
                                                style={{
                                                    padding: '0.65rem 0.85rem', borderRadius: '0.5rem',
                                                    border: '1px solid rgba(148, 163, 184, 0.25)', background: 'rgba(15, 23, 42, 0.6)',
                                                    color: '#e5e7eb', fontSize: '0.95rem', outline: 'none',
                                                }}
                                            />
                                        </div>

                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                                            <label style={{ fontSize: '0.85rem', color: '#9ca3af', fontWeight: 500 }}>Content</label>
                                            <textarea
                                                rows={4}
                                                value={newLesson.content || ''}
                                                onChange={(e) => setNewLesson((p) => ({ ...p, content: e.target.value }))}
                                                placeholder="Lesson content or materials"
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
                                                    value={newLesson.startDate as unknown as string || ''}
                                                    onChange={(e) => setNewLesson((p) => ({ ...p, startDate: e.target.value as unknown as string }))} // Hack for now, adjust typing properly
                                                    style={{
                                                        padding: '0.65rem 0.85rem', borderRadius: '0.5rem',
                                                        border: '1px solid rgba(148, 163, 184, 0.25)', background: 'rgba(15, 23, 42, 0.6)',
                                                        color: '#e5e7eb', fontSize: '0.95rem', outline: 'none',
                                                        colorScheme: 'dark',
                                                    }}
                                                />
                                            </div>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', flex: 1, minWidth: '200px' }}>
                                                <label style={{ fontSize: '0.85rem', color: '#9ca3af', fontWeight: 500 }}>End Date</label>
                                                <input
                                                    type="datetime-local"
                                                    value={newLesson.endDate as unknown as string || ''}
                                                    onChange={(e) => setNewLesson((p) => ({ ...p, endDate: e.target.value as unknown as string }))}
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
                                            <Button type="submit" disabled={creatingLesson || !newLesson.title?.trim()}>
                                                {creatingLesson ? 'Saving…' : (editingLessonId ? 'Update Lesson' : 'Create Lesson')}
                                            </Button>
                                            <Button variant="ghost" type="button" onClick={resetLessonForm} disabled={creatingLesson}>
                                                Cancel
                                            </Button>
                                        </div>
                                    </form>
                                )}
                            </div>

                            {lessons.length === 0 ? (
                                <div className="courses-message">No lessons for this course yet.</div>
                            ) : (
                                <div className="courses-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))' }}>
                                    {lessons.map((l) => (
                                        <article
                                            key={l.id}
                                            className="course-card"
                                            style={{
                                                display: 'flex', flexDirection: 'column', gap: '0.5rem',
                                                position: 'relative', overflow: 'hidden',
                                                transition: 'transform 0.15s, box-shadow 0.15s'
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
                                            <div style={{ position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', backgroundColor: '#10b981' }} />
                                            <div style={{ marginLeft: '0.75rem' }}>
                                                <h3 className="course-title" style={{ fontSize: '1.05rem', marginBottom: '0.3rem' }}>
                                                    {l.title}
                                                </h3>
                                                {l.content && (
                                                    <p style={{ fontSize: '0.85rem', color: '#9ca3af', marginBottom: '0.4rem', lineHeight: '1.5' }}>
                                                        {l.content.length > 120 ? l.content.slice(0, 120) + '…' : l.content}
                                                    </p>
                                                )}
                                                <div style={{ display: 'flex', gap: '1rem', fontSize: '0.8rem', color: '#6b7280', flexWrap: 'wrap' }}>
                                                    {l.startDate && (
                                                        <span>Start: {new Date(l.startDate).toLocaleDateString()}</span>
                                                    )}
                                                    {l.endDate && (
                                                        <span style={{ color: '#f59e0b' }}>
                                                            End: {new Date(l.endDate).toLocaleDateString()}
                                                        </span>
                                                    )}
                                                </div>

                                                <div style={{ marginTop: '0.8rem', display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                                                    <Button
                                                        variant="ghost"
                                                        onClick={(e) => handleEditLesson(e, l)}
                                                        style={{
                                                            color: '#fbbf24',
                                                            padding: '0.3rem 0.6rem',
                                                            fontSize: '0.85rem',
                                                            height: 'auto',
                                                            borderColor: 'rgba(251, 191, 36, 0.3)',
                                                            borderWidth: '1px',
                                                            borderStyle: 'solid'
                                                        }}
                                                    >
                                                        Edit
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        onClick={(e) => handleDeleteLesson(e, l.id)}
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
                        </>
                    )}
                </div>
            )}
        </div>
    )
}
