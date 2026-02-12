const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080'

export async function request<T>(path: string, init: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(init.headers ?? {}),
    },
    ...init,
  })

  if (!response.ok) {
    let message = `Request failed with status ${response.status}`
    try {
      const data = await response.json()
      if (typeof data === 'string') {
        message = data
      } else if (data?.message) {
        message = data.message
      }
    } catch {
      // ignore JSON parse errors, fall back to default message
    }
    throw new Error(message)
  }

  try {
    return (await response.json()) as T
  } catch {
    // no JSON body
    return undefined as unknown as T
  }
}

