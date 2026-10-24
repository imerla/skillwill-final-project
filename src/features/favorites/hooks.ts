import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSession } from '../../shared/auth'
import { getFavorites, addToFavorites, removeFromFavorites } from './api/favorites'
import { useLanguage } from '../../shared/i18n/LanguageContext'

const FAVORITES_QUERY_KEY = ['favorites']
const FAVORITES_STORAGE_KEY = 'favorites_ids'

const getStoredFavorites = (): Set<string> => {
  try {
    const stored = localStorage.getItem(FAVORITES_STORAGE_KEY)
    return stored ? new Set(JSON.parse(stored)) : new Set()
  } catch {
    return new Set()
  }
}

const setStoredFavorites = (ids: Set<string>) => {
  try {
    localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(Array.from(ids)))
  } catch {
    // Ignore storage errors
  }
}

export function useFavorites() {
  const { isAuthenticated, isLoading: isSessionLoading } = useSession()
  const { t } = useLanguage()

  return useQuery({
    queryKey: FAVORITES_QUERY_KEY,
    queryFn: async ({ signal }) => {
      try {
        return await getFavorites(signal)
      } catch {
        // Fallback to localStorage if API fails
        const storedIds = getStoredFavorites()
        if (storedIds.size === 0) {
          return { items: [], total: 0 }
        }
        // Return stored IDs as minimal favorites
        return {
          items: Array.from(storedIds).map((id) => ({
            productId: id,
            product: {
              id: id,
              slug: '',
              title: t.common.product || 'Product',
              description: '',
              brand: '',
              price: 0,
              oldPrice: null,
              discountPercent: null,
              currency: 'GEL',
              rating: 0,
              reviewsCount: 0,
              stock: 0,
              inStock: false,
              warrantyMonths: 0,
              image: '',
              images: [],
              specs: {},
              category: { id: '', slug: '', name: '' },
              createdAt: '',
            },
            addedAt: new Date().toISOString(),
          })),
          total: storedIds.size,
        }
      }
    },
    enabled: isAuthenticated && !isSessionLoading,
    staleTime: 5 * 60 * 1000,
  })
}

export function useAddToFavorites() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (productId: string) => {
      try {
        return await addToFavorites(productId)
      } catch {
        // Fallback to localStorage
        const stored = getStoredFavorites()
        stored.add(productId)
        setStoredFavorites(stored)
        // Return minimal response
        return { items: [], total: stored.size }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: FAVORITES_QUERY_KEY })
    },
  })
}

export function useRemoveFromFavorites() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (productId: string) => {
      try {
        return await removeFromFavorites(productId)
      } catch {
        // Fallback to localStorage
        const stored = getStoredFavorites()
        stored.delete(productId)
        setStoredFavorites(stored)
        // Return minimal response
        return { items: [], total: stored.size }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: FAVORITES_QUERY_KEY })
    },
  })
}

export function useIsFavorite(productId: string) {
  const { data: favorites } = useFavorites()
  return favorites?.items.some((f) => f.productId === productId) ?? false
}
