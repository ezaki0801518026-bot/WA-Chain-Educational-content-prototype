import { useMemo, useState } from 'react'
import lessons from '../../data/lessons.json'
import heroImages from '../../data/heroImages.json'
import coursesData from '../../data/courses.json'
import { getProgress, resetProgress } from '../utils/progress.js'
import SectionCard from '../components/SectionCard.jsx'
import SurveyPopup from '../components/SurveyPopup.jsx'
import MegaNav from '../components/MegaNav.jsx'
import HeroBanner from '../components/HeroBanner.jsx'
import SectionDivider from '../components/SectionDivider.jsx'
import { getSectionIcon } from '../icons/index.js'
import { useLanguage } from '../i18n/LanguageContext.jsx'
// The curriculum moved here from the home page wholesale; it shares the
// same stylesheet rather than duplicating ~200 lines of card styles.
import styles from './HomePage.module.css'
import { asset } from '../utils/asset.js'

const TRACK_ORDER = ['foundations', 'diagnostics', 'practice']
const TRACK_LABEL_KEY = {
  foundations: 'trackFoundations',
  diagnostics: 'trackDiagnostics',
  practice: 'trackPractice',
}

// Rough reading time: ~1.5 min per lesson step, floored so nothing reads as
// trivially short. Used for the card meta line and the resume estimate.
const estMinutes = (steps) => Math.max(3, Math.round((steps || 0) * 1.5))

// The most recently touched section that is active and not yet complete —
// the one worth offering to resume.
export function findResume(sections, progress) {
  let best = null
  for (const section of sections) {
    if (!section.active) continue
    const rec = progress[section.id]
    if (!rec || rec.completed || typeof rec.step !== 'number' || rec.step <= 0) continue
    if (!best || (rec.updatedAt || 0) > (best.updatedAt || 0)) {
      best = { section, step: rec.step }
    }
  }
  return best
}

// The course page: resume prompt (if any), the sections that are actually
// available, then a compact, collapsible list of the planned ("Coming
// soon") sections grouped by track.
function CoursePage({ navigate }) {
  const { t, lang } = useLanguage()
  const pickLang = (field) => (field && (field[lang] ?? field.en)) || ''
  const [progress, setProgress] = useState(getProgress)
  const [confirmingReset, setConfirmingReset] = useState(false)
  const [justReset, setJustReset] = useState(false)
  const [showComingSoon, setShowComingSoon] = useState(true)

  const hasProgress = Object.keys(progress).length > 0

  const activeSections = lessons.sections.filter((s) => s.active)
  const comingByTrack = useMemo(() => {
    const groups = {}
    lessons.sections.forEach((section, index) => {
      if (section.active) return
      const track = section.track || 'foundations'
      if (!groups[track]) groups[track] = []
      groups[track].push({ section, index })
    })
    return groups
  }, [])
  const comingCount = lessons.sections.length - activeSections.length

  const resume = useMemo(() => findResume(lessons.sections, progress), [progress])
  const resumeIndex = resume ? lessons.sections.findIndex((s) => s.id === resume.section.id) : -1

  const handleReset = () => {
    resetProgress()
    setProgress({})
    setConfirmingReset(false)
    setJustReset(true)
  }

  return (
    <>
      <MegaNav navigate={navigate} />
      <HeroBanner image={heroImages.course} eyebrow={t('appSubtitle')} title={t('navCourse')} size="small" />
      <div className={styles.home}>
        <div className={styles.intro}>
          <p className={styles.description}>{t('appDescription')}</p>
        </div>

        <SectionDivider />

        {/* Video lectures come first: they are the part of the course that is
            actually finished, and the thing a visitor came here to watch. */}
        <h2 className={styles.groupHeading}>{t('courseVideoHeading')}</h2>
        <p className={styles.videoLede}>{t('courseVideoLede')}</p>
        <div className={styles.videoGrid}>
          {coursesData.courses.map((course) => (
            <button
              key={course.id}
              type="button"
              className={styles.videoCard}
              onClick={() => navigate(`/watch/${course.id}`)}
            >
              <span className={styles.videoThumb}>
                <img src={asset(course.poster)} alt="" aria-hidden="true" loading="lazy" />
                <span className={styles.videoPlay} aria-hidden="true">▶</span>
                <span className={styles.videoDuration}>{course.durationLabel}</span>
              </span>
              <span className={styles.videoBody}>
                <span className={styles.videoNumber}>{t('courseLabel', { n: course.number })}</span>
                <span className={styles.videoTitle}>{pickLang(course.title)}</span>
                <span className={styles.videoSubtitle}>{pickLang(course.subtitle)}</span>
                <span className={styles.videoCta}>{t('courseWatchCta')} →</span>
              </span>
            </button>
          ))}
        </div>

        <SectionDivider />

        {resume && (
          <button
            type="button"
            className={styles.resumeCard}
            onClick={() =>
              navigate(resume.section.video ? `/video/${resume.section.id}` : `/lesson/${resume.section.id}`)
            }
          >
            <div className={styles.resumeText}>
              <span className={styles.resumeLabel}>{t('resumeLabel')}</span>
              <span className={styles.resumeSection}>
                {t('sectionLabel', { n: resumeIndex + 1 })} — {resume.section.title}
              </span>
              <span className={styles.resumeMeta}>
                {t('resumeMeta', {
                  step: resume.step + 1,
                  total: resume.section.steps.length,
                  min: Math.max(1, Math.round((resume.section.steps.length - resume.step) * 1.5)),
                })}
              </span>
            </div>
            <span className={styles.resumeCta}>{t('resumeCta')} →</span>
          </button>
        )}

        <h2 id="track-foundations" className={styles.groupHeading}>
          {t('homeAvailableNow')}
        </h2>
        <div className={styles.cardList}>
          {activeSections.map((section) => {
            const index = lessons.sections.findIndex((s) => s.id === section.id)
            return (
              <SectionCard
                key={section.id}
                index={index + 1}
                title={section.title}
                description={section.description}
                active
                completed={Boolean(progress[section.id]?.completed)}
                quizResult={progress[section.id]?.quiz}
                onSelect={() => navigate(section.video ? `/video/${section.id}` : `/lesson/${section.id}`)}
                Icon={getSectionIcon(section)}
                track={section.track}
                topics={section.topics}
                stepCount={section.steps?.length}
                quizCount={section.quiz?.length}
                hasVideo={Boolean(section.video)}
                estMin={estMinutes(section.steps?.length)}
              />
            )
          })}
        </div>

        {comingCount > 0 && (
          <div className={styles.comingSection}>
            <div className={styles.comingHeader}>
              <h2 className={styles.groupHeading}>{t('homeComingSoonHeading')}</h2>
              <button
                type="button"
                className={styles.comingToggle}
                onClick={() => setShowComingSoon((v) => !v)}
                aria-expanded={showComingSoon}
              >
                {showComingSoon ? t('homeHideComingSoon') : t('homeShowComingSoon', { n: comingCount })}
              </button>
            </div>

            {showComingSoon &&
              TRACK_ORDER.map((track) => {
                const items = comingByTrack[track]
                if (!items || items.length === 0) return null
                return (
                  <div key={track} className={styles.comingGroup}>
                    <h3 id={`track-${track}`} className={`${styles.trackHeading} ${styles[`track_${track}`]}`}>
                      {t(TRACK_LABEL_KEY[track])}
                    </h3>
                    <ul className={styles.comingList}>
                      {items.map(({ section, index }) => (
                        <li key={section.id} className={styles.comingItem}>
                          <span className={styles.comingIndex}>{t('sectionLabel', { n: index + 1 })}</span>
                          <span className={styles.comingTitle}>{section.title}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )
              })}
          </div>
        )}

        {(hasProgress || justReset) && (
          <div className={styles.resetArea}>
            {hasProgress &&
              (confirmingReset ? (
                <div className={styles.resetConfirm}>
                  <p className={styles.resetConfirmText}>{t('resetProgressConfirm')}</p>
                  <div className={styles.resetConfirmActions}>
                    <button type="button" className={styles.resetConfirmButton} onClick={handleReset}>
                      {t('resetProgressConfirmButton')}
                    </button>
                    <button
                      type="button"
                      className={styles.resetCancelButton}
                      onClick={() => setConfirmingReset(false)}
                    >
                      {t('resetProgressCancelButton')}
                    </button>
                  </div>
                </div>
              ) : (
                <button type="button" className={styles.resetLink} onClick={() => setConfirmingReset(true)}>
                  {t('resetProgress')}
                </button>
              ))}
            {justReset && <p className={styles.resetDone}>{t('resetProgressDone')}</p>}
          </div>
        )}

        <SurveyPopup />
      </div>
    </>
  )
}

export default CoursePage
