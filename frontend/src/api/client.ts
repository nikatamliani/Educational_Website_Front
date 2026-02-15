const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? ''

export class ApiError extends Error {
  status: number
  data: any

  constructor(message: string, status: number, data?: any) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.data = data
  }
}

export async function request<T>(path: string, init: RequestInit): Promise<T> {
  const { headers: initHeaders, ...restInit } = init
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...restInit,
    headers: {
      'Content-Type': 'application/json',
      ...((initHeaders as Record<string, string>) ?? {}),
    },
  })

  if (!response.ok) {
    let message = `Request failed with status ${response.status}`
    let data: any = null
    try {
      data = await response.json()
      if (typeof data === 'string') {
        message = data
      } else if (data?.message) {
        message = data.message
      }
    } catch {
      // ignore JSON parse errors, fall back to default message
    }
    throw new ApiError(message, response.status, data)
  }

  try {
    const text = await response.text()
    return text ? (JSON.parse(text) as T) : (undefined as unknown as T)
  } catch {
    return undefined as unknown as T
  }
}

