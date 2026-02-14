import { request } from './client'

export interface Student {
    id: number
    username: string
    firstName: string
    lastName: string
    email: string
    phoneNumber: string
    image: string | null
}

export async function fetchAllStudents(): Promise<Student[]> {
    const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null
    const headers: Record<string, string> = {}
    if (token) {
        headers['Authorization'] = `Bearer ${token}`
    }

    return request<Student[]>('/api/student/all', {
        method: 'GET',
        headers,
    })
}

export async function fetchStudentByUsername(username: string): Promise<Student | null> {
    try {
        const students = await fetchAllStudents()
        return students.find((s: any) => {
            const uName = (s.username || s.userName || '').toLowerCase();
            return uName === username.toLowerCase();
        }) || null
    } catch (error) {
        console.error('Failed to fetch students:', error)
        return null
    }
}

export async function updateStudent(username: string, data: Partial<Student>): Promise<void> {
    const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
    }
    if (token) {
        headers['Authorization'] = `Bearer ${token}`
    }

    // Following pattern in profile.ts: POST to /api/auth/student/update
    // Alternatively, if it's a direct resource update: /api/student/update
    // We'll try /api/auth/student/update which exists in profile.ts
    await request<void>(`/api/auth/student/update`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ ...data, username }), // Ensure identifier is included
    })
}
