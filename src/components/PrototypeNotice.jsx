import { useLanguage } from '../i18n/LanguageContext.jsx'
import styles from './PrototypeNotice.module.css'

// Says, at the top of a page that is not a real service yet, that what
// follows is a prototype. The tiles on the home page mark these pages as in
// preparation; this is the same statement where it matters most — in front of
// the prices, dates and itineraries themselves. One colour (`note`) means
// "not final" across the site; this and the draft-lesson note share it.
function PrototypeNotice({ messageKey }) {
  const { t } = useLanguage()
  return (
    <p className={`notice ${styles.notice}`} role="note">
      <span className="notice-tag">{t('prototypeTag')}</span>
      <span>{t(messageKey)}</span>
    </p>
  )
}

export default PrototypeNotice
