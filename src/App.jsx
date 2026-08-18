import { useEffect, useState } from 'react'
import styles from './App.module.css'
import lessons from '../data/lessons.json'
import Header from './components/Header.jsx'
import Footer from './components/Footer.jsx'
import BackToTop from './components/BackToTop.jsx'
import Breadcrumbs from './components/Breadcrumbs.jsx'
import DuotoneFilter from './components/DuotoneFilter.jsx'
import IntroSplash from './components/IntroSplash.jsx'
import ScrollProgress from './components/ScrollProgress.jsx'
import HubPage from './pages/HubPage.jsx'
import CoursePage from './pages/CoursePage.jsx'
import CourseVideoPage from './pages/CourseVideoPage.jsx'
import VideoPage from './pages/VideoPage.jsx'
import LessonPage from './pages/LessonPage.jsx'
import QuizPage from './pages/QuizPage.jsx'
import SummaryPage from './pages/SummaryPage.jsx'
import PricingPage from './pages/PricingPage.jsx'
import GlossaryPage from './pages/GlossaryPage.jsx'
import CommunityPage from './pages/CommunityPage.jsx'
import AboutPage from './pages/AboutPage.jsx'
import UpdatesPage from './pages/UpdatesPage.jsx'
import NewsPage from './pages/NewsPage.jsx'
import NewsArticlePage from './pages/NewsArticlePage.jsx'
import news from '../data/news.json'
import courses from '../data/courses.json'
import FeedbackPage from './pages/FeedbackPage.jsx'
import ChatPage from './pages/ChatPage.jsx'
import CohortPage from './pages/CohortPage.jsx'
import WashiMapPage from './pages/WashiMapPage.jsx'
import TourPage from './pages/TourPage.jsx'
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
    const onHashChange = () => setRoute(parseHash(window.location.hash))
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
        <button type="button" className={styles.notFoundButton} onClick={() => navigate('/')}>
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
      <IntroSplash />
      <ScrollProgress />
      <DuotoneFilter />
      <a href="#main-content" className={styles.skipLink}>
        {t('skipToContent')}
      </a>
      <Header navigate={navigate} currentPage={route.page} />
      {crumbs && <Breadcrumbs items={crumbs} navigate={navigate} />}
      <main id="main-content" tabIndex={-1} className={styles.main}>
        {/* Keyed by route so each navigation remounts and replays a gentle
            enter animation, making page changes feel less abrupt. */}
        <div key={`${route.page}/${route.sectionId || ''}`} className={styles.pageEnter}>
          {content}
        </div>
      </main>
      <Footer navigate={navigate} />
      <BackToTop />
    </div>
  )
}

export default App
