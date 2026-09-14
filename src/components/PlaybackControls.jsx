import { useCallback, useEffect, useState } from 'react'
import { useLanguage } from '../i18n/LanguageContext.jsx'
import styles from './PlaybackControls.module.css'

const RATES = [0.75, 1, 1.25, 1.5, 1.75, 2]
const SKIP_SECONDS = 10
const RATE_KEY = 'wa-chain-playback-rate'

function readRate() {
  try {
    const saved = Number(localStorage.getItem(RATE_KEY))
    return RATES.includes(saved) ? saved : 1
  } catch {
    return 1
  }
}

function writeRate(rate) {
  try {
    localStorage.setItem(RATE_KEY, String(rate))
  } catch {
    /* private mode: the speed simply does not carry over */
  }
}

const formatRate = (rate) => `${rate}×`

// Speed and skip controls for a <video>, under the browser's own controls
// rather than instead of them: scrubbing, volume, fullscreen and captions are
// already done well natively, and rebuilding them would only be worse. What
// the native bar lacks is a visible speed control (Chrome hides it behind a
// menu, and every browser puts it somewhere different) and any way to jump
// back a few seconds — which is exactly what someone taking notes on a
// fourteen-minute lecture reaches for.
//
// Keyboard shortcuts are on the window, so they keep working in fullscreen
// where this toolbar is out of sight. Pass arrowKeys={false} on a page that
// already uses the arrow keys to move between pages.
function PlaybackControls({ videoRef, arrowKeys = true }) {
  const { t } = useLanguage()
  const [rate, setRate] = useState(readRate)

  const applyRate = useCallback(
    (next) => {
      const video = videoRef.current
      if (!video) return
      // Changing the source resets playbackRate to defaultPlaybackRate, so
      // set both or a new lecture would quietly drop back to 1×.
      video.defaultPlaybackRate = next
      video.playbackRate = next
    },
    [videoRef]
  )

  // Apply the remembered speed, and follow changes made from the browser's
  // own menu so the toolbar never disagrees with what is playing.
  useEffect(() => {
    const video = videoRef.current
    if (!video) return undefined
    applyRate(rate)
    const onLoaded = () => applyRate(readRate())
    const onRateChange = () => {
      if (RATES.includes(video.playbackRate)) {
        setRate(video.playbackRate)
        writeRate(video.playbackRate)
      }
    }
    video.addEventListener('loadedmetadata', onLoaded)
    video.addEventListener('ratechange', onRateChange)
    return () => {
      video.removeEventListener('loadedmetadata', onLoaded)
      video.removeEventListener('ratechange', onRateChange)
    }
    // rate is read once on mount; later changes arrive through ratechange.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [videoRef, applyRate])

  const choose = useCallback(
    (next) => {
      setRate(next)
      writeRate(next)
      applyRate(next)
    },
    [applyRate]
  )

  const skip = useCallback(
    (seconds) => {
      const video = videoRef.current
      if (!video) return
      const end = Number.isFinite(video.duration) ? video.duration : Infinity
      video.currentTime = Math.min(Math.max(video.currentTime + seconds, 0), end)
    },
    [videoRef]
  )

  const step = useCallback(
    (direction) => {
      const index = RATES.indexOf(rate)
      const next = RATES[Math.min(Math.max(index + direction, 0), RATES.length - 1)]
      if (next !== rate) choose(next)
    },
    [rate, choose]
  )

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.metaKey || event.ctrlKey || event.altKey) return
      const target = event.target
      const tag = target?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || target?.isContentEditable) return
      const video = videoRef.current
      if (!video) return

      let handled = true
      switch (event.key) {
        case 'j':
        case 'J':
          skip(-SKIP_SECONDS)
          break
        case 'l':
        case 'L':
          skip(SKIP_SECONDS)
          break
        case 'k':
        case 'K':
          if (video.paused) video.play()
          else video.pause()
          break
        case '<':
          step(-1)
          break
        case '>':
          step(1)
          break
        case 'ArrowLeft':
          if (!arrowKeys) return
          skip(-SKIP_SECONDS)
          break
        case 'ArrowRight':
          if (!arrowKeys) return
          skip(SKIP_SECONDS)
          break
        default:
          handled = false
      }
      if (!handled) return
      event.preventDefault()
      // When the video element itself has focus, the browser's media controls
      // run their own 5-second arrow seek at the target, before a bubbling
      // listener ever sees the key — preventDefault there came too late and
      // the two seeks stacked (+16 s measured, not +10). Listening in the
      // capture phase and stopping the event here means it never reaches them.
      if (tag === 'VIDEO') event.stopPropagation()
    }
    window.addEventListener('keydown', onKeyDown, true)
    return () => window.removeEventListener('keydown', onKeyDown, true)
  }, [videoRef, skip, step, arrowKeys])

  return (
    <div className={styles.bar}>
      <div className={styles.skips}>
        <button
          type="button"
          className={styles.skip}
          onClick={() => skip(-SKIP_SECONDS)}
          aria-label={t('playbackSkipBack')}
          title={t('playbackSkipBack')}
        >
          <svg viewBox="0 0 20 20" aria-hidden="true" className={styles.icon}>
            <path d="M4 10a6 6 0 1 0 1.8-4.3" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            <path d="M3.5 3v3.4h3.4" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span>{SKIP_SECONDS}</span>
        </button>
        <button
          type="button"
          className={styles.skip}
          onClick={() => skip(SKIP_SECONDS)}
          aria-label={t('playbackSkipForward')}
          title={t('playbackSkipForward')}
        >
          <span>{SKIP_SECONDS}</span>
          <svg viewBox="0 0 20 20" aria-hidden="true" className={styles.icon}>
            <path d="M16 10a6 6 0 1 1-1.8-4.3" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            <path d="M16.5 3v3.4h-3.4" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>

      <div className={styles.rates} role="group" aria-label={t('playbackSpeed')}>
        <span className={styles.rateLabel} aria-hidden="true">
          {t('playbackSpeed')}
        </span>
        {RATES.map((value) => (
          <button
            key={value}
            type="button"
            className={styles.rate}
            aria-pressed={rate === value}
            onClick={() => choose(value)}
          >
            {formatRate(value)}
          </button>
        ))}
      </div>

      <p className={styles.hint}>{arrowKeys ? t('playbackKeysHint') : t('playbackKeysHintNoArrows')}</p>
    </div>
  )
}

export default PlaybackControls
