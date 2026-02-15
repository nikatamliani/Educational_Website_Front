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

export async function createLesson(lesson: Partial<LessonDto>, file?: File): Promise<LessonDto> {
    const headers = authHeaders()
    const formData = new FormData()
    formData.append('data', JSON.stringify(lesson))
    if (file) formData.append('file', file)

    return request<LessonDto>('/api/lessons/save', {
        method: 'POST',
        headers,
        body: formData,
    })
}

export async function updateLesson(lesson: Partial<LessonDto>, file?: File): Promise<LessonDto> {
    const headers = authHeaders()
    const formData = new FormData()
    formData.append('data', JSON.stringify(lesson))
    if (file) formData.append('file', file)

    return request<LessonDto>('/api/lessons/save', {
        method: 'POST',
        headers,
        body: formData,
    })
}

export async function deleteLesson(id: number): Promise<void> {
    return request<void>(`/api/lessons/${id}`, {
        method: 'DELETE',
        headers: authHeaders(),
    })
}
