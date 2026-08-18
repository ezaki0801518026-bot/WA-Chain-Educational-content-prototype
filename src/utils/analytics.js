// Anonymous learning-event tracking (POST /api/event).
//
// Events queue locally and flush in small batches — via sendBeacon when
// available so page navigation never blocks on telemetry. Everything
// fails silently: in local dev (no functions runtime) or before the D1
// database is configured, events simply vanish. No personal data is
// collected; see functions/api/event.js for what is stored.
//
// Without VITE_API_BASE there is no backend to send to (a static host such
// as GitHub Pages), so nothing is queued and no request is ever made.
import { apiUrl, hasApi } from './api.js'

const ENDPOINT = apiUrl('/api/event')
const FLUSH_AFTER = 10
const FLUSH_DELAY_MS = 3000

let queue = []
let timer = null

function flush() {
  if (timer) {
    clearTimeout(timer)
    timer = null
  }
  if (queue.length === 0) return
  const body = JSON.stringify(queue)
  queue = []
  try {
    if (navigator.sendBeacon) {
      navigator.sendBeacon(ENDPOINT, new Blob([body], { type: 'application/json' }))
    } else {
      fetch(ENDPOINT, { method: 'POST', body, keepalive: true }).catch(() => {})
    }
  } catch {
    // Telemetry must never surface an error to the user.
  }
}

export function track(type, fields = {}) {
  if (!hasApi) return
  try {
    queue.push({
      type,
      path: window.location.hash.replace(/^#/, '') || '/',
      lang: localStorage.getItem('washi-course-lang') || '',
      ...fields,
    })
    if (queue.length >= FLUSH_AFTER) flush()
    else if (!timer) timer = window.setTimeout(flush, FLUSH_DELAY_MS)
  } catch {
    // Ignore — see above.
  }
}

if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') flush()
  })
}
