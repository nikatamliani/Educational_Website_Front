import { Navigate, Route, Routes } from 'react-router-dom'
import './App.css'
import { Navbar } from './components/Navbar'
import { Footer } from './components/Footer'
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

function AppLayout() {
  return (
    <div className="app-root">
      <Navbar />

      <main className="app-main">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/course/:id" element={<CourseDetailsPage />} />
          <Route path="/my-courses" element={<MyCoursesPage />} />
          <Route path="/my-courses/:id" element={<EnrolledCoursePage />} />
          <Route path="/assignments" element={<AssignmentsPage />} />
          <Route path="/assignment/:id" element={<AssignmentDetailsPage />} />
          <Route path="/quizzes" element={<QuizzesPage />} />
          <Route path="/quiz/:id" element={<QuizDetailsPage />} />
          <Route path="/grades" element={<GradesPage />} />
          <Route path="/grades/:id" element={<CourseGradesPage />} />
          <Route path="/course/:courseId/assignment/:assignmentId" element={<CourseAssignmentPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register/student" element={<StudentRegisterPage />} />
          <Route path="/register/teacher" element={<TeacherRegisterPage />} />
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
