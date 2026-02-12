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
  return request<Course[]>('/api/course/all', {
    method: 'GET',
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

