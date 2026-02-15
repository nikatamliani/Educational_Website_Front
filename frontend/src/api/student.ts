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

/**
 * Normalizes backend DTOs to ensure 'username' property exists.
 * Some endpoints might return 'userName', 'user', or 'login' instead.
 * Fallback to String(id) if no string-based identifier is found.
 */
function normalizeStudent(s: any): Student {
    if (!s) return s;
    const username = s.username || s.userName || s.user || s.login || String(s.id) || 'unknown';

    // Debug log if we had to fallback to ID or "unknown"
    if (!s.username && !s.userName) {
        console.warn(`Student (ID: ${s.id}) missing username/userName. Normalized to "${username}" via fallback.`, s);
    }

    return {
        ...s,
        username
    };
}

export async function fetchAllStudents(): Promise<Student[]> {
    const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null
    const headers: Record<string, string> = {}
    if (token) {
        headers['Authorization'] = `Bearer ${token}`
    }

    const data = await request<Student[]>('/api/student/all', {
        method: 'GET',
        headers,
    })
    return data.map(normalizeStudent)
}

export async function fetchStudentByUsername(username: string): Promise<Student | null> {
    try {
        // Try direct endpoint first (improving efficiency)
        const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null
        const headers: Record<string, string> = {}
        if (token) {
            headers['Authorization'] = `Bearer ${token}`
        }

        const result = await request<Student>(`/api/student/get-by-username/${username}`, {
            method: 'GET',
            headers,
        })

        // If direct endpoint returns null/undefined or an empty object, trigger fallback
        if (!result || Object.keys(result).length === 0) {
            console.warn(`Direct fetch for student "${username}" returned empty result, trying fallback...`)
            return await fetchStudentFallback(username)
        }

        return normalizeStudent(result)
    } catch (error: any) {
        // Log the error for debugging
        console.warn(`Direct fetch for student "${username}" failed, trying fallback:`, error)
        return await fetchStudentFallback(username)
    }
}

async function fetchStudentFallback(username: string): Promise<Student | null> {
    try {
        // Fetch all students - use try/catch to avoid crashing if this also fails
        let students: Student[] = []
        try {
            students = await fetchAllStudents()
        } catch (e) {
            console.error('Failed to fetch list of all students for fallback:', e)
            return null
        }

        const target = username.toLowerCase().trim()

        const found = students.find((s: any) => {
            const uName = (s.username || s.userName || '').toLowerCase().trim()
            const sId = String(s.id).trim()
            const sEmail = (s.email || '').toLowerCase().trim()

            // Match against: 
            // 1. Lowercase username (handles case mismatches)
            // 2. ID as string (handles links using ID instead of username)
            // 3. Email (an extra identifier fallback)
            return uName === target || sId === target || sEmail === target
        })

        return found ? normalizeStudent(found) : null
    } catch (fallbackError) {
        console.error('Fallback logic failed with unexpected error:', fallbackError)
        return null // Final safety
    }
}

export async function updateStudent(username: string, data: Partial<Student> & { password?: string }): Promise<void> {
    const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
    }
    if (token) {
        headers['Authorization'] = `Bearer ${token}`
    }

    // Following pattern in profile.ts: POST to /api/auth/student/update
    await request<void>(`/api/auth/student/update`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ ...data, username }), // Ensure identifier is included
    })
}
