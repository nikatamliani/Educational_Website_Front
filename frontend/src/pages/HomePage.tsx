import { useEffect, useMemo, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { fetchAllCourses, searchCourses, type Course } from '../api/courses'
import { useAuth } from '../context/AuthContext'
import { CourseCard } from '../components/CourseCard'

export function HomePage() {
  const navigate = useNavigate()
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [searching, setSearching] = useState(false)

  const { user, isAuthenticated } = useAuth()
  const username = user?.username ?? 'Student'

  // Load all courses on mount
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

  // Debounced search
  useEffect(() => {
    if (!searchQuery.trim()) {
      // Re-fetch all when query is cleared
      let isMounted = true
      fetchAllCourses()
        .then((data) => { if (isMounted) setCourses(data) })
        .catch(() => { })
      return () => { isMounted = false }
    }

    const timer = setTimeout(async () => {
      setSearching(true)
      try {
        const results = await searchCourses(searchQuery.trim())
        setCourses(results)
      } catch {
        // Silently fail — user still sees current list
      } finally {
        setSearching(false)
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [searchQuery])

  const sortedCourses = useMemo(
    () =>
      [...courses].sort((a, b) =>
        (a.title ?? '').localeCompare(b.title ?? '', undefined, {
          sensitivity: 'base',
        }),
      ),
    [courses],
  )

  const handleClearSearch = useCallback(() => {
    setSearchQuery('')
  }, [])

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

      {/* Search bar */}
      <div style={{
        position: 'relative',
        maxWidth: '480px',
        marginBottom: '1.5rem',
      }}>
        <span style={{
          position: 'absolute', left: '0.9rem', top: '50%', transform: 'translateY(-50%)',
          fontSize: '1rem', color: '#9ca3af', pointerEvents: 'none',
        }}>
          🔍
        </span>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search courses…"
          style={{
            width: '100%',
            padding: '0.65rem 2.5rem 0.65rem 2.5rem',
            borderRadius: '0.75rem',
            border: '1px solid rgba(148, 163, 184, 0.3)',
            background: 'rgba(15, 23, 42, 0.7)',
            color: '#e5e7eb',
            fontSize: '0.95rem',
            outline: 'none',
            transition: 'border-color 0.2s',
          }}
          onFocus={(e) => e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.6)'}
          onBlur={(e) => e.currentTarget.style.borderColor = 'rgba(148, 163, 184, 0.3)'}
        />
        {searchQuery && (
          <button
            onClick={handleClearSearch}
            style={{
              position: 'absolute', right: '0.6rem', top: '50%', transform: 'translateY(-50%)',
              background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer',
              fontSize: '1.1rem', padding: '0.2rem',
            }}
            title="Clear search"
          >
            ✕
          </button>
        )}
      </div>

      <div className="courses-section">
        {(loading || searching) && <div className="courses-message">Loading courses…</div>}
        {error && !loading && (
          <div className="courses-message courses-message-error">{error}</div>
        )}
        {!loading && !searching && !error && sortedCourses.length === 0 && (
          <div className="courses-message">
            {searchQuery ? 'No courses match your search.' : 'No courses available yet.'}
          </div>
        )}

        {!loading && !searching && !error && sortedCourses.length > 0 && (
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
