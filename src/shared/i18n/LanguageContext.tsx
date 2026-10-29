/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react'
import type { ReactNode } from 'react'
import { ka } from './ka'
import { setApiLanguage } from '../api/client'

export type Language = 'ka' | 'en'

export type Translations = typeof ka

interface LanguageContextType {
  language: Language
  setLanguage: (lang: Language) => void
  t: Translations
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

async function loadTranslations(lang: Language): Promise<Translations> {
  if (lang === 'ka') {
    const { ka } = await import('./ka')
    return ka
  } else {
    const { en } = await import('./en')
    return en as unknown as Translations
  }
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider')
  }
  return context
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('language') as Language | null
    if (saved && (saved === 'ka' || saved === 'en')) {
      return saved
    }
    return 'ka'
  })
  const [translations, setTranslations] = useState<Translations>(ka)

  useEffect(() => {
    if (language !== 'ka') {
      loadTranslations(language).then(setTranslations)
    }
  }, [language])

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang)
    localStorage.setItem('language', lang)
    setApiLanguage(lang)
  }, [])

  useEffect(() => {
    document.documentElement.lang = language
    setApiLanguage(language)
  }, [language])

  const value: LanguageContextType = useMemo(() => ({
    language,
    setLanguage,
    t: translations,
  }), [language, setLanguage, translations])

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
}
