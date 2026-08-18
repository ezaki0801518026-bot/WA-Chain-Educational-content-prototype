import WaitlistForm from '../components/WaitlistForm.jsx'
import { useLanguage } from '../i18n/LanguageContext.jsx'
import styles from './PricingPage.module.css'

// A small check glyph for the feature lists — drawn inline so it inherits
// the track/accent colour and needs no icon dependency.
function Check() {
  return (
    <svg className={styles.check} width="15" height="15" viewBox="0 0 15 15" aria-hidden="true">
      <path d="M3 8l3 3 6-7" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

// Pricing is presented honestly: the free tier is what actually exists
// today (real, no waitlist needed); the subscription and kit tiers are
// not built yet, so their call to action is a waitlist signup rather
// than a checkout flow that would collect payment for nothing.
function PricingPage({ navigate }) {
  const { t } = useLanguage()

  const tiers = [
    {
      key: 'Free',
      features: ['pricingFreeFeature1', 'pricingFreeFeature2', 'pricingFreeFeature3'],
      cta: (
        <button type="button" className={`${styles.tierCta} ${styles.tierCtaSolid}`} onClick={() => navigate('/')}>
          {t('pricingFreeCta')}
        </button>
      ),
    },
    {
      key: 'Course',
      features: ['pricingCourseFeature1', 'pricingCourseFeature2', 'pricingCourseFeature3'],
      cta: <WaitlistForm context="single-course" buttonLabel={t('pricingWaitlistCta')} />,
    },
    {
      key: 'Sub',
      featured: true,
      features: ['pricingSubFeature1', 'pricingSubFeature2', 'pricingSubFeature3'],
      cta: <WaitlistForm context="subscription" buttonLabel={t('pricingWaitlistCta')} />,
    },
    {
      key: 'Kit',
      features: ['pricingKitFeature1', 'pricingKitFeature2', 'pricingKitFeature3'],
      cta: <WaitlistForm context="kit" buttonLabel={t('pricingWaitlistCta')} />,
    },
  ]

  return (
    <div className={styles.page}>
      <div className={styles.intro}>
        <h1 className={styles.title}>{t('pricingTitle')}</h1>
        <p className={styles.description}>{t('pricingDescription')}</p>
      </div>

      <div className={styles.tierList}>
        {tiers.map(({ key, featured, features, cta }) => (
          <div key={key} className={`${styles.tier} ${featured ? styles.tierFeatured : ''}`}>
            {featured && <span className={styles.recommendedBadge}>{t('pricingRecommended')}</span>}
            <p className={styles.tierEyebrow}>{t(`pricing${key}Eyebrow`)}</p>
            <h2 className={styles.tierTitle}>{t(`pricing${key}Title`)}</h2>
            <p className={styles.tierPrice}>{t(`pricing${key}Price`)}</p>
            <p className={styles.tierDescription}>{t(`pricing${key}Description`)}</p>
            <ul className={styles.featureList}>
              {features.map((f) => (
                <li key={f} className={styles.featureItem}>
                  <Check />
                  <span>{t(f)}</span>
                </li>
              ))}
            </ul>
            <div className={styles.ctaArea}>{cta}</div>
          </div>
        ))}
      </div>

      <button type="button" className={styles.cohortCallout} onClick={() => navigate('/cohort')}>
        <span className={styles.cohortCalloutText}>
          <span className={styles.cohortCalloutTitle}>{t('cohortTitle')}</span>
          <span className={styles.cohortCalloutDesc}>{t('cohortLede')}</span>
        </span>
        <span className={styles.cohortCalloutArrow} aria-hidden="true">
          →
        </span>
      </button>

      <p className={styles.footerNote}>{t('pricingFooterNote')}</p>
    </div>
  )
}

export default PricingPage
