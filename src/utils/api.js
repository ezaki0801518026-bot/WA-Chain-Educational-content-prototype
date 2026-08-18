// Where the Cloudflare Functions backend lives — or nowhere.
//
// functions/api/* only exists on a host that runs them (Cloudflare Pages
// with D1 configured). On a purely static host such as GitHub Pages there
// is no backend at all, and calling /api/... there produces a 404/405 on
// every page view: harmless, but it fills the console of a public site
// with errors and sends pointless requests.
//
// So the backend is opt-in. Set VITE_API_BASE at build time to enable it:
//
//   VITE_API_BASE=/ npm run build          # same origin (Cloudflare Pages)
//   VITE_API_BASE=https://api.example.com npm run build
//
// Unset (the default) means every call is skipped before it is made.
const RAW = import.meta.env.VITE_API_BASE || ''

export const hasApi = RAW !== ''

// Returns null when no backend is configured, so callers can bail out.
export function apiUrl(path) {
  if (!hasApi) return null
  const base = RAW.replace(/\/$/, '')
  return `${base}${path.startsWith('/') ? path : `/${path}`}`
}
