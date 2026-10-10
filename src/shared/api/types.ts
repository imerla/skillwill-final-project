export interface ApiError {
  message: string
  code: string
}

export interface ValidationError extends ApiError {
  errors: Record<string, string | string[]>
}

export interface ApiErrorResponse {
  message: string
  code: string
  errors?: Record<string, string | string[]>
}

export class ApiErrorClass extends Error {
  code: string
  errors?: Record<string, string | string[]>
  status?: number
  readonly body?: Record<string, unknown>

  constructor(message: string, code: string, status?: number, errors?: Record<string, string | string[]>, body?: Record<string, unknown>) {
    super(message)
    this.name = 'ApiError'
    this.code = code
    this.status = status
    this.errors = errors
    this.body = body
  }
}

