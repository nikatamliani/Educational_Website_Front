import { request } from './client'

export interface CourseQuiz {
    id: number
    courseId: number
    title: string
    startDate: string | null
    endDate: string | null
}

export async function fetchQuizzesByCourseId(courseId: number): Promise<CourseQuiz[]> {
    const token = localStorage.getItem('authToken')
    const headers: Record<string, string> = {}
    if (token) headers['Authorization'] = `Bearer ${token}`

    return await request<CourseQuiz[]>(`/api/quiz/course/${courseId}`, {
        method: 'GET',
        headers,
    })
}
