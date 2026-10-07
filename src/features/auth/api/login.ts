import { api } from '../../../shared/api'

export interface LoginRequest {
  email: string
  password: string
}

export interface LoginResponse {
  accessToken: string
  user: {
    id: string
    email: string
    name: string
  }
}

export async function login(data: LoginRequest): Promise<LoginResponse> {
  return api.post<LoginResponse>('/auth/login', data)
}
