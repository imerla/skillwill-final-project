import { useEffect } from 'react'
import { ka } from '../i18n/ka'

export function useDocumentTitle(title: string): void {
  useEffect(() => {
    const previous = document.title
    document.title = `${title} · ${ka.common.siteName}`
    return () => {
      document.title = previous
    }
  }, [title])
}

