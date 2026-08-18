import { useEffect, useState } from 'react'
import styles from './IntroSplash.module.css'
import { asset } from '../utils/asset.js'

// Full-screen opening curtain: the seal mark alone on paper, which lifts
// away once the first paint has settled. Shown once per browsing session
// (not on every route change) and skipped outright when the visitor has
// asked for reduced motion or has already seen it.
const SEEN_KEY = 'wa-chain:intro-seen'

const HOLD_MS = 900
const FADE_MS = 1100

function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

function IntroSplash() {
  const [phase, setPhase] = useState(() => {
    if (prefersReducedMotion()) return 'done'
    try {
      if (sessionStorage.getItem(SEEN_KEY)) return 'done'
    } catch {
      // Private mode / storage disabled — show it, just don't remember.
    }
    return 'holding'
  })

  // One timer per phase. Chaining them matters: a single effect that set
  // both would have its cleanup run the moment the first timer flipped the
  // phase, cancelling the second before it ever fired.
  useEffect(() => {
    if (phase === 'holding') {
      try {
        sessionStorage.setItem(SEEN_KEY, '1')
      } catch {
        /* non-fatal */
      }
      const id = setTimeout(() => setPhase('leaving'), HOLD_MS)
      return () => clearTimeout(id)
    }
    if (phase === 'leaving') {
      const id = setTimeout(() => setPhase('done'), FADE_MS)
      return () => clearTimeout(id)
    }
    return undefined
  }, [phase])

  // Keep the page still underneath while the curtain is up.
  useEffect(() => {
    if (phase === 'done') return undefined
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previous
    }
  }, [phase])

  if (phase === 'done') return null

  return (
    <div
      className={`${styles.splash} ${phase === 'leaving' ? styles.leaving : ''}`}
      aria-hidden="true"
    >
      <div className={styles.inner}>
        <img className={styles.mark} src={asset('/images/hero/wa-chain-logo-mark.png')} alt="" />
        <span className={styles.word}>WA-Chain</span>
        <span className={styles.rule} />
      </div>
    </div>
  )
}

export default IntroSplash
