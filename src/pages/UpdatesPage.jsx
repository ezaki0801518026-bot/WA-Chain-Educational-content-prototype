import updates from '../../data/updates.json'
import { useLanguage } from '../i18n/LanguageContext.jsx'
import styles from './UpdatesPage.module.css'

const TAG_KEY = {
  design: 'updatesTagDesign',
  content: 'updatesTagContent',
  feature: 'updatesTagFeature',
}

// A plain reverse-chronological changelog. Entries live in data/updates.json
// with bilingual title/body; the current UI language picks which to show.
// Dates are rendered with the locale so the reader sees a familiar format.
function UpdatesPage() {
  const { t, lang } = useLanguage()
  const locale = lang === 'ja' ? 'ja-JP' : 'en-US'

  const formatDate = (iso) =>
    new Date(iso).toLocaleDateString(locale, { year: 'numeric', month: 'long', day: 'numeric' })

  return (
    <div className={styles.page}>
      <div className={styles.intro}>
        <h1 className={styles.title}>{t('updatesTitle')}</h1>
        <p className={styles.description}>{t('updatesDescription')}</p>
      </div>

      <ol className={styles.list}>
        {updates.entries.map((entry, index) => (
          <li key={index} className={styles.entry}>
            <div className={styles.meta}>
              <time className={styles.date} dateTime={entry.date}>
                {formatDate(entry.date)}
              </time>
              <span className={`${styles.tag} ${styles[`tag_${entry.tag}`] || ''}`}>
                {t(TAG_KEY[entry.tag] || 'updatesTagFeature')}
              </span>
            </div>
            <h2 className={styles.entryTitle}>{entry.title[lang] || entry.title.en}</h2>
            <p className={styles.entryBody}>{entry.body[lang] || entry.body.en}</p>
          </li>
        ))}
      </ol>
    </div>
  )
}

export default UpdatesPage
