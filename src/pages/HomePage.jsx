import { useMemo } from 'react'
import lessons from '../../data/lessons.json'
import news from '../../data/news.json'
import heroImages from '../../data/heroImages.json'
import { getProgress } from '../utils/progress.js'
import HeroBanner from '../components/HeroBanner.jsx'
import AudienceGateway from '../components/AudienceGateway.jsx'
import HomeShowcase from '../components/HomeShowcase.jsx'
import SectionDivider from '../components/SectionDivider.jsx'
import Reveal from '../components/Reveal.jsx'
import { useLanguage } from '../i18n/LanguageContext.jsx'
import { findResume } from './CoursePage.jsx'
import styles from './HomePage.module.css'

// The home page is a hub, not the curriculum: hero, the destination card
// carousel, then teaser bands (latest news, the course) that each link out
// with a "see more". The full curriculum lives at /course.
function HomePage({ navigate }) {
  const { t, lang } = useLanguage()
  const pick = (field) => field[lang] || field.en

  const progress = useMemo(() => getProgress(), [])
  const resume = useMemo(() => findResume(lessons.sections, progress), [progress])
  const resumeIndex = resume ? lessons.sections.findIndex((s) => s.id === resume.section.id) : -1

  const latestPosts = news.posts.slice(0, 3)
  const activeSections = lessons.sections.filter((s) => s.active)

  return (
    <>
      <HeroBanner
        image={heroImages.course}
        eyebrow={t('appSubtitle')}
        title={t('appTitle')}
        size="large"
      />
      <AudienceGateway navigate={navigate} />
      <HomeShowcase navigate={navigate} />
      <div className={styles.home}>
        <div className={styles.intro}>
          <p className={styles.description}>{t('appDescription')}</p>
        </div>

        <SectionDivider />

        {resume && (
          <button
            type="button"
            className={styles.resumeCard}
            onClick={() =>
              navigate(resume.section.video ? `/video/${resume.section.id}` : `/lesson/${resume.section.id}`)
            }
          >
            <div className={styles.resumeText}>
              <span className={styles.resumeLabel}>{t('resumeLabel')}</span>
              <span className={styles.resumeSection}>
                {t('sectionLabel', { n: resumeIndex + 1 })} — {resume.section.title}
              </span>
              <span className={styles.resumeMeta}>
                {t('resumeMeta', {
                  step: resume.step + 1,
                  total: resume.section.steps.length,
                  min: Math.max(1, Math.round((resume.section.steps.length - resume.step) * 1.5)),
                })}
              </span>
            </div>
            <span className={styles.resumeCta}>{t('resumeCta')} →</span>
          </button>
        )}

        <Reveal as="section" className={styles.band}>
          <div className={styles.bandHeader}>
            <h2 className={styles.bandTitle}>
              News
              <span className={styles.bandSub}>{t('showcaseNewsSub')}</span>
            </h2>
            <button type="button" className={styles.moreLink} onClick={() => navigate('/news')}>
              {t('homeMore')} →
            </button>
          </div>
          <div className={styles.newsGrid}>
            {latestPosts.map((post) => (
              <button
                key={post.id}
                type="button"
                className={styles.newsCard}
                onClick={() => navigate(`/news/${post.id}`)}
              >
                <span className={styles.newsThumbWrap}>
                  <img
                    className={styles.newsThumb}
                    src={encodeURI(post.image)}
                    alt={post.imageAlt}
                    loading="lazy"
                  />
                  {post.kicker && <span className={styles.newsKicker}>{pick(post.kicker)}</span>}
                </span>
                <span className={styles.newsMeta}>
                  <span className={styles.newsDate}>{pick(post.dateLabel)}</span>
                  <span className={styles.newsCategory}>{pick(post.category)}</span>
                </span>
                <span className={styles.newsCardTitle}>{pick(post.title)}</span>
              </button>
            ))}
          </div>
        </Reveal>

        <SectionDivider />

        <Reveal as="section" className={styles.band}>
          <div className={styles.bandHeader}>
            <h2 className={styles.bandTitle}>
              The Course
              <span className={styles.bandSub}>{t('showcaseCourseSub')}</span>
            </h2>
            <button type="button" className={styles.moreLink} onClick={() => navigate('/course')}>
              {t('homeMore')} →
            </button>
          </div>
          <p className={styles.courseLede}>{t('homeCourseLede')}</p>
          <ul className={styles.courseList}>
            {activeSections.map((section) => {
              const index = lessons.sections.findIndex((s) => s.id === section.id)
              return (
                <li key={section.id}>
                  <button
                    type="button"
                    className={styles.courseItem}
                    onClick={() => navigate(section.video ? `/video/${section.id}` : `/lesson/${section.id}`)}
                  >
                    <span className={styles.courseIndex}>{String(index + 1).padStart(2, '0')}</span>
                    <span className={styles.courseTitle}>{section.title}</span>
                    <span className={styles.courseArrow} aria-hidden="true">
                      →
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
          <button type="button" className={styles.courseCta} onClick={() => navigate('/course')}>
            {t('homeCourseCta')}
          </button>
        </Reveal>
      </div>
    </>
  )
}

export default HomePage
