import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import strings from './strings.js'

const STORAGE_KEY = 'washi-course-lang'
const LanguageContext = createContext(null)

function interpolate(template, vars) {
  if (!vars) return template
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => (key in vars ? String(vars[key]) : `{{${key}}}`))
}

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored === 'ja' || stored === 'en') return stored
      // First visit: follow the browser language, so a Japanese supporter
      // and an overseas conservator each land in their own language.
      return (navigator.language || '').toLowerCase().startsWith('ja') ? 'ja' : 'en'
    } catch {
      return 'en'
    }
  })

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, lang)
    document.documentElement.lang = lang
  }, [lang])

  const value = useMemo(
    () => ({
      lang,
      setLang,
      t: (key, vars) => interpolate(strings[lang][key] ?? strings.en[key] ?? key, vars),
    }),
    [lang]
  )

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
}

export function useLanguage() {
  const ctx = useContext(LanguageContext)
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider')
  return ctx
}
