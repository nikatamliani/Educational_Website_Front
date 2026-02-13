import { useEffect, useMemo, useState } from 'react'
import { fetchMyCourses, fetchTeacherCourses, type Course } from '../api/courses'
import { useAuth } from '../context/AuthContext'
import { CourseCard } from '../components/CourseCard'

export function MyCoursesPage() {
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const { user } = useAuth()
  const username = user?.username ?? 'User'
  const isTeacher = user?.role === 'teacher'

  useEffect(() => {
    let isMounted = true

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

    loadCourses()

    return () => {
      isMounted = false
    }
  }, [isTeacher])

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
              <CourseCard key={course.id} course={course} basePath={isTeacher ? '/course/' : '/my-courses/'} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
