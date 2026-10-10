import { api } from '../../../shared/api'
import type { UpdateProfileRequest, UpdateProfileResponse } from '../types'

export async function updateProfile(data: UpdateProfileRequest, signal?: AbortSignal) {
  return api.patch<UpdateProfileResponse>('/auth/me', data, { signal })
}

