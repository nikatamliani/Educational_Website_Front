const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? ''

export async function request<T>(path: string, init: RequestInit): Promise<T> {
  const { headers: initHeaders, ...restInit } = init
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((initHeaders as Record<string, string>) ?? {}),
  }

  if (restInit.body instanceof FormData) {
    delete headers['Content-Type']
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...restInit,
    headers,
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

