import styles from './PullQuote.module.css'

// A single emphasized sentence, lifted verbatim from the surrounding step
// text (editorial pull-quote convention — repetition is the point, not an
// error). Rendered as its own <blockquote> so it reads as a typographic
// accent, not new content.
function PullQuote({ text }) {
  if (!text) return null

  return (
    <blockquote className={styles.quote}>
      <p className={styles.text}>{text}</p>
    </blockquote>
  )
}

export default PullQuote
