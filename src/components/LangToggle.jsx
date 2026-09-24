import { useLanguage } from '../i18n/LanguageContext.jsx'
import styles from './LangToggle.module.css'

// The language switch: two segments, each a small flag and a three-letter
// label. The flag is decoration; the accessible name stays the language's
// own name, and the pressed state carries the selection. Inline SVG so no
// image request is made and the flags scale with the text.
function UnionFlag() {
  return (
    <svg className={styles.flag} viewBox="0 0 60 40" aria-hidden="true" focusable="false">
      <rect width="60" height="40" fill="#012169" />
      <path d="M0 0 60 40M60 0 0 40" stroke="#fff" strokeWidth="8" />
      <path d="M0 0 60 40M60 0 0 40" stroke="#c8102e" strokeWidth="3" />
      <path d="M30 0v40M0 20h60" stroke="#fff" strokeWidth="12" />
      <path d="M30 0v40M0 20h60" stroke="#c8102e" strokeWidth="7" />
    </svg>
  )
}

function JapanFlag() {
  return (
    <svg className={styles.flag} viewBox="0 0 60 40" aria-hidden="true" focusable="false">
      <rect width="60" height="40" fill="#fff" />
      <circle cx="30" cy="20" r="12" fill="#bc002d" />
    </svg>
  )
}

const OPTIONS = [
  { code: 'en', label: 'ENG', name: 'English', Flag: UnionFlag },
  { code: 'ja', label: 'JPN', name: '日本語', Flag: JapanFlag },
]

function LangToggle() {
  const { lang, setLang } = useLanguage()
  return (
    <span className={styles.toggle} role="group" aria-label="Language">
      {OPTIONS.map(({ code, label, name, Flag }) => (
        <button
          key={code}
          type="button"
          className={styles.button}
          aria-pressed={lang === code}
          aria-label={name}
          lang={code}
          onClick={() => setLang(code)}
        >
          <Flag />
          <span className={styles.label}>{label}</span>
        </button>
      ))}
    </span>
  )
}

export default LangToggle
