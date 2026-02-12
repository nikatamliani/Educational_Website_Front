import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { fetchMyCourses, type Course } from '../api/courses'

export function MyCoursesPage() {
  const navigate = useNavigate()
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const username =
    typeof window !== 'undefined'
      ? localStorage.getItem('authUsername') ?? 'Student'
      : 'Student'

  useEffect(() => {
    let isMounted = true

    async function loadCourses() {
      try {
        setLoading(true)
        const data = await fetchMyCourses()
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
  }, [])

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
    <div className="auth-card">
      <h1 className="auth-title">My courses</h1>
      <p className="auth-description">
        {`Courses you are enrolled in, ${username}.`}
      </p>

      <div className="student-nav">
        <button
          className="student-nav-item"
          type="button"
          onClick={() => navigate('/')}
        >
          Courses
        </button>
        <button
          className="student-nav-item student-nav-item-active"
          type="button"
        >
          My courses
        </button>
        <button className="student-nav-item" type="button">
          Assignments
        </button>
        <button className="student-nav-item" type="button">
          Quizzes
        </button>
        <button className="student-nav-item" type="button">
          Calendar
        </button>
      </div>

      <div className="courses-section">
        {loading && <div className="courses-message">Loading your courses…</div>}
        {error && !loading && (
          <div className="courses-message courses-message-error">{error}</div>
        )}
        {!loading && !error && sortedCourses.length === 0 && (
          <div className="courses-message">
            You are not enrolled in any courses yet.
          </div>
        )}

        {!loading && !error && sortedCourses.length > 0 && (
          <div className="courses-grid">
            {sortedCourses.map((course) => (
              <article key={course.id} className="course-card">
                <h2 className="course-title">{course.title}</h2>
                {course.description && (
                  <p className="course-description">{course.description}</p>
                )}

                <div className="course-meta">
                  {course.price != null && (
                    <span className="course-pill">
                      {course.price === 0 ? 'Free' : `$${course.price.toFixed(2)}`}
                    </span>
                  )}
                  {course.duration != null && (
                    <span className="course-pill">
                      Duration: {course.duration} hours
                    </span>
                  )}
                  {course.startDate && (
                    <span className="course-pill">
                      Starts{' '}
                        {new Date(course.startDate).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                    </span>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

