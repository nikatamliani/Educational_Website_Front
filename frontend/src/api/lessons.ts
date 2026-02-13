import { request } from './client'

export interface LessonDto {
    id: number
    courseId: number
    title: string
    content: string
    startDate: string | null
    endDate: string | null
}

function authHeaders(): Record<string, string> {
    const token = localStorage.getItem('authToken')
    const headers: Record<string, string> = {}
    if (token) headers['Authorization'] = `Bearer ${token}`
    return headers
}

export async function fetchLessonsByCourse(courseId: number): Promise<LessonDto[]> {
    return request<LessonDto[]>(`/api/lessons/course/${courseId}`, {
        method: 'GET',
        headers: authHeaders(),
    })
}
