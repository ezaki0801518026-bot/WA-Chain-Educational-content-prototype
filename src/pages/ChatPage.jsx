import { useEffect, useRef, useState } from 'react'
import { useLanguage } from '../i18n/LanguageContext.jsx'
import { submitForm } from '../formConfig.js'
import { track } from '../utils/analytics.js'
import styles from './ChatPage.module.css'

// Seeded example exchanges shown before the first question, so an observer
// immediately sees what the assistant is for. Content stays in English, like
// the lesson material (course content is never localised — only UI chrome).
const SAMPLES = [
  {
    q: 'Which fiber is best for a very thin repair tissue on a work on paper?',
    a: 'For the thinnest, most translucent tissue, gampi is a common choice — its fine, dense fibers form a smooth sheet. Where you need more flexibility and long-fiber strength (hinges, tear repairs), kōzo is usually preferred. Section 4 walks through telling the three fibers apart.',
  },
  {
    q: 'How can I check whether a washi is acidic before using it on an artwork?',
    a: 'A surface pH reading on a discreet edge — a pH pen, or a cold-water extraction with an electrode — is the usual quick check. Conservation-grade kōzo papers are typically neutral to mildly alkaline. Section 2 covers why pH is what decides a paper lifespan.',
  },
]

const MAX_CHARS = 2000
const ENDPOINT = '/api/chat'
const CHAT_PREFILL_KEY = 'wa-chain-chat-prefill'

const ERROR_KEYS = {
  budget: 'chatErrorBudget',
  busy: 'chatErrorBusy',
  unconfigured: 'chatErrorUnavailable',
}

function lastUserQuestion(turns) {
  for (let i = turns.length - 1; i >= 0; i -= 1) {
    if (turns[i].role === 'user') return turns[i].content
  }
  return ''
}

// "Ask a conservator" — the third product pillar.
//
// Two modes, chosen by probing /api/chat on load:
//   - With a backend (Cloudflare): the assistant answers from the material.
//   - Without one (GitHub Pages, local dev): the original Wizard of Oz — the
//     question is emailed to the team, who reply by hand.
// The human route stays available in both, because the assistant is built to
// refuse rather than guess, and a refusal needs somewhere to go.
function ChatPage() {
  const { t } = useLanguage()
  const [turns, setTurns] = useState([]) // { role, content, code? }
  const [question, setQuestion] = useState('')
  const [phase, setPhase] = useState('idle') // idle | sending | error
  const [error, setError] = useState('')
  const [escalating, setEscalating] = useState(false)
  const [email, setEmail] = useState('')
  // null while probing, then true/false. Asking the endpoint whether it is
  // there beats a build-time flag: the page then behaves correctly wherever
  // it is served, with no environment variable to remember to set.
  const [assistant, setAssistant] = useState(null)
  const threadEndRef = useRef(null)

  // A question typed on the home page arrives here, ready to send.
  useEffect(() => {
    try {
      const draft = sessionStorage.getItem(CHAT_PREFILL_KEY)
      if (draft) {
        setQuestion(draft)
        sessionStorage.removeItem(CHAT_PREFILL_KEY)
      }
    } catch {
      /* private mode: nothing to carry over */
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    fetch(ENDPOINT, { method: 'GET' })
      .then((response) => (response.status === 405 ? response.json() : null))
      .then((data) => {
        if (!cancelled) setAssistant(data?.code === 'method_not_allowed')
      })
      .catch(() => {
        if (!cancelled) setAssistant(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    threadEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }, [turns, phase])

  const askAssistant = async (event) => {
    event.preventDefault()
    const asked = question.trim()
    if (!asked) {
      setError(t('chatValidationQ'))
      return
    }
    setError('')
    setPhase('sending')
    setQuestion('')

    // Notices (budget, errors) are display-only — never replay them as context.
    const history = [...turns.filter((turn) => turn.role !== 'system' && !turn.code), { role: 'user', content: asked }]
    setTurns(history)
    track('chat_ask', {})

    try {
      const response = await fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          messages: history.map(({ role, content }) => ({ role, content })),
        }),
      })
      const data = await response.json().catch(() => ({}))

      if (data.reply) {
        setTurns([...history, { role: 'assistant', content: data.reply }])
      } else {
        // Budget exhausted, upstream busy, or misconfigured — each gets its own
        // message, and all of them point at the human route.
        const key = ERROR_KEYS[data.code] || 'chatErrorGeneric'
        setTurns([...history, { role: 'assistant', content: t(key), code: data.code || 'error' }])
      }
    } catch {
      setTurns([...history, { role: 'assistant', content: t('chatErrorGeneric'), code: 'error' }])
    } finally {
      setPhase('idle')
    }
  }

  // The fallback path, and the escape hatch when the assistant declines:
  // send the question to the team by email.
  const sendToTeam = async (event) => {
    event.preventDefault()
    const typed = question.trim()
    const asked = typed || lastUserQuestion(turns)
    if (!asked) {
      setError(t('chatValidationQ'))
      return
    }
    if (!email.trim()) {
      setError(t('chatValidationEmail'))
      return
    }
    setError('')
    setPhase('sending')
    try {
      await submitForm({
        _subject: 'Washi Course — conservator question',
        question: asked,
        replyTo: email.trim(),
      })
      setTurns((prev) => [
        ...prev,
        ...(typed ? [{ role: 'user', content: asked }] : []),
        { role: 'system', content: t('chatReceived') },
      ])
      setQuestion('')
      setEscalating(false)
      setPhase('idle')
    } catch {
      setPhase('error')
      setError(t('feedbackError'))
    }
  }

  const sending = phase === 'sending'
  const hasAssistant = assistant === true
  const showEscalation = !hasAssistant || escalating

  return (
    <div className={styles.page}>
      <div className={styles.intro}>
        <h1 className={styles.title}>{t('chatTitle')}</h1>
        <p className={styles.description}>{hasAssistant ? t('chatIntroAi') : t('chatIntro')}</p>
      </div>

      <div className={styles.thread}>
        {turns.length === 0 && (
          <div className={styles.samples}>
            <p className={styles.sampleLabel}>{t('chatSampleLabel')}</p>
            {SAMPLES.map((sample, i) => (
              <div key={`sample-${i}`} className={`${styles.exchange} ${styles.sampleExchange}`}>
                <div className={`${styles.bubble} ${styles.bubbleYou} ${styles.sampleBubble}`}>
                  <span className={styles.who}>{t('chatYou')}</span>
                  {sample.q}
                </div>
                <div className={`${styles.bubble} ${styles.bubbleExpert} ${styles.sampleBubble}`}>
                  <span className={styles.who}>{t('chatAssistant')}</span>
                  {sample.a}
                </div>
              </div>
            ))}
          </div>
        )}

        {turns.map((turn, i) => {
          if (turn.role === 'system') {
            return (
              <div key={`turn-${i}`} className={styles.exchange}>
                <div className={`${styles.bubble} ${styles.bubbleSystem}`}>{turn.content}</div>
              </div>
            )
          }
          const mine = turn.role === 'user'
          return (
            <div key={`turn-${i}`} className={styles.exchange}>
              <div
                className={`${styles.bubble} ${mine ? styles.bubbleYou : styles.bubbleExpert} ${
                  turn.code ? styles.bubbleNotice : ''
                }`}
              >
                <span className={styles.who}>{mine ? t('chatYou') : t('chatAssistant')}</span>
                {turn.content}
              </div>
            </div>
          )
        })}

        {sending && (
          <div className={styles.exchange}>
            <div className={`${styles.bubble} ${styles.bubbleExpert} ${styles.bubblePending}`}>
              {t('chatThinking')}
            </div>
          </div>
        )}
        <div ref={threadEndRef} />
      </div>

      <form className={styles.form} onSubmit={showEscalation ? sendToTeam : askAssistant}>
        <label className={styles.label} htmlFor="chat-question">
          {t('chatQuestionLabel')}
        </label>
        <textarea
          id="chat-question"
          className={styles.textarea}
          rows={3}
          maxLength={MAX_CHARS}
          placeholder={t('chatQuestionPlaceholder')}
          value={question}
          onChange={(event) => {
            setQuestion(event.target.value)
            if (error) setError('')
          }}
          disabled={sending}
        />

        {showEscalation && (
          <>
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
              disabled={sending}
            />
          </>
        )}

        {error && <p className={styles.error}>{error}</p>}

        <div className={styles.actions}>
          <button type="submit" className={styles.submit} disabled={sending}>
            {sending ? t('chatSending') : showEscalation ? t('chatSend') : t('chatAsk')}
          </button>
          {hasAssistant && (
            <button
              type="button"
              className={styles.secondary}
              onClick={() => setEscalating((value) => !value)}
              disabled={sending}
            >
              {escalating ? t('chatBackToAssistant') : t('chatEscalate')}
            </button>
          )}
        </div>

        <p className={styles.disclaimer}>{hasAssistant ? t('chatDisclaimerAi') : t('chatDisclaimer')}</p>
      </form>
    </div>
  )
}

export default ChatPage
