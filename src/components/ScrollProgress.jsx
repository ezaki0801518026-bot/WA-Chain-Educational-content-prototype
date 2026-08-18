import { useEffect, useState } from 'react'
import styles from './ScrollProgress.module.css'

// How far down the page you are, drawn as a hairline across the very top
// of the window. Distinct from ReadingProgress, which reports position
// within a lesson's steps rather than scroll depth.
function ScrollProgress() {
  const [fraction, setFraction] = useState(0)
  const [scrollable, setScrollable] = useState(false)

  useEffect(() => {
    // Browsers already fire scroll at most once per frame, and React bails
    // out of a re-render when the value is unchanged, so measuring straight
    // from the handler is cheap — no extra rAF scheduling needed.
    const measure = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight
      // A page barely taller than the window has nothing worth reporting.
      if (max <= 40) {
        setScrollable(false)
        setFraction(0)
        return
      }
      setScrollable(true)
      setFraction(Math.min(1, Math.max(0, window.scrollY / max)))
    }

    measure()
    window.addEventListener('scroll', measure, { passive: true })
    window.addEventListener('resize', measure)

    // Tab switches and late-loading images change the page height without
    // any scroll happening.
    const observer = new ResizeObserver(measure)
    observer.observe(document.body)

    return () => {
      window.removeEventListener('scroll', measure)
      window.removeEventListener('resize', measure)
      observer.disconnect()
    }
  }, [])

  if (!scrollable) return null

  return (
    <div className={styles.rail} aria-hidden="true">
      <div className={styles.fill} style={{ transform: `scaleX(${fraction})` }} />
    </div>
  )
}

export default ScrollProgress
