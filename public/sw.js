// Offline support: stale-while-revalidate for same-origin GET requests.
// Conservators often work in studios and workshops with poor connectivity,
// so once a lesson has been visited it stays readable offline.
// Bump when a file is replaced under a name that is already in the wild —
// image paths are not content-hashed, so stale-while-revalidate would
// otherwise show the previous portrait for one more load. Activation drops
// every cache that is not the current one.
//
// v3: v2 cached whole lecture videos, which is what this bump clears out.
// v4: the page itself (a navigation) is now network-first, so a deploy is
//     seen on the very next load instead of one load later. Before v4 a
//     visitor kept the previous build, bugs included, for one extra visit.
const CACHE = 'washi-course-v4'

// Requests this worker must never touch, and why:
//
// - Video, and anything asked for by byte range. A cached video is a whole
//   file and cache.match ignores the Range header, so every seek was answered
//   with the entire file from the start. Safari will not seek against that,
//   and every browser kept playing a lecture that had since been replaced.
//   Lectures are also too large to hold offline sensibly, and the server
//   already answers ranges correctly (server/range.js).
// - The API. The chat endpoint streams, and its probe must describe the
//   deployment that is live now, not one remembered from an earlier visit.
const BYPASS = /\/(videos|video|api)\//

self.addEventListener('install', () => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      // If storage is unusable, still take over: a stuck old worker is worse
      // than an uncleaned cache.
      .catch(() => {})
      .then(() => self.clients.claim()),
  )
})

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET') return
  if (request.headers.has('range')) return
  const url = new URL(request.url)
  if (url.origin !== self.location.origin) return
  if (BYPASS.test(url.pathname)) return
  event.respondWith(respond(request))
})

async function respond(request) {
  let cache
  let cached
  try {
    cache = await caches.open(CACHE)
    cached = await cache.match(request)
  } catch {
    // CacheStorage can fail outright. Measured in a real Chrome profile:
    // "Failed to execute 'open' on 'CacheStorage': Unexpected internal error".
    // v2 had no fallback here, so every request — the page itself included —
    // failed and the site would not load at all. Offline support is a bonus;
    // it must never stand between a visitor and the network.
    return fetch(request)
  }

  const network = fetch(request)
    .then((response) => {
      // Only complete responses: a partial (206) cannot be stored, and an
      // error page must not replace a good copy.
      if (response.status === 200) cache.put(request, response.clone()).catch(() => {})
      return response
    })
    .catch(async () => {
      // Offline: fall back to the app shell for navigations. Resolved against
      // the worker's own scope, so this also works when the site is served
      // from a sub-path (GitHub Pages project site).
      if (request.mode === 'navigate') {
        const scope = self.registration.scope
        const shell = (await cache.match(`${scope}index.html`).catch(() => null)) || (await cache.match(scope).catch(() => null))
        if (shell) return shell
      }
      if (cached) return cached
      throw new Error('offline')
    })

  // The HTML shell is tiny and names the hashed assets of the current build,
  // so it is always fetched fresh when the network is there; the cached copy
  // is only for offline. Everything else stays stale-while-revalidate.
  if (request.mode === 'navigate') {
    try {
      return await network
    } catch {
      return cached || Response.error()
    }
  }

  return cached || network
}
