// Resolves a path under `public/` against the deployment base.
//
// The site is built with an absolute base (`/` by default, `/<repo>/` for a
// GitHub Pages project site — see BASE_PATH in vite.config.js). Vite rewrites
// the URLs it generates itself, but paths written by hand or stored in
// data/*.json are opaque strings, so they have to be prefixed here.
//
// Encoding happens here too: most photo filenames are Japanese, and a raw
// multi-byte path in an attribute is only saved by browser leniency.
const BASE = import.meta.env.BASE_URL.replace(/\/$/, '')

export function asset(path) {
  if (!path) return path
  // Leave anything already absolute alone: http(s), protocol-relative, data:.
  if (/^([a-z][a-z0-9+.-]*:|\/\/)/i.test(path)) return path
  const rooted = path.startsWith('/') ? path : `/${path}`
  return BASE + encodeURI(rooted)
}

export default asset
