import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { fetchAllCourses, type Course } from '../api/courses'
import { useAuth } from '../context/AuthContext'
import { CourseCard } from '../components/CourseCard'

export function HomePage() {
  const navigate = useNavigate()
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const { user, isAuthenticated } = useAuth()
  const username = user?.username ?? 'Student'

  useEffect(() => {
    let isMounted = true

    async function loadCourses() {
      try {
        setLoading(true)
        const data = await fetchAllCourses()
        if (isMounted) {
          setCourses(data)
        }
      } catch (err) {
        if (isMounted) {
          const message =
            err instanceof Error
              ? err.message
              : 'Could not load courses. Please try again.'
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

  if (!isAuthenticated) {
    return (
      <div className="auth-card">
        <h1 className="auth-title">Welcome to Educational Website</h1>
        <p className="auth-description">
          Please log in or sign up to view courses.
        </p>
        <div className="home-actions">
          <button className="btn btn-primary" onClick={() => navigate('/login')}>Login</button>
          <button className="btn btn-outline" onClick={() => navigate('/register/student')}>Sign up</button>
        </div>
      </div>
    )
  }

  return (
    <div className="width-full">
      <h1 className="page-title">Welcome back, {username}</h1>
      <p className="page-description">
        Here is an overview of available courses. Use the navigation to explore
        your courses, assignments, quizzes and upcoming schedule.
      </p>

      <div className="courses-section">
        {loading && <div className="courses-message">Loading courses…</div>}
        {error && !loading && (
          <div className="courses-message courses-message-error">{error}</div>
        )}
        {!loading && !error && sortedCourses.length === 0 && (
          <div className="courses-message">No courses available yet.</div>
        )}

        {!loading && !error && sortedCourses.length > 0 && (
          <div className="courses-grid">
            {sortedCourses.map((course) => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

