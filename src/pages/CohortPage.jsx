import WaitlistForm from '../components/WaitlistForm.jsx'
import { useLanguage } from '../i18n/LanguageContext.jsx'
import styles from './CohortPage.module.css'

const POINTS = ['1', '2', '3', '4']

// Concept page for a fixed-start, deadline-driven cohort. There is nothing
// to enrol in yet — the page exists to measure demand for structured,
// obligation-carrying learning (hypothesis E-2) via waitlist signups.
function CohortPage() {
  const { t } = useLanguage()

  return (
    <div className={styles.page}>
      <div className={styles.intro}>
        <p className={styles.eyebrow}>{t('cohortEyebrow')}</p>
        <h1 className={styles.title}>{t('cohortTitle')}</h1>
        <p className={styles.lede}>{t('cohortLede')}</p>
      </div>

      <h2 className={styles.subheading}>{t('cohortWhatTitle')}</h2>
      <div className={styles.pointGrid}>
        {POINTS.map((n) => (
          <div key={n} className={styles.pointCard}>
            <h3 className={styles.pointTitle}>{t(`cohortPoint${n}Title`)}</h3>
            <p className={styles.pointDesc}>{t(`cohortPoint${n}Desc`)}</p>
          </div>
        ))}
      </div>

      <p className={styles.status}>{t('cohortStatus')}</p>
      <WaitlistForm context="cohort" buttonLabel={t('cohortCta')} />
    </div>
  )
}

export default CohortPage
