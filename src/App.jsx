import { lazy, Suspense, startTransition, useEffect, useState } from 'react'
import styles from './App.module.css'
import lessons from '../data/lessons.json'
import Header from './components/Header.jsx'
import Footer from './components/Footer.jsx'
import BackToTop from './components/BackToTop.jsx'
import Breadcrumbs from './components/Breadcrumbs.jsx'
import ScrollProgress from './components/ScrollProgress.jsx'
import HubPage from './pages/HubPage.jsx'

// Every page but the home is its own chunk, fetched the first time it is
// opened, so the first visit downloads only what the home needs.
const CoursePage = lazy(() => import('./pages/CoursePage.jsx'))
const CourseVideoPage = lazy(() => import('./pages/CourseVideoPage.jsx'))
const VideoPage = lazy(() => import('./pages/VideoPage.jsx'))
const LessonPage = lazy(() => import('./pages/LessonPage.jsx'))
const QuizPage = lazy(() => import('./pages/QuizPage.jsx'))
const SummaryPage = lazy(() => import('./pages/SummaryPage.jsx'))
const PricingPage = lazy(() => import('./pages/PricingPage.jsx'))
const GlossaryPage = lazy(() => import('./pages/GlossaryPage.jsx'))
const CommunityPage = lazy(() => import('./pages/CommunityPage.jsx'))
const AboutPage = lazy(() => import('./pages/AboutPage.jsx'))
const UpdatesPage = lazy(() => import('./pages/UpdatesPage.jsx'))
const NewsPage = lazy(() => import('./pages/NewsPage.jsx'))
const NewsArticlePage = lazy(() => import('./pages/NewsArticlePage.jsx'))
const FeedbackPage = lazy(() => import('./pages/FeedbackPage.jsx'))
const ChatPage = lazy(() => import('./pages/ChatPage.jsx'))
const CohortPage = lazy(() => import('./pages/CohortPage.jsx'))
const WashiMapPage = lazy(() => import('./pages/WashiMapPage.jsx'))
const TourPage = lazy(() => import('./pages/TourPage.jsx'))
import news from '../data/news.json'
import courses from '../data/courses.json'
import { useLanguage } from './i18n/LanguageContext.jsx'
import { track } from './utils/analytics.js'

function parseHash(hash) {
  const path = hash.replace(/^#\/?/, '')
  const [page, sectionId] = path.split('/')
  return { page: page || 'home', sectionId }
}

function navigate(path) {
  window.location.hash = path
}

// Static pages -> header/menu label key, reused for the document title.
const PAGE_TITLE_KEYS = {
  course: 'navCourse',
  pricing: 'navPricing',
  glossary: 'navGlossary',
  community: 'navCommunity',
  about: 'navAbout',
  updates: 'navUpdates',
  news: 'navNews',
  feedback: 'navFeedback',
  chat: 'navChat',
  cohort: 'navCohort',
  'washi-map': 'navWashiMap',
  tour: 'navTour',
}

// Lesson-flow pages that get a breadcrumb trail (Home › Section › page).
const SECTION_PAGE_CRUMB_KEYS = {
  lesson: 'crumbLesson',
  video: 'crumbVideo',
  quiz: 'crumbQuiz',
  summary: 'crumbSummary',
}

// Minimal hash router.
function App() {
  const [route, setRoute] = useState(() => parseHash(window.location.hash))
  const { t, lang } = useLanguage()

  useEffect(() => {
    // A transition keeps the current page on screen while the next one's
    // chunk arrives, instead of flashing an empty main.
    const onHashChange = () => startTransition(() => setRoute(parseHash(window.location.hash)))
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])

  // A hash change alone keeps the old scroll position, so every navigation
  // would otherwise land mid-page. Reset to the top like a real page load.
  useEffect(() => {
    window.scrollTo(0, 0)
    track('page_view', { section: route.sectionId || null })
  }, [route.page, route.sectionId])

  // Per-page document title, so tabs and browser history stay legible.
  useEffect(() => {
    const base = t('appTitle')
    let title = base
    if (route.page === 'news' && route.sectionId) {
      const post = news.posts.find((p) => p.id === route.sectionId)
      title = post ? `${post.title[lang] || post.title.en} · ${base}` : `${t('navNews')} · ${base}`
    } else if (route.page === 'watch' && route.sectionId) {
      const course = courses.courses.find((c) => c.id === route.sectionId)
      title = course ? `${course.title[lang] || course.title.en} · ${base}` : `${t('navCourse')} · ${base}`
    } else if (PAGE_TITLE_KEYS[route.page]) {
      title = `${t(PAGE_TITLE_KEYS[route.page])} · ${base}`
    } else if (route.sectionId) {
      const section = lessons.sections.find((s) => s.id === route.sectionId)
      if (section) title = `${section.title} · ${base}`
    }
    document.title = title
  }, [route, t, lang])

  let content
  if (route.page === 'home') {
    content = <HubPage navigate={navigate} />
  } else if (route.page === 'course') {
    content = <CoursePage navigate={navigate} />
  } else if (route.page === 'watch' && route.sectionId) {
    content = <CourseVideoPage courseId={route.sectionId} navigate={navigate} />
  } else if (route.page === 'video' && route.sectionId) {
    content = (
      <VideoPage
        sectionId={route.sectionId}
        onContinue={(sectionId) => navigate(`/lesson/${sectionId}`)}
      />
    )
  } else if (route.page === 'lesson' && route.sectionId) {
    content = (
      <LessonPage
        sectionId={route.sectionId}
        navigate={navigate}
        onFinish={(sectionId) => navigate(`/quiz/${sectionId}`)}
      />
    )
  } else if (route.page === 'quiz' && route.sectionId) {
    content = (
      <QuizPage
        sectionId={route.sectionId}
        navigate={navigate}
        onFinish={(sectionId) => navigate(`/summary/${sectionId}`)}
      />
    )
  } else if (route.page === 'summary' && route.sectionId) {
    content = <SummaryPage sectionId={route.sectionId} navigate={navigate} />
  } else if (route.page === 'pricing') {
    content = <PricingPage navigate={navigate} />
  } else if (route.page === 'glossary') {
    content = <GlossaryPage navigate={navigate} />
  } else if (route.page === 'community') {
    content = <CommunityPage />
  } else if (route.page === 'about') {
    content = <AboutPage />
  } else if (route.page === 'updates') {
    content = <UpdatesPage />
  } else if (route.page === 'news' && route.sectionId) {
    content = <NewsArticlePage id={route.sectionId} navigate={navigate} />
  } else if (route.page === 'news') {
    content = <NewsPage navigate={navigate} />
  } else if (route.page === 'feedback') {
    content = <FeedbackPage />
  } else if (route.page === 'chat') {
    content = <ChatPage />
  } else if (route.page === 'cohort') {
    content = <CohortPage navigate={navigate} />
  } else if (route.page === 'washi-map') {
    content = <WashiMapPage navigate={navigate} />
  } else if (route.page === 'tour') {
    content = <TourPage navigate={navigate} />
  } else {
    content = (
      <div className={styles.notFound}>
        <p className={styles.notFoundText}>{t('pageNotFound')}</p>
        <button type="button" className="btn btn-secondary" onClick={() => navigate('/')}>
          {t('notFoundHome')}
        </button>
      </div>
    )
  }

  // Breadcrumbs for the lesson flow only — top-level pages are one hop
  // from the header and don't need a trail.
  let crumbs = null
  if (SECTION_PAGE_CRUMB_KEYS[route.page] && route.sectionId) {
    const sectionIndex = lessons.sections.findIndex((s) => s.id === route.sectionId)
    if (sectionIndex !== -1) {
      const section = lessons.sections[sectionIndex]
      crumbs = [
        { label: t('crumbHome'), route: '/' },
        {
          label: `${t('sectionLabel', { n: sectionIndex + 1 })} — ${section.title}`,
          route: route.page === 'lesson' ? undefined : `/lesson/${route.sectionId}`,
        },
        { label: t(SECTION_PAGE_CRUMB_KEYS[route.page]) },
      ]
    }
  }

  return (
    <div className={`${styles.app} ${crumbs ? styles.withCrumbs : ''}`}>
      <ScrollProgress />
      <a href="#main-content" className={styles.skipLink}>
        {t('skipToContent')}
      </a>
      <Header navigate={navigate} currentPage={route.page} />
      {crumbs && <Breadcrumbs items={crumbs} navigate={navigate} />}
      <main id="main-content" tabIndex={-1} className={styles.main}>
        {/* Keyed by route so each navigation remounts and replays a gentle
            enter animation, making page changes feel less abrupt. */}
        <div key={`${route.page}/${route.sectionId || ''}`} className={styles.pageEnter}>
          <Suspense fallback={null}>{content}</Suspense>
        </div>
      </main>
      <Footer navigate={navigate} />
      <BackToTop />
    </div>
  )
}

export default App
