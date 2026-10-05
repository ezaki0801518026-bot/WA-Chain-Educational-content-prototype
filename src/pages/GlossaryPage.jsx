import { useMemo, useState } from 'react'
import glossary from '../../data/glossary.json'
import { useLanguage } from '../i18n/LanguageContext.jsx'
import styles from './GlossaryPage.module.css'
import PrototypeNotice from '../components/PrototypeNotice.jsx'

// Real reference content (not a "coming soon" stub) — concise definitions
// for terms used across WA-Chain's material. Search is a plain client-side
// substring match; no backend needed for content that fits comfortably
// in one JSON file.
function GlossaryPage({ navigate }) {
  const { t } = useLanguage()
  const [query, setQuery] = useState('')

  const terms = useMemo(() => {
    const sorted = [...glossary.terms].sort((a, b) => a.term.localeCompare(b.term))
    const q = query.trim().toLowerCase()
    if (!q) return sorted
    return sorted.filter(
      (entry) =>
        entry.term.toLowerCase().includes(q) ||
        entry.definition.toLowerCase().includes(q) ||
        (entry.native ?? '').includes(q)
    )
  }, [query])

  return (
    <div className={styles.page}>
      <PrototypeNotice messageKey="prototypeNoticeGeneral" />
      <div className={styles.intro}>
        <h1 className={styles.title}>{t('glossaryTitle')}</h1>
        <p className={styles.description}>{t('glossaryDescription')}</p>
        <button type="button" className="btn btn-secondary" onClick={() => navigate('/washi-map')}>
          {t('washiMapFromGlossary')}
        </button>
      </div>

      <label className="sr-only" htmlFor="glossary-search">
        {t('glossarySearchLabel')}
      </label>
      <input
        id="glossary-search"
        type="search"
        className={`field ${styles.search}`}
        placeholder={t('glossarySearchPlaceholder')}
        value={query}
        onChange={(event) => setQuery(event.target.value)}
      />

      {terms.length === 0 ? (
        <p className={styles.empty}>{t('glossaryNoResults')}</p>
      ) : (
        <dl className={styles.list}>
          {terms.map((entry) => (
            <div key={entry.id} className={styles.entry}>
              <dt className={styles.term}>
                {entry.term}
                {entry.native && (
                  <span className={styles.native} lang="ja">
                    {' '}
                    {entry.native}
                  </span>
                )}
              </dt>
              <dd className={styles.definition}>
                {entry.definition}
              </dd>
            </div>
          ))}
        </dl>
      )}
    </div>
  )
}

export default GlossaryPage
