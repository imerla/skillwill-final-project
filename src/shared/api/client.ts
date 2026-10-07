import { ApiErrorClass } from './types'
import type { ApiErrorResponse } from './types'
import { getAccessToken } from '../auth/tokenStorage'

const API_URL = import.meta.env.VITE_API_URL

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_URL}${endpoint}`
  
  const token = getAccessToken()
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const response = await fetch(url, {
    ...options,
    headers,
  })

  const contentType = response.headers.get('content-type')
  const isJson = contentType?.includes('application/json')

  if (!response.ok) {
    let errorData: ApiErrorResponse = {
      message: 'An error occurred',
      code: 'UNKNOWN_ERROR',
    }

    if (isJson) {
      try {
        errorData = await response.json()
      } catch {
        // Use default error data if JSON parsing fails
      }
    }

    throw new ApiErrorClass(
      errorData.message,
      errorData.code,
      response.status,
      errorData.errors
    )
  }

  if (isJson && response.status !== 204) {
    return response.json()
  }

  return undefined as T
}

export const api = {
  get: <T>(endpoint: string) => request<T>(endpoint, { method: 'GET' }),
  post: <T>(endpoint: string, data?: unknown) =>
    request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    }),
  put: <T>(endpoint: string, data?: unknown) =>
    request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    }),
  patch: <T>(endpoint: string, data?: unknown) =>
    request<T>(endpoint, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    }),
  delete: <T>(endpoint: string) => request<T>(endpoint, { method: 'DELETE' }),
}
