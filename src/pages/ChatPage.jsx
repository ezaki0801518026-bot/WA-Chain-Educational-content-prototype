import { useState } from 'react'
import { useLanguage } from '../i18n/LanguageContext.jsx'
import { submitForm } from '../formConfig.js'
import styles from './ChatPage.module.css'

// Seeded example exchanges shown at the top so an observer immediately sees
// the concept's value. Content stays in English, like the lesson material
// (course content is never localised — only the UI chrome is).
const SAMPLES = [
  {
    q: 'Which fiber is best for a very thin repair tissue on a work on paper?',
    a: 'For the thinnest, most translucent tissue, gampi is a common choice — its fine, dense fibers form a smooth sheet. Where you need more flexibility and long-fiber strength (hinges, tear repairs), kōzo is usually preferred. Section 4 walks through telling the three fibers apart.',
  },
  {
    q: 'How can I check whether a washi is acidic before using it on an artwork?',
    a: 'A surface pH reading on a discreet edge — a pH pen, or a cold-water extraction with an electrode — is the usual quick check. Conservation-grade kōzo papers are typically neutral to mildly alkaline. Section 2 covers why pH is what decides a paper’s lifespan.',
  },
]

// "Ask a conservator" — the third product pillar, built as a Wizard of Oz:
// there is no live AI. A question is emailed (via the shared submitForm
// helper) to the team, who reply by hand. The seeded samples plus the
// human-in-the-loop framing let a validation session gauge demand for the
// feature (hypothesis E-3) without building any real automation yet.
function ChatPage() {
  const { t } = useLanguage()
  const [question, setQuestion] = useState('')
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState([]) // questions submitted this session
  const [phase, setPhase] = useState('idle') // idle | sending | error
  const [error, setError] = useState('')

  const submit = async (event) => {
    event.preventDefault()
    if (!question.trim()) {
      setError(t('chatValidationQ'))
      return
    }
    if (!email.trim()) {
      setError(t('chatValidationEmail'))
      return
    }
    setError('')
    setPhase('sending')
    const asked = question.trim()
    try {
      await submitForm({
        _subject: 'Washi Course — conservator question',
        question: asked,
        replyTo: email.trim(),
      })
      setSent((prev) => [...prev, asked])
      setQuestion('')
      setPhase('idle')
    } catch {
      setPhase('error')
      setError(t('feedbackError'))
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.intro}>
        <h1 className={styles.title}>{t('chatTitle')}</h1>
        <p className={styles.description}>{t('chatIntro')}</p>
      </div>

      <div className={styles.thread}>
        <p className={styles.sampleLabel}>{t('chatSampleLabel')}</p>
        {SAMPLES.map((s, i) => (
          <div key={i} className={styles.exchange}>
            <div className={`${styles.bubble} ${styles.bubbleYou}`}>
              <span className={styles.who}>{t('chatYou')}</span>
              {s.q}
            </div>
            <div className={`${styles.bubble} ${styles.bubbleExpert}`}>
              <span className={styles.who}>{t('chatConservator')}</span>
              {s.a}
            </div>
          </div>
        ))}

        {/* Questions asked this session: the reader's message, then the
            "received, we'll reply by email" acknowledgement. */}
        {sent.map((q, i) => (
          <div key={`sent-${i}`} className={styles.exchange}>
            <div className={`${styles.bubble} ${styles.bubbleYou}`}>
              <span className={styles.who}>{t('chatYou')}</span>
              {q}
            </div>
            <div className={`${styles.bubble} ${styles.bubbleSystem}`}>{t('chatReceived')}</div>
          </div>
        ))}
      </div>

      <form className={styles.form} onSubmit={submit}>
        <label className={styles.label} htmlFor="chat-question">
          {t('chatQuestionLabel')}
        </label>
        <textarea
          id="chat-question"
          className={styles.textarea}
          rows={3}
          placeholder={t('chatQuestionPlaceholder')}
          value={question}
          onChange={(event) => {
            setQuestion(event.target.value)
            if (error) setError('')
          }}
          disabled={phase === 'sending'}
        />

        <label className={styles.label} htmlFor="chat-email">
          {t('chatEmailLabel')}
        </label>
        <input
          id="chat-email"
          type="email"
          className={styles.input}
          value={email}
          onChange={(event) => {
            setEmail(event.target.value)
            if (error) setError('')
          }}
          disabled={phase === 'sending'}
        />

        {error && <p className={styles.error}>{error}</p>}

        <button type="submit" className={styles.submit} disabled={phase === 'sending'}>
          {phase === 'sending' ? t('chatSending') : t('chatSend')}
        </button>
        <p className={styles.disclaimer}>{t('chatDisclaimer')}</p>
      </form>
    </div>
  )
}

export default ChatPage
