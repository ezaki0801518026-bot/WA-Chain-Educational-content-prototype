import { PROFILE_KEY, sanitiseProfile } from '../../data/profile.js'

// The reader's own answers, kept in this browser only. There is no account
// and no server copy, so every read has to survive private mode, cleared
// storage and a stale shape.

export function readProfile() {
  try {
    return sanitiseProfile(JSON.parse(localStorage.getItem(PROFILE_KEY) || 'null'))
  } catch {
    return null
  }
}

export function writeProfile(profile) {
  const clean = sanitiseProfile(profile)
  try {
    if (clean) localStorage.setItem(PROFILE_KEY, JSON.stringify(clean))
    else localStorage.removeItem(PROFILE_KEY)
  } catch {
    /* private mode: the answers just do not persist */
  }
  return clean
}

// Set when the visitor closes the setup without answering, so they are asked
// once and not on every visit.
const SKIP_KEY = 'wa-chain-profile-skipped'

export function wasSkipped() {
  try {
    return localStorage.getItem(SKIP_KEY) === '1'
  } catch {
    return true
  }
}

export function markSkipped() {
  try {
    localStorage.setItem(SKIP_KEY, '1')
  } catch {
    /* nothing to remember it with; the setup may appear again */
  }
}

// A gentle reminder for visitors who closed the setup: shown on the home
// page from their next visit (a new browser session) onwards, until they
// answer, or put it away for a week with "Not now".
const SKIP_SESSION_KEY = 'wa-chain-profile-skip-session'
const REMIND_OFF_KEY = 'wa-chain-profile-remind-off'
const REMIND_SNOOZE_MS = 7 * 24 * 60 * 60 * 1000

export function markSkippedThisSession() {
  try {
    sessionStorage.setItem(SKIP_SESSION_KEY, '1')
  } catch {
    /* no session storage: the reminder may show a little early */
  }
}

export function shouldRemind() {
  try {
    if (readProfile() || !wasSkipped()) return false
    if (sessionStorage.getItem(SKIP_SESSION_KEY) === '1') return false
    const off = Number(localStorage.getItem(REMIND_OFF_KEY) || 0)
    return Date.now() - off > REMIND_SNOOZE_MS
  } catch {
    return false
  }
}

export function snoozeReminder() {
  try {
    localStorage.setItem(REMIND_OFF_KEY, String(Date.now()))
  } catch {
    /* nothing to remember it with */
  }
}
