const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'

const request = async (endpoint: string, options: RequestInit = {}) => {
  const cleanEndpoint = endpoint.replace(/^\//, '')

  const response = await fetch(`${API_URL}/api/${cleanEndpoint}`, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  })

  const data = response.status !== 204 ? await response.json(): {}

  if (!response.ok) {
    const error = new Error(data.error || 'Something went wrong') as Error & { status: number }
    error.status = response.status
    throw error
  }
  return data
}



export const authApi = {
  register: (data: { email: string; password: string; name?: string }) => 
    request('auth/register', { 
      method: 'POST',
      body: JSON.stringify(data),
    }),

    login: (data: { email: string; password: string }) => 
      request('auth/login', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

      logout: () =>
        request('auth/logout', { method: 'POST' }),


      me: () => request('auth/me'),
}




export const  reviewApi = {
  create: (data: { code: string; language: string }) => 
    request('reviews', {
      method: 'POST',
      body: JSON.stringify(data),
    }),


    getAll: () => 
      request('/reviews'),


    getById: (id: string) =>
      request(`/reviews/${id}`),
}