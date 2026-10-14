import { ApiErrorClass } from './types'
import type { ApiErrorResponse } from './types'
import { getAccessToken } from '../auth/tokenStorage'

const API_URL = import.meta.env.VITE_API_URL

let onUnauthorized: ((code?: string) => void) | null = null

export function setUnauthorizedHandler(handler: (code?: string) => void): void {
  onUnauthorized = handler
}

async function request<T>(
  endpoint: string,
  options: RequestInit & { params?: Record<string, string | string[]> } = {}
): Promise<T> {
  const url = new URL(`${API_URL}${endpoint}`)

  // Add query params
  if (options.params) {
    Object.entries(options.params).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        value.forEach(v => url.searchParams.append(key, v))
      } else if (value !== undefined && value !== null) {
        url.searchParams.append(key, value)
      }
    })
  }

  const token = getAccessToken()
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const response = await fetch(url.toString(), {
    ...options,
    headers,
    signal: options.signal,
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

    if (response.status === 401 && token && errorData.code !== 'INVALID_CREDENTIALS' && onUnauthorized) {
      onUnauthorized(errorData.code)
    }

    throw new ApiErrorClass(
      errorData.message,
      errorData.code,
      response.status,
      errorData.errors,
      errorData as unknown as Record<string, unknown>
    )
  }

  if (isJson && response.status !== 204) {
    return response.json()
  }

  return undefined as T
}

export const api = {
  get: <T>(endpoint: string, options?: RequestInit & { params?: Record<string, string | string[]> }) =>
    request<T>(endpoint, { method: 'GET', ...options }),
  post: <T>(endpoint: string, data?: unknown, options?: RequestInit & { params?: Record<string, string | string[]> }) =>
    request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
      ...options,
    }),
  put: <T>(endpoint: string, data?: unknown, options?: RequestInit & { params?: Record<string, string | string[]> }) =>
    request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
      ...options,
    }),
  patch: <T>(endpoint: string, data?: unknown, options?: RequestInit & { params?: Record<string, string | string[]> }) =>
    request<T>(endpoint, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
      ...options,
    }),
  delete: <T>(endpoint: string, options?: RequestInit & { params?: Record<string, string | string[]> }) =>
    request<T>(endpoint, { method: 'DELETE', ...options }),
}

