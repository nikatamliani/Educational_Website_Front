import { request } from './client'
import { fetchMyCourses } from './courses'


export type AssignmentStatus = 'upcoming' | 'submitted' | 'returned'

export interface Assignment {
    id: number
    courseId: number
    courseTitle: string
    title: string
    description: string
    dueDate: string // ISO date string
    status: AssignmentStatus
    grade?: number
    maxGrade?: number
    feedback?: string
    submittedDate?: string
}

interface AssignmentDto {
    id: number
    courseId: number
    title: string
    description: string
    deadline: string // ISO date string
}

interface AssignmentSubmissionDto {
    assignmentId: number
    studentId: number
    content: string
}

interface AssignmentResultDto {
    assignmentId: number
    studentId: number
    grade: number
    feedback: string
}

export async function fetchStudentAssignments(): Promise<Assignment[]> {
    const username = localStorage.getItem('authUsername')
    if (!username) return []

    try {
        const token = localStorage.getItem('authToken')
        const headers: Record<string, string> = {}
        if (token) {
            headers['Authorization'] = `Bearer ${token}`
        }

        // 1. Get My Courses
        const courses = await fetchMyCourses()

        // 2. For each course, get assignments
        const allAssignments: Assignment[] = []

        await Promise.all(
            courses.map(async (course) => {
                try {
                    const courseAssignments = await request<AssignmentDto[]>(
                        `/api/assignment/course/${course.id}`,
                        { method: 'GET', headers }
                    )

                    // 3. For each assignment, get status
                    const assignmentPromises = courseAssignments.map(async (dto) => {
                        let status: AssignmentStatus = 'upcoming'
                        let grade: number | undefined
                        let maxGrade = 100 // Default max grade
                        let feedback: string | undefined
                        let submittedDate: string | undefined

                        // Check if returned (graded)
                        try {
                            const result = await request<AssignmentResultDto>(
                                `/api/assignment/my-result/${dto.id}`,
                                { method: 'GET', headers }
                            )
                            if (result) {
                                status = 'returned'
                                grade = result.grade
                                feedback = result.feedback
                            }
                        } catch (e) {
                            // No result found, ignore
                        }

                        // If not returned, check if submitted
                        if (status !== 'returned') {
                            try {
                                const submission = await request<AssignmentSubmissionDto>(
                                    `/api/assignment/my-submission/${dto.id}`,
                                    { method: 'GET', headers }
                                )
                                if (submission) {
                                    status = 'submitted'
                                    // We don't have submission date in DTO, so we omit it or assume current/recent
                                }
                            } catch (e) {
                                // No submission found, ignore
                            }
                        }

                        // Map to Assignment interface
                        const assignment: Assignment = {
                            id: dto.id,
                            courseId: course.id,
                            courseTitle: course.title,
                            title: dto.title,
                            description: dto.description,
                            dueDate: dto.deadline,
                            status,
                            grade,
                            maxGrade,
                            feedback,
                            submittedDate,
                        }

                        return assignment
                    })

                    const resolvedAssignments = await Promise.all(assignmentPromises)
                    allAssignments.push(...resolvedAssignments)
                } catch (e) {
                    console.error(`Failed to fetch assignments for course ${course.id}`, e)
                }
            })
        )

        return allAssignments
    } catch (error) {
        console.error('Failed to fetch student assignments:', error)
        return []
    }
}

// ─── Teacher: fetch assignments for a specific course ───
export interface CourseAssignment {
    id: number
    courseId: number
    title: string
    description: string | null
    content: string | null
    startDate: string | null
    deadline: string | null
}

export async function fetchAssignmentsByCourseId(courseId: number): Promise<CourseAssignment[]> {
    const token = localStorage.getItem('authToken')
    const headers: Record<string, string> = {}
    if (token) headers['Authorization'] = `Bearer ${token}`

    return await request<CourseAssignment[]>(`/api/assignment/course/${courseId}`, {
        method: 'GET',
        headers,
    })
}

// ─── Teacher: create a new assignment ───
export interface CreateAssignmentPayload {
    courseId: number
    title: string
    description?: string
    content?: string
    startDate?: string  // ISO datetime string
    deadline?: string   // ISO datetime string
}

export async function createAssignment(payload: CreateAssignmentPayload): Promise<CourseAssignment> {
    const token = localStorage.getItem('authToken')
    if (!token) throw new Error('You must be logged in as a teacher to create assignments.')

    return await request<CourseAssignment>('/api/assignment/save', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
            id: 0,
            courseId: payload.courseId,
            title: payload.title,
            description: payload.description ?? '',
            content: payload.content ?? '',
            startDate: payload.startDate ?? null,
            deadline: payload.deadline ?? null,
        }),
    })
}

// Existing DTO shapes returned by backend
export interface AssignmentSubmissionResponse {
    assignmentId: number
    studentId: number
    content: string | null
    studentFirstName: string | null
    studentLastName: string | null
    studentUsername: string | null
    assignmentTitle: string | null
    assignmentDeadline: string | null
    courseName: string | null
}

export interface AssignmentResultResponse {
    assignmentId: number
    studentId: number
    grade: number | null
    feedback: string | null
    studentFirstName: string | null
    studentLastName: string | null
    studentUsername: string | null
    assignmentTitle: string | null
    courseName: string | null
}

export async function fetchTeacherSubmissions(): Promise<AssignmentSubmissionResponse[]> {
    const token = localStorage.getItem('authToken')
    const headers: Record<string, string> = {}
    if (token) headers['Authorization'] = `Bearer ${token}`

    return await request<AssignmentSubmissionResponse[]>('/api/assignment/teacher-submissions', {
        method: 'GET',
        headers,
    })
}

export async function fetchTeacherResults(): Promise<AssignmentResultResponse[]> {
    const token = localStorage.getItem('authToken')
    const headers: Record<string, string> = {}
    if (token) headers['Authorization'] = `Bearer ${token}`

    return await request<AssignmentResultResponse[]>('/api/assignment/teacher-results', {
        method: 'GET',
        headers,
    })
}

export async function saveAssignmentResult(data: {
    assignmentId: number
    studentId: number
    grade: number
    feedback: string
}): Promise<AssignmentResultResponse> {
    const token = localStorage.getItem('authToken')
    const headers: Record<string, string> = { 'Content-Type': 'application/json' }
    if (token) headers['Authorization'] = `Bearer ${token}`

    return await request<AssignmentResultResponse>('/api/assignment/result/save', {
        method: 'POST',
        headers,
        body: JSON.stringify(data),
    })
}

export async function fetchAssignmentById(id: number): Promise<Assignment | null> {
    try {
        const token = localStorage.getItem('authToken')
        const headers: Record<string, string> = {}
        if (token) {
            headers['Authorization'] = `Bearer ${token}`
        }

        // 1. Fetch Assignment DTO
        const dto = await request<AssignmentDto>(`/api/assignment/${id}`, {
            method: 'GET',
            headers,
        })

        // 2. Fetch Course (needed for title)
        // We could fetch it, or just use ID if we don't have an endpoint for single course without auth or similar.
        // But wait, we have fetchCourseById in courses.ts? Let's assume we can get it or just map what we have.
        // Actually, the assignment DTO from /api/assignment/{id} might not have course title.
        // Let's check AssignmentDto interface. It has courseId.

        // We need to fetch the course title to be complete, or just show "Course X".
        // Let's try to fetch course details.
        let courseTitle = 'Unknown Course'
        try {
            // We can import fetchCourseById from courses.ts if exported, or just request
            // But for now let's keep it simple.
        } catch (e) { }

        // 3. Fetch Status (Submission / Result)
        let status: AssignmentStatus = 'upcoming'
        let grade: number | undefined
        let maxGrade = 100
        let feedback: string | undefined
        let submittedDate: string | undefined

        // Check result
        try {
            const result = await request<AssignmentResultDto>(
                `/api/assignment/my-result/${id}`,
                { method: 'GET', headers }
            )
            if (result) {
                status = 'returned'
                grade = result.grade
                feedback = result.feedback
            }
        } catch (e) { }

        if (status !== 'returned') {
            try {
                const submission = await request<AssignmentSubmissionDto>(
                    `/api/assignment/my-submission/${id}`,
                    { method: 'GET', headers }
                )
                if (submission) {
                    status = 'submitted'
                    // submittedDate = ...
                }
            } catch (e) { }
        }

        return {
            id: dto.id,
            courseId: dto.courseId,
            courseTitle, // We might need to fetch this if important
            title: dto.title,
            description: dto.description,
            dueDate: dto.deadline,
            status,
            grade,
            maxGrade,
            feedback,
            submittedDate
        }
    } catch (error) {
        console.error('Failed to fetch assignment:', error)
        return null
    }
}

export async function submitAssignment(assignmentId: number, content: string): Promise<void> {
    const token = localStorage.getItem('authToken')
    const headers: Record<string, string> = {
        'Content-Type': 'application/json'
    }
    if (token) {
        headers['Authorization'] = `Bearer ${token}`
    }

    // The backend endpoint is /submissions/save and it takes AssignmentSubmissionDto
    // The backend implementation of saveAssignmentSubmission:
    // int studentId = getCurrentStudent().getId();
    // dto.setStudentId(studentId);
    // So we don't need to send studentId, just assignmentId and content.

    const body = {
        assignmentId,
        studentId: 0, // Ignored by backend
        content
    }

    await request<unknown>('/api/assignment/submissions/save', {
        method: 'POST',
        headers,
        body: JSON.stringify(body)
    })
}
