export interface ApiError {
  message: string
  code: string
}

export interface ValidationError extends ApiError {
  errors: Record<string, string[]>
}

export interface ApiErrorResponse {
  message: string
  code: string
  errors?: Record<string, string[]>
}

export class ApiErrorClass extends Error {
  code: string
  errors?: Record<string, string[]>
  status?: number

  constructor(message: string, code: string, status?: number, errors?: Record<string, string[]>) {
    super(message)
    this.name = 'ApiError'
    this.code = code
    this.status = status
    this.errors = errors
  }
}
