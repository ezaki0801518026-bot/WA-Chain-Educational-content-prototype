import { useEffect, useRef, useState } from 'react'
import { useLanguage } from '../i18n/LanguageContext.jsx'
import styles from './HomeShowcase.module.css'
import { asset } from '../utils/asset.js'

const img = (name) => encodeURI(`/images/hero/${name}`)

// Top-level destinations as large photo cards — an English display title
// with a localized subtitle, in a horizontally scrolling band where the
// next card peeks in from the edge (the JINS Holdings pattern).
const CARDS = [
  {
    id: 'course',
    title: 'The Course',
    subKey: 'showcaseCourseSub',
    route: '/course',
    image: img('楮を水につけているきれいな写真.JPG'),
    alt: 'Kōzo bark soaking in clear water',
  },
  {
    id: 'map',
    title: 'Washi Map',
    subKey: 'showcaseMapSub',
    route: '/washi-map',
    image: img('島根安部記念館の和紙.jpg'),
    alt: 'Racks of colourful washi at the Abe Eishirō Memorial Museum',
  },
  {
    id: 'about',
    title: 'About WA-Chain',
    subKey: 'showcaseAboutSub',
    route: '/about',
    image: img('メンバーが和紙を漉く様子.jpg'),
    alt: 'WA-Chain members forming washi sheets by hand',
  },
  {
    id: 'news',
    title: 'News',
    subKey: 'showcaseNewsSub',
    route: '/news',
    image: img('ノルウェーの授業でピッチする様子.jpg'),
    alt: 'WA-Chain members pitching in Norway',
  },
  {
    id: 'tour',
    title: 'Study Tour',
    subKey: 'showcaseTourSub',
    route: '/tour',
    image: img('紙の博物館.jpg'),
    alt: 'The sign of the Ino-chō Paper Museum against a blue sky',
  },
  {
    id: 'pricing',
    title: 'Pricing',
    subKey: 'showcasePricingSub',
    route: '/pricing',
    image: img('和紙の見本帳.jpg'),
    alt: 'Leafing through a numbered washi sample book',
  },
]

function HomeShowcase({ navigate }) {
  const { t } = useLanguage()
  const scrollerRef = useRef(null)
  const [atStart, setAtStart] = useState(true)
  const [atEnd, setAtEnd] = useState(false)
  const [thumb, setThumb] = useState({ left: 0, width: 100 })

  useEffect(() => {
    const el = scrollerRef.current
    if (!el) return
    const measure = () => {
      const max = el.scrollWidth - el.clientWidth
      setAtStart(el.scrollLeft <= 4)
      setAtEnd(el.scrollLeft >= max - 4)
      setThumb({
        left: (el.scrollLeft / el.scrollWidth) * 100,
        width: (el.clientWidth / el.scrollWidth) * 100,
      })
    }
    measure()
    // Layout can settle after mount (fonts, images, scrollbars) — measure
    // again on the next frame and once more shortly after.
    const raf = requestAnimationFrame(measure)
    const timer = window.setTimeout(measure, 350)
    el.addEventListener('scroll', measure, { passive: true })
    window.addEventListener('resize', measure)
    return () => {
      cancelAnimationFrame(raf)
      window.clearTimeout(timer)
      el.removeEventListener('scroll', measure)
      window.removeEventListener('resize', measure)
    }
  }, [])

  const scrollByCard = (dir) => {
    const el = scrollerRef.current
    if (!el) return
    const card = el.querySelector(`.${styles.card}`)
    const amount = card ? card.getBoundingClientRect().width + 20 : el.clientWidth * 0.8
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    el.scrollBy({ left: dir * amount, behavior: reduced ? 'auto' : 'smooth' })
  }

  const open = (card) => navigate(card.route)

  return (
    <section className={styles.showcase} aria-label={t('showcaseLabel')}>
      <div ref={scrollerRef} className={styles.scroller}>
        {CARDS.map((card) => (
          <button key={card.id} type="button" className={styles.card} onClick={() => open(card)}>
            <img className={styles.cardImg} src={asset(card.image)} alt={card.alt} loading="lazy" />
            <span className={styles.scrim} aria-hidden="true" />
            <span className={styles.cardText}>
              <span className={styles.cardTitle}>{card.title}</span>
              <span className={styles.cardSub}>{t(card.subKey)}</span>
            </span>
          </button>
        ))}
      </div>

      <div className={styles.controls}>
        <button
          type="button"
          className={styles.arrow}
          onClick={() => scrollByCard(-1)}
          disabled={atStart}
          aria-label={t('showcasePrev')}
        >
          <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M10 3 5 8l5 5" />
          </svg>
        </button>
        <button
          type="button"
          className={styles.arrow}
          onClick={() => scrollByCard(1)}
          disabled={atEnd}
          aria-label={t('showcaseNext')}
        >
          <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="m6 3 5 5-5 5" />
          </svg>
        </button>
        <div className={styles.track} aria-hidden="true">
          <div className={styles.thumb} style={{ left: `${thumb.left}%`, width: `${thumb.width}%` }} />
        </div>
      </div>
    </section>
  )
}

export default HomeShowcase
