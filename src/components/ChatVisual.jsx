import { useState } from 'react'
import { useLanguage } from '../i18n/LanguageContext.jsx'
import styles from './ChatVisual.module.css'

// Draws the small figures the assistant can put in a reply. The model writes
// <visual>{json}</visual>; src/utils/chatStream.js pulls the JSON out, and
// this turns it into markup. Four kinds, all plain HTML and CSS so they follow
// the site's tokens and both themes:
//
//   table   {title, columns: [..], rows: [[..], ..]}
//   bars    {title, unit, items: [{label, value, note?}]}
//   ranges  {title, unit, min?, max?, marker?: {value, label}, items: [{label, from, to}]}
//   routes  {title, routes: [{name, fit, steps: [{title, link?, note?}]}]}
//   quiz    {title, questions: [{q, options: [..], answer: index, explain}]}
//
// A quiz is the one interactive kind: the reader picks an option (or just
// asks to see the answer) and the answer and its explanation are revealed.
// No score and no "wrong" — the same quiet tone as the questions after each
// lecture (CourseReflection).
//
// Everything is treated as untrusted: text is rendered as text, numbers are
// checked, lists are capped, and a link is only followed if it is a page on
// this site (#/…) or an https address. Anything malformed renders nothing.

const str = (value) => (typeof value === 'string' || typeof value === 'number' ? String(value) : '')
const num = (value) => (typeof value === 'number' && Number.isFinite(value) ? value : null)

function safeLink(link) {
  if (typeof link !== 'string') return null
  if (/^#\/[a-z0-9\-/]*$/i.test(link)) return { href: link, external: false }
  if (/^https:\/\/[^\s"'<>]+$/i.test(link)) return { href: link, external: true }
  return null
}

function Refs({ refs }) {
  if (!refs?.length) return null
  return <sup className={styles.refs}>[{refs.join(', ')}]</sup>
}

function Table({ spec }) {
  const columns = Array.isArray(spec.columns) ? spec.columns.slice(0, 6).map(str) : []
  const rows = Array.isArray(spec.rows) ? spec.rows.filter(Array.isArray).slice(0, 14) : []
  if (!columns.length || !rows.length) return null
  return (
    <div className={styles.tableWrap}>
      <table className={styles.table}>
        <thead>
          <tr>
            {columns.map((c, i) => (
              <th key={i} scope="col">
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, r) => (
            <tr key={r}>
              {columns.map((_, c) =>
                c === 0 ? (
                  <th key={c} scope="row">
                    {str(row[c])}
                  </th>
                ) : (
                  <td key={c}>{str(row[c])}</td>
                )
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function Bars({ spec }) {
  const items = (Array.isArray(spec.items) ? spec.items : [])
    .map((item) => ({ label: str(item?.label), value: num(item?.value), note: str(item?.note) }))
    .filter((item) => item.label && item.value !== null && item.value >= 0)
    .slice(0, 12)
  if (!items.length) return null
  const max = Math.max(...items.map((item) => item.value)) || 1
  const unit = str(spec.unit)
  return (
    <ul className={styles.bars}>
      {items.map((item, i) => (
        <li key={i} className={styles.barRow}>
          <span className={styles.barLabel}>{item.label}</span>
          <span className={styles.barTrack} aria-hidden="true">
            <span className={styles.barFill} style={{ width: `${(item.value / max) * 100}%` }} />
          </span>
          <span className={styles.barValue}>
            {item.value}
            {unit && ` ${unit}`}
            {item.note && <span className={styles.note}> {item.note}</span>}
          </span>
        </li>
      ))}
    </ul>
  )
}

function Ranges({ spec }) {
  const items = (Array.isArray(spec.items) ? spec.items : [])
    .map((item) => ({ label: str(item?.label), from: num(item?.from), to: num(item?.to) }))
    .filter((item) => item.label && item.from !== null && item.to !== null && item.to >= item.from)
    .slice(0, 10)
  if (!items.length) return null
  const marker = num(spec.marker?.value)
  const values = items.flatMap((item) => [item.from, item.to]).concat(marker ?? [])
  let min = num(spec.min) ?? Math.min(...values)
  let max = num(spec.max) ?? Math.max(...values)
  if (max <= min) {
    min -= 1
    max += 1
  }
  const at = (value) => `${((Math.min(Math.max(value, min), max) - min) / (max - min)) * 100}%`
  const unit = str(spec.unit)
  return (
    <div className={styles.ranges}>
      {items.map((item, i) => (
        <div key={i} className={styles.rangeRow}>
          <span className={styles.barLabel}>{item.label}</span>
          <span className={styles.rangeTrack} aria-hidden="true">
            {marker !== null && <span className={styles.marker} style={{ left: at(marker) }} />}
            <span
              className={styles.rangeFill}
              style={{ left: at(item.from), width: `calc(${at(item.to)} - ${at(item.from)})` }}
            />
          </span>
          <span className={styles.barValue}>
            {item.from}–{item.to}
            {unit && ` ${unit}`}
          </span>
        </div>
      ))}
      <div className={styles.axisRow} aria-hidden="true">
        <span />
        <span className={styles.axis}>
          <span>{min}</span>
          {marker !== null && (
            <span className={styles.axisMarker} style={{ left: at(marker) }}>
              {marker}
              {spec.marker?.label ? ` ${str(spec.marker.label)}` : ''}
            </span>
          )}
          <span>{max}</span>
        </span>
        <span />
      </div>
    </div>
  )
}

function Routes({ spec }) {
  const routes = (Array.isArray(spec.routes) ? spec.routes : []).slice(0, 3)
  if (!routes.length) return null
  return (
    <div className={styles.routes}>
      {routes.map((route, r) => {
        const steps = (Array.isArray(route?.steps) ? route.steps : []).slice(0, 6)
        return (
          <section key={r} className={styles.route}>
            <p className={styles.routeName}>{str(route?.name)}</p>
            {route?.fit && <p className={styles.routeFit}>{str(route.fit)}</p>}
            <ol className={styles.routeSteps}>
              {steps.map((step, s) => {
                const link = safeLink(step?.link)
                const title = str(step?.title)
                return (
                  <li key={s}>
                    {link ? (
                      <a href={link.href} {...(link.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>
                        {title}
                      </a>
                    ) : (
                      title
                    )}
                    {step?.note && <span className={styles.note}> — {str(step.note)}</span>}
                  </li>
                )
              })}
            </ol>
          </section>
        )
      })}
    </div>
  )
}

function validQuestions(spec) {
  return (Array.isArray(spec.questions) ? spec.questions : [])
    .map((item) => ({
      q: str(item?.q),
      options: (Array.isArray(item?.options) ? item.options : []).map(str).filter(Boolean).slice(0, 5),
      answer: Number.isInteger(item?.answer) ? item.answer : -1,
      explain: str(item?.explain),
    }))
    .filter((item) => item.q && item.options.length >= 2 && item.answer >= 0 && item.answer < item.options.length)
    .slice(0, 6)
}

function QuizQuestion({ item, n }) {
  const { t } = useLanguage()
  const [picked, setPicked] = useState(null)
  const [shown, setShown] = useState(false)
  const open = shown || picked !== null
  const letter = (i) => String.fromCharCode(65 + i)
  return (
    <li className={styles.quizItem}>
      <p className={styles.quizQ}>
        <span className={styles.quizN}>Q{n}.</span> {item.q}
      </p>
      <ul className={styles.quizOptions}>
        {item.options.map((option, i) => {
          const state = open ? (i === item.answer ? styles.quizRight : i === picked ? styles.quizPicked : '') : ''
          return (
            <li key={i}>
              <button
                type="button"
                className={`${styles.quizOption} ${state}`}
                onClick={() => setPicked(i)}
                disabled={open}
                aria-pressed={picked === i}
              >
                <span className={styles.quizLetter}>{open && i === item.answer ? '✓' : letter(i)}</span>
                {option}
              </button>
            </li>
          )
        })}
      </ul>
      {open ? (
        <p className={styles.quizExplain}>
          <strong>
            {t('chatQuizAnswer')}: {letter(item.answer)}
          </strong>
          {item.explain && ` — ${item.explain}`}
        </p>
      ) : (
        <button type="button" className={styles.quizShow} onClick={() => setShown(true)}>
          {t('chatQuizShow')}
        </button>
      )}
    </li>
  )
}

function Quiz({ spec }) {
  const questions = validQuestions(spec)
  return (
    <ol className={styles.quiz}>
      {questions.map((item, i) => (
        <QuizQuestion key={i} item={item} n={i + 1} />
      ))}
    </ol>
  )
}

const KINDS = { table: Table, bars: Bars, ranges: Ranges, routes: Routes }

function ChatVisual({ spec, refs }) {
  // The quiz holds state, so it renders as a component; the others are plain
  // functions of the spec and are called directly so an empty one draws nothing.
  const isQuiz = spec?.type === 'quiz'
  const Kind = KINDS[spec?.type]
  if (!isQuiz && !Kind) return null
  if (isQuiz && validQuestions(spec).length === 0) return null
  const body = isQuiz ? <Quiz spec={spec} /> : Kind({ spec })
  if (!body) return null
  return (
    <figure className={styles.figure}>
      {spec.title && (
        <figcaption className={styles.title}>
          {str(spec.title)}
          <Refs refs={refs} />
        </figcaption>
      )}
      {body}
    </figure>
  )
}

export default ChatVisual
