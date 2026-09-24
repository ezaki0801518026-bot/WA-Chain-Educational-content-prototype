import WaitlistForm from '../components/WaitlistForm.jsx'
import { useLanguage } from '../i18n/LanguageContext.jsx'
import styles from './CommunityPage.module.css'
import PrototypeNotice from '../components/PrototypeNotice.jsx'

function CommunityPage() {
  const { t } = useLanguage()

  return (
    <div className={styles.page}>
      <PrototypeNotice messageKey="prototypeNoticeGeneral" />
      <h1 className={styles.title}>{t('communityTitle')}</h1>
      <p className={styles.description}>{t('communityDescription')}</p>
      <ul className={styles.pointList}>
        <li>{t('communityPoint1')}</li>
        <li>{t('communityPoint2')}</li>
        <li>{t('communityPoint3')}</li>
      </ul>
      <p className={styles.status}>{t('communityStatus')}</p>
      <WaitlistForm context="community" buttonLabel={t('communityCta')} />
    </div>
  )
}

export default CommunityPage
