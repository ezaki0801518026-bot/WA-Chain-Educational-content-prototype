import { useLanguage } from '../i18n/LanguageContext.jsx'
import { track } from '../utils/analytics.js'
import styles from './AudienceGateway.module.css'

// The two front doors, directly under the hero. The site serves two very
// different audiences — overseas conservators (the course, in English)
// and Japanese supporters/partners (activities and the team) — so each
// door is written in its audience's language and, when opened, switches
// the UI language to match. Deliberately NOT localized via t(): both
// doors must be legible to both audiences at the same time.
function AudienceGateway({ navigate }) {
  const { setLang } = useLanguage()

  const enter = (choice) => {
    track('gateway_choice', { detail: choice })
    if (choice === 'conservators') {
      setLang('en')
      navigate('/course')
    } else {
      setLang('ja')
      navigate('/about')
    }
  }

  return (
    <section className={styles.gateway} aria-label="Choose your entrance">
      <button type="button" className={`${styles.door} ${styles.doorInk}`} onClick={() => enter('conservators')}>
        <span className={styles.doorKicker}>For Conservators</span>
        <span className={styles.doorTitle}>Learn the science of washi</span>
        <span className={styles.doorSub}>The online course, in English — built with Japanese conservation sources</span>
        <span className={styles.doorHint} lang="ja">
          海外の修復師の方へ（英語講座）
        </span>
        <span className={styles.doorArrow} aria-hidden="true">
          →
        </span>
      </button>

      <button type="button" className={`${styles.door} ${styles.doorPaper}`} onClick={() => enter('activities')}>
        <span className={styles.doorKicker} lang="ja">
          支援者・パートナーの方へ
        </span>
        <span className={styles.doorTitle} lang="ja">
          私たちの活動を知る
        </span>
        <span className={styles.doorSub} lang="ja">
          ミッション・活動実績・チーム紹介・最新の活動報告
        </span>
        <span className={styles.doorHint}>Our story &amp; activities (Japanese)</span>
        <span className={styles.doorArrow} aria-hidden="true">
          →
        </span>
      </button>
    </section>
  )
}

export default AudienceGateway
