import news from '../../data/news.json'
import Reveal from '../components/Reveal.jsx'
import { useLanguage } from '../i18n/LanguageContext.jsx'
import styles from './NewsArticlePage.module.css'
import { asset } from '../utils/asset.js'

// One news article at /news/<id>: category + date, headline, hero image,
// body paragraphs, then captioned photos — the standard corporate
// news-detail layout. Content comes from data/news.json.
//
// `backTo` and `backLabelKey` exist because the standalone About build
// reuses this page but has no news index to return to — there it goes
// back to the About page instead.
function NewsArticlePage({ id, navigate, backTo = '/news', backLabelKey = 'newsBackToList' }) {
  const { t, lang } = useLanguage()
  const pick = (field) => field[lang] || field.en
  const post = news.posts.find((p) => p.id === id)

  if (!post) {
    return (
      <div className={styles.page}>
        <p className={styles.notFound}>{t('newsNotFound')}</p>
        <button type="button" className={styles.backButton} onClick={() => navigate(backTo)}>
          {t(backLabelKey)}
        </button>
      </div>
    )
  }

  return (
    <article className={styles.page}>
      <button type="button" className={styles.backLink} onClick={() => navigate(backTo)}>
        ← {t(backLabelKey)}
      </button>

      <header className={styles.header}>
        <p className={styles.meta}>
          <span className={styles.category}>{pick(post.category)}</span>
          <span className={styles.date}>{pick(post.dateLabel)}</span>
        </p>
        <h1 className={styles.title}>{pick(post.title)}</h1>
      </header>

      <figure className={styles.heroFigure}>
        <img className={styles.heroImg} src={asset(post.image)} alt={post.imageAlt} />
      </figure>

      <div className={styles.body}>
        {pick(post.paragraphs).map((paragraph, index) => (
          <p key={index} className={styles.paragraph}>
            {paragraph}
          </p>
        ))}
      </div>

      {post.links?.length > 0 && (
        <div className={styles.linksSection}>
          <h2 className={styles.linksHeading}>{t('newsRelatedLinks')}</h2>
          <ul className={styles.linksList}>
            {post.links.map((link) => (
              <li key={link.url}>
                <a
                  className={styles.relatedLink}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {pick(link.label)}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}

      {post.photos.length > 0 && (
        <div className={styles.photoGrid}>
          {post.photos.map((photo) => (
            <Reveal as="figure" key={photo.src} className={styles.photoFigure}>
              <img
                className={styles.photo}
                src={asset(photo.src)}
                alt={photo.alt}
                loading="lazy"
              />
              <figcaption className={styles.photoCaption}>{pick(photo.caption)}</figcaption>
            </Reveal>
          ))}
        </div>
      )}

      <footer className={styles.footer}>
        <button type="button" className={styles.backButton} onClick={() => navigate(backTo)}>
          {t(backLabelKey)}
        </button>
      </footer>
    </article>
  )
}

export default NewsArticlePage
