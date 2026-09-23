import { useCallback, useEffect, useRef, useState } from 'react'
import { useLanguage } from '../i18n/LanguageContext.jsx'
import { submitForm } from '../formConfig.js'
import { track } from '../utils/analytics.js'
import { setSectionStep } from '../utils/progress.js'
import { readProfile } from '../utils/profile.js'
import { readAnswer } from '../utils/chatStream.js'
import { sourceFor } from '../../data/chat-corpus.js'
import ChatVisual from '../components/ChatVisual.jsx'
import styles from './ChatPage.module.css'

// Example exchanges, shown under the input before the first question so an
// observer sees what the assistant is for. Content stays in English, like the
// lesson material (course content is never localised — only UI chrome).
//
// Written the way a real answer comes back: every claim is from the course or
// WA-Chain's research, and each source is a real passage looked up with
// sourceFor(document, block) — see data/chat-corpus.js for the numbering
// (documents 0–4 are Sections 1–5, then one per research topic).
const sample = (q, segments, sources) => ({
  q,
  answer: { segments, sources: sources.map((source, i) => ({ ...source, n: i + 1 })), searched: [], searching: '' },
})

const SAMPLES = [
  sample(
    'I mostly work with Western paper. Where should I start with washi?',
    [
      { type: 'text', parts: [{ text: 'That depends on what you need first. Two ways in:', refs: [] }] },
      {
        type: 'visual',
        refs: [],
        spec: {
          type: 'routes',
          routes: [
            {
              name: 'Choosing a repair paper',
              fit: 'You need to pick, and trust, a tissue soon',
              steps: [
                { title: 'Washi Is Not a Single Type of Paper', link: '#/watch/three-fibers', note: '16 min' },
                { title: 'Section 4: The Raw Materials of Washi', link: '#/lesson/section-4', note: 'text lesson, draft' },
              ],
            },
            {
              name: 'Why washi treatments are reversible',
              fit: 'You want the principles behind lining and its removal',
              steps: [
                { title: 'Section 1: Sōkō and Reversibility', link: '#/lesson/section-1', note: 'text lesson, draft' },
                { title: 'Section 3: Hydrogen Bonding', link: '#/lesson/section-3', note: 'text lesson, draft' },
              ],
            },
          ],
        },
      },
      { type: 'text', parts: [{ text: 'Which is closer to your work right now?', refs: [] }] },
    ],
    []
  ),
  sample(
    'Is gampi paper acidic?',
    [
      {
        type: 'text',
        parts: [
          {
            text: 'No. Measured values put gampi and mitsumata paper at pH 6.6–8.6, the same neutral-to-mildly-alkaline band as kōzo paper.',
            refs: [1],
          },
          { text: ' WA-Chain checked the claim that gampi paper is acidic and found no independent support for it.', refs: [2] },
        ],
      },
      {
        type: 'visual',
        refs: [1],
        spec: {
          type: 'ranges',
          title: 'Measured pH of washi',
          min: 5,
          max: 10,
          marker: { value: 7, label: 'neutral' },
          items: [
            { label: 'Kōzo paper', from: 6.3, to: 9.5 },
            { label: 'Gampi, mitsumata', from: 6.6, to: 8.6 },
          ],
        },
      },
    ],
    [sourceFor(3, 3), sourceFor(6, 1)]
  ),
]

const MAX_CHARS = 2000
const ENDPOINT = '/api/chat'
const CHAT_PREFILL_KEY = 'wa-chain-chat-prefill'
// Set by the home page's "Ask a person" card, so the chat page opens on the
// email route instead of the assistant.
const CHAT_MODE_KEY = 'wa-chain-chat-mode'

const ERROR_KEYS = {
  budget: 'chatErrorBudget',
  busy: 'chatErrorBusy',
  unconfigured: 'chatErrorUnavailable',
}

const external = { target: '_blank', rel: 'noopener noreferrer' }

function lastUserQuestion(turns) {
  for (let i = turns.length - 1; i >= 0; i -= 1) {
    if (turns[i].role === 'user') return turns[i].content
  }
  return ''
}

function hostOf(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return ''
  }
}

// Addresses the assistant writes — a web page, or a page on this site — are
// made clickable. Anything else stays text.
const LINK = /(https?:\/\/[^\s<>()（）「」、。]+|#\/(?:watch|lesson|course|glossary|washi-map|tour)(?:\/[\w-]+)?)/g

function Linked({ text }) {
  return text.split(LINK).map((piece, i) => {
    if (i % 2 === 0) return piece
    const href = piece.replace(/[.,;:]+$/, '')
    return (
      <span key={i}>
        <a className={styles.inlineLink} href={href} {...(href.startsWith('http') ? external : {})}>
          {href}
        </a>
        {piece.slice(href.length)}
      </span>
    )
  })
}

// Footnote markers go before any line break that ends the text, so "…9.5.[1]"
// stays on its line instead of opening the next paragraph.
function AnswerText({ parts }) {
  return parts.map((part, i) => {
    const body = part.text.replace(/\s+$/, '')
    const tail = part.text.slice(body.length)
    return (
      <span key={i}>
        <Linked text={body} />
        {part.refs.length > 0 && <sup className={styles.ref}>[{part.refs.join(', ')}]</sup>}
        {tail}
      </span>
    )
  })
}

// Three kinds of source, each labelled so the reader knows what stands behind
// a claim: the course itself, WA-Chain's own checked research, or a page from
// the open web that WA-Chain has not checked.
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
  const quote = (source) => (source.quote ? source.quote.slice(0, 280) : undefined)
  return (
    <div className={styles.sources}>
      <p className={styles.sourcesLabel}>{t('chatSources')}</p>
      <ol className={styles.sourceList}>
        {sources.map((source) => (
          <li key={source.n} value={source.n}>
            {source.kind === 'course' && (
              <>
                <span className={styles.kind}>{t('chatSourceCourse')}</span>
                <a href={`#/lesson/${source.sectionId}`} onClick={() => open(source)} title={quote(source)}>
                  Section {source.sectionNumber} · {source.stepHeading ?? source.sectionTitle}
                </a>
              </>
            )}
            {source.kind === 'research' && (
              <>
                <span className={`${styles.kind} ${styles.kindResearch}`}>{t('chatSourceResearch')}</span>
                <span title={quote(source)}>{source.factTitle}</span>
                {source.references?.length > 0 && (
                  <span className={styles.references}>
                    {' — '}
                    {source.references.map((ref, i) => (
                      <span key={i}>
                        {i > 0 && '; '}
                        {ref.url ? (
                          <a href={ref.url} {...external}>
                            {ref.label}
                          </a>
                        ) : (
                          ref.label
                        )}
                      </span>
                    ))}
                  </span>
                )}
              </>
            )}
            {source.kind === 'web' && (
              <>
                <span className={`${styles.kind} ${styles.kindWeb}`}>{t('chatSourceWeb')}</span>
                <a href={source.url} {...external} title={quote(source)}>
                  {source.title}
                </a>
                <span className={styles.host}> {hostOf(source.url)}</span>
              </>
            )}
          </li>
        ))}
      </ol>
    </div>
  )
}

// When a search ran but no page from it was cited, the pages it found are
// still listed, so the reader can follow them up.
function SearchedList({ pages }) {
  const { t } = useLanguage()
  if (!pages?.length) return null
  return (
    <div className={styles.sources}>
      <p className={styles.sourcesLabel}>{t('chatSearched')}</p>
      <ul className={styles.sourceList}>
        {pages.map((page) => (
          <li key={page.url}>
            <a href={page.url} {...external}>
              {page.title}
            </a>
            <span className={styles.host}> {hostOf(page.url)}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

function AnswerBody({ answer }) {
  const { t } = useLanguage()
  return (
    <>
      {answer.segments.map((segment, i) => {
        if (segment.type === 'text') return <AnswerText key={i} parts={segment.parts} />
        if (segment.type === 'visual') return <ChatVisual key={i} spec={segment.spec} refs={segment.refs} />
        return (
          <span key={i} className={styles.status}>
            {t('chatDrawing')}
          </span>
        )
      })}
      {answer.searching && (
        <span className={styles.status}>
          {t('chatSearching')}
          {answer.searching.trim() && ` — ${answer.searching.trim()}`}
        </span>
      )}
      <SourceList sources={answer.sources} />
      <SearchedList pages={answer.searched} />
    </>
  )
}

// "Ask a conservator" — the third product pillar.
//
// Two modes, chosen by probing /api/chat on load:
//   - With a backend (Cloudflare): the assistant answers from the course,
//     WA-Chain's research and, when needed, the web.
//   - Without one (GitHub Pages, local dev): the original Wizard of Oz — the
//     question is emailed to the team, who reply by hand.
// The human route stays available in both, because the assistant is built to
// refuse rather than guess, and a refusal needs somewhere to go.
function ChatPage() {
  const { t } = useLanguage()
  // { role, content, answer?, code?, streaming? } — content is the plain
  // text, which is what is replayed to the model as history.
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
      if (sessionStorage.getItem(CHAT_MODE_KEY) === 'team') {
        setEscalating(true)
        sessionStorage.removeItem(CHAT_MODE_KEY)
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
            // The five answers from the home page, if they were given: they
            // set how plainly the assistant explains. Never any free text.
            profile: readProfile(),
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
          if (!sofar.text && !sofar.searching) return
          // The bubble replaces the "looking through the material" notice as
          // soon as there is something to read, or a search to report.
          setPhase('streaming')
          setTurns([...history, { role: 'assistant', content: sofar.text, answer: sofar, streaming: true }])
        })

        if (!answer.text) {
          fail(code || 'error')
          return
        }
        const notice = truncated ? 'chatTruncated' : code ? 'chatInterrupted' : null
        setTurns([
          ...history,
          { role: 'assistant', content: answer.text, answer },
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
                  } ${turn.streaming ? styles.bubbleStreaming : ''} ${turn.answer ? styles.bubbleAnswer : ''}`}
                >
                  <span className={styles.who}>{mine ? t('chatYou') : t('chatAssistant')}</span>
                  {turn.answer ? <AnswerBody answer={turn.answer} /> : turn.content}
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
          {SAMPLES.map((example, i) => (
            <div key={`sample-${i}`} className={`${styles.exchange} ${styles.sampleExchange}`}>
              <div className={`${styles.bubble} ${styles.bubbleYou} ${styles.sampleBubble}`}>
                <span className={styles.who}>{t('chatYou')}</span>
                {example.q}
              </div>
              <div className={`${styles.bubble} ${styles.bubbleExpert} ${styles.sampleBubble} ${styles.bubbleAnswer}`}>
                <span className={styles.who}>{t('chatAssistant')}</span>
                <AnswerBody answer={example.answer} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default ChatPage
