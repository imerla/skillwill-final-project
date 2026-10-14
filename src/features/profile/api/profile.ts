import { api } from '../../../shared/api'
import type { UpdateProfileRequest, UpdateProfileResponse, Address, CreateAddressRequest, UpdateAddressRequest } from '../hooks'

export async function updateProfile(data: UpdateProfileRequest, signal?: AbortSignal) {
  return api.patch<UpdateProfileResponse>('/auth/me', data, { signal })
}

export async function getAddresses(signal?: AbortSignal) {
  return api.get<{ items: Address[] }>('/addresses', { signal })
}

export async function createAddress(data: CreateAddressRequest, signal?: AbortSignal) {
  return api.post<Address>('/addresses', data, { signal })
}

export async function updateAddress(id: string, data: UpdateAddressRequest, signal?: AbortSignal) {
  return api.patch<Address>(`/addresses/${id}`, data, { signal })
}

export async function deleteAddress(id: string, signal?: AbortSignal) {
  return api.delete<{ success: boolean }>(`/addresses/${id}`, { signal })
}

export async function setDefaultAddress(id: string, signal?: AbortSignal) {
  return api.patch<Address>(`/addresses/${id}/default`, {}, { signal })
}

