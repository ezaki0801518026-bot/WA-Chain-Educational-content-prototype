import { useState } from 'react'
import glossary from '../../data/glossary.json'
import { useLanguage } from '../i18n/LanguageContext.jsx'
import styles from './GlossaryText.module.css'

// Longest terms first, so multi-word entries win over any shorter term
// they happen to contain.
const TERMS = [...glossary.terms].sort((a, b) => b.term.length - a.term.length)
const BY_LOWER = new Map(TERMS.map((term) => [term.term.toLowerCase(), term]))

// \b is ASCII-only, so it fails after macron vowels ("Sōkō" ends in a
// "non-word" character). Use explicit Latin-letter lookarounds instead.
const LATIN = 'A-Za-z\\u00C0-\\u024F'
const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
const TERM_RE = new RegExp(
  `(?<![${LATIN}])(${TERMS.map((t) => escapeRe(t.term)).join('|')})(?![${LATIN}])`,
  'gi',
)

// Renders lesson prose with glossary terms marked: dotted underline, and a
// definition tooltip on hover or keyboard focus (focus also serves touch).
// Only the first occurrence of each term per paragraph is marked, so
// definition-dense paragraphs don't turn into a field of underlines.
function GlossaryText({ text }) {
  const { t } = useLanguage()
  // CSS :hover/:focus-within handles the common case; this state mirrors it
  // so the tooltip also opens reliably from taps and programmatic focus.
  const [openId, setOpenId] = useState(null)
  const parts = []
  const seen = new Set()
  let last = 0
  let match

  TERM_RE.lastIndex = 0
  while ((match = TERM_RE.exec(text)) !== null) {
    const entry = BY_LOWER.get(match[1].toLowerCase())
    if (!entry || seen.has(entry.id)) continue
    seen.add(entry.id)
    if (match.index > last) parts.push(text.slice(last, match.index))
    const closeIfCurrent = () => setOpenId((v) => (v === entry.id ? null : v))
    parts.push(
      <span
        key={`${entry.id}-${match.index}`}
        className={`${styles.wrap} ${openId === entry.id ? styles.wrapOpen : ''}`}
        onMouseEnter={() => setOpenId(entry.id)}
        onMouseLeave={closeIfCurrent}
        onFocus={() => setOpenId(entry.id)}
        onBlur={closeIfCurrent}
      >
        <button type="button" className={styles.term}>
          {match[1]}
        </button>
        <span className={styles.tip} role="tooltip">
          <span className={styles.tipTerm}>
            {entry.term}
            {entry.native && <span className={styles.tipNative}> {entry.native}</span>}
          </span>
          <span className={styles.tipDef}>{entry.definition}</span>
          <button
            type="button"
            className={styles.tipLink}
            onClick={() => {
              window.location.hash = '/glossary'
            }}
          >
            {t('glossaryOpenLink')}
          </button>
        </span>
      </span>,
    )
    last = match.index + match[1].length
  }
  if (parts.length === 0) return text
  if (last < text.length) parts.push(text.slice(last))
  return parts
}

export default GlossaryText
