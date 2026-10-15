import { api } from '../../../shared/api'
import type { Favorites } from '../types'

export async function getFavorites(signal?: AbortSignal): Promise<Favorites> {
  return api.get<Favorites>('/favorites', signal ? { signal } : undefined)
}

export async function addToFavorites(productId: string): Promise<Favorites> {
  return api.post<Favorites>('/favorites', { productId })
}

export async function removeFromFavorites(productId: string): Promise<Favorites> {
  return api.delete<Favorites>(`/favorites/${productId}`)
}
