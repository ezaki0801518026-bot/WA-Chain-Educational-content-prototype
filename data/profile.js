// What we ask a conservator once, and what we do with the answers.
//
// Two features read this: the assistant (functions/api/chat.js receives it and
// pitches its answers at the right level) and the recommendations on the home
// page (src/utils/recommend.js). It is stored in the browser only — no
// account, no server copy — so it is deliberately small and never asks for a
// name, a workplace or anything identifying.
//
// Adding a question: append to QUESTIONS with a new id and options. Both
// readers ignore ids they do not know, so nothing breaks in between.

export const PROFILE_KEY = 'wa-chain-profile'

export const QUESTIONS = [
  {
    id: 'level',
    label: { en: 'How much do you work with washi?', ja: '和紙とのかかわりは？' },
    options: [
      { id: 'new', label: { en: 'New to it', ja: 'はじめて' } },
      { id: 'some', label: { en: 'Know a little', ja: '少し知っている' } },
      { id: 'using', label: { en: 'Use it in treatments', ja: '実務で使っている' } },
    ],
  },
  {
    id: 'field',
    label: { en: 'What do you work on?', ja: '専門分野は？' },
    options: [
      { id: 'paper', label: { en: 'Works on paper', ja: '紙作品' } },
      { id: 'painting', label: { en: 'Paintings', ja: '絵画' } },
      { id: 'books', label: { en: 'Books and bindings', ja: '書籍・製本' } },
      { id: 'other', label: { en: 'Something else', ja: 'その他' } },
    ],
  },
  {
    id: 'years',
    label: { en: 'Years in conservation', ja: '修復の経験年数' },
    options: [
      { id: 'student', label: { en: 'Studying', ja: '学んでいる' } },
      { id: 'under5', label: { en: 'Under 5', ja: '5年未満' } },
      { id: 'over5', label: { en: '5 or more', ja: '5年以上' } },
    ],
  },
  {
    id: 'interest',
    label: { en: 'What brings you here?', ja: '知りたいことは？' },
    options: [
      { id: 'choosing', label: { en: 'Choosing repair paper', ja: '補修紙の選定' } },
      { id: 'sourcing', label: { en: 'Where paper comes from', ja: '産地と調達' } },
      { id: 'science', label: { en: 'Why washi lasts', ja: '化学と保存性' } },
      { id: 'cases', label: { en: 'Treatment examples', ja: '修復の事例' } },
      { id: 'making', label: { en: 'How paper is made', ja: '紙の作り方' } },
    ],
  },
  {
    id: 'language',
    label: { en: 'Language you prefer', ja: 'ふだん使う言語' },
    options: [
      { id: 'en', label: { en: 'English', ja: '英語' } },
      { id: 'ja', label: { en: 'Japanese', ja: '日本語' } },
    ],
  },
]

const IDS = new Set(QUESTIONS.map((q) => q.id))

export function isComplete(profile) {
  return Boolean(profile) && QUESTIONS.every((q) => typeof profile[q.id] === 'string' && profile[q.id])
}

// Only known ids and known option values survive, so nothing a stale or
// tampered-with browser store holds can reach the model or the UI.
export function sanitiseProfile(input) {
  if (!input || typeof input !== 'object') return null
  const out = {}
  for (const question of QUESTIONS) {
    const value = input[question.id]
    if (typeof value === 'string' && question.options.some((option) => option.id === value)) {
      out[question.id] = value
    }
  }
  for (const key of Object.keys(out)) if (!IDS.has(key)) delete out[key]
  return Object.keys(out).length ? out : null
}

// One plain-English line per answer, for the assistant. Written as facts
// about the reader, not as instructions — the persona decides what to do.
export function profileLines(profile) {
  const clean = sanitiseProfile(profile)
  if (!clean) return []
  const say = {
    level: { new: 'New to washi', some: 'Knows a little about washi', using: 'Uses washi in treatments' },
    field: {
      paper: 'Works on paper objects',
      painting: 'Works on paintings',
      books: 'Works on books and bindings',
      other: 'Works on other kinds of object',
    },
    years: { student: 'Still studying conservation', under5: 'Under 5 years in conservation', over5: '5 or more years in conservation' },
    interest: {
      choosing: 'Here mainly to choose repair paper',
      sourcing: 'Here mainly for where paper comes from',
      science: 'Here mainly for the chemistry and permanence',
      cases: 'Here mainly for treatment examples',
      making: 'Here mainly for how paper is made',
    },
    language: { en: 'Prefers English', ja: 'Prefers Japanese' },
  }
  return QUESTIONS.map((q) => say[q.id]?.[clean[q.id]]).filter(Boolean)
}
