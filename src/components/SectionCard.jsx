import { useLanguage } from '../i18n/LanguageContext.jsx'
import styles from './SectionCard.module.css'

const TRACK_LABEL_KEY = {
  foundations: 'megaMenuFoundations',
  diagnostics: 'megaMenuDiagnostics',
  practice: 'megaMenuPractice',
}

// A single curriculum entry on the HomePage. Every card leads with a
// track-coloured cover carrying the section's topic icon, so the grid
// reads as a set of distinct, scannable subjects rather than a wall of
// identical bordered boxes. Active cards add topic tags ("what you'll
// learn"), a step/quiz meta line, and a CTA; inactive ("Coming soon")
// cards keep the same coloured identity but stay title-only and
// non-interactive.
function SectionCard({
  index,
  title,
  description,
  active,
  completed,
  quizResult,
  onSelect,
  Icon,
  anchorId,
  track = 'foundations',
  topics,
  stepCount,
  quizCount,
  hasVideo,
  estMin,
}) {
  const { t } = useLanguage()
  const anchorStyle = anchorId ? { scrollMarginTop: 'var(--header-height)' } : undefined
  const trackClass = styles[`track_${track}`] || styles.track_foundations
  const trackLabel = t(TRACK_LABEL_KEY[track] || 'megaMenuFoundations')

  const cover = (
    <div className={`${styles.cover} ${trackClass}`} aria-hidden="true">
      {Icon && <Icon size={40} className={styles.coverIcon} />}
      <span className={styles.trackPill}>{trackLabel}</span>
      {completed && <span className={styles.completeDot}>✓</span>}
    </div>
  )

  if (!active) {
    return (
      <div id={anchorId} style={anchorStyle} className={`${styles.card} ${styles.cardInactive}`}>
        {cover}
        <div className={styles.body}>
          <p className={styles.eyebrow}>{t('sectionLabel', { n: index })}</p>
          <h2 className={styles.title}>{title}</h2>
          <p className={styles.comingSoon}>{t('comingSoon')}</p>
        </div>
      </div>
    )
  }

  return (
    <div id={anchorId} style={anchorStyle} className={`${styles.card} ${trackClass}`}>
      {cover}
      <div className={styles.body}>
        <p className={styles.eyebrow}>{t('sectionLabel', { n: index })}</p>
        <h2 className={styles.title}>{title}</h2>
        {description && <p className={styles.description}>{description}</p>}

        {topics && topics.length > 0 && (
          <div className={styles.learnBlock}>
            <p className={styles.learnLabel}>{t('cardYoullLearn')}</p>
            <ul className={styles.topicList}>
              {topics.map((topic) => (
                <li key={topic} className={styles.topicTag}>
                  {topic}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className={styles.metaRow}>
          {estMin ? <span className={styles.metaItem}>⏱ {t('cardEstMin', { min: estMin })}</span> : null}
          {hasVideo && <span className={styles.metaItem}>▶ {t('cardVideoIntro')}</span>}
          {stepCount ? <span className={styles.metaItem}>{t('cardSteps', { n: stepCount })}</span> : null}
          {quizCount ? <span className={styles.metaItem}>{t('cardQuestions', { n: quizCount })}</span> : null}
        </div>

        {completed && (
          <p className={styles.status}>
            {t('sectionComplete')}
            {quizResult ? ` — ${t('quizScore', { correct: quizResult.correct, total: quizResult.total })}` : ''}
          </p>
        )}

        <button type="button" className={styles.cta} onClick={onSelect}>
          {completed ? t('reviewSection') : t('beginSection')}
        </button>
      </div>
    </div>
  )
}

export default SectionCard
