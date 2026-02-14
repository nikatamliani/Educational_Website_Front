import { Navigate, Route, Routes } from 'react-router-dom'
import './App.css'
import { Navbar } from './components/Navbar'
import { Footer } from './components/Footer'
import { ProtectedRoute } from './components/ProtectedRoute'
import { HomePage } from './pages/HomePage'
import { CourseDetailsPage } from './pages/CourseDetailsPage'
import { EnrolledCoursePage } from './pages/EnrolledCoursePage'
import { AssignmentsPage } from './pages/AssignmentsPage'
import { AssignmentDetailsPage } from './pages/AssignmentDetailsPage'
import { QuizzesPage } from './pages/QuizzesPage'
import { QuizDetailsPage } from './pages/QuizDetailsPage'
import { GradesPage } from './pages/GradesPage'
import { CourseGradesPage } from './pages/CourseGradesPage'
import { CourseAssignmentPage } from './pages/CourseAssignmentPage'
import { LoginPage } from './pages/LoginPage'
import { StudentRegisterPage } from './pages/StudentRegisterPage'
import { TeacherRegisterPage } from './pages/TeacherRegisterPage'
import { MyCoursesPage } from './pages/MyCoursesPage'
import { ProfilePage } from './pages/ProfilePage'
import { QuizManagementPage } from './pages/QuizManagementPage'
import { QuizTakingPage } from './pages/QuizTakingPage'
import { CalendarPage } from './pages/CalendarPage'
import { StudentsPage } from './pages/StudentsPage'
import { StudentDetailsPage } from './pages/StudentDetailsPage'
import { TeachersPage } from './pages/TeachersPage'
import { TeacherDetailsPage } from './pages/TeacherDetailsPage'

function AppLayout() {
  return (
    <div className="app-root">
      <Navbar />

      <main className="app-main">
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<HomePage />} />
          <Route path="/course/:id" element={<CourseDetailsPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register/student" element={<StudentRegisterPage />} />
          <Route path="/register/teacher" element={<TeacherRegisterPage />} />

          {/* Protected routes — redirect to /login when logged out */}
          <Route path="/my-courses" element={<ProtectedRoute><MyCoursesPage /></ProtectedRoute>} />
          <Route path="/my-courses/:id" element={<ProtectedRoute><EnrolledCoursePage /></ProtectedRoute>} />
          <Route path="/assignments" element={<ProtectedRoute><AssignmentsPage /></ProtectedRoute>} />
          <Route path="/assignment/:id" element={<ProtectedRoute><AssignmentDetailsPage /></ProtectedRoute>} />
          <Route path="/quizzes" element={<ProtectedRoute><QuizzesPage /></ProtectedRoute>} />
          <Route path="/quiz/:id" element={<ProtectedRoute><QuizDetailsPage /></ProtectedRoute>} />
          <Route path="/grades" element={<ProtectedRoute><GradesPage /></ProtectedRoute>} />
          <Route path="/grades/:id" element={<ProtectedRoute><CourseGradesPage /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
          <Route path="/course/:courseId/assignment/:assignmentId" element={<ProtectedRoute><CourseAssignmentPage /></ProtectedRoute>} />
          <Route path="/course/:courseId/quiz/:quizId/edit" element={<ProtectedRoute><QuizManagementPage /></ProtectedRoute>} />
          <Route path="/course/:courseId/quiz/:quizId/take" element={<ProtectedRoute><QuizTakingPage /></ProtectedRoute>} />
          <Route path="/calendar" element={<ProtectedRoute><CalendarPage /></ProtectedRoute>} />

          {/* Admin routes */}
          <Route path="/students" element={<ProtectedRoute><StudentsPage /></ProtectedRoute>} />
          <Route path="/students/:username" element={<ProtectedRoute><StudentDetailsPage /></ProtectedRoute>} />
          <Route path="/teachers" element={<ProtectedRoute><TeachersPage /></ProtectedRoute>} />
          <Route path="/teachers/:username" element={<ProtectedRoute><TeacherDetailsPage /></ProtectedRoute>} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes >
      </main >

      <Footer />
    </div >
  )
}

export default function App() {
  return <AppLayout />
}
