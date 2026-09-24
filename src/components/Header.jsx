import { useEffect, useState } from 'react'
import { useLanguage } from '../i18n/LanguageContext.jsx'
import { useTheme } from '../context/ThemeContext.jsx'
import FeaturesMenu from './FeaturesMenu.jsx'
import SearchModal from './SearchModal.jsx'
import styles from './Header.module.css'
import { picture } from '../utils/asset.js'

// Persistent header on every page: the four destinations as plain links on
// the left, the brand in the middle, search / language / theme / menu on
// the right. Nothing in the bar is a filled button — the page below owns
// its one primary action. On narrow screens the links move into the menu.
const NAV = [
  { page: 'course', key: 'navCourse', route: '/course' },
  { page: 'washi-map', key: 'navWashiMap', route: '/washi-map' },
  { page: 'tour', key: 'navTour', route: '/tour' },
  { page: 'pricing', key: 'navPricing', route: '/pricing' },
]

function Header({ navigate, currentPage }) {
  const { lang, setLang, t } = useLanguage()
  const { theme, toggleTheme } = useTheme()
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header className={`${styles.header} ${scrolled ? styles.headerScrolled : ''}`}>
      <nav className={styles.nav} aria-label="Main">
        {NAV.map((item) => (
          <button
            key={item.page}
            type="button"
            className={`${styles.navLink} ${currentPage === item.page ? styles.navLinkActive : ''}`}
            aria-current={currentPage === item.page ? 'page' : undefined}
            onClick={() => navigate(item.route)}
          >
            {t(item.key)}
          </button>
        ))}
      </nav>

      <button type="button" className={styles.brand} onClick={() => navigate('/')} aria-label={t('appTitle')}>
        <img className={styles.brandMark} {...picture('/images/hero/wa-chain-logo-mark.png', '1.75rem')} alt="" />
        <span className={styles.brandName} aria-hidden="true">
          {t('appTitle')}
        </span>
      </button>

      <div className={styles.controls}>
        <SearchModal navigate={navigate} />
        <span className={styles.langToggle} role="group" aria-label="Language">
          <button
            type="button"
            className={styles.langButton}
            aria-pressed={lang === 'en'}
            lang="en"
            onClick={() => setLang('en')}
          >
            EN
          </button>
          <button
            type="button"
            className={styles.langButton}
            aria-pressed={lang === 'ja'}
            lang="ja"
            onClick={() => setLang('ja')}
          >
            日本語
          </button>
        </span>
        <button
          type="button"
          className={`btn btn-quiet btn-icon btn-sm ${styles.iconButton}`}
          onClick={toggleTheme}
          aria-label={theme === 'dark' ? t('themeToggleToLight') : t('themeToggleToDark')}
        >
          {theme === 'dark' ? (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="12" cy="12" r="4" />
              <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
            </svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M20.5 14.5A8.5 8.5 0 0 1 9.5 3.5a8.5 8.5 0 1 0 11 11Z" />
            </svg>
          )}
        </button>
        <FeaturesMenu navigate={navigate} />
      </div>
    </header>
  )
}

export default Header
