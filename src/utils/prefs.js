// Lightweight UI preferences kept separate from lesson *progress*.
// Currently just the reader's format lean (read vs. watch), which the
// section micro-feedback attaches to its submission so the team can see
// whether people prefer text or video (hypothesis D-1).
const FORMAT_KEY = 'washi-course-format-pref'

export function getFormatPref() {
  try {
    return localStorage.getItem(FORMAT_KEY) || 'read'
  } catch {
    return 'read'
  }
}

export function setFormatPref(value) {
  try {
    localStorage.setItem(FORMAT_KEY, value)
  } catch {
    // ignore — a failed write just means the default ('read') is used
  }
}
