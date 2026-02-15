import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { fetchStudentByUsername, updateStudent, Student } from '../api/student'
import { Button } from '../components/Button'
import ErrorMessage from '../components/ErrorMessage'
import { useToast } from '../context/ToastContext'
import { Course, fetchCoursesByStudentId, unenrollStudentFromCourse } from '../api/courses'
// import { Input } from '../components/Input' 
import './StudentDetailsPage.css'

export const StudentDetailsPage: React.FC = () => {
    const { username } = useParams<{ username: string }>()
    const navigate = useNavigate()
    const { showToast } = useToast()
    const [student, setStudent] = useState<Student | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    // Courses state
    const [enrolledCourses, setEnrolledCourses] = useState<Course[]>([])
    const [loadingCourses, setLoadingCourses] = useState(false)

    // Edit state
    const [isEditing, setIsEditing] = useState(false)
    const [editForm, setEditForm] = useState<Partial<Student>>({})
    const [saving, setSaving] = useState(false)
    const [saveError, setSaveError] = useState<string | null>(null)
    const [file, setFile] = useState<File | null>(null)

    useEffect(() => {
        loadStudent()
    }, [username])

    const loadStudent = () => {
        if (!username) return
        setLoading(true)
        setError(null)
        fetchStudentByUsername(username)
            .then((s) => {
                if (!s) throw new Error(`Student "${username}" not found. Please verify the username or link.`)
                setStudent(s)
                setEditForm(s) // Initialize form
                loadEnrolledCourses(s.id)
            })
            .catch((err) => {
                setError(err.message || 'Failed to load student details')
            })
            .finally(() => setLoading(false))
    }

    const handleEditToggle = () => {
        setIsEditing(!isEditing)
        if (!isEditing && student) {
            setEditForm(student) // Reset form on open
            setSaveError(null)
            setFile(null)
        }
    }

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target
        setEditForm(prev => ({ ...prev, [name]: value }))
    }

    const loadEnrolledCourses = async (studentId: number) => {
        setLoadingCourses(true)
        try {
            const courses = await fetchCoursesByStudentId(studentId)
            setEnrolledCourses(courses)
        } catch (err: any) {
            console.error('Failed to load courses:', err)
            // We don't set a global error here to not block the whole page
        } finally {
            setLoadingCourses(false)
        }
    }

    const handleUnenroll = async (courseId: number) => {
        if (!student) return
        if (!window.confirm('Are you sure you want to unenroll this student from the course?')) return

        try {
            await unenrollStudentFromCourse(courseId, student.id)
            showToast('Student unenrolled successfully', 'success')
            // Refresh courses
            loadEnrolledCourses(student.id)
        } catch (err: any) {
            showToast(err.message || 'Failed to unenroll student', 'error')
        }
    }

    const handleSave = async () => {
        if (!student || !username) return

        setSaving(true)
        setSaveError(null)
        try {
            await updateStudent(username, editForm, file || undefined)
            // Refresh data
            const updated = { ...student, ...editForm } as Student
            setStudent(updated)
            setIsEditing(false)
            showToast('Student updated successfully', 'success')
        } catch (err: any) {
            setSaveError(`Failed to update student: ${err.message || 'Unknown error'}`)
            console.error('Update student failed:', err)
        } finally {
            setSaving(false)
        }
    }

    if (loading) return <div className="p-4">Loading student details...</div>
    if (error) return (
        <div className="p-4">
            <ErrorMessage
                message={error}
                onRetry={loadStudent}
                title="Failed to Load Student"
            />
            <button onClick={() => navigate(-1)} className="btn btn-secondary mt-4">Go Back</button>
        </div>
    )
    if (!student) return null

    return (
        <div className="student-details-page">
            <button onClick={() => navigate(-1)} className="back-btn">← Back to Students</button>

            <div className="details-card">
                <div className="details-header">
                    <div className="details-avatar">
                        {student.image ? (
                            <img src={student.image} alt={student.username} />
                        ) : (
                            <div className="details-avatar-placeholder">
                                {student.username.slice(0, 2).toUpperCase()}
                            </div>
                        )}
                    </div>
                    <div className="details-header-content">
                        <div className="details-title">
                            <h1>{student.firstName} {student.lastName}</h1>
                            <p className="details-subtitle">@{student.username}</p>
                        </div>
                        <div className="details-actions">
                            <button
                                onClick={handleEditToggle}
                                className={`btn ${isEditing ? 'btn-secondary' : 'btn-primary'}`}
                            >
                                {isEditing ? 'Cancel' : 'Edit Student'}
                            </button>
                        </div>
                    </div>
                </div>

                <div className="details-body">
                    {saveError && (
                        <div style={{ marginBottom: '1.5rem' }}>
                            <ErrorMessage message={saveError} title="Save Failed" />
                        </div>
                    )}

                    {isEditing ? (
                        <div className="edit-form">
                            <div className="form-group">
                                <label>First Name</label>
                                <input
                                    name="firstName"
                                    value={editForm.firstName || ''}
                                    onChange={handleInputChange}
                                    className="form-input"
                                />
                            </div>
                            <div className="form-group">
                                <label>Last Name</label>
                                <input
                                    name="lastName"
                                    value={editForm.lastName || ''}
                                    onChange={handleInputChange}
                                    className="form-input"
                                />
                            </div>
                            <div className="form-group">
                                <label>Email</label>
                                <input
                                    name="email"
                                    value={editForm.email || ''}
                                    onChange={handleInputChange}
                                    className="form-input"
                                />
                            </div>
                            <div className="form-group">
                                <label>Phone Details</label>
                                <input
                                    name="phoneNumber"
                                    value={editForm.phoneNumber || ''}
                                    onChange={handleInputChange}
                                    className="form-input"
                                />
                            </div>
                            <div className="form-group">
                                <label>Profile Image</label>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => {
                                        if (e.target.files && e.target.files[0]) {
                                            setFile(e.target.files[0])
                                        }
                                    }}
                                    className="form-input"
                                />
                            </div>
                            <div className="form-group">
                                <label>New Password (Optional)</label>
                                <input
                                    name="password"
                                    type="password"
                                    onChange={handleInputChange}
                                    className="form-input"
                                    placeholder="Enter new password to change it"
                                />
                                <small className="form-info">Leave blank to keep current password</small>
                            </div>

                            <div className="form-actions">
                                <Button
                                    onClick={handleSave}
                                    disabled={saving}
                                    style={{ marginTop: '1rem' }}
                                >
                                    {saving ? 'Saving...' : 'Save Changes'}
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <div className="view-mode">
                            <div className="details-section">
                                <h2>Contact Information</h2>
                                <div className="info-row">
                                    <span className="info-label">Email:</span>
                                    <span className="info-value">{student.email}</span>
                                </div>
                                <div className="info-row">
                                    <span className="info-label">Phone:</span>
                                    <span className="info-value">{student.phoneNumber}</span>
                                </div>
                            </div>

                            <div className="details-section">
                                <h2>Account Information</h2>
                                <div className="info-row">
                                    <span className="info-label">User ID:</span>
                                    <span className="info-value">{student.id}</span>
                                </div>
                                <div className="info-row">
                                    <span className="info-label">Username:</span>
                                    <span className="info-value">{student.username}</span>
                                </div>
                            </div>

                            <div className="details-section">
                                <h2>Enrolled Courses</h2>
                                {loadingCourses ? (
                                    <div className="loading-inline">Loading courses...</div>
                                ) : enrolledCourses.length > 0 ? (
                                    <div className="course-list">
                                        {enrolledCourses.map(course => (
                                            <div key={course.id} className="course-item">
                                                <div className="course-info">
                                                    <span className="course-title">{course.title}</span>
                                                    <span className="course-id">ID: {course.id}</span>
                                                </div>
                                                <button
                                                    className="btn btn-danger btn-sm"
                                                    onClick={() => handleUnenroll(course.id)}
                                                >
                                                    Unenroll
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="no-data">No enrolled courses found.</p>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
