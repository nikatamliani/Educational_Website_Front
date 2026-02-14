import { useEffect, useMemo, useState } from 'react'
import { fetchMyCourses, fetchTeacherCourses, createCourse, updateCourse, deleteCourse, type Course } from '../api/courses'
import { useAuth } from '../context/AuthContext'
import { CourseCard } from '../components/CourseCard'
import { Button } from '../components/Button'
import { CourseForm } from '../components/CourseForm'

export function MyCoursesPage() {
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Form state
  const [showForm, setShowForm] = useState(false)
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create')
  const [editingCourseId, setEditingCourseId] = useState<number | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const [courseData, setCourseData] = useState<Partial<Course>>({
    title: '',
    description: '',
    price: null,
    duration: null,
    startDate: '',
    syllabus: '',
  })

  const { user } = useAuth()
  const username = user?.username ?? 'User'
  const isTeacher = user?.role === 'teacher'

  useEffect(() => {
    let isMounted = true
    loadCourses()
    return () => { isMounted = false }

    async function loadCourses() {
      try {
        setLoading(true)
        const data = isTeacher ? await fetchTeacherCourses() : await fetchMyCourses()
        if (isMounted) {
          setCourses(data)
        }
      } catch (err) {
        if (isMounted) {
          const message =
            err instanceof Error
              ? err.message
              : 'Could not load your courses. Please try again.'
          setError(message)
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }
  }, [isTeacher])

  const handleCreateClick = () => {
    setFormMode('create')
    setEditingCourseId(null)
    setCourseData({
      title: '',
      description: '',
      price: null,
      duration: null,
      startDate: '',
      syllabus: '',
    })
    setSubmitError(null)
    setShowForm(true)
  }

  const handleEditClick = (course: Course) => {
    setFormMode('edit')
    setEditingCourseId(course.id)
    setCourseData({
      ...course,
      startDate: course.startDate || '',
    })
    setSubmitError(null)
    setShowForm(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleDeleteClick = async (courseId: number) => {
    if (!window.confirm('Are you sure you want to delete this course? This action cannot be undone.')) {
      return
    }

    try {
      await deleteCourse(courseId)
      // Refresh list
      const data = await fetchTeacherCourses()
      setCourses(data)
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete course')
    }
  }

  const handleFormSubmit = async (data: Partial<Course>) => {
    try {
      setSubmitting(true)
      setSubmitError(null)

      if (formMode === 'create') {
        await createCourse({
          ...data,
          startDate: data.startDate || null,
        })
      } else {
        if (!editingCourseId) return
        await updateCourse({
          ...data,
          id: editingCourseId,
          startDate: data.startDate || null,
        })
      }

      // Refresh list
      const updatedCourses = await fetchTeacherCourses()
      setCourses(updatedCourses)

      // Close form
      setShowForm(false)
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Failed to save course.')
    } finally {
      setSubmitting(false)
    }
  }

  const sortedCourses = useMemo(
    () =>
      [...courses].sort((a, b) =>
        (a.title ?? '').localeCompare(b.title ?? '', undefined, {
          sensitivity: 'base',
        }),
      ),
    [courses],
  )

  return (
    <div className="width-full">
      <h1 className="page-title">My Courses</h1>
      <p className="page-description">
        {isTeacher
          ? `Courses you are teaching, ${username}.`
          : `Courses you are enrolled in, ${username}.`}
      </p>

      {isTeacher && (
        <div style={{ marginTop: '1.5rem' }}>
          {!showForm ? (
            <Button onClick={handleCreateClick}>+ Create New Course</Button>
          ) : (
            <CourseForm
              initialData={courseData}
              onSubmit={handleFormSubmit}
              onCancel={() => setShowForm(false)}
              isLoading={submitting}
              error={submitError}
              submitLabel={formMode === 'create' ? 'Create Course' : 'Update Course'}
            />
          )}
        </div>
      )}

      <div className="courses-section" style={{ marginTop: '2rem' }}>
        {loading && <div className="courses-message">Loading your courses…</div>}
        {error && !loading && (
          <div className="courses-message courses-message-error">{error}</div>
        )}
        {!loading && !error && sortedCourses.length === 0 && (
          <div className="courses-message">
            {isTeacher
              ? 'You are not teaching any courses yet.'
              : 'You are not enrolled in any courses yet.'}
          </div>
        )}

        {!loading && !error && sortedCourses.length > 0 && (
          <div className="courses-grid">
            {sortedCourses.map((course) => (
              <CourseCard
                key={course.id}
                course={course}
                basePath={isTeacher ? '/teacher-course/' : '/my-courses/'}
                onEdit={isTeacher ? handleEditClick : undefined}
                onDelete={isTeacher ? handleDeleteClick : undefined}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
