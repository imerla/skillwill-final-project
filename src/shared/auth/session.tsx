import { useCallback, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { api, setUnauthorizedHandler } from '../api'
import { ApiErrorClass } from '../api'
import { getAccessToken, removeAccessToken } from './tokenStorage'
import { setSessionExpiredNotice } from './sessionNotice'
import type { User } from './types'
import { SessionContext, type SessionContextValue } from './sessionContext'

interface SessionProviderProps {
  children: ReactNode
}

export function SessionProvider({ children }: SessionProviderProps) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const queryClient = useQueryClient()

  const logout = useCallback(() => {
    removeAccessToken()
    setUser(null)
    queryClient.removeQueries({ queryKey: ['cart'] })
    queryClient.removeQueries({ queryKey: ['checkout'] })
    queryClient.removeQueries({ queryKey: ['orders'] })
    queryClient.removeQueries({ queryKey: ['user'] })
  }, [queryClient])

  useEffect(() => {
    setUnauthorizedHandler((code) => {
      if (code === 'TOKEN_EXPIRED') {
        setSessionExpiredNotice()
      }
      logout()
    })

    async function loadSession() {
      const token = getAccessToken()
      
      if (!token) {
        setIsLoading(false)
        return
      }

      try {
        const response = await api.get<{ user: User }>('/auth/me')
        setUser(response.user)
      } catch (error) {
        if (error instanceof ApiErrorClass && error.status === 401) {
          logout()
        }
        // Network errors and 5xx do not clear the session
      } finally {
        setIsLoading(false)
      }
    }

    loadSession()
  }, [logout])

  const value: SessionContextValue = {
    user,
    isLoading,
    isAuthenticated: !!user,
    logout,
    setUser,
  }

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
}

