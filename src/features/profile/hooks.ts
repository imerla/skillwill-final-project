import { useMutation } from '@tanstack/react-query'
import { updateProfile } from './api/profile'
import type { UpdateProfileRequest } from './types'

export function useUpdateProfile() {
  return useMutation({
    mutationFn: (data: UpdateProfileRequest) => updateProfile(data),
  })
}

