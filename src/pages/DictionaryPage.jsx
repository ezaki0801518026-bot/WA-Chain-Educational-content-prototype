import { useLanguage } from '../i18n/LanguageContext.jsx'
import { useTheme } from '../context/ThemeContext.jsx'
import HelpTip from '../components/HelpTip.jsx'
import PrototypeNotice from '../components/PrototypeNotice.jsx'
import { DICTIONARY } from '../config/dictionary.js'
import { asset } from '../utils/asset.js'
import styles from './DictionaryPage.module.css'

// The frame for the washi dictionary, a reference feature beside the map.
// The dictionary itself is a separate HTML document (see config/dictionary.js)
// shown inside this page once it has been connected; until then the page says
// so in one sentence and offers the course glossary, which already exists.
function DictionaryPage({ navigate }) {
  const { t, lang } = useLanguage()
  const { theme } = useTheme()

  return (
    <div className={styles.page}>
      <PrototypeNotice messageKey="prototypeNoticeGeneral" />
      <div className={styles.intro}>
        <h1 className={styles.title}>
          {t('dictionaryTitle')}
          <HelpTip label={t('dictionaryHelpLabel')}>{t('dictionaryHelp')}</HelpTip>
        </h1>
        <p className={styles.description}>{t('dictionaryLede')}</p>
      </div>

      {DICTIONARY.ready ? (
        <div className={`card ${styles.frame}`}>
          <iframe
            className={styles.document}
            src={`${asset(DICTIONARY.src)}?lang=${lang}&theme=${theme}`}
            title={t('dictionaryTitle')}
            loading="lazy"
            referrerPolicy="same-origin"
          />
        </div>
      ) : (
        <div className={`card ${styles.pending}`}>
          <p className={styles.pendingTag}>{t('hubComingSoon')}</p>
          <p className={styles.pendingText}>{t('dictionarySoonBody')}</p>
          <button type="button" className="btn btn-secondary" onClick={() => navigate('/glossary')}>
            {t('dictionaryToGlossary')}
          </button>
        </div>
      )}
    </div>
  )
}

export default DictionaryPage
