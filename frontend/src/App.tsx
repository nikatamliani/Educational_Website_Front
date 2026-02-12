import { Link, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import './App.css'
import { HomePage } from './pages/HomePage'
import { LoginPage } from './pages/LoginPage'
import { StudentRegisterPage } from './pages/StudentRegisterPage'
import { TeacherRegisterPage } from './pages/TeacherRegisterPage'
import { MyCoursesPage } from './pages/MyCoursesPage'

function AppLayout() {
  const location = useLocation()

  return (
    <div className="app-root">
      <header className="app-header">
        <div className="app-brand">
          <span className="app-logo-circle">EW</span>
          <div>
            <div className="app-title">Educational Website</div>
            <div className="app-subtitle">Learning platform</div>
          </div>
        </div>
        <nav className="app-nav">
          <Link
            to="/"
            className={
              location.pathname === '/' ? 'nav-link nav-link-active' : 'nav-link'
            }
          >
            Home
          </Link>
          <Link
            to="/login"
            className={
              location.pathname === '/login'
                ? 'nav-link nav-link-active'
                : 'nav-link'
            }
          >
            Login
          </Link>
          <Link
            to="/register/student"
            className={
              location.pathname.startsWith('/register/student')
                ? 'nav-link nav-link-active'
                : 'nav-link'
            }
          >
            Student sign up
          </Link>
          <Link
            to="/register/teacher"
            className={
              location.pathname.startsWith('/register/teacher')
                ? 'nav-link nav-link-active'
                : 'nav-link'
            }
          >
            Teacher sign up
          </Link>
        </nav>
      </header>

      <main className="app-main">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/my-courses" element={<MyCoursesPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register/student" element={<StudentRegisterPage />} />
          <Route path="/register/teacher" element={<TeacherRegisterPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      <footer className="app-footer">
        <span>© {new Date().getFullYear()} Educational Website</span>
      </footer>
    </div>
  )
}

export default function App() {
  return <AppLayout />
}
