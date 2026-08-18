import { useEffect, useState } from 'react'
import { useLanguage } from '../i18n/LanguageContext.jsx'
import styles from './BackToTop.module.css'

// Floating "back to top" button, shown site-wide once the page has been
// scrolled well past the first viewport. Bottom-left, so it never collides
// with the survey popup pinned to the bottom-right on the home page.
function BackToTop() {
  const { t } = useLanguage()
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 600)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  if (!visible) return null

  return (
    <button
      type="button"
      className={styles.button}
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      aria-label={t('backToTop')}
    >
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M8 13V3" />
        <path d="M3.5 7.5 8 3l4.5 4.5" />
      </svg>
    </button>
  )
}

export default BackToTop
