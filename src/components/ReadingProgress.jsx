import styles from './ReadingProgress.module.css'

// Thin progress bar; the page that renders it decides where it sits.
// `value` is a 0..1 fraction — on lesson pages this is step progress,
// the honest measure of how far through the section the reader is.
function ReadingProgress({ value }) {
  const fraction = Math.min(1, Math.max(0, value))

  return (
    <div className={styles.track} aria-hidden="true">
      <div
        className={`${styles.fill} ${fraction === 0 ? styles.empty : ''}`}
        style={{ width: `${fraction * 100}%` }}
      />
    </div>
  )
}

export default ReadingProgress
