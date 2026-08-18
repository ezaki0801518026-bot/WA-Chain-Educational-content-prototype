import { useEffect, useRef, useState } from 'react'
import coursesData from '../../data/courses.json'
import { useLanguage } from '../i18n/LanguageContext.jsx'
import { track } from '../utils/analytics.js'
import styles from './CourseVideoPage.module.css'
import { asset } from '../utils/asset.js'

const WATCH_KEY = 'wa-chain-watch'

function readWatch() {
  try {
    return JSON.parse(localStorage.getItem(WATCH_KEY) || '{}')
  } catch {
    return {}
  }
}

function writeWatch(id, seconds) {
  try {
    const all = readWatch()
    all[id] = { seconds, updatedAt: Date.now() }
    localStorage.setItem(WATCH_KEY, JSON.stringify(all))
  } catch {
    /* storage can be unavailable (private mode); playback still works */
  }
}

function formatTime(total) {
  const s = Math.max(0, Math.floor(total))
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}

// Plays one video course. Resumes from wherever the viewer stopped — a
// fourteen-minute lecture is rarely watched in one sitting — and remembers
// the position roughly once a second while playing.
function CourseVideoPage({ courseId, navigate }) {
  const { t, lang } = useLanguage()
  const videoRef = useRef(null)
  const [resumeFrom, setResumeFrom] = useState(0)
  const [resumed, setResumed] = useState(false)

  const course = coursesData.courses.find((c) => c.id === courseId)
  const pick = (field) => (field && (field[lang] ?? field.en)) || ''

  useEffect(() => {
    if (!course) return
    const saved = readWatch()[course.id]?.seconds || 0
    // Ignore a position within the last 15s — that is effectively "finished".
    setResumeFrom(saved > 5 && saved < course.durationSeconds - 15 ? saved : 0)
    setResumed(false)
    track('course_video_open', { section: course.id })
  }, [course])

  if (!course) {
    return <p className={styles.notFound}>{t('sectionNotFound')}</p>
  }

  const onTimeUpdate = (e) => {
    const v = e.currentTarget
    if (!v.paused && Math.floor(v.currentTime) % 2 === 0) writeWatch(course.id, v.currentTime)
  }

  const jumpToResume = () => {
    if (videoRef.current) {
      videoRef.current.currentTime = resumeFrom
      videoRef.current.play()
    }
    setResumed(true)
  }

  return (
    <div className={styles.page}>
      <button type="button" className={styles.back} onClick={() => navigate('/course')}>
        ← {t('backToCourse')}
      </button>

      <div className={styles.head}>
        <p className={styles.eyebrow}>
          {t('courseLabel', { n: course.number })} · {course.durationLabel}
        </p>
        <h1 className={styles.title}>{pick(course.title)}</h1>
        <p className={styles.subtitle}>{pick(course.subtitle)}</p>
      </div>

      <div className={styles.playerWrap}>
        {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
        <video
          ref={videoRef}
          className={styles.player}
          src={asset(course.video)}
          poster={asset(course.poster)}
          controls
          preload="metadata"
          playsInline
          onTimeUpdate={onTimeUpdate}
          onEnded={() => writeWatch(course.id, 0)}
        />
      </div>

      {resumeFrom > 0 && !resumed && (
        <button type="button" className={styles.resume} onClick={jumpToResume}>
          {t('videoResumeFrom', { time: formatTime(resumeFrom) })}
        </button>
      )}

      <div className={styles.body}>
        <h2 className={styles.aboutHeading}>{t('videoAboutHeading')}</h2>
        <p className={styles.description}>{pick(course.description)}</p>

        {course.topics && (
          <ul className={styles.topics}>
            {pick(course.topics).map((topic) => (
              <li key={topic} className={styles.topic}>
                {topic}
              </li>
            ))}
          </ul>
        )}
      </div>

      <nav className={styles.nav}>
        <button type="button" className={styles.navButton} onClick={() => navigate('/course')}>
          {t('backToCourse')}
        </button>
      </nav>
    </div>
  )
}

export default CourseVideoPage
