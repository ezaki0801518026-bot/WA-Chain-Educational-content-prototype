import { useEffect, useRef, useState } from 'react'
import styles from './Reveal.module.css'

// Fades and lifts its children into place the first time they enter the
// viewport, giving pages a gentle sense of motion without any library.
//
// Uses a plain scroll-position check (reveal on mount if already in view,
// otherwise on scroll/resize) rather than IntersectionObserver: it is
// bulletproof — content can never get stuck invisible if an observer never
// fires — and behaves identically across environments. The CSS honours
// prefers-reduced-motion. `delay` (ms) staggers a row; `as` keeps correct
// semantics (e.g. as="section").
function Reveal({ children, as: Tag = 'div', delay = 0, className = '' }) {
  const ref = useRef(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    let done = false
    const check = () => {
      if (done) return
      // Reveal once the top edge has entered the viewport; it then stays
      // revealed even after the reader scrolls past, so a fast scroll never
      // leaves already-passed content stuck invisible.
      const rect = el.getBoundingClientRect()
      if (rect.top < window.innerHeight - 40) {
        done = true
        setVisible(true)
        window.removeEventListener('scroll', check)
        window.removeEventListener('resize', check)
      }
    }

    check()
    if (!done) {
      window.addEventListener('scroll', check, { passive: true })
      window.addEventListener('resize', check)
    }
    return () => {
      window.removeEventListener('scroll', check)
      window.removeEventListener('resize', check)
    }
  }, [])

  return (
    <Tag
      ref={ref}
      className={`${styles.reveal} ${visible ? styles.visible : ''} ${className}`.trim()}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
    >
      {children}
    </Tag>
  )
}

export default Reveal
