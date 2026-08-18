// GET /api/newsletter — Substack RSS → JSON proxy.
//
// Reads the feed URL from the SUBSTACK_FEED_URL environment variable
// (e.g. https://wachain.substack.com/feed). Until it is set, responds
// with an empty list so the News page renders unchanged. The upstream
// fetch is edge-cached for an hour, so Substack sees at most ~24
// requests a day regardless of traffic.

const pick = (xml, tag) => {
  const m = xml.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, 'i'))
  if (!m) return ''
  return m[1]
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/<[^>]+>/g, '')
    .trim()
}

export async function onRequestGet({ env }) {
  if (!env.SUBSTACK_FEED_URL) {
    return Response.json({ configured: false, posts: [] })
  }

  let xml
  try {
    const upstream = await fetch(env.SUBSTACK_FEED_URL, {
      cf: { cacheTtl: 3600, cacheEverything: true },
      headers: { accept: 'application/rss+xml, application/xml, text/xml' },
    })
    if (!upstream.ok) throw new Error(`upstream ${upstream.status}`)
    xml = await upstream.text()
  } catch {
    return Response.json({ configured: true, posts: [] }, { status: 200 })
  }

  const items = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)].slice(0, 10)
  const posts = items.map(([, item]) => ({
    title: pick(item, 'title'),
    url: pick(item, 'link'),
    date: pick(item, 'pubDate'),
    excerpt: pick(item, 'description').slice(0, 200),
  }))

  return Response.json(
    { configured: true, posts },
    { headers: { 'cache-control': 'public, max-age=1800' } },
  )
}
