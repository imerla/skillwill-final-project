export interface UpdateProfileRequest {
  name?: string
  email?: string
  phone?: string
  city?: string
  address?: string
  newPassword?: string
  currentPassword: string
}

export interface UpdateProfileResponse {
  user: {
    id: string
    email: string
    name: string
    phone?: string
    city?: string
    address?: string
  }
}

