import { useEffect, useId, useRef, useState } from 'react'
import styles from './HelpTip.module.css'

// A "?" the reader can press for the explanation that would otherwise sit on
// the page as a paragraph nobody asked for. The page stays short; the
// explanation is one press away.
//
// label is read by screen readers ("What this means"); children is the note.
// The note is a disclosure: the button reports expanded/collapsed and owns
// the note through aria-controls, and Escape or a press outside closes it.
function HelpTip({ label, children, align = 'left' }) {
  const [open, setOpen] = useState(false)
  const wrapRef = useRef(null)
  const noteId = useId()

  useEffect(() => {
    if (!open) return undefined
    const close = (event) => {
      if (!wrapRef.current?.contains(event.target)) setOpen(false)
    }
    const onKey = (event) => {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('pointerdown', close)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', close)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <span className={styles.wrap} ref={wrapRef}>
      <button
        type="button"
        className={`${styles.button} ${open ? styles.buttonOpen : ''}`}
        aria-label={label}
        aria-expanded={open}
        aria-controls={noteId}
        onClick={() => setOpen((value) => !value)}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M9.5 9.2a2.6 2.6 0 0 1 5.1.6c0 1.8-2.6 2.2-2.6 4.2" />
          <circle cx="12" cy="18" r="0.6" fill="currentColor" />
        </svg>
      </button>
      {open && (
        <span id={noteId} className={`${styles.note} ${align === 'right' ? styles.noteRight : ''}`} role="note">
          {children}
        </span>
      )}
    </span>
  )
}

export default HelpTip
