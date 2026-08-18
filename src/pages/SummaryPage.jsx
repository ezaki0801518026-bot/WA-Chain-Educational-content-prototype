import { useEffect } from 'react'
import lessons from '../../data/lessons.json'
import heroImages from '../../data/heroImages.json'
import { getProgress, setSectionComplete } from '../utils/progress.js'
import ProgressIndicator from '../components/ProgressIndicator.jsx'
import HeroBanner from '../components/HeroBanner.jsx'
import SectionDivider from '../components/SectionDivider.jsx'
import SectionFeedback from '../components/SectionFeedback.jsx'
import CertificateButton from '../components/CertificateButton.jsx'
import SourceList from '../components/SourceList.jsx'
import { useLanguage } from '../i18n/LanguageContext.jsx'
import { useArrowKeyNav } from '../hooks/useArrowKeyNav.js'
import { track } from '../utils/analytics.js'
import styles from './SummaryPage.module.css'

// Section completion screen: key takeaways, factual quiz score, and a link
// onward. Marks the section complete in localStorage on arrival.
function SummaryPage({ sectionId, navigate }) {
  const { t } = useLanguage()
  const sections = lessons.sections
  const sectionIndex = sections.findIndex((s) => s.id === sectionId)
  const section = sections[sectionIndex]

  useEffect(() => {
    if (section) {
      setSectionComplete(sectionId)
      const quiz = getProgress()[sectionId]?.quiz
      track('section_complete', {
        section: sectionId,
        detail: quiz ? `quiz ${quiz.correct}/${quiz.total}` : null,
      })
    }
  }, [sectionId, section])

  // Only link onward to another *active* section — later entries may be
  // inactive "Coming soon" placeholders with no lesson/quiz data.
  const nextSection = section ? sections.slice(sectionIndex + 1).find((s) => s.active) : null

  // Hooks must run unconditionally on every render, so this sits above the
  // early return below.
  useArrowKeyNav({
    onNext: !section ? undefined : () => navigate(nextSection ? `/lesson/${nextSection.id}` : '/'),
  })

  if (!section) {
    return <p className={styles.notFound}>{t('sectionNotFound')}</p>
  }

  const quizResult = getProgress()[sectionId]?.quiz
  const doorImage = heroImages.sections[sectionId]

  return (
    <div className={styles.pageGrid}>
      <div className={styles.spacer} />
      <div className={styles.summary}>
        {doorImage && (
          <HeroBanner image={doorImage} eyebrow={t('sectionLabel', { n: sectionIndex + 1 })} size="small" />
        )}
        <ProgressIndicator text={t('sectionComplete')} />
        <h1 className={styles.title}>{section.title}</h1>
        {quizResult && (
          <ProgressIndicator text={t('quizScore', { correct: quizResult.correct, total: quizResult.total })} />
        )}
        <CertificateButton sectionTitle={section.title} quizResult={quizResult} />

        <h2 className={styles.subheading}>{t('keyTakeaways')}</h2>
        <ul className={styles.points}>
          {section.summaryPoints.map((point, index) => (
            <li key={index} className={styles.point}>
              {point}
            </li>
          ))}
        </ul>

        <SourceList sources={section.sources} />

        <SectionFeedback sectionId={sectionId} sectionTitle={section.title} />

        <SectionDivider />

        <nav className={styles.nav}>
          {nextSection ? (
            <button
              type="button"
              className={styles.nextCard}
              onClick={() =>
                navigate(nextSection.video ? `/video/${nextSection.id}` : `/lesson/${nextSection.id}`)
              }
            >
              <span className={styles.nextLabel}>{t('upNextLabel')}</span>
              <span className={styles.nextTitle}>
                {t('sectionLabel', { n: sections.findIndex((s) => s.id === nextSection.id) + 1 })} —{' '}
                {nextSection.title}
              </span>
              <span className={styles.nextDesc}>{nextSection.description}</span>
              <span className={styles.nextCta}>{t('continueToNextSection')} →</span>
            </button>
          ) : (
            <button type="button" className={styles.navButton} onClick={() => navigate('/')}>
              {t('returnToCourseHome')}
            </button>
          )}
        </nav>
      </div>
    </div>
  )
}

export default SummaryPage
