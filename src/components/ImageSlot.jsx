import { useState } from 'react'
import { useLanguage } from '../i18n/LanguageContext.jsx'
import styles from './ImageSlot.module.css'
import { asset } from '../utils/asset.js'

// Renders an explicit placeholder box until a real `src` is supplied on
// the imageSlot object — the data shape allows a photo to be inserted
// later without changing this component. When `isPlaceholder` is true on a
// slot that already has a src (a stand-in image dropped in ahead of the
// final photograph), a small "PLACEHOLDER" badge is overlaid so it stays
// obviously distinguishable from a final asset.
function ImageSlot({ imageSlot }) {
  const { t } = useLanguage()
  const [loaded, setLoaded] = useState(false)

  if (!imageSlot) return null

  if (imageSlot.src) {
    return (
      <figure className={styles.figure}>
        <div className={styles.imageWrapper}>
          <img
            className={`${styles.image} ${loaded ? styles.imageLoaded : ''}`}
            src={asset(imageSlot.src)}
            alt={imageSlot.label}
            loading="lazy"
            onLoad={() => setLoaded(true)}
            ref={(el) => {
              // Cached images can complete before onLoad is attached.
              if (el?.complete) setLoaded(true)
            }}
          />
          {imageSlot.isPlaceholder && <span className={styles.placeholderBadge}>PLACEHOLDER</span>}
        </div>
        <figcaption className={styles.caption}>{imageSlot.label}</figcaption>
      </figure>
    )
  }

  return (
    <div className={styles.placeholder} role="img" aria-label={`${t('photoComingSoon')}: ${imageSlot.description}`}>
      <p className={styles.placeholderText}>
        {t('photoComingSoon')} — {imageSlot.description}
      </p>
    </div>
  )
}

export default ImageSlot
