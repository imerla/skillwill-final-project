import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { api } from '../api'
import { getAccessToken, removeAccessToken } from './tokenStorage'
import type { User } from './types'
import { SessionContext, type SessionContextValue } from './sessionContext'

interface SessionProviderProps {
  children: ReactNode
}

export function SessionProvider({ children }: SessionProviderProps) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const logout = () => {
    removeAccessToken()
    setUser(null)
  }

  useEffect(() => {
    async function loadSession() {
      const token = getAccessToken()
      
      if (!token) {
        setIsLoading(false)
        return
      }

      try {
        const response = await api.get<User>('/auth/me')
        setUser(response)
      } catch {
        removeAccessToken()
        setUser(null)
      } finally {
        setIsLoading(false)
      }
    }

    loadSession()
  }, [])

  const value: SessionContextValue = {
    user,
    isLoading,
    isAuthenticated: !!user,
    logout,
  }

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
}
