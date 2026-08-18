import { useRef, useState } from 'react'
import { useLanguage } from '../i18n/LanguageContext.jsx'
import styles from './AudioButton.module.css'

// Returns null entirely when audioSrc is not set — the element must not
// exist in the DOM, not merely be visually hidden.
function AudioButton({ audioSrc }) {
  const { t } = useLanguage()
  const audioRef = useRef(null)
  const [playing, setPlaying] = useState(false)

  if (!audioSrc) return null

  const toggle = () => {
    if (!audioRef.current) return
    if (playing) {
      audioRef.current.pause()
    } else {
      audioRef.current.play()
    }
  }

  return (
    <div className={styles.wrapper}>
      <audio
        ref={audioRef}
        src={audioSrc}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => setPlaying(false)}
      />
      <button type="button" className={styles.button} onClick={toggle}>
        {playing ? t('pauseAudio') : t('playAudio')}
      </button>
    </div>
  )
}

export default AudioButton
