import { useLanguage } from '../i18n/LanguageContext.jsx'
import styles from './SectionCard.module.css'

const TRACK_LABEL_KEY = {
  foundations: 'megaMenuFoundations',
  diagnostics: 'megaMenuDiagnostics',
  practice: 'megaMenuPractice',
}

// A single curriculum entry on the course page. The track's colour lives in
// the topic icon and the track name, nothing louder; the card itself is the
// same quiet sheet as every other card on the site. Active cards carry the
// topics, a meta line and the way in; inactive ("Coming soon") cards stay
// title-only and non-interactive.
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

  const head = (
    <div className={`${styles.head} ${trackClass}`}>
      {Icon && <Icon size={28} className={styles.icon} />}
      <span className={styles.headText}>
        <span className={styles.index}>{t('sectionLabel', { n: index })}</span>
        <span className={styles.track}>{trackLabel}</span>
      </span>
      {completed && (
        <span className={styles.done}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M3 8.5 6.5 12 13 4.5" />
          </svg>
          {t('sectionComplete')}
        </span>
      )}
    </div>
  )

  if (!active) {
    return (
      <div id={anchorId} style={anchorStyle} className={`card ${styles.card} ${styles.cardInactive}`}>
        {head}
        <h2 className={styles.title}>{title}</h2>
        <p className={styles.comingSoon}>{t('comingSoon')}</p>
      </div>
    )
  }

  const meta = [
    estMin ? t('cardEstMin', { min: estMin }) : null,
    hasVideo ? t('cardVideoIntro') : null,
    stepCount ? t('cardSteps', { n: stepCount }) : null,
    quizCount ? t('cardQuestions', { n: quizCount }) : null,
  ].filter(Boolean)

  return (
    <div id={anchorId} style={anchorStyle} className={`card ${styles.card}`}>
      {head}
      <h2 className={styles.title}>{title}</h2>
      {description && <p className={styles.description}>{description}</p>}

      {topics && topics.length > 0 && (
        <p className={styles.topics}>
          <span className={styles.topicsLabel}>{t('cardYoullLearn')}</span> {topics.join(', ')}
        </p>
      )}

      {meta.length > 0 && (
        <ul className={styles.meta}>
          {meta.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      )}

      {completed && quizResult && (
        <p className={styles.status}>{t('quizScore', { correct: quizResult.correct, total: quizResult.total })}</p>
      )}

      <button type="button" className={`btn ${completed ? 'btn-secondary' : 'btn-primary'} ${styles.cta}`} onClick={onSelect}>
        {completed ? t('reviewSection') : t('beginSection')}
      </button>
    </div>
  )
}

export default SectionCard
