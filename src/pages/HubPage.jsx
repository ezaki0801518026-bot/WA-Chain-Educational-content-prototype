import coursesData from '../../data/courses.json'
import news from '../../data/news.json'
import { useLanguage } from '../i18n/LanguageContext.jsx'
import Reveal from '../components/Reveal.jsx'
import styles from './HubPage.module.css'
import { asset } from '../utils/asset.js'

// Someone looking closely at a sheet they have just made, with the rest of
// the group still working behind them. The course page keeps the rare-books
// hero; the home page should show learning, not the archive.
const HERO_IMAGE = '/images/hero/和紙漉く様子小松in島根.jpg'

// The four things this prototype actually offers, in the order a visitor
// meets them: learn, then look up where paper comes from, then visit, then
// see what it costs. Each tile is a door — the page's only job is to make
// the shape of the service legible in one screen.
const CORE = [
  { id: 'course', route: '/course', image: '/images/hero/ノルウェーで学ぶ様子.jpg' },
  { id: 'map', route: '/washi-map', image: '/images/hero/島根安部記念館の和紙.jpg' },
  { id: 'tour', route: '/tour', image: '/images/hero/和紙漉き体験.jpg' },
  { id: 'pricing', route: '/pricing', image: '/images/hero/和紙の見本帳.jpg' },
]

function Arrow() {
  return (
    <svg className={styles.arrow} viewBox="0 0 22 10" aria-hidden="true">
      <path d="M0 5h20M16 1l4 4-4 4" fill="none" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  )
}

function HubPage({ navigate }) {
  const { t, lang } = useLanguage()
  const pick = (field) => (field && (field[lang] ?? field.en)) || ''
  const latest = news.posts.slice(0, 2)

  return (
    <div className={styles.page}>
      {/* Hero: says what this is before anything else. */}
      <section className={styles.hero}>
        <img className={styles.heroImg} src={asset(HERO_IMAGE)} alt="" aria-hidden="true" />
        <div className={styles.heroVeil} />
        <div className={styles.heroInner}>
          <p className={styles.heroEyebrow}>{t('hubEyebrow')}</p>
          <h1 className={styles.heroTitle}>{t('hubTitle')}</h1>
          <p className={styles.heroLede}>{t('hubLede')}</p>
          <div className={styles.heroActions}>
            <button type="button" className={styles.primaryCta} onClick={() => navigate('/course')}>
              {t('hubStartCta')}
            </button>
            <button type="button" className={styles.secondaryCta} onClick={() => navigate('/about')}>
              {t('hubAboutCta')}
            </button>
          </div>
        </div>
      </section>

      {/* What you can do here — the four core features. */}
      <Reveal as="section" className={styles.band}>
        <div className={styles.bandHead}>
          <h2 className={styles.bandTitle}>{t('hubExploreTitle')}</h2>
          <p className={styles.bandSub}>{t('hubExploreSub')}</p>
        </div>
        <div className={styles.grid}>
          {CORE.map((item, i) => (
            <button
              key={item.id}
              type="button"
              className={styles.tile}
              onClick={() => navigate(item.route)}
            >
              <span className={styles.tileImgWrap}>
                <img className={styles.tileImg} src={asset(item.image)} alt="" aria-hidden="true" loading="lazy" />
              </span>
              <span className={styles.tileBody}>
                <span className={styles.tileNum}>{String(i + 1).padStart(2, '0')}</span>
                <span className={styles.tileTitle}>{t(`hub_${item.id}_title`)}</span>
                <span className={styles.tileDesc}>{t(`hub_${item.id}_desc`)}</span>
                <span className={styles.tileCta}>
                  {t(`hub_${item.id}_cta`)} <Arrow />
                </span>
              </span>
            </button>
          ))}
        </div>
      </Reveal>

      {/* The lectures themselves, so a visitor can start without a detour. */}
      <Reveal as="section" className={styles.band}>
        <div className={styles.bandHead}>
          <h2 className={styles.bandTitle}>{t('hubWatchTitle')}</h2>
          <p className={styles.bandSub}>{t('hubWatchSub')}</p>
        </div>
        <div className={styles.watchRow}>
          {coursesData.courses.map((course) => (
            <button
              key={course.id}
              type="button"
              className={styles.watchCard}
              onClick={() => navigate(`/watch/${course.id}`)}
            >
              <span className={styles.watchThumb}>
                <img src={asset(course.poster)} alt="" aria-hidden="true" loading="lazy" />
                <span className={styles.playBadge} aria-hidden="true">▶</span>
                <span className={styles.durBadge}>{course.durationLabel}</span>
              </span>
              <span className={styles.watchMeta}>{t('courseLabel', { n: course.number })}</span>
              <span className={styles.watchTitle}>{pick(course.title)}</span>
              <span className={styles.watchSub}>{pick(course.subtitle)}</span>
            </button>
          ))}
        </div>
      </Reveal>

      {/* Secondary: what the team has been doing. */}
      <Reveal as="section" className={styles.bandQuiet}>
        <div className={styles.bandHead}>
          <h2 className={styles.bandTitle}>{t('hubNewsTitle')}</h2>
          <button type="button" className={styles.moreLink} onClick={() => navigate('/news')}>
            {t('hubNewsMore')} →
          </button>
        </div>
        <div className={styles.newsRow}>
          {latest.map((post) => (
            <button
              key={post.id}
              type="button"
              className={styles.newsCard}
              onClick={() => navigate(`/news/${post.id}`)}
            >
              <span className={styles.newsThumb}>
                <img src={asset(post.image)} alt="" aria-hidden="true" loading="lazy" />
              </span>
              <span className={styles.newsDate}>{pick(post.dateLabel)}</span>
              <span className={styles.newsTitle}>{pick(post.title)}</span>
            </button>
          ))}
        </div>
      </Reveal>
    </div>
  )
}

export default HubPage
