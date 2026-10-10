import { api } from '../../../shared/api'

export interface RegisterRequest {
  name: string
  email: string
  password: string
}

export interface RegisterResponse {
  accessToken: string
  user: {
    id: string
    email: string
    name: string
  }
}

export async function register(data: RegisterRequest): Promise<RegisterResponse> {
  return api.post<RegisterResponse>('/auth/register', data)
}

