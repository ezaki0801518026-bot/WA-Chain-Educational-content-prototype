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
  { labelKey: 'navChat', route: '/chat' },
  { labelKey: 'navNews', route: '/news' },
  { labelKey: 'navAbout', route: '/about' },
]

// The site's overflow menu: every destination in the prototype, opened as a
// modal dialog from the header's menu button. Shown on every page (unlike
// the course-page-only mega-nav). The page behind is made inert while it
// is open, so focus and the screen reader stay inside.
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
    if (!open) return undefined
    panelRef.current?.focus()
    const root = document.getElementById('root')
    root?.setAttribute('inert', '')
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        close()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      root?.removeAttribute('inert')
    }
  }, [open])

  return (
    <>
      <button
        type="button"
        ref={triggerRef}
        className={`btn btn-quiet btn-icon btn-sm ${styles.trigger}`}
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={t('menuOpen')}
      >
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" aria-hidden="true">
          <line x1="3" y1="6" x2="17" y2="6" />
          <line x1="3" y1="10" x2="17" y2="10" />
          <line x1="3" y1="14" x2="17" y2="14" />
        </svg>
      </button>

      {open && (
        <div className={`dialog-backdrop ${styles.backdrop}`} onClick={close}>
          <div
            className={`dialog-panel ${styles.panel}`}
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
              <button type="button" className="btn btn-quiet btn-icon btn-sm" onClick={close} aria-label={t('featuresMenuClose')}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                  <path d="M6 6l12 12M18 6 6 18" />
                </svg>
              </button>
            </div>

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
                    {t(labelKey)}
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
