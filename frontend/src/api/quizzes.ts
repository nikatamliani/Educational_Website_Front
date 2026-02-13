import { request } from './client'
import { fetchMyCourses, fetchTeacherCourses } from './courses'

// ── Backend DTO interfaces ──────────────────────────────────────────

export interface QuizQuestionDto {
    id: number
    quizId: number
    question: string
    optionA: string
    optionB: string
    optionC: string
    optionD: string
    correctOption: string | null // null for students (stripped by backend)
}

export interface QuizDto {
    id: number
    courseId: number
    title: string
    startDate: string   // ISO datetime
    endDate: string     // ISO datetime
    quizQuestionDtos: QuizQuestionDto[]
}

export interface QuizQuestionSubmissionDto {
    id: number
    questionId: number
    selectedOption: string
    correct: boolean
    correctOption?: string
}

export interface QuizSubmissionDto {
    id: number
    studentId: number
    quizId: number
    questionSubmissions: QuizQuestionSubmissionDto[]
    submittedAt: string // ISO datetime
    score: number | null
}

// ── Enriched frontend type ──────────────────────────────────────────

export type QuizStatus = 'upcoming' | 'returned'

export interface Quiz {
    id: number
    courseId: number
    courseTitle: string
    title: string
    startDate: string
    endDate: string
    questionCount: number
    status: QuizStatus
    score?: number | null
    totalQuestions?: number
    submittedAt?: string
}

// ── Helper ──────────────────────────────────────────────────────────

function authHeaders(): Record<string, string> {
    const token = localStorage.getItem('authToken')
    const headers: Record<string, string> = {}
    if (token) headers['Authorization'] = `Bearer ${token}`
    return headers
}

// ── API functions ───────────────────────────────────────────────────

export async function fetchStudentQuizzes(): Promise<Quiz[]> {
    const username = localStorage.getItem('authUsername')
    if (!username) return []

    try {
        const courses = await fetchMyCourses()
        const allQuizzes: Quiz[] = []

        await Promise.all(
            courses.map(async (course) => {
                try {
                    const courseQuizzes = await request<QuizDto[]>(
                        `/api/quiz/course/${course.id}`,
                        { method: 'GET', headers: authHeaders() }
                    )

                    const quizPromises = courseQuizzes.map(async (dto) => {
                        let status: QuizStatus = 'upcoming'
                        let score: number | null = null
                        let submittedAt: string | undefined

                        // Check if student has already submitted this quiz
                        // Uses /my-submission which resolves student from auth context
                        try {
                            const submission = await request<QuizSubmissionDto>(
                                `/api/quiz/${dto.id}/my-submission`,
                                { method: 'GET', headers: authHeaders() }
                            )
                            if (submission) {
                                status = 'returned'
                                score = submission.score
                                submittedAt = submission.submittedAt
                            }
                        } catch {
                            // No submission found → still upcoming
                        }

                        const quiz: Quiz = {
                            id: dto.id,
                            courseId: course.id,
                            courseTitle: course.title,
                            title: dto.title,
                            startDate: dto.startDate,
                            endDate: dto.endDate,
                            questionCount: dto.quizQuestionDtos?.length ?? 0,
                            status,
                            score,
                            totalQuestions: dto.quizQuestionDtos?.length ?? 0,
                            submittedAt,
                        }
                        return quiz
                    })

                    const resolved = await Promise.all(quizPromises)
                    allQuizzes.push(...resolved)
                } catch (e) {
                    console.error(`Failed to fetch quizzes for course ${course.id}`, e)
                }
            })
        )

        return allQuizzes
    } catch (error) {
        console.error('Failed to fetch student quizzes:', error)
        return []
    }
}

export async function fetchTeacherQuizzes(): Promise<Quiz[]> {
    try {
        const courses = await fetchTeacherCourses()
        const allQuizzes: Quiz[] = []

        await Promise.all(
            courses.map(async (course) => {
                try {
                    const courseQuizzes = await request<QuizDto[]>(
                        `/api/quiz/course/${course.id}`,
                        { method: 'GET', headers: authHeaders() }
                    )

                    for (const dto of courseQuizzes) {
                        const now = new Date()
                        const endDate = new Date(dto.endDate)
                        const status: QuizStatus = endDate < now ? 'returned' : 'upcoming'

                        allQuizzes.push({
                            id: dto.id,
                            courseId: course.id,
                            courseTitle: course.title,
                            title: dto.title,
                            startDate: dto.startDate,
                            endDate: dto.endDate,
                            questionCount: dto.quizQuestionDtos?.length ?? 0,
                            status,
                            totalQuestions: dto.quizQuestionDtos?.length ?? 0,
                        })
                    }
                } catch (e) {
                    console.error(`Failed to fetch quizzes for course ${course.id}`, e)
                }
            })
        )

        return allQuizzes
    } catch (error) {
        console.error('Failed to fetch teacher quizzes:', error)
        return []
    }
}

export async function fetchQuizById(id: number): Promise<QuizDto | null> {
    try {
        return await request<QuizDto>(`/api/quiz/get/${id}`, {
            method: 'GET',
            headers: authHeaders(),
        })
    } catch (error) {
        console.error('Failed to fetch quiz:', error)
        return null
    }
}

export async function submitQuiz(
    quizId: number,
    answers: { questionId: number; selectedOption: string }[]
): Promise<QuizSubmissionDto> {
    const body: Partial<QuizSubmissionDto> = {
        quizId,
        studentId: 0, // Backend resolves from auth
        questionSubmissions: answers.map((a) => ({
            id: 0,
            questionId: a.questionId,
            selectedOption: a.selectedOption,
            correct: false, // Server calculates
        })),
    }

    return request<QuizSubmissionDto>(`/api/quiz/${quizId}/submit`, {
        method: 'POST',
        headers: { ...authHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    })
}

export async function fetchQuizSubmission(
    quizId: number,
    studentId: number
): Promise<QuizSubmissionDto | null> {
    try {
        return await request<QuizSubmissionDto>(
            `/api/quiz/${quizId}/submissions/student/${studentId}`,
            { method: 'GET', headers: authHeaders() }
        )
    } catch {
        return null
    }
}

export async function fetchMyQuizSubmission(
    quizId: number
): Promise<QuizSubmissionDto | null> {
    try {
        return await request<QuizSubmissionDto>(
            `/api/quiz/${quizId}/my-submission`,
            { method: 'GET', headers: authHeaders() }
        )
    } catch {
        return null
    }
}

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

export async function saveQuiz(quiz: Partial<QuizDto>): Promise<QuizDto> {
    const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null
    return request<QuizDto>('/api/quiz/save', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(quiz),
    })
}

export async function deleteQuiz(id: number): Promise<void> {
    const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null
    await request<void>(`/api/quiz/${id}`, {
        method: 'DELETE',
        headers: {
            Authorization: `Bearer ${token}`,
        },
    })
}

export async function saveQuestion(question: Partial<QuizQuestionDto>): Promise<QuizQuestionDto> {
    const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null
    return request<QuizQuestionDto>('/api/quiz/questions/save', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(question),
    })
}

export async function deleteQuestion(id: number): Promise<void> {
    const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null
    await request<void>(`/api/quiz/questions/${id}`, {
        method: 'DELETE',
        headers: {
            Authorization: `Bearer ${token}`,
        },
    })
}
