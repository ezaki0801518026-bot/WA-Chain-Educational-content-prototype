import { useEffect, useMemo, useState } from 'react'
import news from '../../data/news.json'
import { useLanguage } from '../i18n/LanguageContext.jsx'
import HelpTip from '../components/HelpTip.jsx'
import { readProfile, wasSkipped, shouldRemind, snoozeReminder } from '../utils/profile.js'
import { useProfile } from '../context/ProfileContext.jsx'
import { getProgress } from '../utils/progress.js'
import { recommend } from '../utils/recommend.js'
import { picture } from '../utils/asset.js'
import styles from './HubPage.module.css'

// The first screen is the image and the sentence, nothing else: what this is,
// before any navigation. Everything the service offers starts one scroll down.
// Several photographs can sit behind the sentence; a sideways swipe (or a
// trackpad scroll) moves to the next. Add a path here after running
// `npm run images` for it; the first one is preloaded from index.html.
const HERO_IMAGES = [
  '/images/hero/繊維を水にさらす様子.jpg',
  '/images/hero/漉き簀の目.jpg',
  '/images/hero/楮の束.jpg',
  '/images/hero/楮を水にさらす槽.jpg',
]

// The four things the service offers. Titles only — the tiles are doors, not
// descriptions. `soon` marks what is not open yet.
const CORE = [
  { id: 'course', route: '/course', image: '/images/hero/ノルウェーで学ぶ様子.jpg' },
  { id: 'map', route: '/washi-map', image: '/images/hero/島根安部記念館の和紙.jpg' },
  { id: 'tour', route: '/tour', image: '/images/hero/和紙漉き体験.jpg', soon: true },
  { id: 'pricing', route: '/pricing', image: '/images/hero/和紙の見本帳.jpg', soon: true },
]

// Carries a question typed on the home page through to the chat page. A hash
// router leaves no clean place to put it in the URL, and it is a draft the
// visitor has not sent yet — sessionStorage suits both. The mode key opens
// the chat page on the human route instead of the assistant.
export const CHAT_PREFILL_KEY = 'wa-chain-chat-prefill'
export const CHAT_MODE_KEY = 'wa-chain-chat-mode'

const WATCH_KEY = 'wa-chain-watch'

function readWatched() {
  try {
    return Object.keys(JSON.parse(localStorage.getItem(WATCH_KEY) || '{}'))
  } catch {
    return []
  }
}

function PlayGlyph() {
  return (
    <svg className={styles.playGlyph} width="44" height="44" viewBox="0 0 44 44" aria-hidden="true">
      <circle cx="22" cy="22" r="21" fill="rgb(13 17 18 / 0.55)" />
      <path d="M17.5 14.5v15l12-7.5z" fill="#fff" />
    </svg>
  )
}

function HubPage({ navigate }) {
  const { t, lang } = useLanguage()
  const pick = (field) => (field && (field[lang] ?? field.en)) || ''
  const [askDraft, setAskDraft] = useState('')
  const { profile, openSetup } = useProfile()
  const [heroIndex, setHeroIndex] = useState(0)
  // Closed it last time? A quiet reminder on the next visit, until answered.
  const [remind, setRemind] = useState(() => shouldRemind())

  // Asked once, on the first visit, and never again once answered or closed.
  useEffect(() => {
    if (!readProfile() && !wasSkipped()) openSetup()
  }, [openSetup])

  useEffect(() => {
    if (profile) setRemind(false)
  }, [profile])

  const picks = useMemo(() => {
    const progress = getProgress()
    const completed = Object.keys(progress).filter((id) => progress[id]?.completed)
    return recommend(profile, { watched: readWatched(), completed })
  }, [profile])

  const openChat = (event) => {
    event.preventDefault()
    const draft = askDraft.trim()
    try {
      sessionStorage.removeItem(CHAT_MODE_KEY)
      if (draft) sessionStorage.setItem(CHAT_PREFILL_KEY, draft)
    } catch {
      /* private mode: the chat page just opens empty */
    }
    navigate('/chat')
  }

  const openExpert = () => {
    try {
      sessionStorage.setItem(CHAT_MODE_KEY, 'team')
    } catch {
      /* private mode: the chat page opens on the assistant instead */
    }
    navigate('/chat')
  }

  const reasonText = (reason) => {
    if (!reason) return ''
    const [, value] = reason.split(':')
    return t(`recReason_${value}`) || ''
  }

  return (
    <div className={styles.page}>
      {/* One screen: the image, the name of the thing, and a hint to scroll.
          The only entrance animation on the site lives here. */}
      <section className={styles.hero}>
        <div
          className={styles.heroTrack}
          aria-hidden="true"
          onScroll={(event) => {
            const el = event.currentTarget
            setHeroIndex(Math.round(el.scrollLeft / Math.max(1, el.clientWidth)))
          }}
        >
          {HERO_IMAGES.map((src, i) => (
            <img
              key={src}
              className={styles.heroImg}
              {...picture(src, '100vw')}
              alt=""
              fetchPriority={i === 0 ? 'high' : undefined}
              loading={i === 0 ? undefined : 'lazy'}
              decoding="async"
            />
          ))}
        </div>
        <div className={styles.heroVeil} />
        <div className={`container ${styles.heroInner}`}>
          <h1 className={styles.heroTitle}>{t('hubTitle')}</h1>
          <p className={styles.heroLede}>{t('hubLede')}</p>
        </div>
        <svg className={styles.scrollCue} width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M4 7.5 10 13l6-5.5" />
        </svg>
        {HERO_IMAGES.length > 1 && (
          <div className={styles.heroDots} aria-hidden="true">
            {HERO_IMAGES.map((src, i) => (
              <span key={src} className={`${styles.heroDot} ${i === heroIndex ? styles.heroDotActive : ''}`} />
            ))}
          </div>
        )}
      </section>

      {/* Two ways to ask, side by side: the assistant, and a person. */}
      <section className={`container ${styles.band}`}>
        <div className={styles.askGrid}>
          <form className={`card ${styles.askCard}`} onSubmit={openChat}>
            <h2 className={styles.askTitle}>
              {t('hubAskTitle')}
              <HelpTip label={t('hubAskHelpLabel')}>{t('hubAskHelp')}</HelpTip>
            </h2>
            <div className={styles.askRow}>
              <label className="sr-only" htmlFor="hub-ask">
                {t('hubAskLabel')}
              </label>
              <input
                id="hub-ask"
                type="text"
                className={`field ${styles.askInput}`}
                maxLength={2000}
                placeholder={t('hubAskPlaceholder')}
                value={askDraft}
                onChange={(event) => setAskDraft(event.target.value)}
                autoComplete="off"
                enterKeyHint="send"
              />
              <button type="submit" className="btn btn-primary">
                {t('hubAskCta')}
              </button>
            </div>
          </form>

          <div className={`card ${styles.askCard}`}>
            <h2 className={styles.askTitle}>
              {t('hubExpertTitle')}
              <HelpTip label={t('hubExpertHelpLabel')}>{t('hubExpertHelp')}</HelpTip>
            </h2>
            <button type="button" className={`btn btn-secondary ${styles.expertButton}`} onClick={openExpert}>
              {t('hubExpertCta')}
            </button>
          </div>
        </div>
      </section>

      {/* What you can do here — titles only. */}
      <section className={`container ${styles.band}`}>
        <h2 className={styles.bandTitle}>{t('hubExploreTitle')}</h2>
        <div className={styles.grid}>
          {CORE.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`card-link ${styles.tile}`}
              onClick={() => navigate(item.route)}
            >
              <span className={styles.tileImgWrap}>
                <img className={styles.tileImg} {...picture(item.image, '(min-width: 64em) 25vw, (min-width: 30em) 50vw, 100vw')} alt="" aria-hidden="true" loading="lazy" decoding="async" />
              </span>
              <span className={styles.tileBody}>
                <span className={styles.tileTitle}>{t(`hub_${item.id}_title`)}</span>
                {item.soon && <span className={styles.soon}>{t('hubComingSoon')}</span>}
              </span>
            </button>
          ))}
        </div>
      </section>

      {/* For you — ordered by the reader's own answers. */}
      <section className={`container ${styles.band}`}>
        <div className={styles.bandHead}>
          <h2 className={styles.bandTitle}>
            {t('hubForYouTitle')}
            <HelpTip label={t('hubForYouHelpLabel')}>
              {profile ? t('hubForYouHelp') : t('hubForYouHelpEmpty')}
            </HelpTip>
          </h2>
          <button type="button" className="link" onClick={openSetup}>
            {profile ? t('hubForYouEdit') : t('hubForYouSet')}
          </button>
        </div>

        {remind && (
          <div className={`card ${styles.remind}`} role="status">
            <p className={styles.remindText}>{t('profileRemindText')}</p>
            <div className={styles.remindActions}>
              <button type="button" className="btn btn-primary btn-sm" onClick={openSetup}>
                {t('profileRemindYes')}
              </button>
              <button
                type="button"
                className="btn btn-quiet btn-sm"
                onClick={() => {
                  snoozeReminder()
                  setRemind(false)
                }}
              >
                {t('profileRemindNo')}
              </button>
            </div>
          </div>
        )}

        <div className={styles.recRow}>
          {picks.videos.map((entry) => (
            <button
              key={entry.id}
              type="button"
              className={`card-link ${styles.recCard}`}
              onClick={() => navigate(entry.route)}
            >
              <span className={styles.recThumb}>
                <img {...picture(entry.item.poster, '(min-width: 64em) 25vw, (min-width: 30em) 50vw, 100vw')} alt="" aria-hidden="true" loading="lazy" decoding="async" />
                <PlayGlyph />
                <span className={`tnum ${styles.durBadge}`}>{entry.item.durationLabel}</span>
              </span>
              <span className={styles.recBody}>
                <span className={styles.recTitle}>{pick(entry.item.title)}</span>
                <span className={styles.recWhy}>
                  {entry.done ? t('recWatched') : reasonText(entry.reason) || t('recGeneral')}
                </span>
              </span>
            </button>
          ))}

          {picks.lessons.slice(0, 2).map((entry) => (
            <button
              key={entry.id}
              type="button"
              className={`card-link ${styles.recCard} ${styles.recText}`}
              onClick={() => navigate(entry.route)}
            >
              <span className={styles.recBody}>
                <span className={styles.recKind}>{t('recLessonKind')}</span>
                <span className={styles.recTitle}>
                  {t('sectionLabel', { n: entry.number })} — {entry.item.title}
                </span>
                <span className={styles.recWhy}>
                  {entry.done ? t('recDone') : reasonText(entry.reason) || t('recGeneral')}
                </span>
              </span>
            </button>
          ))}
        </div>

        {picks.places.length > 0 && (
          <div className={styles.placeRow}>
            {picks.places.map((place) => (
              <button key={place.id} type="button" className="chip" onClick={() => navigate(place.route)}>
                {t(`recPlace_${place.id}`)}
              </button>
            ))}
          </div>
        )}
      </section>

      {/* Secondary: what the team has been doing. */}
      <section className={`container ${styles.band}`}>
        <div className={styles.bandHead}>
          <h2 className={styles.bandTitle}>{t('hubNewsTitle')}</h2>
          <button type="button" className="link" onClick={() => navigate('/news')}>
            {t('hubNewsMore')}
          </button>
        </div>
        <div className={styles.newsRow}>
          {news.posts.slice(0, 2).map((post) => (
            <button
              key={post.id}
              type="button"
              className={`card-link ${styles.newsCard}`}
              onClick={() => navigate(`/news/${post.id}`)}
            >
              <span className={styles.newsThumb}>
                <img {...picture(post.image, '(min-width: 30em) 11rem, 7rem')} alt="" aria-hidden="true" loading="lazy" decoding="async" />
              </span>
              <span className={styles.newsBody}>
                <span className={styles.newsDate}>{pick(post.dateLabel)}</span>
                <span className={styles.newsTitle}>{pick(post.title)}</span>
              </span>
            </button>
          ))}
        </div>
      </section>

    </div>
  )
}

export default HubPage
