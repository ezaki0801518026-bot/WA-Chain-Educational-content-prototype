import { useEffect, useRef, useState } from 'react'
import { QUESTIONS } from '../../data/profile.js'
import { useLanguage } from '../i18n/LanguageContext.jsx'
import { writeProfile, markSkipped } from '../utils/profile.js'
import { track } from '../utils/analytics.js'
import HelpTip from './HelpTip.jsx'
import styles from './ProfileSetup.module.css'

// Five questions, once. The answers stay in this browser and decide two
// things: how plainly the assistant explains, and what the home page puts
// first. Nothing here is required — "Not now" closes it and the site works
// exactly as before, with the general order.
function ProfileSetup({ initial = null, onDone, onClose }) {
  const { t, lang } = useLanguage()
  const [answers, setAnswers] = useState(() => ({ ...(initial || {}) }))
  const panelRef = useRef(null)
  const label = (field) => field[lang] ?? field.en

  useEffect(() => {
    panelRef.current?.focus()
    const onKey = (event) => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  const answered = QUESTIONS.filter((question) => answers[question.id]).length
  const save = () => {
    const saved = writeProfile(answers)
    track('profile_saved', { detail: `${answered}/${QUESTIONS.length}` })
    onDone(saved)
  }
  const skip = () => {
    markSkipped()
    track('profile_skipped', {})
    onClose()
  }

  return (
    <div className={styles.backdrop} role="dialog" aria-modal="true" aria-labelledby="profile-title">
      <div className={styles.panel} ref={panelRef} tabIndex={-1}>
        <div className={styles.head}>
          <h2 id="profile-title" className={styles.title}>
            {t('profileTitle')}
            <HelpTip label={t('profileWhyLabel')}>{t('profileWhy')}</HelpTip>
          </h2>
          <button type="button" className={styles.close} onClick={skip} aria-label={t('profileSkip')}>
            ×
          </button>
        </div>

        <div className={styles.questions}>
          {QUESTIONS.map((question) => (
            <fieldset key={question.id} className={styles.question}>
              <legend className={styles.legend}>{label(question.label)}</legend>
              <div className={styles.options}>
                {question.options.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    className={`${styles.option} ${answers[question.id] === option.id ? styles.optionOn : ''}`}
                    aria-pressed={answers[question.id] === option.id}
                    onClick={() =>
                      setAnswers((current) => ({
                        ...current,
                        // Pressing the chosen option again clears it: every
                        // question may be left unanswered.
                        [question.id]: current[question.id] === option.id ? undefined : option.id,
                      }))
                    }
                  >
                    {label(option.label)}
                  </button>
                ))}
              </div>
            </fieldset>
          ))}
        </div>

        <div className={styles.actions}>
          <button type="button" className={styles.save} onClick={save} disabled={answered === 0}>
            {t('profileSave')}
          </button>
          <button type="button" className={styles.later} onClick={skip}>
            {t('profileSkip')}
          </button>
          <p className={styles.note}>{t('profileStored')}</p>
        </div>
      </div>
    </div>
  )
}

export default ProfileSetup
