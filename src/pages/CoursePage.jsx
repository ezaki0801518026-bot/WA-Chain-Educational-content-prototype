import { useMemo, useState } from 'react'
import lessons from '../../data/lessons.json'
import heroImages from '../../data/heroImages.json'
import coursesData from '../../data/courses.json'
import upcoming from '../../data/upcoming.json'
import { getProgress, resetProgress } from '../utils/progress.js'
import SectionCard from '../components/SectionCard.jsx'
import SurveyPopup from '../components/SurveyPopup.jsx'
import HeroBanner from '../components/HeroBanner.jsx'
import { getSectionIcon } from '../icons/index.js'
import { useLanguage } from '../i18n/LanguageContext.jsx'
import styles from './CoursePage.module.css'
import PrototypeNotice from '../components/PrototypeNotice.jsx'
import HelpTip from '../components/HelpTip.jsx'
import { asset, picture } from '../utils/asset.js'

// The video plan (data/upcoming.json): every video sits in one quadrant,
// level x kind, and carries how far along it is.
const LEVEL_KEY = { basic: 'upcomingLevelBasic', applied: 'upcomingLevelApplied' }
const KIND_KEY = { systematic: 'upcomingKindSystematic', practical: 'upcomingKindPractical' }
const STATE_KEY = { draft: 'upcomingStateDraft', planned: 'upcomingStatePlanned' }

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

function PlayGlyph() {
  return (
    <svg className={styles.playGlyph} width="52" height="52" viewBox="0 0 44 44" aria-hidden="true">
      <circle cx="22" cy="22" r="21" fill="rgb(13 17 18 / 0.55)" />
      <path d="M17.5 14.5v15l12-7.5z" fill="#fff" />
    </svg>
  )
}

// The course page: the video lectures (finished, fact-checked) first, then
// the resume prompt if there is one, the draft text lessons that are open,
// and a collapsible list of the planned videos.
function CoursePage({ navigate }) {
  const { t, lang } = useLanguage()
  const pickLang = (field) => (field && (field[lang] ?? field.en)) || ''
  const [progress, setProgress] = useState(getProgress)
  const [confirmingReset, setConfirmingReset] = useState(false)
  const [justReset, setJustReset] = useState(false)
  const [showComingSoon, setShowComingSoon] = useState(true)

  const hasProgress = Object.keys(progress).length > 0

  const activeSections = lessons.sections.filter((s) => s.active)
  const comingCount = upcoming.videos.length

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
      <HeroBanner image={heroImages.course} title={t('navCourse')} subtitle={t('appSubtitle')} size="large" />
      <div className={`container ${styles.page}`}>
        <PrototypeNotice messageKey="prototypeNoticeGeneral" />
        <p className={`prose ${styles.description}`}>{t('appDescription')}</p>

        {/* Video lectures come first: they are the part of the course that is
            actually finished, and the thing a visitor came here to watch. */}
        <section className={styles.block}>
          <h2 id="track-videos" className={styles.heading}>{t('courseVideoHeading')}</h2>
          <p className={styles.lede}>{t('courseVideoLede')}</p>
          <div className={styles.videoGrid}>
            {coursesData.courses.map((course) => (
              <button
                key={course.id}
                type="button"
                className={`card-link ${styles.videoCard}`}
                onClick={() => navigate(`/watch/${course.id}`)}
              >
                <span className={styles.videoThumb}>
                  <img {...picture(course.poster, '(min-width: 64em) 18rem, 100vw')} alt="" aria-hidden="true" loading="lazy" decoding="async" />
                  <PlayGlyph />
                  <span className={`tnum ${styles.videoDuration}`}>{course.durationLabel}</span>
                </span>
                <span className={styles.videoBody}>
                  <span className={styles.videoNumber}>{t('courseLabel', { n: course.number })}</span>
                  <span className={styles.videoTitle}>{pickLang(course.title)}</span>
                  <span className={styles.videoSubtitle}>{pickLang(course.subtitle)}</span>
                </span>
              </button>
            ))}
          </div>
        </section>

        {resume && (
          <button
            type="button"
            className={styles.resumeCard}
            onClick={() =>
              navigate(resume.section.video ? `/video/${resume.section.id}` : `/lesson/${resume.section.id}`)
            }
          >
            <span className={styles.resumeText}>
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
            </span>
            <span className={styles.resumeCta}>{t('resumeCta')}</span>
          </button>
        )}

        <section className={styles.block}>
          <h2 id="track-foundations" className={styles.heading}>
            {t('homeAvailableNow')}
          </h2>
          <p className={`notice ${styles.draftNote}`} role="note">
            <span className="notice-tag">{t('prototypeTag')}</span>
            <span>{t('courseLessonsDraftNote')}</span>
          </p>
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
        </section>

        {comingCount > 0 && (
          <section className={styles.block}>
            <div className={styles.comingHeader}>
              <h2 id="track-upcoming" className={styles.heading}>
                {t('homeComingSoonHeading')}
                <HelpTip label={t('upcomingHelpLabel')}>{t('upcomingHelp')}</HelpTip>
              </h2>
              <button
                type="button"
                className="link"
                onClick={() => setShowComingSoon((v) => !v)}
                aria-expanded={showComingSoon}
              >
                {showComingSoon ? t('homeHideComingSoon') : t('homeShowComingSoon', { n: comingCount })}
              </button>
            </div>

            {showComingSoon && (
              <ol className={styles.comingList}>
                {upcoming.videos.map((video) => (
                  <li key={video.no} className={styles.comingItem}>
                    <span className={`tnum ${styles.comingIndex}`}>{String(video.no).padStart(2, '0')}</span>
                    <span className={styles.comingTitle}>{pickLang(video.title)}</span>
                    <span className={styles.comingMeta}>
                      <span className={styles.comingQuadrant}>
                        {t(LEVEL_KEY[video.level])} × {t(KIND_KEY[video.kind])}
                      </span>
                      <span className={`${styles.comingState} ${video.state === 'draft' ? styles.comingStateDraft : ''}`}>
                        {video.stateLabel ? pickLang(video.stateLabel) : t(STATE_KEY[video.state])}
                      </span>
                    </span>
                  </li>
                ))}
              </ol>
            )}
          </section>
        )}

        {(hasProgress || justReset) && (
          <div className={styles.resetArea}>
            {hasProgress &&
              (confirmingReset ? (
                <div className={styles.resetConfirm} role="alertdialog" aria-labelledby="reset-confirm-text">
                  <p id="reset-confirm-text" className={styles.resetConfirmText}>
                    {t('resetProgressConfirm')}
                  </p>
                  <div className={styles.resetConfirmActions}>
                    <button type="button" className={`btn btn-sm ${styles.resetDanger}`} onClick={handleReset}>
                      {t('resetProgressConfirmButton')}
                    </button>
                    <button type="button" className="btn btn-secondary btn-sm" onClick={() => setConfirmingReset(false)}>
                      {t('resetProgressCancelButton')}
                    </button>
                  </div>
                </div>
              ) : (
                <button type="button" className="link" onClick={() => setConfirmingReset(true)}>
                  {t('resetProgress')}
                </button>
              ))}
            {justReset && (
              <p className={styles.resetDone} role="status">
                {t('resetProgressDone')}
              </p>
            )}
          </div>
        )}

        <SurveyPopup />
      </div>
    </>
  )
}

export default CoursePage
