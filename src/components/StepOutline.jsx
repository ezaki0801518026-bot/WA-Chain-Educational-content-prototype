import styles from './StepOutline.module.css'

// Wide-viewport-only step list for the current section, shown in the
// left margin beside the reading column. Lets a reader see where they are
// in the section at a glance and jump directly to another step. Hidden
// entirely below the desktop breakpoint (see StepOutline.module.css).
function StepOutline({ steps, currentIndex, onSelect }) {
  return (
    <nav className={styles.outline} aria-label="Section steps">
      <ol className={styles.list}>
        {steps.map((step, index) => {
          const isCurrent = index === currentIndex
          return (
            <li key={step.id}>
              <button
                type="button"
                className={isCurrent ? `${styles.item} ${styles.itemCurrent}` : styles.item}
                aria-current={isCurrent ? 'step' : undefined}
                onClick={() => onSelect(index)}
              >
                <span className={styles.itemNumber}>{index + 1}</span>
                <span className={styles.itemHeading}>{step.heading}</span>
              </button>
            </li>
          )
        })}
      </ol>
    </nav>
  )
}

export default StepOutline
