import { useMemo, useState } from 'react'
import readingList from '../../data/readingList.json'
import { useLanguage } from '../i18n/LanguageContext.jsx'
import HelpTip from '../components/HelpTip.jsx'
import PrototypeNotice from '../components/PrototypeNotice.jsx'
import styles from './ReadingListPage.module.css'

// The reading list, a reference feature beside the map and the dictionary:
// books, papers and websites in sections, each tagged with the language it can
// be read in. The content lives in data/readingList.json; until it has any,
// the page says the list is in preparation.
const LANGUAGES = ['en', 'ja-en', 'ja']
const LANGUAGE_KEY = { en: 'readingLangEn', 'ja-en': 'readingLangJaEn', ja: 'readingLangJa' }
const KIND_KEY = {
  book: 'readingKindBook',
  paper: 'readingKindPaper',
  report: 'readingKindReport',
  website: 'readingKindWebsite',
  video: 'readingKindVideo',
}

const external = { target: '_blank', rel: 'noopener noreferrer' }
const safeUrl = (url) => (typeof url === 'string' && /^https:\/\/[^\s"'<>]+$/i.test(url) ? url : null)

function ReadingListPage() {
  const { t, lang } = useLanguage()
  const pick = (field) => (field && (field[lang] ?? field.en)) || ''
  const [language, setLanguage] = useState('all')

  const sections = useMemo(
    () =>
      readingList.sections
        .map((section) => ({
          ...section,
          items: (section.items || []).filter((item) => language === 'all' || item.language === language),
        }))
        .filter((section) => section.items.length > 0),
    [language]
  )
  const total = readingList.sections.reduce((n, section) => n + (section.items?.length || 0), 0)
  const shown = sections.reduce((n, section) => n + section.items.length, 0)

  return (
    <div className={styles.page}>
      <PrototypeNotice messageKey="prototypeNoticeGeneral" />
      <div className={styles.intro}>
        <h1 className={styles.title}>
          {t('readingTitle')}
          <HelpTip label={t('readingHelpLabel')}>{t('readingHelp')}</HelpTip>
        </h1>
        <p className={styles.description}>{t('readingLede')}</p>
      </div>

      {total === 0 ? (
        <div className={`card ${styles.pending}`}>
          <p className={styles.pendingTag}>{t('hubComingSoon')}</p>
          <p className={styles.pendingText}>{t('readingSoonBody')}</p>
        </div>
      ) : (
        <>
          <div className={styles.filters}>
            <div className={styles.chips} role="group" aria-label={t('readingFilterLabel')}>
              <button type="button" className="chip" aria-pressed={language === 'all'} onClick={() => setLanguage('all')}>
                {t('readingFilterAll')}
              </button>
              {LANGUAGES.map((code) => (
                <button key={code} type="button" className="chip" aria-pressed={language === code} onClick={() => setLanguage(code)}>
                  {t(LANGUAGE_KEY[code])}
                </button>
              ))}
            </div>
            <p className={`tnum ${styles.count}`} aria-live="polite">
              {t('readingCount', { n: shown })}
            </p>
          </div>

          {sections.length === 0 ? (
            <div className={styles.empty}>
              <p className={styles.emptyText}>{t('readingNoResults')}</p>
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => setLanguage('all')}>
                {t('readingClearFilter')}
              </button>
            </div>
          ) : (
            sections.map((section) => (
              <section key={section.id} className={styles.section} aria-labelledby={`reading-${section.id}`}>
                <h2 id={`reading-${section.id}`} className={styles.sectionTitle}>
                  {pick(section.title)}
                </h2>
                {section.intro && <p className={styles.sectionIntro}>{pick(section.intro)}</p>}
                <ul className={styles.list}>
                  {section.items.map((item, i) => {
                    const url = safeUrl(item.url)
                    const showEnglishTitle = lang === 'en' && item.titleEn
                    return (
                      <li key={`${section.id}-${i}`} className={styles.item}>
                        <p className={styles.itemTitle}>
                          {url ? (
                            <a href={url} {...external}>
                              {showEnglishTitle ? item.titleEn : item.title}
                            </a>
                          ) : showEnglishTitle ? (
                            item.titleEn
                          ) : (
                            item.title
                          )}
                        </p>
                        {showEnglishTitle && (
                          <p className={styles.original} lang="ja">
                            {item.title}
                          </p>
                        )}
                        <p className={styles.meta}>
                          {[item.authors, item.year].filter(Boolean).join(', ')}
                          <span className={styles.tags}>
                            {KIND_KEY[item.kind] && <span className={styles.tag}>{t(KIND_KEY[item.kind])}</span>}
                            {LANGUAGE_KEY[item.language] && (
                              <span className={`${styles.tag} ${styles.tagLanguage}`}>{t(LANGUAGE_KEY[item.language])}</span>
                            )}
                          </span>
                        </p>
                        {item.note && <p className={styles.note}>{pick(item.note)}</p>}
                      </li>
                    )
                  })}
                </ul>
              </section>
            ))
          )}
        </>
      )}
    </div>
  )
}

export default ReadingListPage
