import styles from './ProgressIndicator.module.css'

// Plain-text progress caption only — no visual progress bar, per the
// "progress display is factual only" constraint.
function ProgressIndicator({ text }) {
  return <p className={styles.indicator}>{text}</p>
}

export default ProgressIndicator
