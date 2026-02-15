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

export async function updateTeacher(username: string, data: Partial<Teacher>, file?: File): Promise<void> {
    const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null
    const formData = new FormData()
    formData.append('data', JSON.stringify({ ...data, username }))
    if (file) {
        formData.append('file', file)
    }

    await request<void>(`/api/teacher/update`, {
        method: 'POST',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
        body: formData,
    })
}
