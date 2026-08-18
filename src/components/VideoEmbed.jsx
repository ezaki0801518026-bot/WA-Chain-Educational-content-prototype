import styles from './VideoEmbed.module.css'

// Turns a normal YouTube/Vimeo share link into its privacy-friendly embed
// URL. Accepts youtu.be/ID, youtube.com/watch?v=ID, vimeo.com/ID, or an
// already-built embed URL. Returns null for anything unrecognised/empty so
// the component can render nothing until a real link is supplied.
function toEmbedSrc(url) {
  if (!url) return null
  try {
    const u = new URL(url)
    const host = u.hostname.replace(/^www\./, '')
    if (host === 'youtu.be') return `https://www.youtube-nocookie.com/embed/${u.pathname.slice(1)}`
    if (host.endsWith('youtube.com')) {
      if (u.pathname.startsWith('/embed/')) return url
      const id = u.searchParams.get('v')
      return id ? `https://www.youtube-nocookie.com/embed/${id}` : null
    }
    if (host.endsWith('vimeo.com')) {
      if (host === 'player.vimeo.com') return url
      const id = u.pathname.split('/').filter(Boolean)[0]
      return id ? `https://player.vimeo.com/video/${id}` : null
    }
    return url
  } catch {
    return null
  }
}

// Responsive 16:9 embed. Renders nothing until a valid URL is provided, so
// pages can include it unconditionally without showing an empty frame.
function VideoEmbed({ url, title }) {
  const src = toEmbedSrc(url)
  if (!src) return null

  return (
    <div className={styles.wrap}>
      <iframe
        className={styles.frame}
        src={src}
        title={title || 'Video'}
        loading="lazy"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
        allowFullScreen
      />
    </div>
  )
}

export default VideoEmbed
