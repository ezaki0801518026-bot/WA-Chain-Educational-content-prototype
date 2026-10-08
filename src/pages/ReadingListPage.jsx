import { useMemo, useState } from 'react'
import readingList from '../../data/readingList.json'
import { useLanguage } from '../i18n/LanguageContext.jsx'
import HelpTip from '../components/HelpTip.jsx'
import PrototypeNotice from '../components/PrototypeNotice.jsx'
import styles from './ReadingListPage.module.css'

// The reading list, a reference feature beside the map and the dictionary:
// books, papers and websites in sections, each tagged with what kind of
// source it is, the language it can be read in and how it can be reached.
// The content lives in data/readingList.json; until it has any, the page says
// the list is in preparation.
//
// Several hundred entries: the page offers a search box, a language filter and
// a row of section links, and each section shows its first few entries until
// the reader asks for the rest. A search or a filter shows every match.
const LANGUAGES = ['en', 'ja-en', 'ja']
const LANGUAGE_KEY = { en: 'readingLangEn', 'ja-en': 'readingLangJaEn', ja: 'readingLangJa' }
const KIND_KEY = {
  book: 'readingKindBook',
  catalogue: 'readingKindCatalogue',
  paper: 'readingKindPaper',
  report: 'readingKindReport',
  glossary: 'readingKindGlossary',
  standard: 'readingKindStandard',
  journal: 'readingKindJournal',
  newsletter: 'readingKindNewsletter',
  organisation: 'readingKindOrganisation',
  website: 'readingKindWebsite',
  database: 'readingKindDatabase',
  social: 'readingKindSocial',
  community: 'readingKindCommunity',
  course: 'readingKindCourse',
  video: 'readingKindVideo',
  podcast: 'readingKindPodcast',
}
const ACCESS_KEY = {
  free: 'readingAccessFree',
  paid: 'readingAccessPaid',
  library: 'readingAccessLibrary',
  members: 'readingAccessMembers',
}
const SOURCE_KEY = {
  peer: 'readingSourcePeer',
  public: 'readingSourcePublic',
  society: 'readingSourceSociety',
  specialist: 'readingSourceSpecialist',
  industry: 'readingSourceIndustry',
  commercial: 'readingSourceCommercial',
}
const PREVIEW = 6

const external = { target: '_blank', rel: 'noopener noreferrer' }
const safeUrl = (url) => (typeof url === 'string' && /^https?:\/\/[^\s"'<>]+$/i.test(url) ? url : null)

// Latin diacritics off (kozo finds kōzo), Japanese left as it is.
const norm = (value) =>
  String(value || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .normalize('NFC')
    .toLowerCase()

function ReadingListPage() {
  const { t, lang } = useLanguage()
  const pick = (field) => (field && (field[lang] ?? field.en)) || ''
  const [language, setLanguage] = useState('all')
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState({})

  const q = norm(query.trim())
  const narrowed = language !== 'all' || q !== ''

  const sections = useMemo(
    () =>
      readingList.sections
        .map((section) => ({
          ...section,
          items: (section.items || []).filter((item) => {
            if (language !== 'all' && item.language !== language) return false
            if (!q) return true
            const haystack = norm([item.title, item.titleEn, item.authors, item.note?.en, item.note?.ja].join(' '))
            return haystack.includes(q)
          }),
        }))
        .filter((section) => section.items.length > 0),
    [language, q]
  )
  const total = readingList.sections.reduce((n, section) => n + (section.items?.length || 0), 0)
  const shown = sections.reduce((n, section) => n + section.items.length, 0)

  const jumpTo = (id) => document.getElementById(`reading-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  const clear = () => {
    setLanguage('all')
    setQuery('')
  }

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
          <div className={styles.tools}>
            <label className="sr-only" htmlFor="reading-search">
              {t('readingSearchLabel')}
            </label>
            <input
              id="reading-search"
              type="search"
              className={`field ${styles.search}`}
              placeholder={t('readingSearchPlaceholder')}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
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
          </div>

          {sections.length > 1 && (
            <nav className={styles.index} aria-label={t('readingIndexLabel')}>
              {sections.map((section) => (
                <button key={section.id} type="button" className={`link ${styles.indexLink}`} onClick={() => jumpTo(section.id)}>
                  {pick(section.title)} <span className="tnum">{section.items.length}</span>
                </button>
              ))}
            </nav>
          )}

          {sections.length === 0 ? (
            <div className={styles.empty}>
              <p className={styles.emptyText}>{t('readingNoResults')}</p>
              <button type="button" className="btn btn-secondary btn-sm" onClick={clear}>
                {t('readingClearFilter')}
              </button>
            </div>
          ) : (
            sections.map((section) => {
              const expanded = narrowed || open[section.id]
              const items = expanded ? section.items : section.items.slice(0, PREVIEW)
              return (
                <section key={section.id} id={`reading-${section.id}`} className={styles.section} aria-labelledby={`reading-${section.id}-title`}>
                  <h2 id={`reading-${section.id}-title`} className={styles.sectionTitle}>
                    {pick(section.title)}
                  </h2>
                  {section.intro && <p className={styles.sectionIntro}>{pick(section.intro)}</p>}
                  <ul className={styles.list}>
                    {items.map((item) => {
                      const url = safeUrl(item.url)
                      const showEnglishTitle = lang === 'en' && item.titleEn
                      const heading = showEnglishTitle ? item.titleEn : item.title
                      const byline = [item.authors, item.year].filter(Boolean).join(', ')
                      return (
                        <li key={item.id} className={styles.item}>
                          <p className={styles.itemTitle}>
                            {url ? (
                              <a href={url} {...external}>
                                {heading}
                              </a>
                            ) : (
                              heading
                            )}
                          </p>
                          {showEnglishTitle && (
                            <p className={styles.original} lang="ja">
                              {item.title}
                            </p>
                          )}
                          <p className={styles.meta}>
                            {byline && <span lang={/[぀-ヿ一-鿿]/.test(byline) ? 'ja' : undefined}>{byline}</span>}
                            {SOURCE_KEY[item.source] && <span>{t(SOURCE_KEY[item.source])}</span>}
                            <span className={styles.tags}>
                              {KIND_KEY[item.kind] && <span className={styles.tag}>{t(KIND_KEY[item.kind])}</span>}
                              {LANGUAGE_KEY[item.language] && (
                                <span className={`${styles.tag} ${styles.tagLanguage}`}>{t(LANGUAGE_KEY[item.language])}</span>
                              )}
                              {ACCESS_KEY[item.access] && <span className={styles.tag}>{t(ACCESS_KEY[item.access])}</span>}
                            </span>
                          </p>
                          {pick(item.note) && <p className={styles.note}>{pick(item.note)}</p>}
                        </li>
                      )
                    })}
                  </ul>
                  {!expanded && section.items.length > PREVIEW && (
                    <button
                      type="button"
                      className={`link ${styles.more}`}
                      onClick={() => setOpen((current) => ({ ...current, [section.id]: true }))}
                    >
                      {t('readingShowAll', { n: section.items.length })}
                    </button>
                  )}
                </section>
              )
            })
          )}
        </>
      )}
    </div>
  )
}

export default ReadingListPage
