import { useEffect, useMemo, useState } from 'react'
import news from '../../data/news.json'
import { useLanguage } from '../i18n/LanguageContext.jsx'
import Reveal from '../components/Reveal.jsx'
import HelpTip from '../components/HelpTip.jsx'
import ProfileSetup from '../components/ProfileSetup.jsx'
import { readProfile, wasSkipped } from '../utils/profile.js'
import { getProgress } from '../utils/progress.js'
import { recommend } from '../utils/recommend.js'
import { asset } from '../utils/asset.js'
import styles from './HubPage.module.css'

// The first screen is the image and the sentence, nothing else: what this is,
// before any navigation. Everything the service offers starts one scroll down.
const HERO_IMAGE = '/images/hero/繊維を水にさらす様子.jpg'

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

function HubPage({ navigate }) {
  const { t, lang } = useLanguage()
  const pick = (field) => (field && (field[lang] ?? field.en)) || ''
  const [askDraft, setAskDraft] = useState('')
  const [profile, setProfile] = useState(() => readProfile())
  const [setupOpen, setSetupOpen] = useState(false)

  // Asked once, on the first visit, and never again once answered or closed.
  useEffect(() => {
    if (!readProfile() && !wasSkipped()) setSetupOpen(true)
  }, [])

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
      {/* One screen: the image, the name of the thing, and a hint to scroll. */}
      <section className={styles.hero}>
        <img className={styles.heroImg} src={asset(HERO_IMAGE)} alt="" aria-hidden="true" />
        <div className={styles.heroVeil} />
        <div className={styles.heroInner}>
          <p className={styles.heroEyebrow}>{t('hubEyebrow')}</p>
          <h1 className={styles.heroTitle}>{t('hubTitle')}</h1>
          <p className={styles.heroLede}>{t('hubLede')}</p>
        </div>
        <span className={styles.scrollCue} aria-hidden="true" />
      </section>

      {/* Two ways to ask, side by side: the assistant, and a person. */}
      <Reveal as="section" className={styles.band}>
        <div className={styles.askGrid}>
          <form className={styles.askCard} onSubmit={openChat}>
            <h2 className={styles.askTitle}>
              {t('hubAskTitle')}
              <HelpTip label={t('hubAskHelpLabel')}>{t('hubAskHelp')}</HelpTip>
            </h2>
            <div className={styles.askRow}>
              <label className={styles.srOnly} htmlFor="hub-ask">
                {t('hubAskLabel')}
              </label>
              <input
                id="hub-ask"
                type="text"
                className={styles.askInput}
                maxLength={2000}
                placeholder={t('hubAskPlaceholder')}
                value={askDraft}
                onChange={(event) => setAskDraft(event.target.value)}
              />
              <button type="submit" className={styles.askButton}>
                {t('hubAskCta')}
              </button>
            </div>
          </form>

          <div className={styles.askCard}>
            <h2 className={styles.askTitle}>
              {t('hubExpertTitle')}
              <HelpTip label={t('hubExpertHelpLabel')}>{t('hubExpertHelp')}</HelpTip>
            </h2>
            <button type="button" className={styles.expertButton} onClick={openExpert}>
              {t('hubExpertCta')}
            </button>
          </div>
        </div>
      </Reveal>

      {/* What you can do here — titles only. */}
      <Reveal as="section" className={styles.band}>
        <h2 className={styles.bandTitle}>{t('hubExploreTitle')}</h2>
        <div className={styles.grid}>
          {CORE.map((item) => (
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
                <span className={styles.tileTitle}>{t(`hub_${item.id}_title`)}</span>
                {item.soon && <span className={styles.soon}>{t('hubComingSoon')}</span>}
              </span>
            </button>
          ))}
        </div>
      </Reveal>

      {/* For you — ordered by the reader's own answers. */}
      <Reveal as="section" className={styles.band}>
        <div className={styles.forYouHead}>
          <h2 className={styles.bandTitle}>
            {t('hubForYouTitle')}
            <HelpTip label={t('hubForYouHelpLabel')}>
              {profile ? t('hubForYouHelp') : t('hubForYouHelpEmpty')}
            </HelpTip>
          </h2>
          <button type="button" className={styles.settingsLink} onClick={() => setSetupOpen(true)}>
            {profile ? t('hubForYouEdit') : t('hubForYouSet')}
          </button>
        </div>

        <div className={styles.recRow}>
          {picks.videos.map((entry) => (
            <button
              key={entry.id}
              type="button"
              className={styles.recCard}
              onClick={() => navigate(entry.route)}
            >
              <span className={styles.recThumb}>
                <img src={asset(entry.item.poster)} alt="" aria-hidden="true" loading="lazy" />
                <span className={styles.playBadge} aria-hidden="true">▶</span>
                <span className={styles.durBadge}>{entry.item.durationLabel}</span>
              </span>
              <span className={styles.recTitle}>{pick(entry.item.title)}</span>
              <span className={styles.recWhy}>
                {entry.done ? t('recWatched') : reasonText(entry.reason) || t('recGeneral')}
              </span>
            </button>
          ))}

          {picks.lessons.slice(0, 2).map((entry) => (
            <button
              key={entry.id}
              type="button"
              className={`${styles.recCard} ${styles.recText}`}
              onClick={() => navigate(entry.route)}
            >
              <span className={styles.recKind}>{t('recLessonKind')}</span>
              <span className={styles.recTitle}>
                {t('sectionLabel', { n: entry.number })} — {entry.item.title}
              </span>
              <span className={styles.recWhy}>
                {entry.done ? t('recDone') : reasonText(entry.reason) || t('recGeneral')}
              </span>
            </button>
          ))}
        </div>

        {picks.places.length > 0 && (
          <div className={styles.placeRow}>
            {picks.places.map((place) => (
              <button
                key={place.id}
                type="button"
                className={styles.placeChip}
                onClick={() => navigate(place.route)}
              >
                {t(`recPlace_${place.id}`)}
              </button>
            ))}
          </div>
        )}
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
          {news.posts.slice(0, 2).map((post) => (
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

      {setupOpen && (
        <ProfileSetup
          initial={profile}
          onDone={(saved) => {
            setProfile(saved)
            setSetupOpen(false)
          }}
          onClose={() => setSetupOpen(false)}
        />
      )}
    </div>
  )
}

export default HubPage
