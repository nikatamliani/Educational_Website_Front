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

export async function updateStudent(username: string, data: Partial<Student>, file?: File): Promise<void> {
    const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null
    // Use FormData for multipart file upload support
    const formData = new FormData()
    formData.append('data', JSON.stringify({ ...data, username }))
    if (file) {
        formData.append('file', file)
    }

    await request<void>(`/api/student/update`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {}, // Content-Type header removed for FormData
        body: formData,
    })
}
