import { useEffect, useState } from 'react'
import news from '../../data/news.json'
import Reveal from '../components/Reveal.jsx'
import { useLanguage } from '../i18n/LanguageContext.jsx'
import styles from './NewsPage.module.css'
import { asset } from '../utils/asset.js'

// News index — a thumbnail grid in the style of a company news page
// (date + category chip + title per card). Each card opens the full
// article at /news/<id>; content lives in data/news.json.
function NewsPage({ navigate }) {
  const { t, lang } = useLanguage()
  const pick = (field) => field[lang] || field.en

  // Newsletter posts appear automatically once the Substack feed is
  // configured server-side (see functions/api/newsletter.js). Local dev
  // and unconfigured deploys silently render nothing extra.
  const [newsletter, setNewsletter] = useState([])
  useEffect(() => {
    let cancelled = false
    fetch('/api/newsletter')
      .then((res) => (res.ok ? res.json() : { posts: [] }))
      .then((data) => {
        if (!cancelled && Array.isArray(data.posts)) setNewsletter(data.posts.slice(0, 5))
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <p className={styles.eyebrow}>{t('newsEyebrow')}</p>
        <h1 className={styles.title}>{t('newsTitle')}</h1>
        <p className={styles.lede}>{t('newsLede')}</p>
      </header>

      {newsletter.length > 0 && (
        <section className={styles.newsletterBand}>
          <h2 className={styles.newsletterHeading}>{t('newsFromNewsletter')}</h2>
          <ul className={styles.newsletterList}>
            {newsletter.map((post) => (
              <li key={post.url}>
                <a
                  className={styles.newsletterLink}
                  href={post.url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <span className={styles.newsletterTitle}>{post.title} ↗</span>
                  {post.date && <span className={styles.newsletterDate}>{post.date}</span>}
                </a>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className={styles.grid}>
        {news.posts.map((post) => (
          <Reveal as="article" key={post.id} className={styles.card}>
            <button type="button" className={styles.cardButton} onClick={() => navigate(`/news/${post.id}`)}>
              <span className={styles.thumbWrap}>
                <img
                  className={styles.thumb}
                  src={asset(post.image)}
                  alt={post.imageAlt}
                  loading="lazy"
                />
                {post.kicker && <span className={styles.kicker}>{pick(post.kicker)}</span>}
              </span>
              <span className={styles.cardTitle}>{pick(post.title)}</span>
              <span className={styles.meta}>
                <span className={styles.category}>{pick(post.category)}</span>
                <span className={styles.date}>{pick(post.dateLabel)}</span>
              </span>
            </button>
          </Reveal>
        ))}
      </div>
    </div>
  )
}

export default NewsPage
