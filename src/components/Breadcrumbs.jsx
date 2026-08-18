import styles from './Breadcrumbs.module.css'

// Breadcrumb trail for the lesson flow (Home › Section — title › Lesson).
// `items` is an ordered list of { label, route? }; entries without a route
// (the current page) render as plain text.
function Breadcrumbs({ items, navigate }) {
  return (
    <nav aria-label="Breadcrumb" className={styles.crumbs}>
      <ol className={styles.list}>
        {items.map((item, index) => (
          <li key={index} className={styles.item}>
            {item.route ? (
              <button type="button" className={styles.link} onClick={() => navigate(item.route)}>
                {item.label}
              </button>
            ) : (
              <span className={styles.current} aria-current="page">
                {item.label}
              </span>
            )}
            {index < items.length - 1 && (
              <span className={styles.separator} aria-hidden="true">
                ›
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  )
}

export default Breadcrumbs
