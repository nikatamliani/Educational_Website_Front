import { request } from './client'

export interface UserProfile {
    id: number
    username: string
    firstName: string
    lastName: string
    email: string
    phoneNumber: string
    image: string | null
}

export async function fetchMyProfile(): Promise<UserProfile> {
    const token = localStorage.getItem('authToken')
    if (!token) throw new Error('Not authenticated')

    return request<UserProfile>('/api/student/me', {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}` },
    })
}

export interface UpdateProfilePayload {
    id: number
    username: string
    firstName: string
    lastName: string
    email: string
    phoneNumber: string
    image: string | null
    password?: string
}

export async function updateMyProfile(data: UpdateProfilePayload): Promise<void> {
    const token = localStorage.getItem('authToken')
    if (!token) throw new Error('Not authenticated')

    return request<void>('/api/auth/student/update', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify(data),
    })
}
