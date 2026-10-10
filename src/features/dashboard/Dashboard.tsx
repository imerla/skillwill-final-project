import { useSession } from '../../shared/auth'
import { Button } from '../../shared/ui/Button'
import { ka } from '../../shared/i18n/ka'

export function Dashboard() {
  const { user, logout } = useSession()

  const handleLogout = () => {
    logout()
    window.location.href = '/login'
  }

  return (
    <div style={{ padding: '2rem' }}>
      <h1>{ka.dashboard.welcome(user?.name || ka.nav.profile)}</h1>
      <p>{ka.dashboard.email}: {user?.email}</p>
      <Button onClick={handleLogout}>{ka.dashboard.signOut}</Button>
    </div>
  )
}

