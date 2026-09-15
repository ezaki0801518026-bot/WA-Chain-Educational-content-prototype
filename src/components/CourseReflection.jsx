import { useEffect, useRef, useState } from 'react'
import { useLanguage } from '../i18n/LanguageContext.jsx'
import { submitForm } from '../formConfig.js'
import { track } from '../utils/analytics.js'
import styles from './CourseReflection.module.css'

const STORE_KEY = 'wa-chain-reflection'
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function readSent(courseId) {
  try {
    return JSON.parse(localStorage.getItem(STORE_KEY) || '{}')[courseId]?.sentAt || null
  } catch {
    return null
  }
}

function markSent(courseId) {
  try {
    const all = JSON.parse(localStorage.getItem(STORE_KEY) || '{}')
    all[courseId] = { sentAt: Date.now() }
    localStorage.setItem(STORE_KEY, JSON.stringify(all))
  } catch {
    /* private mode: nothing to remember, the send itself still went through */
  }
}

const clock = (seconds) => `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, '0')}`

// What comes after a lecture: two questions on its key words, then an open
// question asking what the viewer thinks. It is deliberately not a test or an
// assignment — there is no score, a wrong pick is met with "here is how the
// lecture put it" rather than a red cross, and the last step asks for a view
// with no right answer. The team reads what arrives and, where an address is
// left, writes back.
//
// Each question can send the viewer back to the moment in the video where
// the answer is explained; `rewatchAt` is measured against the served file.
function CourseReflection({ course, videoRef, open, onOpen, autoScroll }) {
  const { t, lang } = useLanguage()
  const pick = (field) => (field && (field[lang] ?? field.en)) || ''
  const reflection = course.reflection
  const quiz = reflection?.quiz || []

  const [step, setStep] = useState(0) // 0..quiz.length-1, then 'opinion', then 'sent'
  const [answers, setAnswers] = useState({})
  const [opinion, setOpinion] = useState('')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phase, setPhase] = useState('idle') // idle | sending
  const [error, setError] = useState('')
  const [sentBefore] = useState(() => readSent(course.id))
  const panelRef = useRef(null)
  const headingRef = useRef(null)

  useEffect(() => {
    if (!open || !autoScroll) return
    panelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [open, autoScroll])

  // Move focus to each new step's heading, so keyboard and screen-reader
  // users are carried along instead of left on a button that has gone.
  useEffect(() => {
    if (open) headingRef.current?.focus({ preventScroll: true })
  }, [step, open])

  if (!reflection) return null

  if (!open) {
    return (
      <div className={styles.entry}>
        <div>
          <p className={styles.entryTitle}>{t('reflectEntryTitle')}</p>
          <p className={styles.entryText}>{sentBefore ? t('reflectEntrySent') : t('reflectEntryText')}</p>
        </div>
        <button
          type="button"
          className={styles.entryButton}
          onClick={() => {
            track('reflection_open', { section: course.id, detail: 'manual' })
            onOpen()
          }}
        >
          {t('reflectEntryCta')}
        </button>
      </div>
    )
  }

  const rewatch = (seconds) => {
    const video = videoRef.current
    if (!video) return
    video.currentTime = seconds
    video.play().catch(() => {})
    video.scrollIntoView({ behavior: 'smooth', block: 'center' })
    track('reflection_rewatch', { section: course.id, detail: String(seconds) })
  }

  const stepsTotal = quiz.length + 1
  const stepIndex = step === 'opinion' || step === 'sent' ? quiz.length : step

  const send = async (event) => {
    event.preventDefault()
    const text = opinion.trim()
    const address = email.trim()
    if (!text) {
      setError(t('reflectNeedOpinion'))
      return
    }
    if (address && !EMAIL.test(address)) {
      setError(t('reflectBadEmail'))
      return
    }
    setError('')
    setPhase('sending')
    try {
      await submitForm({
        _subject: `WA-Chain — viewer's view on “${course.title.en}”`,
        from_name: name.trim() || 'Viewer (no name given)',
        lecture: `${course.title.en} (${course.id})`,
        prompt: reflection.prompt.en,
        opinion: text,
        keyword_questions: quiz
          .map((q) => `${q.keyword.en}: ${answers[q.id] === q.correct ? 'matched the lecture' : `chose ${answers[q.id] || '—'}`}`)
          .join(' / '),
        wants_reply: address ? 'yes' : 'no — reading only',
        language: lang,
        ...(address ? { email: address, replyTo: address } : {}),
      })
      markSent(course.id)
      track('reflection_sent', { section: course.id, detail: address ? 'reply' : 'no-reply' })
      setStep('sent')
    } catch {
      setError(t('reflectSendFailed'))
    } finally {
      setPhase('idle')
    }
  }

  return (
    <section ref={panelRef} className={styles.panel} aria-labelledby="reflection-heading">
      <p className={styles.eyebrow}>{t('reflectEyebrow')}</p>

      {step !== 'sent' && (
        <ol className={styles.steps} aria-label={t('reflectProgress', { n: stepIndex + 1, total: stepsTotal })}>
          {quiz.map((q, i) => (
            <li key={q.id} className={styles.stepDot} aria-current={stepIndex === i ? 'step' : undefined}>
              {pick(q.keyword)}
            </li>
          ))}
          <li className={styles.stepDot} aria-current={step === 'opinion' ? 'step' : undefined}>
            {t('reflectYourView')}
          </li>
        </ol>
      )}

      {typeof step === 'number' &&
        (() => {
          const q = quiz[step]
          const chosen = answers[q.id]
          const answered = chosen != null
          const matched = chosen === q.correct
          const isLast = step === quiz.length - 1
          return (
            <div key={q.id}>
              <p className={styles.keyword}>{pick(q.keyword)}</p>
              <h2 id="reflection-heading" ref={headingRef} tabIndex={-1} className={styles.question}>
                {pick(q.question)}
              </h2>

              <ul className={styles.options}>
                {q.options.map((option) => {
                  const isChosen = chosen === option.id
                  const isCorrect = option.id === q.correct
                  const state = !answered ? '' : isCorrect ? styles.optionCorrect : isChosen ? styles.optionChosen : styles.optionDim
                  return (
                    <li key={option.id}>
                      <button
                        type="button"
                        className={`${styles.option} ${state}`}
                        disabled={answered}
                        aria-pressed={isChosen}
                        onClick={() => {
                          setAnswers((prev) => ({ ...prev, [q.id]: option.id }))
                          track('reflection_answer', { section: course.id, detail: `${q.id}:${option.id === q.correct ? 'match' : 'other'}` })
                        }}
                      >
                        {answered && isCorrect && (
                          <span className={styles.mark} aria-hidden="true">
                            ✓
                          </span>
                        )}
                        {pick(option.text)}
                      </button>
                    </li>
                  )
                })}
              </ul>

              {answered && (
                <div className={styles.feedback} role="status">
                  <p className={styles.feedbackLead}>{matched ? t('reflectMatched') : t('reflectHowPut')}</p>
                  <p className={styles.explanation}>{pick(q.explanation)}</p>
                  {Number.isFinite(q.rewatchAt) && (
                    <button type="button" className={styles.rewatch} onClick={() => rewatch(q.rewatchAt)}>
                      ▶ {t('reflectRewatch', { time: clock(q.rewatchAt) })}
                    </button>
                  )}
                </div>
              )}

              <div className={styles.nav}>
                <button
                  type="button"
                  className={styles.primary}
                  disabled={!answered}
                  onClick={() => setStep(isLast ? 'opinion' : step + 1)}
                >
                  {isLast ? t('reflectToView') : t('reflectNext')}
                </button>
              </div>
            </div>
          )
        })()}

      {step === 'opinion' && (
        <form onSubmit={send} noValidate>
          <h2 id="reflection-heading" ref={headingRef} tabIndex={-1} className={styles.question}>
            {pick(reflection.prompt)}
          </h2>
          {reflection.hint && <p className={styles.hint}>{pick(reflection.hint)}</p>}

          <label className={styles.label} htmlFor="reflection-opinion">
            {t('reflectOpinionLabel')}
          </label>
          <textarea
            id="reflection-opinion"
            className={styles.textarea}
            rows={6}
            maxLength={4000}
            value={opinion}
            onChange={(event) => {
              setOpinion(event.target.value)
              if (error) setError('')
            }}
            disabled={phase === 'sending'}
          />

          <div className={styles.row}>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="reflection-name">
                {t('reflectNameLabel')}
              </label>
              <input
                id="reflection-name"
                className={styles.input}
                value={name}
                onChange={(event) => setName(event.target.value)}
                disabled={phase === 'sending'}
                autoComplete="name"
              />
            </div>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="reflection-email">
                {t('reflectEmailLabel')}
              </label>
              <input
                id="reflection-email"
                type="email"
                className={styles.input}
                value={email}
                onChange={(event) => {
                  setEmail(event.target.value)
                  if (error) setError('')
                }}
                disabled={phase === 'sending'}
                autoComplete="email"
              />
            </div>
          </div>
          <p className={styles.note}>{t('reflectEmailNote')}</p>

          {error && (
            <p className={styles.error} role="alert">
              {error}
            </p>
          )}

          <div className={styles.nav}>
            <button type="button" className={styles.secondary} onClick={() => setStep(quiz.length - 1)} disabled={phase === 'sending'}>
              {t('reflectBack')}
            </button>
            <button type="submit" className={styles.primary} disabled={phase === 'sending'}>
              {phase === 'sending' ? t('reflectSending') : t('reflectSend')}
            </button>
          </div>
          <p className={styles.privacy}>{t('reflectPrivacy')}</p>
        </form>
      )}

      {step === 'sent' && (
        <div className={styles.sent}>
          <h2 id="reflection-heading" ref={headingRef} tabIndex={-1} className={styles.question}>
            {t('reflectThanks')}
          </h2>
          <p className={styles.explanation}>{email.trim() ? t('reflectThanksReply') : t('reflectThanksRead')}</p>
        </div>
      )}
    </section>
  )
}

export default CourseReflection
