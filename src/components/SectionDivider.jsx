import styles from './SectionDivider.module.css'

// A single curved ink-brush stroke marking a section boundary — a quiet
// alternative to a plain <hr>, echoing sumi calligraphy rather than a
// hard rule.
function SectionDivider() {
  return (
    <svg className={styles.divider} viewBox="0 0 240 24" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
      <path
        d="M4,16 C40,4 90,20 120,10 C150,2 190,18 236,8
           C232,14 200,22 160,18 C120,14 70,4 34,16
           C20,20 8,20 4,16 Z"
      />
    </svg>
  )
}

export default SectionDivider
