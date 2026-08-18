import { useState } from 'react'
import { useLanguage } from '../i18n/LanguageContext.jsx'
import { submitForm } from '../formConfig.js'
import { getFormatPref } from '../utils/prefs.js'
import styles from './SectionFeedback.module.css'

const STORAGE_KEY = 'washi-course-section-feedback' // { [sectionId]: true }

function alreadySent(sectionId) {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? Boolean(JSON.parse(raw)[sectionId]) : false
  } catch {
    return false
  }
}

function markSent(sectionId) {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    const map = raw ? JSON.parse(raw) : {}
    map[sectionId] = true
    localStorage.setItem(STORAGE_KEY, JSON.stringify(map))
  } catch {
    // ignore — a failed write just means we may ask again next visit
  }
}

// Two-question completion check shown on the summary page. It is the direct
// measurement instrument for the team's core validation questions: the
// free-text answer captures "did they learn ≥1 new thing" (success
// condition / hypothesis F-1), and the 1–5 rating captures perceived
// usefulness to real work. Sends through the shared submitForm() helper and
// remembers, per section, that it was answered so it never nags on a revisit.
function SectionFeedback({ sectionId, sectionTitle }) {
  const { t } = useLanguage()
  const [rating, setRating] = useState(0)
  const [learned, setLearned] = useState('')
  const [phase, setPhase] = useState(alreadySent(sectionId) ? 'done' : 'idle') // idle | sending | done | error
  const [invalid, setInvalid] = useState(false)

  if (phase === 'done') {
    return <p className={styles.thanks}>{t('sfThanks')}</p>
  }

  const submit = async (event) => {
    event.preventDefault()
    if (!rating) {
      setInvalid(true)
      return
    }
    setInvalid(false)
    setPhase('sending')
    try {
      await submitForm({
        _subject: `Washi Course — section feedback: ${sectionId}`,
        section: sectionTitle,
        usefulness: `${rating}/5`,
        learnedSomethingNew: learned.trim() || '(left blank)',
        preferredFormat: getFormatPref(),
      })
      markSent(sectionId)
      setPhase('done')
    } catch {
      setPhase('error')
    }
  }

  return (
    <form className={styles.card} onSubmit={submit}>
      <p className={styles.title}>{t('sfTitle')}</p>

      <label className={styles.label} htmlFor={`sf-learned-${sectionId}`}>
        {t('sfNewLabel')}
      </label>
      <textarea
        id={`sf-learned-${sectionId}`}
        className={styles.textarea}
        rows={2}
        placeholder={t('sfNewPlaceholder')}
        value={learned}
        onChange={(event) => setLearned(event.target.value)}
        disabled={phase === 'sending'}
      />

      <p className={styles.label}>{t('sfUsefulLabel')}</p>
      <div className={styles.scale} role="radiogroup" aria-label={t('sfUsefulLabel')}>
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            className={`${styles.scaleButton} ${rating === n ? styles.scaleButtonActive : ''}`}
            aria-pressed={rating === n}
            onClick={() => {
              setRating(n)
              if (invalid) setInvalid(false)
            }}
            disabled={phase === 'sending'}
          >
            {n}
          </button>
        ))}
      </div>
      <div className={styles.scaleLabels}>
        <span>{t('sfScaleLow')}</span>
        <span>{t('sfScaleHigh')}</span>
      </div>

      {invalid && <p className={styles.validation}>{t('sfValidation')}</p>}

      <button type="submit" className={styles.submit} disabled={phase === 'sending'}>
        {phase === 'sending' ? t('sfSending') : t('sfSubmit')}
      </button>
      {phase === 'error' && <p className={styles.error}>{t('feedbackError')}</p>}
    </form>
  )
}

export default SectionFeedback
