import WaitlistForm from '../components/WaitlistForm.jsx'
import { useLanguage } from '../i18n/LanguageContext.jsx'
import styles from './CohortPage.module.css'

const POINTS = ['1', '2', '3', '4']

// Concept page for a future washi tour — visiting the producing regions,
// hands-on papermaking, meeting the makers. Nothing to book yet; the page
// exists to describe the idea and gauge interest, and it links back to the
// origins map (the regions a tour would visit).
function TourPage({ navigate }) {
  const { t } = useLanguage()

  return (
    <div className={styles.page}>
      <div className={styles.intro}>
        <p className={styles.eyebrow}>{t('tourEyebrow')}</p>
        <h1 className={styles.title}>{t('tourTitle')}</h1>
        <p className={styles.lede}>{t('tourLede')}</p>
        <button type="button" className={styles.mapLink} onClick={() => navigate('/washi-map')}>
          {t('tourMapLink')}
        </button>
      </div>

      <h2 className={styles.subheading}>{t('tourWhatTitle')}</h2>
      <div className={styles.pointGrid}>
        {POINTS.map((n) => (
          <div key={n} className={styles.pointCard}>
            <h3 className={styles.pointTitle}>{t(`tourPoint${n}Title`)}</h3>
            <p className={styles.pointDesc}>{t(`tourPoint${n}Desc`)}</p>
          </div>
        ))}
      </div>

      <p className={styles.status}>{t('tourStatus')}</p>
      <WaitlistForm context="tour" buttonLabel={t('tourCta')} />
    </div>
  )
}

export default TourPage
