import { request } from './client'

export interface AuthResponse {
  token: string
  username: string
  roles: string[]
}

export interface LoginRequest {
  username: string
  password: string
}

export interface StudentRegistrationRequest {
  username: string
  password: string
  firstName: string
  lastName: string
  email: string
  phoneNumber: string
  image?: string
}

export interface TeacherRegistrationRequest {
  username: string
  password: string
  firstName: string
  lastName: string
  email: string
  phoneNumber: string
  department: string
  bio?: string
  image?: string
}

export async function login(body: LoginRequest): Promise<AuthResponse> {
  return request<AuthResponse>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

export async function registerStudent(
  body: StudentRegistrationRequest,
): Promise<void> {
  await request<unknown>('/api/auth/student/register', {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

export async function registerTeacher(
  body: TeacherRegistrationRequest,
): Promise<void> {
  await request<unknown>('/api/auth/teacher/register', {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

