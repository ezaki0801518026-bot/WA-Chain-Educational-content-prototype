import { useEffect, useMemo, useRef, useState } from 'react'
import washi from '../../data/washiPapers.json'
import japanSvgRaw from '../assets/japan-prefectures.svg?raw'
import { useLanguage } from '../i18n/LanguageContext.jsx'
import Reveal from '../components/Reveal.jsx'
import styles from './WashiMapPage.module.css'

// Base map: geolonia/japanese-prefectures (MIT). Strip the XML prolog so the
// markup can be injected inside HTML.
const JAPAN_SVG = japanSvgRaw.replace(/<\?xml[^>]*\?>/, '')

const CATEGORY_CLASS = {
  designated: 'catDesignated',
  raw: 'catRaw',
  regional: 'catRegional',
  decorative: 'catDecorative',
  imported: 'catImported',
}

// Category → the theme colour variable used to fill an active prefecture and
// its marker (kept as var() references so dark mode adapts automatically).
const CAT_VAR = {
  designated: 'var(--seal)',
  raw: 'var(--track-foundations)',
  regional: 'var(--track-diagnostics)',
  decorative: 'var(--track-practice)',
  imported: 'var(--accent)',
}

const SVGNS = 'http://www.w3.org/2000/svg'

function WashiMapPage() {
  const { t, lang } = useLanguage()
  const { regions, categories, papers, designations } = washi

  // Small ■●▲◆★ chips for a paper's national designations.
  const renderDesignations = (p) =>
    p.designations && (
      <span className={styles.desigRow}>
        {p.designations.map((id) => {
          const dsg = designations.find((x) => x.id === id)
          if (!dsg) return null
          return (
            <span key={id} className={`${styles.desigChip} ${styles[`desig_${id}`]}`}>
              {dsg.mark} {lang === 'ja' ? dsg.name : dsg.nameEn}
            </span>
          )
        })}
      </span>
    )

  const [selectedRegion, setSelectedRegion] = useState(null)
  const [activePaper, setActivePaper] = useState(null)
  const hostRef = useRef(null)

  // paperId -> [regionId, ...] so picking kōzo-shi lights all three regions.
  const paperRegions = useMemo(() => {
    const map = {}
    for (const region of regions) {
      for (const paperId of region.papers) (map[paperId] ||= []).push(region.id)
    }
    return map
  }, [regions])

  const selectRegion = (id) => {
    setSelectedRegion(id)
    setActivePaper(null)
  }

  const selectPaper = (paperId) => {
    setActivePaper(paperId)
    const homes = paperRegions[paperId]
    setSelectedRegion(homes ? homes[0] : null)
    if (homes) hostRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }

  // One-time setup of the injected SVG: make it responsive, tag the target
  // prefectures for interaction, drop a marker on each region, and wire up
  // delegated hover/click/keyboard selection.
  useEffect(() => {
    const svg = hostRef.current?.querySelector('svg')
    if (!svg) return
    svg.removeAttribute('width')
    svg.removeAttribute('height')
    svg.classList.add(styles.svg)

    for (const region of regions) {
      const catColor = CAT_VAR[papers[region.papers[0]].category]
      for (const code of region.codes) {
        const g = svg.querySelector(`.prefecture[data-code="${code}"]`)
        if (!g) continue
        g.classList.add('wp-target')
        g.setAttribute('data-region', region.id)
        g.setAttribute('role', 'button')
        g.setAttribute('tabindex', '0')
        g.setAttribute('aria-label', lang === 'ja' ? region.name : region.nameEn)
        g.style.setProperty('--cat', catColor)
      }
      // Marker dot at the region's representative prefecture.
      const markerG = svg.querySelector(`.prefecture[data-code="${region.markerCode}"]`)
      if (markerG) {
        try {
          const bb = markerG.getBBox()
          const dot = document.createElementNS(SVGNS, 'circle')
          dot.setAttribute('cx', bb.x + bb.width / 2)
          dot.setAttribute('cy', bb.y + bb.height / 2)
          dot.setAttribute('r', '5')
          dot.setAttribute('class', 'wp-marker')
          dot.setAttribute('data-region', region.id)
          dot.setAttribute('pointer-events', 'none')
          dot.style.setProperty('--cat', catColor)
          markerG.appendChild(dot)
        } catch {
          // getBBox can throw on a detached node — the fill highlight still works
        }
      }
    }

    const regionFromEvent = (event) => event.target.closest('.prefecture[data-region]')?.getAttribute('data-region')
    const onOver = (event) => {
      const id = regionFromEvent(event)
      if (id) selectRegion(id)
    }
    const onKey = (event) => {
      if (event.key !== 'Enter' && event.key !== ' ') return
      const id = regionFromEvent(event)
      if (id) {
        event.preventDefault()
        selectRegion(id)
      }
    }
    svg.addEventListener('mouseover', onOver)
    svg.addEventListener('click', onOver)
    svg.addEventListener('keydown', onKey)
    // Full teardown so a re-run (e.g. React StrictMode's double-invoke, or
    // an HMR update) starts from a clean SVG instead of stacking duplicate
    // markers and attributes.
    return () => {
      svg.removeEventListener('mouseover', onOver)
      svg.removeEventListener('click', onOver)
      svg.removeEventListener('keydown', onKey)
      svg.querySelectorAll('.wp-marker').forEach((m) => m.remove())
      svg.querySelectorAll('.prefecture[data-region]').forEach((g) => {
        g.classList.remove('wp-target', 'wp-active')
        g.removeAttribute('data-region')
        g.removeAttribute('role')
        g.removeAttribute('tabindex')
        g.removeAttribute('aria-label')
        g.style.removeProperty('--cat')
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Highlight the active prefecture(s) + marker(s) whenever the selection
  // changes. activePaper (from the list) can light several regions at once.
  useEffect(() => {
    const svg = hostRef.current?.querySelector('svg')
    if (!svg) return
    const activeCodes = new Set()
    if (selectedRegion) regions.find((r) => r.id === selectedRegion)?.codes.forEach((c) => activeCodes.add(c))
    if (activePaper) {
      regions.filter((r) => r.papers.includes(activePaper)).forEach((r) => r.codes.forEach((c) => activeCodes.add(c)))
    }
    svg.querySelectorAll('.prefecture').forEach((g) => {
      g.classList.toggle('wp-active', activeCodes.has(g.getAttribute('data-code')))
    })
    svg.querySelectorAll('.wp-marker').forEach((dot) => {
      const region = regions.find((r) => r.id === dot.getAttribute('data-region'))
      const on = region ? region.codes.some((c) => activeCodes.has(c)) : false
      dot.classList.toggle('wp-marker-active', on)
    })
  }, [selectedRegion, activePaper, regions])

  const region = regions.find((r) => r.id === selectedRegion)
  const panelPapers = activePaper ? [activePaper] : region ? region.papers : []

  return (
    <div className={styles.page}>
      <div className={styles.intro}>
        <h1 className={styles.title}>{t('washiMapTitle')}</h1>
        <p className={styles.description}>{t('washiMapIntro')}</p>
        <div className={styles.desigLegend} aria-label={t('washiMapDesignationHeading')}>
          {designations.map((dsg) => (
            <span key={dsg.id} className={`${styles.desigChip} ${styles[`desig_${dsg.id}`]}`}>
              {dsg.mark} {lang === 'ja' ? dsg.name : dsg.nameEn}
            </span>
          ))}
        </div>
      </div>

      <div className={styles.mapLayout}>
        <figure className={styles.figure}>
          <div
            className={styles.mapHost}
            ref={hostRef}
            /* eslint-disable-next-line react/no-danger */
            dangerouslySetInnerHTML={{ __html: JAPAN_SVG }}
          />
        </figure>

        <aside className={styles.panel} aria-live="polite">
          {panelPapers.length === 0 ? (
            <p className={styles.hint}>{t('washiMapHint')}</p>
          ) : (
            <>
              {region && (
                <p className={styles.panelRegion}>
                  <span className={styles.panelRegionLabel}>{t('washiMapRegionLabel')}</span>
                  {lang === 'ja' ? region.name : region.nameEn}
                </p>
              )}
              {panelPapers.map((paperId) => {
                const p = papers[paperId]
                return (
                  <div key={paperId} className={styles.panelPaper}>
                    <div className={styles.panelPaperHead}>
                      <h2 className={styles.panelPaperName}>{p.name}</h2>
                      <span className={styles.panelReading}>{p.reading}</span>
                    </div>
                    <span className={`${styles.badge} ${styles[CATEGORY_CLASS[p.category]]}`}>
                      {lang === 'ja'
                        ? categories.find((c) => c.id === p.category)?.name
                        : categories.find((c) => c.id === p.category)?.nameEn}
                    </span>
                    {renderDesignations(p)}
                    <p className={styles.panelRegionLine}>{p.regionLabel}</p>
                    <p className={styles.panelDesc}>{p.desc}</p>
                  </div>
                )
              })}
            </>
          )}
        </aside>
      </div>

      <h2 className={styles.listHeading}>{t('washiMapListHeading')}</h2>
      {categories.map((cat) => (
        <Reveal as="section" key={cat.id} className={styles.catSection}>
          <h3 className={`${styles.catHeading} ${styles[CATEGORY_CLASS[cat.id]]}`}>
            {lang === 'ja' ? cat.name : cat.nameEn}
          </h3>
          <div className={styles.paperGrid}>
            {cat.papers.map((paperId) => {
              const p = papers[paperId]
              const pinned = Boolean(paperRegions[paperId])
              const selected = activePaper === paperId
              return (
                <button
                  key={paperId}
                  type="button"
                  className={`${styles.paperCard} ${selected ? styles.paperCardActive : ''}`}
                  onClick={() => selectPaper(paperId)}
                >
                  <div className={styles.paperCardHead}>
                    <span className={styles.paperName}>{p.name}</span>
                    <span className={styles.paperReading}>{p.reading}</span>
                  </div>
                  {renderDesignations(p)}
                  {pinned && <span className={styles.paperPin}>{t('washiMapOnMap')}</span>}
                  <p className={styles.paperDesc}>{p.desc}</p>
                </button>
              )
            })}
          </div>
        </Reveal>
      ))}
    </div>
  )
}

export default WashiMapPage
