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
