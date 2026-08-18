import { useLanguage } from '../i18n/LanguageContext.jsx'
import styles from './SourceList.module.css'

// Full source list for a section, shown on the summary page. Each row
// carries the source, its type, and which steps it backs — so a reader can
// trace any statement back without hunting. `weight` (percent of the
// section's content drawn from that source) is optional; when every source
// declares one, a bar and the largest share are shown, which is how the
// project checks that no single source dominates a lesson.
function SourceList({ sources, aiNotice = true }) {
  const { t } = useLanguage()

  if (!sources?.length) return null

  const weighted = sources.every((s) => typeof s.weight === 'number')
  const heaviest = weighted
    ? sources.reduce((a, b) => (b.weight > a.weight ? b : a))
    : null

  return (
    <section className={styles.panel} aria-labelledby="section-sources">
      <h2 id="section-sources" className={styles.heading}>
        {t('sectionSources')}
      </h2>
      <p className={styles.sub}>{t('sectionSourcesIntro')}</p>

      <div className={styles.tableScroll}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th scope="col" className={styles.numCol}>
                #
              </th>
              <th scope="col">{t('sourceColSource')}</th>
              <th scope="col">{t('sourceColType')}</th>
              <th scope="col">{t('sourceColUsedIn')}</th>
              {weighted && <th scope="col">{t('sourceColShare')}</th>}
            </tr>
          </thead>
          <tbody>
            {sources.map((source) => (
              <tr key={source.id}>
                <td className={styles.num}>{source.id}</td>
                <td>{source.text}</td>
                <td className={styles.type}>{source.type}</td>
                <td className={styles.usedIn}>
                  {source.steps?.length
                    ? source.steps.map((n) => t('step', { n, total: '' }).replace(/\s*\/\s*$/, '')).join('・')
                    : '—'}
                </td>
                {weighted && <td className={styles.share}>{source.weight}%</td>}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {weighted && (
        <>
          <div className={styles.bar} aria-hidden="true">
            {sources.map((source, index) => (
              <i
                key={source.id}
                className={styles.barPart}
                style={{ width: `${source.weight}%`, opacity: 1 - index * 0.18 }}
              />
            ))}
          </div>
          <p className={styles.weightNote}>
            {t('sourceWeightNote', { n: heaviest.id, pct: heaviest.weight })}
          </p>
        </>
      )}

      {aiNotice && <p className={styles.aiNotice}>{t('aiDisclosure')}</p>}
    </section>
  )
}

export default SourceList
