import { useEffect, useRef, useState } from 'react'
import upcoming from '../../data/upcoming.json'
import { useLanguage } from '../i18n/LanguageContext.jsx'
import { submitForm } from '../formConfig.js'
import styles from './SurveyPopup.module.css'

const STORAGE_KEY = 'washi-course-survey-status' // 'dismissed' | 'submitted'
const SHOW_DELAY_MS = 4000


// Small, dismissible corner prompt asking which planned video a
// visitor wants most. Home page only — Lesson/Quiz/Video pages already
// have a fixed action button in this same corner, and interrupting an
// in-progress lesson with a survey would be exactly the kind of nagging
// this app's design deliberately avoids. Once dismissed or submitted, it
// never appears again in this browser (localStorage-backed, no re-prompting).
function SurveyPopup() {
  const { t, lang } = useLanguage()
  const [visible, setVisible] = useState(false)
  const [phase, setPhase] = useState('teaser') // 'teaser' | 'form' | 'sending' | 'success' | 'error'
  const [selectedSection, setSelectedSection] = useState('')
  const [comment, setComment] = useState('')
  const panelRef = useRef(null)

  const numbered = (video) => `${String(video.no).padStart(2, '0')} ${video.title[lang] ?? video.title.en}`

  useEffect(() => {
    let alreadyResolved = false
    try {
      alreadyResolved = Boolean(localStorage.getItem(STORAGE_KEY))
    } catch {
      alreadyResolved = false
    }
    if (alreadyResolved) return
    const timer = window.setTimeout(() => setVisible(true), SHOW_DELAY_MS)
    return () => window.clearTimeout(timer)
  }, [])

  const dismiss = () => {
    localStorage.setItem(STORAGE_KEY, 'dismissed')
    setVisible(false)
  }

  const openForm = () => {
    setPhase('form')
    window.setTimeout(() => panelRef.current?.querySelector('select')?.focus(), 50)
  }

  const submit = async (event) => {
    event.preventDefault()
    setPhase('sending')
    try {
      await submitForm({
        _subject: 'Washi Course — section request survey',
        requestedSection: selectedSection || '(no selection)',
        comment: comment || '(none)',
      })
      localStorage.setItem(STORAGE_KEY, 'submitted')
      setPhase('success')
    } catch {
      setPhase('error')
    }
  }

  if (!visible) return null

  return (
    <div className={styles.popup} ref={panelRef} role="region" aria-label={t('surveyHeadline')}>
      <button type="button" className={styles.dismissButton} onClick={dismiss} aria-label={t('surveyDismiss')}>
        ✕
      </button>

      {phase === 'teaser' && (
        <>
          <p className={styles.headline}>{t('surveyHeadline')}</p>
          <p className={styles.body}>{t('surveyBody')}</p>
          <button type="button" className={styles.ctaButton} onClick={openForm}>
            {t('surveyCta')}
          </button>
        </>
      )}

      {(phase === 'form' || phase === 'sending') && (
        <form className={styles.form} onSubmit={submit}>
          <label className={styles.label} htmlFor="survey-section">
            {t('surveySelectLabel')}
          </label>
          <select
            id="survey-section"
            className={styles.select}
            value={selectedSection}
            onChange={(event) => setSelectedSection(event.target.value)}
            disabled={phase === 'sending'}
          >
            <option value="">{t('surveySelectPlaceholder')}</option>
            {upcoming.videos.map((video) => (
              <option key={video.no} value={`${String(video.no).padStart(2, '0')} ${video.title.en}`}>
                {numbered(video)}
              </option>
            ))}
          </select>

          <label className={styles.label} htmlFor="survey-comment">
            {t('surveyCommentLabel')}
          </label>
          <textarea
            id="survey-comment"
            className={styles.textarea}
            rows={2}
            value={comment}
            onChange={(event) => setComment(event.target.value)}
            disabled={phase === 'sending'}
          />

          <button type="submit" className={styles.ctaButton} disabled={phase === 'sending'}>
            {phase === 'sending' ? t('surveySending') : t('surveySubmit')}
          </button>
        </form>
      )}

      {phase === 'success' && <p className={styles.resultText}>{t('surveyThanks')}</p>}

      {phase === 'error' && (
        <>
          <p className={styles.resultTextError}>{t('surveyError')}</p>
          <button type="button" className={styles.ctaButton} onClick={() => setPhase('form')}>
            {t('surveySubmit')}
          </button>
        </>
      )}
    </div>
  )
}

export default SurveyPopup
