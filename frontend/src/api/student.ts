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
        return students.find((s) => s.username === username) || null
    } catch (error) {
        console.error('Failed to fetch students:', error)
        return null
    }
}
