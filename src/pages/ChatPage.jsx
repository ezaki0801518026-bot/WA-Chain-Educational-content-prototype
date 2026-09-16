import { useCallback, useEffect, useRef, useState } from 'react'
import { useLanguage } from '../i18n/LanguageContext.jsx'
import { submitForm } from '../formConfig.js'
import { track } from '../utils/analytics.js'
import { setSectionStep } from '../utils/progress.js'
import { readAnswer } from '../utils/chatStream.js'
import { sourceFor } from '../../data/chat-corpus.js'
import styles from './ChatPage.module.css'

// Example exchanges, shown under the input before the first question so an
// observer sees what the assistant is for. Content stays in English, like the
// lesson material (course content is never localised — only UI chrome).
//
// Written the way a real answer comes back: every claim is from the course,
// and the sources are real passages looked up with sourceFor(document, block)
// — block 0 is a section's overview, block N its step N.
const SAMPLES = [
  {
    q: 'Which fiber suits a thin repair paper where no bulk can be added?',
    parts: [
      { text: 'The material points to gampi: its short, smooth, dense fiber is prized for thin, refined repair papers where bulk cannot be added.', refs: [1] },
      { text: ' It also puts identifying the fiber of the original first, before any repair material is chosen.', refs: [2] },
    ],
    sources: [sourceFor(3, 3), sourceFor(3, 9)],
  },
  {
    q: 'Is gampi paper acidic?',
    parts: [
      { text: 'No. Measured values put mitsumata and gampi paper at pH 6.6–8.6, the same neutral-to-mildly-alkaline band as kōzo paper at 6.3–9.5.', refs: [1] },
      { text: ' Any repair paper must itself be neutral to weakly alkaline, so each sheet is judged by measurement, not by its fiber.', refs: [2] },
    ],
    sources: [sourceFor(3, 3), sourceFor(1, 7)],
  },
].map((sample) => ({ ...sample, sources: sample.sources.map((source, i) => ({ ...source, n: i + 1 })) }))

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

// Footnote markers go before any line break that ends the text, so "…9.5.[1]"
// stays on its line instead of opening the next paragraph.
function AnswerText({ parts }) {
  return parts.map((part, i) => {
    const body = part.text.replace(/\s+$/, '')
    const tail = part.text.slice(body.length)
    return (
      <span key={i}>
        {body}
        {part.refs.length > 0 && <sup className={styles.ref}>[{part.refs.join(', ')}]</sup>}
        {tail}
      </span>
    )
  })
}

function SourceList({ sources }) {
  const { t } = useLanguage()
  if (!sources?.length) return null
  // Opens the lesson at the cited step: the lesson reopens wherever the
  // reader last was, so pointing that at the step is all it takes.
  const open = (source) => {
    if (source.stepIndex === null) return
    try {
      setSectionStep(source.sectionId, source.stepIndex)
    } catch {
      /* storage blocked: the lesson opens at its first step */
    }
  }
  return (
    <div className={styles.sources}>
      <p className={styles.sourcesLabel}>{t('chatSources')}</p>
      <ol className={styles.sourceList}>
        {sources.map((source) => (
          <li key={source.n} value={source.n}>
            <a
              href={`#/lesson/${source.sectionId}`}
              onClick={() => open(source)}
              title={source.quote ? source.quote.slice(0, 280) : undefined}
            >
              Section {source.sectionNumber} · {source.stepHeading ?? source.sectionTitle}
            </a>
          </li>
        ))}
      </ol>
    </div>
  )
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
  // { role, content, parts?, sources?, code?, streaming? } — content is the
  // plain text, which is what is replayed to the model as history.
  const [turns, setTurns] = useState([])
  const [question, setQuestion] = useState('')
  const [phase, setPhase] = useState('idle') // idle | sending | streaming | error
  const [error, setError] = useState('')
  const [escalating, setEscalating] = useState(false)
  const [email, setEmail] = useState('')
  // null while probing, then true/false. Asking the endpoint whether it is
  // there beats a build-time flag: the page then behaves correctly wherever
  // it is served, with no environment variable to remember to set.
  const [assistant, setAssistant] = useState(null)
  const threadEndRef = useRef(null)
  const turnsRef = useRef(turns)
  turnsRef.current = turns

  // A question typed on the home page. Held until the probe says whether
  // there is an assistant to send it to — then it is asked straight away,
  // so one press on the home page is one question asked.
  const carried = useRef(null)
  useEffect(() => {
    try {
      const draft = sessionStorage.getItem(CHAT_PREFILL_KEY)
      if (draft) {
        carried.current = draft
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
    if (turns.length === 0 && phase === 'idle') return
    threadEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }, [turns, phase])

  const ask = useCallback(
    async (asked) => {
      setError('')
      setPhase('sending')
      setQuestion('')

      // Notices (budget, errors) are display-only — never replay them as context.
      const history = [
        ...turnsRef.current.filter((turn) => turn.role !== 'system' && !turn.code),
        { role: 'user', content: asked },
      ]
      setTurns(history)
      track('chat_ask', {})

      const fail = (code) =>
        setTurns([...history, { role: 'assistant', content: t(ERROR_KEYS[code] || 'chatErrorGeneric'), code }])

      try {
        const response = await fetch(ENDPOINT, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            messages: history.map(({ role, content }) => ({ role, content })),
          }),
        })

        // Anything that is not the event stream is a refusal before the model
        // was reached (no key, bad body, budget, outage), as {code} JSON.
        if (!(response.headers.get('content-type') || '').includes('event-stream')) {
          const data = await response.json().catch(() => ({}))
          fail(data.code || 'error')
          return
        }

        const { answer, truncated, code } = await readAnswer(response, (sofar) => {
          if (!sofar.text) return
          // The bubble replaces the "looking through the material" notice as
          // soon as there is something to read.
          setPhase('streaming')
          setTurns([...history, { role: 'assistant', content: sofar.text, parts: sofar.parts, streaming: true }])
        })

        if (!answer.text) {
          fail(code || 'error')
          return
        }
        const notice = truncated ? 'chatTruncated' : code ? 'chatInterrupted' : null
        setTurns([
          ...history,
          { role: 'assistant', content: answer.text, parts: answer.parts, sources: answer.sources },
          ...(notice ? [{ role: 'system', content: t(notice) }] : []),
        ])
      } catch {
        fail('error')
      } finally {
        setPhase('idle')
      }
    },
    [t]
  )

  useEffect(() => {
    if (assistant === null || !carried.current) return
    const draft = carried.current
    carried.current = null
    if (assistant) ask(draft)
    else setQuestion(draft) // no assistant here: the team route needs an email first
  }, [assistant, ask])

  const askAssistant = (event) => {
    event.preventDefault()
    const asked = question.trim()
    if (!asked) {
      setError(t('chatValidationQ'))
      return
    }
    ask(asked)
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

  // Both states lock the form; only 'sending' shows the waiting notice,
  // because once text is arriving the bubble itself is the progress.
  const sending = phase === 'sending' || phase === 'streaming'
  const hasAssistant = assistant === true
  const showEscalation = !hasAssistant || escalating
  const onSubmit = showEscalation ? sendToTeam : askAssistant

  return (
    <div className={styles.page}>
      <div className={styles.intro}>
        <h1 className={styles.title}>{t('chatTitle')}</h1>
        <p className={styles.description}>{hasAssistant ? t('chatIntroAi') : t('chatIntro')}</p>
      </div>

      {(turns.length > 0 || phase === 'sending') && (
        <div className={styles.thread}>
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
                  } ${turn.streaming ? styles.bubbleStreaming : ''}`}
                >
                  <span className={styles.who}>{mine ? t('chatYou') : t('chatAssistant')}</span>
                  {turn.parts ? <AnswerText parts={turn.parts} /> : turn.content}
                  {turn.sources && <SourceList sources={turn.sources} />}
                </div>
              </div>
            )
          })}

          {phase === 'sending' && (
            <div className={styles.exchange}>
              <div className={`${styles.bubble} ${styles.bubbleExpert} ${styles.bubblePending}`}>
                {t('chatThinking')}
              </div>
            </div>
          )}
          <div ref={threadEndRef} />
        </div>
      )}

      <form className={styles.form} onSubmit={onSubmit}>
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
          onKeyDown={(event) => {
            // Enter asks; Shift+Enter is a new line. Never while an input
            // method is composing — that Enter confirms the kanji, not the question.
            if (event.key !== 'Enter' || event.shiftKey || event.nativeEvent.isComposing || event.keyCode === 229) return
            if (showEscalation) return // the team route still needs an email
            onSubmit(event)
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

      {turns.length === 0 && phase === 'idle' && (
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
                <AnswerText parts={sample.parts} />
                <SourceList sources={sample.sources} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default ChatPage
