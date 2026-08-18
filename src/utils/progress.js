const STORAGE_KEY = 'washi-course-progress'

function readStore() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

function writeStore(store) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store))
}

// Returns the full progress object:
// { [sectionId]: { completed, quiz: { correct, total }, step, updatedAt } }
export function getProgress() {
  return readStore()
}

// Remembers how far into a section's lesson the reader has scrolled, so the
// home page can offer to resume and the lesson can reopen at that step.
// `updatedAt` lets the home page pick the *most recently* touched section.
export function setSectionStep(sectionId, step) {
  const store = readStore()
  store[sectionId] = { ...store[sectionId], step, updatedAt: Date.now() }
  writeStore(store)
}

export function setSectionComplete(sectionId) {
  const store = readStore()
  // Clear the saved step on completion so a finished section never shows up
  // as "continue where you left off".
  const { step, ...rest } = store[sectionId] || {}
  store[sectionId] = { ...rest, completed: true }
  writeStore(store)
}

export function setQuizResult(sectionId, correct, total) {
  const store = readStore()
  store[sectionId] = { ...store[sectionId], quiz: { correct, total } }
  writeStore(store)
}

export function resetProgress() {
  localStorage.removeItem(STORAGE_KEY)
}
