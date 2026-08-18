import React, { useEffect, useLayoutEffect, useRef, useState } from 'react'
import ReactDOM from 'react-dom/client'
import AboutPage from './pages/AboutPage.jsx'
import NewsArticlePage from './pages/NewsArticlePage.jsx'
import news from '../data/news.json'
import IntroSplash from './components/IntroSplash.jsx'
import ScrollProgress from './components/ScrollProgress.jsx'
import SocialIcon, { socialLabel } from './components/SocialIcon.jsx'
import { TEAM_SOCIAL } from './config/social.js'
import { LanguageProvider, useLanguage } from './i18n/LanguageContext.jsx'
import { ThemeProvider, useTheme } from './context/ThemeContext.jsx'
import './tokens.css'
import styles from './AboutStandalone.module.css'
import { asset } from './utils/asset.js'

// Standalone build of the existing About page (mission / activity record /
// team tabs), served at /about/. Same component as the in-app page — this
// entry only swaps the chrome: no course nav, no search, no pricing CTA,
// and the brand is inert so the page can be shared on its own without
// leading anyone into the course prototype.
// A deliberately tiny router: the only two things reachable from this
// build are the About page and a single activity report. Anything else in
// the hash falls back to About, so no course route can be reached from
// here even by typing one in.
function parseHash(hash) {
  const match = hash.match(/^#\/news\/([\w-]+)$/)
  if (match && news.posts.some((p) => p.id === match[1])) return { view: 'news', id: match[1] }
  return { view: 'about' }
}

function AboutShell() {
  const { lang, setLang, t } = useLanguage()
  const { theme, toggleTheme } = useTheme()
  const [route, setRoute] = useState(() => parseHash(window.location.hash))
  const [aboutTab, setAboutTab] = useState('mission')

  // Where the reader was on the About page when they opened a report, so
  // coming back returns them to that spot rather than the top of a fresh
  // page. Kept in a ref: it changes on every scroll and must not re-render.
  const aboutScroll = useRef(0)

  // Which view is on screen right now, readable from the hashchange
  // handler without re-subscribing it on every route change.
  const viewRef = useRef(route.view)
  useEffect(() => {
    viewRef.current = route.view
  }, [route.view])

  // Own the scroll position outright: with 'auto' the browser also restores
  // an offset on hash navigation and fights the restore below.
  useEffect(() => {
    if (!('scrollRestoration' in window.history)) return undefined
    const previous = window.history.scrollRestoration
    window.history.scrollRestoration = 'manual'
    return () => {
      window.history.scrollRestoration = previous
    }
  }, [])

  useEffect(() => {
    const onHashChange = () => {
      // Read the offset at the moment of navigation rather than tracking
      // scroll events: it is one read, and it cannot miss.
      if (viewRef.current === 'about') aboutScroll.current = window.scrollY
      setRoute(parseHash(window.location.hash))
    }
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])

  // An article always opens at the top; returning to About restores the
  // offset. useLayoutEffect so the jump happens before the browser paints.
  useLayoutEffect(() => {
    if (route.view === 'news') {
      window.scrollTo(0, 0)
      return undefined
    }
    const target = aboutScroll.current
    window.scrollTo(0, target)
    // Lazy images below the fold settle after the first paint and can
    // shorten the page; re-apply once, but only if the reader has not
    // taken over scrolling in the meantime.
    const settle = setTimeout(() => {
      if (Math.abs(window.scrollY - target) > 4 && window.scrollY < 4) window.scrollTo(0, target)
    }, 300)
    return () => clearTimeout(settle)
  }, [route.view, route.id])

  useEffect(() => {
    const base = 'WA-Chain'
    if (route.view === 'news') {
      const post = news.posts.find((p) => p.id === route.id)
      document.title = post ? `${post.title[lang] || post.title.en} · ${base}` : base
    } else {
      document.title = `${base} — ${t('aboutEyebrow')}`
    }
  }, [route, lang, t])

  const goBackToAbout = () => {
    window.location.hash = ''
  }

  return (
    <div className={styles.shell}>
      <IntroSplash />
      <ScrollProgress />
      <header className={styles.bar}>
        <span className={styles.brand}>
          <img className={styles.brandMark} src={asset('/images/hero/wa-chain-logo-mark.png')} alt="" />
          <span className={styles.brandName}>WA-Chain</span>
        </span>
        <nav className={styles.controls} aria-label="Display options">
          <span className={styles.langToggle} role="group" aria-label="Language">
            <button
              type="button"
              className={styles.langButton}
              aria-pressed={lang === 'en'}
              onClick={() => setLang('en')}
            >
              EN
            </button>
            <button
              type="button"
              className={styles.langButton}
              aria-pressed={lang === 'ja'}
              onClick={() => setLang('ja')}
            >
              日本語
            </button>
          </span>
          <button
            type="button"
            className={styles.themeButton}
            onClick={toggleTheme}
            aria-label={theme === 'dark' ? t('themeToggleToLight') : t('themeToggleToDark')}
          >
            {theme === 'dark' ? '☀' : '☾'}
          </button>
        </nav>
      </header>

      {/* AboutPage closes each tab with its own footer (incl. the team-tab
          meta line), so the shell adds only WA-Chain's own accounts. */}
      <main className={styles.main}>
        {route.view === 'news' ? (
          <NewsArticlePage
            id={route.id}
            navigate={goBackToAbout}
            backTo={null}
            backLabelKey="aboutBackToAbout"
          />
        ) : (
          <AboutPage initialTab={aboutTab} onTabChange={setAboutTab} />
        )}
      </main>

      <footer className={styles.foot}>
        {TEAM_SOCIAL.map((account) => (
          <a
            key={account.url}
            className={styles.footLink}
            href={account.url}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`WA-Chain — ${socialLabel(account.network)}`}
            title={socialLabel(account.network)}
          >
            <SocialIcon network={account.network} size={18} />
          </a>
        ))}
      </footer>
    </div>
  )
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ThemeProvider>
      <LanguageProvider>
        <AboutShell />
      </LanguageProvider>
    </ThemeProvider>
  </React.StrictMode>,
)
