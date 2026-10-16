import { useSession } from '../../shared/auth'
import { Button } from '../../shared/ui/Button'
import { useLanguage } from '../../shared/i18n/LanguageContext'

export function Dashboard() {
  const { user, logout } = useSession()
  const { t } = useLanguage()

  const handleLogout = () => {
    logout()
    window.location.href = '/login'
  }

  return (
    <div style={{ padding: '2rem' }}>
      <h1>{t.dashboard.welcome(user?.name || t.nav.profile)}</h1>
      <p>{t.dashboard.email}: {user?.email}</p>
      <Button onClick={handleLogout}>{t.dashboard.signOut}</Button>
    </div>
  )
}

