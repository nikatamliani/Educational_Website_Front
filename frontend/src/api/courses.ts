import { request } from './client'

export interface Course {
  id: number
  title: string
  description: string
  price: number | null
  startDate: string | null
  duration: number | null
  syllabus: string | null
}

export async function fetchAllCourses(): Promise<Course[]> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null
  const headers: Record<string, string> = {}
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  return request<Course[]>('/api/course/all', {
    method: 'GET',
    headers,
  })
}

export async function fetchCourseById(id: number): Promise<Course> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null
  const headers: Record<string, string> = {}
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  return request<Course>(`/api/course/${id}`, {
    method: 'GET',
    headers,
  })
}

export async function fetchMyCourses(): Promise<Course[]> {
  const token =
    typeof window !== 'undefined' ? localStorage.getItem('authToken') : null

  if (!token) {
    throw new Error('You must be logged in as a student to view your courses.')
  }

  return request<Course[]>('/api/course/my', {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })
}

export async function fetchTeacherCourses(): Promise<Course[]> {
  const token =
    typeof window !== 'undefined' ? localStorage.getItem('authToken') : null

  if (!token) {
    throw new Error('You must be logged in as a teacher to view your courses.')
  }

  return request<Course[]>('/api/course/my-teaching', {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })
}

export async function enrollInCourse(courseId: number): Promise<void> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null

  return request<void>(`/api/course/${courseId}/enroll`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  })
}
