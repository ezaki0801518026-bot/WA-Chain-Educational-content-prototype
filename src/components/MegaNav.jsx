import { useEffect, useRef, useState } from 'react'
import lessons from '../../data/lessons.json'
import heroImages from '../../data/heroImages.json'
import { useLanguage } from '../i18n/LanguageContext.jsx'
import styles from './MegaNav.module.css'
import { asset } from '../utils/asset.js'

const TRACKS = [
  { id: 'foundations', labelKey: 'megaMenuFoundations', descKey: 'megaMenuFoundationsDesc' },
  { id: 'diagnostics', labelKey: 'megaMenuDiagnostics', descKey: 'megaMenuDiagnosticsDesc' },
  { id: 'practice', labelKey: 'megaMenuPractice', descKey: 'megaMenuPracticeDesc' },
]

// The image side of each category panel: the door image of that track's
// first active section if one has been assigned, falling back to the
// course-wide hero so no panel is ever left with a blank swatch.
function trackImage(track) {
  const withDoor = lessons.sections.find(
    (section) => section.track === track && section.active && heroImages.sections[section.id]
  )
  return withDoor ? heroImages.sections[withDoor.id] : heroImages.course
}

// Home page only — a lightweight category bar under the main site header.
// Hovering (or focusing) a category expands an Aesop-style panel: the
// track's sections listed on the left, a representative photo on the
// right. Not shown on lesson/quiz pages, which keep only a plain back
// link per the "one screen, one concept" rule.
//
// Open/close is tracked at the <nav> level, not per trigger, so sweeping
// the cursor sideways across the bar switches panels seamlessly — the
// menu only closes when the pointer leaves the whole nav (bar + panel),
// never in the small gaps between category labels.
function MegaNav({ navigate }) {
  const { t } = useLanguage()
  const [openTrack, setOpenTrack] = useState(null)
  const navRef = useRef(null)

  const close = () => setOpenTrack(null)

  // Only close on blur if focus has actually left the nav entirely (e.g.
  // tabbing past it), not when moving between elements inside it.
  const handleNavBlur = (event) => {
    if (navRef.current && !navRef.current.contains(event.relatedTarget)) close()
  }

  const handleKeyDown = (event) => {
    if (event.key === 'Escape') close()
  }

  // Hover-open is for mice only: on touch, a tap also fires a synthetic
  // pointerenter, which — combined with the click toggle below — would open
  // then immediately close the panel. Gating on pointerType keeps hover for
  // mice while letting touch rely purely on tap-to-toggle.
  const handlePointerEnter = (id) => (event) => {
    if (event.pointerType === 'mouse') setOpenTrack(id)
  }

  // Tap/click toggles a category (open it, or close it if already open) —
  // the primary interaction on touch devices, and harmless on desktop.
  const toggleTrack = (id) => setOpenTrack((prev) => (prev === id ? null : id))

  // On touch there is no mouseleave; close when a tap lands outside the nav.
  useEffect(() => {
    if (!openTrack) return
    const handlePointerDown = (event) => {
      if (navRef.current && !navRef.current.contains(event.target)) close()
    }
    document.addEventListener('pointerdown', handlePointerDown)
    return () => document.removeEventListener('pointerdown', handlePointerDown)
  }, [openTrack])

  return (
    <nav
      className={styles.megaNav}
      aria-label="Course categories"
      ref={navRef}
      onMouseLeave={close}
      onBlur={handleNavBlur}
      onKeyDown={handleKeyDown}
    >
      <ul className={styles.trackList}>
        {TRACKS.map(({ id, labelKey, descKey }) => {
          const trackSections = lessons.sections.filter((section) => section.track === id)
          const image = trackImage(id)
          const isOpen = openTrack === id

          return (
            <li
              key={id}
              className={`${styles.trackItem} ${styles[`track_${id}`]}`}
              onPointerEnter={handlePointerEnter(id)}
            >
              <button
                type="button"
                className={styles.trackTrigger}
                aria-expanded={isOpen}
                aria-haspopup="true"
                onFocus={() => setOpenTrack(id)}
                onClick={() => toggleTrack(id)}
              >
                {t(labelKey)}
              </button>

              {isOpen && (
                <div className={styles.panel}>
                  <div className={styles.panelBody}>
                    <div className={styles.panelList}>
                      <p className={styles.panelDesc}>{t(descKey)}</p>
                      <ul className={styles.sectionList}>
                        {trackSections.map((section) => (
                          <li key={section.id}>
                            {section.active ? (
                              <button
                                type="button"
                                className={styles.sectionLink}
                                onClick={() => {
                                  close()
                                  navigate(section.video ? `/video/${section.id}` : `/lesson/${section.id}`)
                                }}
                              >
                                {section.title}
                              </button>
                            ) : (
                              <span className={styles.sectionInactive}>
                                {section.title}
                                <span className={styles.comingSoonTag}>{t('comingSoon')}</span>
                              </span>
                            )}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className={styles.panelImage}>
                      <img className={styles.panelImageEl} src={asset(image.src)} alt={image.alt} />
                    </div>
                  </div>
                </div>
              )}
            </li>
          )
        })}
      </ul>
    </nav>
  )
}

export default MegaNav
