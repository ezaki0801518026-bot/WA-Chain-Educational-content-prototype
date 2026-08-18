// Single source of truth for where every form on the site sends its data:
// the section-request survey, the waitlist signups, and the feedback form
// all go through submitForm() below. To change providers or the target
// inbox, edit only this file.
//
// Provider: Web3Forms (https://web3forms.com). It delivers straight to an
// inbox with no redirect and proper CORS, and the access key is designed to
// live in front-end code (it is not a secret — it only routes mail to the
// address it was registered with).
//
// ┌─────────────────────────────────────────────────────────────────────┐
// │ SETUP (one time, ~30 seconds):                                        │
// │  1. Go to https://web3forms.com and enter wachain2026@gmail.com       │
// │  2. An access key is emailed to you instantly.                        │
// │  3. Paste it below in place of PLACEHOLDER — that's it. Every form     │
// │     (survey, waitlist, feedback) starts delivering immediately.       │
// └─────────────────────────────────────────────────────────────────────┘
export const WEB3FORMS_ACCESS_KEY = '33778fe8-f535-47dd-beb1-62e978cf06aa'

const ENDPOINT = 'https://api.web3forms.com/submit'
const REQUEST_TIMEOUT_MS = 10000

// True once a real key has been set, so the UI can point the user at the
// setup step instead of silently failing during local testing.
export const formsConfigured = WEB3FORMS_ACCESS_KEY !== 'PASTE-YOUR-WEB3FORMS-ACCESS-KEY-HERE'

// Shared POST helper. Accepts a plain payload; `_subject` (kept for
// readability at the call sites) is mapped to Web3Forms' `subject` field.
// Bounded timeout so a blocked/slow network resolves to a definite failure
// instead of hanging a form forever. Resolves true on success, throws
// otherwise (callers show a retryable error).
export async function submitForm(payload) {
  const { _subject, ...fields } = payload
  const body = { access_key: WEB3FORMS_ACCESS_KEY, subject: _subject, ...fields }

  const controller = new AbortController()
  const timeoutId = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)
  try {
    const res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal,
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok || !data.success) throw new Error(data.message || `Request failed: ${res.status}`)
    return true
  } finally {
    window.clearTimeout(timeoutId)
  }
}
