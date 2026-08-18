import lessons from '../../data/lessons.json'
import glossary from '../../data/glossary.json'
import washi from '../../data/washiPapers.json'

// Static, always-available destinations. `kw` adds a few extra search terms
// (in both languages) so a page turns up under words that aren't in its title.
const PAGES = [
  { key: 'navCourse', route: '/course', kw: 'course lessons curriculum sections learn 講座 レッスン カリキュラム' },
  { key: 'navAbout', route: '/about', kw: 'wa-chain team mission story about 運営 チーム' },
  { key: 'navWashiMap', route: '/washi-map', kw: 'map japan region origin prefecture 産地 地図 都道府県' },
  { key: 'navTour', route: '/tour', kw: 'tour visit region papermaking ツアー 産地 体験' },
  { key: 'navCohort', route: '/cohort', kw: 'cohort certificate deadline structured コホート 修了証' },
  { key: 'navChat', route: '/chat', kw: 'chat ask expert question 相談 質問 チャット' },
  { key: 'navPricing', route: '/pricing', kw: 'price plan subscription kit course 料金 プラン' },
  { key: 'navGlossary', route: '/glossary', kw: 'glossary dictionary terms 用語 辞典' },
  { key: 'navCommunity', route: '/community', kw: 'community conservators コミュニティ' },
  { key: 'navNews', route: '/news', kw: 'news activity reports announcements blog 活動報告 お知らせ ニュース' },
  { key: 'navUpdates', route: '/updates', kw: 'updates changelog site 更新 履歴' },
  { key: 'navFeedback', route: '/feedback', kw: 'feedback report suggestion フィードバック 意見' },
]

// Strip Latin diacritics (so "kozo" matches "kōzo", "gampi" macrons, etc.)
// while leaving Japanese intact: decompose, remove only the Latin combining
// range, then recompose — this preserves dakuten (が stays が, not か゛).
function norm(value) {
  return String(value)
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .normalize('NFC')
    .toLowerCase()
}

// Builds a flat, searchable index across every kind of content on the site.
// `t` and `lang` are passed in so page titles and section labels are indexed
// in the current UI language. Section/glossary text stays in its source
// language (English) and washi text in Japanese — substring search matches
// either, whatever the query language.
export function buildSearchIndex(t) {
  const items = []

  lessons.sections.forEach((section, index) => {
    const parts = [
      section.title,
      section.description,
      ...(section.topics || []),
      ...(section.summaryPoints || []),
      ...(section.steps || []).map((step) => step.heading),
    ]
    items.push({
      type: 'section',
      title: section.title,
      subtitle: section.active
        ? t('sectionLabel', { n: index + 1 })
        : `${t('sectionLabel', { n: index + 1 })} · ${t('comingSoon')}`,
      titleNorm: norm(section.title),
      text: norm(parts.filter(Boolean).join(' ')),
      route: section.active ? (section.video ? `/video/${section.id}` : `/lesson/${section.id}`) : '/',
    })
  })

  ;(glossary.terms || []).forEach((term) => {
    items.push({
      type: 'glossary',
      title: term.term,
      subtitle: term.native || '',
      titleNorm: norm(term.term),
      text: norm(`${term.term} ${term.native || ''} ${term.definition}`),
      route: '/glossary',
    })
  })

  Object.values(washi.papers).forEach((paper) => {
    items.push({
      type: 'washi',
      title: paper.name,
      subtitle: paper.reading,
      titleNorm: norm(paper.name),
      text: norm(`${paper.name} ${paper.reading} ${paper.desc} ${paper.regionLabel}`),
      route: '/washi-map',
    })
  })

  PAGES.forEach((page) => {
    const title = t(page.key)
    items.push({
      type: 'page',
      title,
      subtitle: '',
      titleNorm: norm(title),
      text: norm(`${title} ${page.kw}`),
      route: page.route,
    })
  })

  return items
}

// Case-insensitive substring match on title (weighted first) then body text.
export function searchIndex(index, query, limit = 30) {
  const q = norm(query.trim())
  if (!q) return []
  const titleHits = []
  const bodyHits = []
  for (const item of index) {
    if (item.titleNorm.includes(q)) titleHits.push(item)
    else if (item.text.includes(q)) bodyHits.push(item)
  }
  return [...titleHits, ...bodyHits].slice(0, limit)
}
