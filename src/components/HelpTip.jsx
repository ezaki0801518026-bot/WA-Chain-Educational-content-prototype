import { useEffect, useRef, useState } from 'react'
import styles from './HelpTip.module.css'

// A "?" the reader can press for the explanation that would otherwise sit on
// the page as a paragraph nobody asked for. The page stays short; the
// explanation is one press away.
//
// label is read by screen readers ("What this means"); children is the note.
function HelpTip({ label, children, align = 'left' }) {
  const [open, setOpen] = useState(false)
  const wrapRef = useRef(null)

  useEffect(() => {
    if (!open) return undefined
    const close = (event) => {
      if (!wrapRef.current?.contains(event.target)) setOpen(false)
    }
    const onKey = (event) => {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', close)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', close)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <span className={styles.wrap} ref={wrapRef}>
      <button
        type="button"
        className={styles.button}
        aria-label={label}
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        ?
      </button>
      {open && (
        <span className={`${styles.note} ${align === 'right' ? styles.noteRight : ''}`} role="note">
          {children}
        </span>
      )}
    </span>
  )
}

export default HelpTip
