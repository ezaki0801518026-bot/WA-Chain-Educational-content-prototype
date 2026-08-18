import lessons from '../../data/lessons.json'
import ProgressIndicator from '../components/ProgressIndicator.jsx'
import { useLanguage } from '../i18n/LanguageContext.jsx'
import { useArrowKeyNav } from '../hooks/useArrowKeyNav.js'
import styles from './VideoPage.module.css'
import { asset } from '../utils/asset.js'

// Optional section intro video, shown before the lesson when the section
// data defines one (data/lessons.json section.video). Video → Lecture →
// Quiz. Sections without a video field are never routed here.
function VideoPage({ sectionId, onContinue }) {
  const { t } = useLanguage()
  const section = lessons.sections.find((s) => s.id === sectionId)
  const hasVideo = Boolean(section?.video)

  // Hooks must run unconditionally on every render, so this sits above the
  // early return below.
  useArrowKeyNav({
    onNext: hasVideo ? () => onContinue(sectionId) : undefined,
  })

  if (!hasVideo) {
    return <p className={styles.notFound}>{t('sectionNotFound')}</p>
  }

  return (
    <div className={styles.pageGrid}>
      <div className={styles.spacer} />
      <div className={styles.video}>
        <ProgressIndicator text={t('videoIntro')} />
        <p className={styles.sectionTitle}>{section.title}</p>
        <div className={styles.playerWrapper}>
          <video
            className={styles.player}
            controls
            preload="metadata"
            src={asset(section.video.src)}
            aria-label={section.video.label}
          />
        </div>
        <nav className={styles.nav}>
          <button type="button" className={styles.navButton} onClick={() => onContinue(sectionId)}>
            {t('continueToLecture')}
          </button>
        </nav>
      </div>
    </div>
  )
}

export default VideoPage
