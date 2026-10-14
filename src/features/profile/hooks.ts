import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { updateProfile, getAddresses, createAddress, updateAddress, deleteAddress, setDefaultAddress } from './api/profile'

export interface UpdateProfileRequest {
  name?: string
  email?: string
  newPassword?: string
  currentPassword?: string
}

export interface UpdateProfileResponse {
  user: {
    id: string
    name: string
    email: string
  }
}

export interface Address {
  id: string
  label: string
  fullName: string
  phone: string
  city: string
  address: string
  isDefault: boolean
  createdAt: string
  updatedAt: string
}

export interface CreateAddressRequest {
  label: string
  fullName: string
  phone: string
  city: string
  address: string
  isDefault?: boolean
}

export interface UpdateAddressRequest {
  label?: string
  fullName?: string
  phone?: string
  city?: string
  address?: string
  isDefault?: boolean
}

const ADDRESSES_QUERY_KEY = ['addresses']

export function useUpdateProfile() {
  return useMutation({
    mutationFn: (data: UpdateProfileRequest) => updateProfile(data),
  })
}

export function useAddresses() {
  return useQuery({
    queryKey: ADDRESSES_QUERY_KEY,
    queryFn: ({ signal }) => getAddresses(signal),
    staleTime: 0,
  })
}

export function useCreateAddress() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateAddressRequest) => createAddress(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADDRESSES_QUERY_KEY })
    },
  })
}

export function useUpdateAddress() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateAddressRequest }) =>
      updateAddress(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADDRESSES_QUERY_KEY })
    },
  })
}

export function useDeleteAddress() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteAddress(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADDRESSES_QUERY_KEY })
    },
  })
}

export function useSetDefaultAddress() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => setDefaultAddress(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADDRESSES_QUERY_KEY })
    },
  })
}

