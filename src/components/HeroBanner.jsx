import { useState } from 'react'
import styles from './HeroBanner.module.css'
import { asset } from '../utils/asset.js'

// Full-bleed (`size="large"`, course home) or contained (`size="small"`,
// section "door" on SummaryPage) photo banner with a duotone treatment
// (see DuotoneFilter.jsx) so any photo — regardless of its own colours —
// reads as part of the ink/paper palette. `image` comes straight from
// data/heroImages.json; `isPlaceholder` there marks it as a stand-in for a
// future professional shoot but has no visual effect here.
function HeroBanner({ image, eyebrow, title, subtitle, size = 'large' }) {
  const [loaded, setLoaded] = useState(false)
  if (!image) return null

  return (
    <div className={`${styles.hero} ${size === 'small' ? styles.small : styles.large}`}>
      <img
        className={`${styles.image} ${loaded ? styles.imageLoaded : ''}`}
        src={asset(image.src)}
        alt={image.alt}
        onLoad={() => setLoaded(true)}
        ref={(el) => {
          // Cached images can complete before onLoad is attached.
          if (el?.complete) setLoaded(true)
        }}
      />
      <div className={styles.scrim} aria-hidden="true" />
      {(eyebrow || title || subtitle) && (
        <div className={styles.content}>
          {eyebrow && <p className={styles.eyebrow}>{eyebrow}</p>}
          {title && <h1 className={styles.title}>{title}</h1>}
          {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
        </div>
      )}
    </div>
  )
}

export default HeroBanner
