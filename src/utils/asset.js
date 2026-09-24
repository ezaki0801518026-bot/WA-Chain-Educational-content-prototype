// Resolves a path under `public/` against the deployment base.
//
// The site is built with an absolute base (`/` by default, `/<repo>/` for a
// GitHub Pages project site — see BASE_PATH in vite.config.js). Vite rewrites
// the URLs it generates itself, but paths written by hand or stored in
// data/*.json are opaque strings, so they have to be prefixed here.
//
// Encoding happens here too: most photo filenames are Japanese, and a raw
// multi-byte path in an attribute is only saved by browser leniency.
import manifest from '../imageManifest.json'

const BASE = import.meta.env.BASE_URL.replace(/\/$/, '')

export function asset(path) {
  if (!path) return path
  // Leave anything already absolute alone: http(s), protocol-relative, data:.
  if (/^([a-z][a-z0-9+.-]*:|\/\/)/i.test(path)) return path
  const rooted = path.startsWith('/') ? path : `/${path}`
  return BASE + encodeURI(rooted)
}

export default asset

// Responsive photo attributes. `scripts/images.mjs` writes WebP variants
// next to each photo and lists them in imageManifest.json; this turns a
// photo path into { src, srcSet, sizes } for an <img>. `src` stays the
// original file, so a browser without srcset still gets a picture, while
// every current browser picks the WebP nearest to the rendered width.
// Paths not in the manifest (or absolute URLs) fall back to { src } only.
export function picture(path, sizes = '100vw') {
  if (!path) return { src: path }
  if (/^([a-z][a-z0-9+.-]*:|\/\/)/i.test(path)) return { src: path }
  let key = path
  try {
    key = decodeURI(path)
  } catch {
    // leave as is
  }
  if (!key.startsWith('/')) key = `/${key}`
  const entry = manifest[key]
  if (!entry) return { src: asset(path) }
  const stem = key.slice(0, key.lastIndexOf('.'))
  return {
    src: asset(key),
    srcSet: entry.widths.map((w) => `${asset(`${stem}.w${w}.webp`)} ${w}w`).join(', '),
    sizes,
  }
}
