// Offline support: stale-while-revalidate for same-origin GET requests.
// Conservators often work in studios and workshops with poor connectivity,
// so once a lesson has been visited it stays readable offline.
// Bump when a file is replaced under a name that is already in the wild —
// image paths are not content-hashed, so stale-while-revalidate would
// otherwise show the previous portrait for one more load. Activation drops
// every cache that is not the current one.
const CACHE = 'washi-course-v2'

self.addEventListener('install', () => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  )
})

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET') return
  const url = new URL(request.url)
  if (url.origin !== self.location.origin) return

  event.respondWith(
    caches.open(CACHE).then(async (cache) => {
      const cached = await cache.match(request)
      const network = fetch(request)
        .then((response) => {
          if (response.ok) cache.put(request, response.clone())
          return response
        })
        .catch(async () => {
          // Offline: fall back to the app shell for navigations. Resolved
          // against the worker's own scope, so this also works when the site
          // is served from a sub-path (GitHub Pages project site).
          if (request.mode === 'navigate') {
            const scope = self.registration.scope
            return (await cache.match(`${scope}index.html`)) || (await cache.match(scope)) || cached
          }
          return cached
        })
      return cached || network
    }),
  )
})
