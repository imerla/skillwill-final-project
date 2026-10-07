import { useSession } from '../../shared/auth'
import { Button } from '../../shared/ui/Button'

export function Dashboard() {
  const { user, logout } = useSession()

  const handleLogout = () => {
    logout()
    window.location.href = '/login'
  }

  return (
    <div style={{ padding: '2rem' }}>
      <h1>Welcome, {user?.name || 'User'}!</h1>
      <p>Email: {user?.email}</p>
      <Button onClick={handleLogout}>Sign out</Button>
    </div>
  )
}
