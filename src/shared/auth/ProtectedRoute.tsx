import { Navigate, useLocation } from 'react-router-dom'
import { useSession } from './useSession'
import './ProtectedRoute.css'

interface ProtectedRouteProps {
  children: React.ReactNode
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading } = useSession()
  const location = useLocation()

  if (isLoading) {
    return (
      <div className="protected-route__loading" aria-live="polite" aria-busy="true">
        <span className="protected-route__spinner" aria-hidden="true" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return <>{children}</>
}

