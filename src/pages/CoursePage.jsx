import { useState } from 'react'
import heroImages from '../../data/heroImages.json'
import coursesData from '../../data/courses.json'
import upcoming from '../../data/upcoming.json'
import SurveyPopup from '../components/SurveyPopup.jsx'
import HeroBanner from '../components/HeroBanner.jsx'
import { useLanguage } from '../i18n/LanguageContext.jsx'
import styles from './CoursePage.module.css'
import PrototypeNotice from '../components/PrototypeNotice.jsx'
import HelpTip from '../components/HelpTip.jsx'
import { picture } from '../utils/asset.js'

// The video plan (data/upcoming.json): every video sits in one quadrant,
// level x kind, and carries how far along it is.
const LEVEL_KEY = { basic: 'upcomingLevelBasic', applied: 'upcomingLevelApplied' }
const KIND_KEY = { systematic: 'upcomingKindSystematic', practical: 'upcomingKindPractical' }
const STATE_KEY = { draft: 'upcomingStateDraft', planned: 'upcomingStatePlanned' }

function PlayGlyph() {
  return (
    <svg className={styles.playGlyph} width="52" height="52" viewBox="0 0 44 44" aria-hidden="true">
      <circle cx="22" cy="22" r="21" fill="rgb(13 17 18 / 0.55)" />
      <path d="M17.5 14.5v15l12-7.5z" fill="#fff" />
    </svg>
  )
}

// The course page: the video lectures that are finished, then the plan of
// the videos still to come. (The draft text lessons are not offered here for
// now; their pages and data are kept for later.)
function CoursePage({ navigate }) {
  const { t, lang } = useLanguage()
  const pickLang = (field) => (field && (field[lang] ?? field.en)) || ''
  const [showComingSoon, setShowComingSoon] = useState(true)

  const comingCount = upcoming.videos.length

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

        <SurveyPopup />
      </div>
    </>
  )
}

export default CoursePage
