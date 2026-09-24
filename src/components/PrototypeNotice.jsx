import { useLanguage } from '../i18n/LanguageContext.jsx'
import styles from './PrototypeNotice.module.css'

// Says, at the top of a page that is not a real service yet, that what
// follows is a prototype. The tiles on the home page mark these pages as in
// preparation; this is the same statement where it matters most — in front of
// the prices, dates and itineraries themselves.
function PrototypeNotice({ messageKey }) {
  const { t } = useLanguage()
  return (
    <p className={styles.notice} role="note">
      <span className={styles.tag}>{t('prototypeTag')}</span>
      {t(messageKey)}
    </p>
  )
}

export default PrototypeNotice
