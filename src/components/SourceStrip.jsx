import { useLanguage } from '../i18n/LanguageContext.jsx'
import styles from './SourceStrip.module.css'

// Shows the sources a lesson step draws on, as a collapsed strip at the
// foot of the step. The list is folded away so it never competes with the
// reading column, but the count stays visible and the superscript markers
// in the prose are always shown — attribution is never hidden, only the
// full citations are.
//
// `citations` is a list of source ids (numbers) on the step; `sources` is
// the section-level list those ids index into. Renders nothing when a step
// declares no citations, so sections can be filled in gradually.
function SourceStrip({ citations, sources }) {
  const { t } = useLanguage()

  if (!citations?.length || !sources?.length) return null

  const cited = citations
    .map((id) => sources.find((s) => s.id === id))
    .filter(Boolean)

  if (!cited.length) return null

  return (
    <details className={styles.strip}>
      <summary className={styles.summary}>
        {t('stepSources', { n: cited.length })}
      </summary>
      <ol className={styles.list}>
        {cited.map((source) => (
          <li key={source.id} className={styles.item} value={source.id}>
            {source.text}
          </li>
        ))}
      </ol>
    </details>
  )
}

export default SourceStrip
