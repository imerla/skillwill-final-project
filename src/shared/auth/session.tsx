import { useCallback, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { api, setUnauthorizedHandler } from '../api'
import { ApiErrorClass } from '../api'
import { getAccessToken, removeAccessToken } from './tokenStorage'
import type { User } from './types'
import { SessionContext, type SessionContextValue } from './sessionContext'

interface SessionProviderProps {
  children: ReactNode
}

export function SessionProvider({ children }: SessionProviderProps) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const logout = useCallback(() => {
    removeAccessToken()
    setUser(null)
  }, [])

  useEffect(() => {
    setUnauthorizedHandler(logout)

    async function loadSession() {
      const token = getAccessToken()
      
      if (!token) {
        setIsLoading(false)
        return
      }

      try {
        const response = await api.get<User>('/auth/me')
        setUser(response)
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
