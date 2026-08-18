import { useState } from 'react'
import { useLanguage } from '../i18n/LanguageContext.jsx'
import { getFormatPref, setFormatPref } from '../utils/prefs.js'
import { track } from '../utils/analytics.js'
import styles from './FormatToggle.module.css'

// A small, non-blocking "how do you want to learn this?" control shown in
// the lesson. Choosing "Watch" opens the section's video when one exists,
// and otherwise records the preference and shows a brief note. The stored
// choice rides along on the section micro-feedback (see SectionFeedback),
// making format preference (hypothesis D-1) a piece of collected data
// rather than a guess — without splitting readers into A/B groups.
function FormatToggle({ sectionId, hasVideo, navigate }) {
  const { t } = useLanguage()
  const [pref, setPref] = useState(getFormatPref)
  const [showHint, setShowHint] = useState(false)

  const choose = (value) => {
    setPref(value)
    setFormatPref(value)
    track('format_choice', { section: sectionId, detail: value })
    if (value === 'watch') {
      if (hasVideo && navigate) {
        navigate(`/video/${sectionId}`)
      } else {
        setShowHint(true)
        window.setTimeout(() => setShowHint(false), 4000)
      }
    } else {
      setShowHint(false)
    }
  }

  return (
    <div className={styles.wrap}>
      <div className={styles.toggle} role="group" aria-label={t('formatLabel')}>
        <button
          type="button"
          className={`${styles.option} ${pref === 'read' ? styles.optionActive : ''}`}
          aria-pressed={pref === 'read'}
          onClick={() => choose('read')}
        >
          📖 {t('formatRead')}
        </button>
        {/* Still clickable without a video — the click is the signal we
            want — but it says so first, rather than looking broken. */}
        <button
          type="button"
          className={`${styles.option} ${pref === 'watch' ? styles.optionActive : ''} ${
            hasVideo ? '' : styles.optionPending
          }`}
          aria-pressed={pref === 'watch'}
          title={hasVideo ? undefined : t('formatVideoSoon')}
          onClick={() => choose('watch')}
        >
          ▶ {t('formatWatch')}
          {!hasVideo && <span className={styles.pendingMark}>{t('formatWatchPending')}</span>}
        </button>
      </div>
      {showHint && <span className={styles.hint}>{t('formatVideoSoon')}</span>}
    </div>
  )
}

export default FormatToggle
