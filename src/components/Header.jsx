import { useEffect, useState } from 'react'
import { useLanguage } from '../i18n/LanguageContext.jsx'
import { useTheme } from '../context/ThemeContext.jsx'
import FeaturesMenu from './FeaturesMenu.jsx'
import SearchModal from './SearchModal.jsx'
import styles from './Header.module.css'
import { asset } from '../utils/asset.js'

// Persistent header shown on every page: brand/home link, UI language
// toggle (English/Japanese chrome only — lesson content is never
// translated), and a light/dark theme toggle. `currentPage` marks the
// active nav link; a soft shadow appears once the page scrolls under it.
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

  const navLinkClass = (page) =>
    `${styles.navLink} ${currentPage === page ? styles.navLinkActive : ''}`

  return (
    <header className={`${styles.header} ${scrolled ? styles.headerScrolled : ''}`}>
      <div className={styles.leftGroup}>
        <SearchModal navigate={navigate} />
        {/* The three core destinations besides Pricing, which keeps its own
            CTA on the right. Everything else lives in the overflow menu. */}
        <button
          type="button"
          className={navLinkClass('course')}
          aria-current={currentPage === 'course' ? 'page' : undefined}
          onClick={() => navigate('/course')}
        >
          {t('navCourse')}
        </button>
        <button
          type="button"
          className={navLinkClass('washi-map')}
          aria-current={currentPage === 'washi-map' ? 'page' : undefined}
          onClick={() => navigate('/washi-map')}
        >
          {t('navWashiMap')}
        </button>
        <button
          type="button"
          className={navLinkClass('tour')}
          aria-current={currentPage === 'tour' ? 'page' : undefined}
          onClick={() => navigate('/tour')}
        >
          {t('navTour')}
        </button>
      </div>

      <button type="button" className={styles.brand} onClick={() => navigate('/')}>
        <img className={styles.brandMark} src={asset('/images/hero/wa-chain-logo-mark.png')} alt="" />
        <span className={styles.brandName}>{t('appTitle')}</span>
      </button>

      <nav className={styles.controls} aria-label="Site">
        <span className={styles.langToggle} role="group" aria-label="Language">
          <button
            type="button"
            className={styles.langButton}
            aria-pressed={lang === 'en'}
            onClick={() => setLang('en')}
          >
            EN
          </button>
          <button
            type="button"
            className={styles.langButton}
            aria-pressed={lang === 'ja'}
            onClick={() => setLang('ja')}
          >
            日本語
          </button>
        </span>
        <button
          type="button"
          className={styles.themeButton}
          onClick={toggleTheme}
          aria-label={theme === 'dark' ? t('themeToggleToLight') : t('themeToggleToDark')}
        >
          {theme === 'dark' ? '☀' : '☾'}
          <span className={styles.themeLabel}>
            {theme === 'dark' ? ` ${t('themeToggleToLight')}` : ` ${t('themeToggleToDark')}`}
          </span>
        </button>
        <button
          type="button"
          className={styles.pricingCta}
          aria-current={currentPage === 'pricing' ? 'page' : undefined}
          onClick={() => navigate('/pricing')}
        >
          {t('navPricing')}
        </button>
        <FeaturesMenu navigate={navigate} />
      </nav>
    </header>
  )
}

export default Header
