import { request } from './client'

export interface Teacher {
    id: number
    username: string
    firstName: string
    lastName: string
    email: string
    phoneNumber: string
    department: string
    bio: string | null
    image: string | null
}

export async function fetchAllTeachers(): Promise<Teacher[]> {
    const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null
    const headers: Record<string, string> = {}
    if (token) {
        headers['Authorization'] = `Bearer ${token}`
    }

    return request<Teacher[]>('/api/teacher/all', {
        method: 'GET',
        headers,
    })
}

export async function fetchTeacherByUsername(username: string): Promise<Teacher | null> {
    try {
        const teachers = await fetchAllTeachers()
        return teachers.find((t: any) => {
            const uName = (t.username || t.userName || '').toLowerCase();
            return uName === username.toLowerCase();
        }) || null
    } catch (error) {
        console.error('Failed to fetch teachers:', error)
        return null
    }
}

export async function updateTeacher(username: string, data: Partial<Teacher>): Promise<void> {
    const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
    }
    if (token) {
        headers['Authorization'] = `Bearer ${token}`
    }

    // Following pattern in profile.ts: POST to /api/auth/teacher/update
    await request<void>(`/api/auth/teacher/update`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ ...data, username }),
    })
}
