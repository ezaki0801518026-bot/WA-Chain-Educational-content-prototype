import { useEffect, useRef, useState } from 'react'
import { useLanguage } from '../i18n/LanguageContext.jsx'
import { submitForm } from '../formConfig.js'
import { readProfile } from '../utils/profile.js'
import styles from './SurveyPopup.module.css'

// A small corner prompt that lets a visitor cheer the team on: one tap sends
// "keep going", a comment is optional. It appears after a while on the
// browsing pages only, never over a lesson, the video player, the chat
// composer or the course page (which has the section survey in this corner).
// Closed with ✕ it stays away for a week; sent, for a month.
const STORAGE_KEY = 'wa-chain-cheer' // JSON { state: 'dismissed' | 'sent', at }
const SHOW_DELAY_MS = 12000
const QUIET_AFTER_DISMISS_MS = 7 * 24 * 60 * 60 * 1000
const QUIET_AFTER_SENT_MS = 30 * 24 * 60 * 60 * 1000
const QUIET_PAGES = new Set(['lesson', 'quiz', 'video', 'summary', 'course', 'chat'])

function quietUntil() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null')
    if (!saved?.at) return 0
    return saved.at + (saved.state === 'sent' ? QUIET_AFTER_SENT_MS : QUIET_AFTER_DISMISS_MS)
  } catch {
    return 0
  }
}

function remember(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ state, at: Date.now() }))
  } catch {
    /* nothing to remember it with; it may appear again */
  }
}

function CheerPopup({ page }) {
  const { t, lang } = useLanguage()
  const [visible, setVisible] = useState(false)
  const [phase, setPhase] = useState('form') // 'form' | 'sending' | 'success' | 'error'
  const [comment, setComment] = useState('')
  const panelRef = useRef(null)

  const eligible = !QUIET_PAGES.has(page)

  useEffect(() => {
    if (visible || !eligible) return undefined
    if (Date.now() < quietUntil()) return undefined
    const timer = window.setTimeout(() => setVisible(true), SHOW_DELAY_MS)
    return () => window.clearTimeout(timer)
  }, [eligible, visible])

  const dismiss = () => {
    remember('dismissed')
    setVisible(false)
  }

  const send = async (event) => {
    event.preventDefault()
    setPhase('sending')
    try {
      await submitForm({
        _subject: 'WA-Chain — cheer from a visitor',
        page: window.location.hash || '#/',
        language: lang,
        level: readProfile()?.level || '(not set)',
        comment: comment.trim() || '(none)',
      })
      remember('sent')
      setPhase('success')
      window.setTimeout(() => setVisible(false), 4000)
    } catch {
      setPhase('error')
    }
  }

  if (!visible || !eligible) return null

  return (
    <div className={styles.popup} ref={panelRef} role="region" aria-label={t('cheerHeadline')}>
      <button type="button" className={styles.dismissButton} onClick={dismiss} aria-label={t('cheerDismiss')}>
        ✕
      </button>

      {phase === 'success' ? (
        <p className={styles.resultText}>{t('cheerThanks')}</p>
      ) : (
        <form className={styles.form} onSubmit={send}>
          <p className={styles.headline}>{t('cheerHeadline')}</p>
          <p className={styles.body}>{t('cheerBody')}</p>
          <label className={styles.label} htmlFor="cheer-comment">
            {t('cheerCommentLabel')}
          </label>
          <textarea
            id="cheer-comment"
            className={styles.textarea}
            rows={2}
            value={comment}
            onChange={(event) => setComment(event.target.value)}
            disabled={phase === 'sending'}
          />
          {phase === 'error' && <p className={styles.resultTextError}>{t('cheerError')}</p>}
          <button type="submit" className={styles.ctaButton} disabled={phase === 'sending'}>
            {phase === 'sending' ? t('cheerSending') : t('cheerSend')}
          </button>
        </form>
      )}
    </div>
  )
}

export default CheerPopup
