import { request } from './client'

export interface Teacher {
    id: number
    username: string
    firstName: string
    lastName: string
    email: string
    phoneNumber: string
    department: string
    bio: string | null
    image: string | null
}

/**
 * Normalizes backend DTOs to ensure 'username' property exists.
 * Some endpoints might return 'userName', 'user', or 'login' instead.
 * Fallback to String(id) if no string-based identifier is found.
 */
function normalizeTeacher(t: any): Teacher {
    if (!t) return t;
    const username = t.username || t.userName || t.user || t.login || String(t.id) || 'unknown';

    // Debug log if we had to fallback to ID or "unknown"
    if (!t.username && !t.userName) {
        console.warn(`Teacher (ID: ${t.id}) missing username/userName. Normalized to "${username}" via fallback.`, t);
    }

    return {
        ...t,
        username
    };
}

export async function fetchAllTeachers(): Promise<Teacher[]> {
    const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null
    const headers: Record<string, string> = {}
    if (token) {
        headers['Authorization'] = `Bearer ${token}`
    }

    const data = await request<Teacher[]>('/api/teacher/all', {
        method: 'GET',
        headers,
    })
    return data.map(normalizeTeacher)
}

export async function fetchTeacherByUsername(username: string): Promise<Teacher | null> {
    try {
        // Try direct endpoint first (improving efficiency)
        const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null
        const headers: Record<string, string> = {}
        if (token) {
            headers['Authorization'] = `Bearer ${token}`
        }

        const result = await request<Teacher>(`/api/teacher/get-by-username/${username}`, {
            method: 'GET',
            headers,
        })

        // If direct endpoint returns null/undefined or an empty object, trigger fallback
        if (!result || Object.keys(result).length === 0) {
            console.warn(`Direct fetch for teacher "${username}" returned empty result, trying fallback...`)
            return await fetchTeacherFallback(username)
        }

        return normalizeTeacher(result)
    } catch (error: any) {
        // Log the error for debugging
        console.warn(`Direct fetch for teacher "${username}" failed, trying fallback:`, error)
        return await fetchTeacherFallback(username)
    }
}

async function fetchTeacherFallback(username: string): Promise<Teacher | null> {
    try {
        // Fetch all teachers - use try/catch to avoid crashing if this also fails
        let teachers: Teacher[] = []
        try {
            teachers = await fetchAllTeachers()
        } catch (e) {
            console.error('Failed to fetch list of all teachers for fallback:', e)
            return null
        }

        const target = username.toLowerCase().trim()

        const found = teachers.find((t: any) => {
            const uName = (t.username || t.userName || '').toLowerCase().trim()
            const tId = String(t.id).trim()
            const tEmail = (t.email || '').toLowerCase().trim()

            // Match against: 
            // 1. Lowercase username (handles case mismatches)
            // 2. ID as string (handles links using ID instead of username)
            // 3. Email (an extra identifier fallback)
            return uName === target || tId === target || tEmail === target
        })

        return found ? normalizeTeacher(found) : null
    } catch (fallbackError) {
        console.error('Fallback logic failed with unexpected error:', fallbackError)
        return null // Final safety
    }
}

export async function updateTeacher(username: string, data: Partial<Teacher> & { password?: string }): Promise<void> {
    const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
    }
    if (token) {
        headers['Authorization'] = `Bearer ${token}`
    }

    // Following pattern in profile.ts: POST to /api/auth/teacher/update
    await request<void>(`/api/auth/teacher/update`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ ...data, username }),
    })
}
