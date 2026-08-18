import { useEffect, useRef, useState } from 'react'
import { useLanguage } from '../i18n/LanguageContext.jsx'
import styles from './FeaturesMenu.module.css'

// The prototype's whole surface, in one list: the four core features
// first, then the two supporting pages. Pages built earlier (glossary,
// chat, cohort, community, updates, feedback) still resolve by URL but are
// deliberately out of the navigation while the product is this narrow.
const EXPLORE = [
  { labelKey: 'navCourse', route: '/course' },
  { labelKey: 'navWashiMap', route: '/washi-map' },
  { labelKey: 'navTour', route: '/tour' },
  { labelKey: 'navPricing', route: '/pricing' },
  { labelKey: 'navNews', route: '/news' },
  { labelKey: 'navAbout', route: '/about' },
]

// The site's overflow menu: every destination in the prototype, opened as a
// modal dialog from the header's menu button. Shown on every page (unlike
// the course-page-only mega-nav).
function FeaturesMenu({ navigate }) {
  const { t } = useLanguage()
  const [open, setOpen] = useState(false)
  const triggerRef = useRef(null)
  const panelRef = useRef(null)

  const close = () => {
    setOpen(false)
    triggerRef.current?.focus()
  }

  useEffect(() => {
    if (!open) return
    panelRef.current?.focus()

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        close()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [open])

  return (
    <>
      <button
        type="button"
        ref={triggerRef}
        className={styles.trigger}
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={t('menuOpen')}
      >
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
          <line x1="2" y1="5" x2="16" y2="5" />
          <line x1="2" y1="9" x2="16" y2="9" />
          <line x1="2" y1="13" x2="16" y2="13" />
        </svg>
      </button>

      {open && (
        <div className={styles.backdrop} onClick={close}>
          <div
            className={styles.panel}
            role="dialog"
            aria-modal="true"
            aria-labelledby="features-menu-title"
            ref={panelRef}
            tabIndex={-1}
            onClick={(event) => event.stopPropagation()}
          >
            <div className={styles.panelHeader}>
              <h2 id="features-menu-title" className={styles.panelTitle}>
                {t('menuTitle')}
              </h2>
              <button type="button" className={styles.closeButton} onClick={close} aria-label={t('featuresMenuClose')}>
                ✕
              </button>
            </div>

            <p className={styles.sectionLabel}>{t('menuSectionExplore')}</p>
            <ul className={styles.exploreList}>
              {EXPLORE.map(({ labelKey, route }) => (
                <li key={labelKey}>
                  <button
                    type="button"
                    className={styles.exploreLink}
                    onClick={() => {
                      close()
                      navigate(route)
                    }}
                  >
                    <span>{t(labelKey)}</span>
                    <span aria-hidden="true" className={styles.exploreArrow}>
                      →
                    </span>
                  </button>
                </li>
              ))}
            </ul>

          </div>
        </div>
      )}
    </>
  )
}

export default FeaturesMenu
