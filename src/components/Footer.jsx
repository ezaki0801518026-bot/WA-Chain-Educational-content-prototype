import { useLanguage } from '../i18n/LanguageContext.jsx'
import SocialIcon, { socialLabel } from './SocialIcon.jsx'
import { TEAM_SOCIAL } from '../config/social.js'
import styles from './Footer.module.css'

const TRACKS = [
  { id: 'foundations', labelKey: 'megaMenuFoundations' },
  { id: 'diagnostics', labelKey: 'megaMenuDiagnostics' },
  { id: 'practice', labelKey: 'megaMenuPractice' },
]

// Scrolls to the first section card belonging to a track, rather than
// navigating — the hash router treats any hash change as a page route,
// so an in-page anchor here would be read as an (unknown) route. Away from
// the course page the anchor doesn't exist, so go there first, then scroll
// once the page (and its enter animation) has settled.
function scrollToTrack(track, navigate) {
  const target = document.getElementById(`track-${track}`)
  if (target) {
    target.scrollIntoView({ behavior: 'smooth', block: 'start' })
    return
  }
  navigate('/course')
  setTimeout(() => {
    document.getElementById(`track-${track}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, 450)
}

// Site-wide footer — a quiet, ink-dark close to the page, not a storefront
// footer. Curriculum links jump to the track on the home page; the About
// link opens the WA-Chain page (the team behind the course).
function Footer({ navigate }) {
  const { t } = useLanguage()
  const year = new Date().getFullYear()

  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <div className={styles.brandColumn}>
          <p className={styles.brand}>{t('appTitle')}</p>
          <p className={styles.tagline}>{t('footerTagline')}</p>
          {TEAM_SOCIAL.length > 0 && (
            <p className={styles.socialRow}>
              {TEAM_SOCIAL.map((account) => (
                <a
                  key={account.url}
                  className={styles.socialLink}
                  href={account.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`WA-Chain — ${socialLabel(account.network)}`}
                  title={socialLabel(account.network)}
                >
                  <SocialIcon network={account.network} size={18} />
                </a>
              ))}
            </p>
          )}
        </div>

        <div className={styles.linkColumn}>
          <p className={styles.columnHeading}>{t('footerCurriculum')}</p>
          <ul className={styles.linkList}>
            {TRACKS.map(({ id, labelKey }) => (
              <li key={id}>
                <button type="button" className={styles.footerLink} onClick={() => scrollToTrack(id, navigate)}>
                  {t(labelKey)}
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div className={styles.linkColumn}>
          <p className={styles.columnHeading}>{t('footerExplore')}</p>
          <ul className={styles.linkList}>
            {[
              { key: 'navCourse', route: '/course' },
              { key: 'navWashiMap', route: '/washi-map' },
              { key: 'navTour', route: '/tour' },
              { key: 'navPricing', route: '/pricing' },
            ].map(({ key, route }) => (
              <li key={key}>
                <button type="button" className={styles.footerLink} onClick={() => navigate(route)}>
                  {t(key)}
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div className={styles.linkColumn}>
          <p className={styles.columnHeading}>{t('footerAbout')}</p>
          <ul className={styles.linkList}>
            <li>
              <button type="button" className={styles.footerLink} onClick={() => navigate('/about')}>
                {t('footerWaChainTitle')}
              </button>
            </li>
            <li>
              <button type="button" className={styles.footerLink} onClick={() => navigate('/news')}>
                {t('navNews')}
              </button>
            </li>
          </ul>
        </div>
      </div>

      <p className={styles.copyright}>{t('footerCopyright', { year })}</p>
    </footer>
  )
}

export default Footer
