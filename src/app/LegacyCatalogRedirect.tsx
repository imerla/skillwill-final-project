import { Navigate, useLocation } from 'react-router-dom'

export function LegacyCatalogRedirect() {
  const location = useLocation()
  return <Navigate to={{ pathname: '/catalog', search: location.search }} replace />
}

