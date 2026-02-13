import { request } from './client'

/* ── Shared base fields ── */
interface ProfileBase {
    id: number
    username: string
    firstName: string
    lastName: string
    email: string
    phoneNumber: string
    image: string | null
}

/* ── Student profile ── */
export interface StudentProfile extends ProfileBase {
    _role: 'student'
}

/* ── Teacher profile (extra fields) ── */
export interface TeacherProfile extends ProfileBase {
    _role: 'teacher'
    department: string
    bio: string
}

export type UserProfile = StudentProfile | TeacherProfile

/* ── Fetch the current user's profile (auto-detects role) ── */
export async function fetchMyProfile(): Promise<UserProfile> {
    const token = localStorage.getItem('authToken')
    if (!token) throw new Error('Not authenticated')

    const headers = { Authorization: `Bearer ${token}` }

    let roles: string[] = []
    try {
        roles = JSON.parse(localStorage.getItem('authRoles') || '[]')
    } catch { /* ignore */ }

    if (roles.includes('ROLE_TEACHER')) {
        const data = await request<Omit<TeacherProfile, '_role'>>('/api/teacher/me', { method: 'GET', headers })
        return { ...data, _role: 'teacher' }
    } else {
        const data = await request<Omit<StudentProfile, '_role'>>('/api/student/me', { method: 'GET', headers })
        return { ...data, _role: 'student' }
    }
}

/* ── Update payloads ── */
export interface UpdateStudentPayload extends ProfileBase {
    password?: string
}

export interface UpdateTeacherPayload extends ProfileBase {
    department: string
    bio: string
    password?: string
}

/* ── Update the current user's profile ── */
export async function updateMyProfile(
    data: UpdateStudentPayload | UpdateTeacherPayload,
    role: 'student' | 'teacher',
): Promise<void> {
    const token = localStorage.getItem('authToken')
    if (!token) throw new Error('Not authenticated')

    const endpoint = role === 'teacher' ? '/api/auth/teacher/update' : '/api/auth/student/update'
    return request<void>(endpoint, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify(data),
    })
}
