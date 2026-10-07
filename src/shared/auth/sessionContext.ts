import { createContext } from 'react'
import type { User } from './types'

export interface SessionContextValue {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  logout: () => void
}

export const SessionContext = createContext<SessionContextValue | undefined>(undefined)
