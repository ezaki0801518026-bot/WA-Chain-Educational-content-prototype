import courses from '../../data/courses.json'
import lessons from '../../data/lessons.json'

// What to put in front of this reader, from their own answers.
//
// A small, readable scoring pass rather than anything clever: each item
// carries the answers it suits, and the ones that match the reader's answers
// rise. With no answers yet, the order is the course's own order, which is
// what a first-time visitor should see anyway. Every item says why it was
// picked, so the page can show the reason instead of a black box.

const VIDEO_TRAITS = {
  'kozo-provenance': { interest: ['sourcing'], level: ['some', 'using'], field: [] },
  'three-fibers': { interest: ['choosing', 'science'], level: ['new', 'some', 'using'], field: ['paper', 'painting', 'books'] },
}

const SECTION_TRAITS = {
  'section-1': { interest: ['cases'], field: ['painting'], level: ['new'] },
  'section-2': { interest: ['science'], level: ['some', 'using'] },
  'section-3': { interest: ['science', 'cases'], level: ['using'] },
  'section-4': { interest: ['choosing'], level: ['new', 'some', 'using'] },
  'section-5': { interest: ['making'], level: ['some', 'using'] },
}

const PLACE_TRAITS = {
  'washi-map': { interest: ['sourcing'] },
  tour: { interest: ['sourcing', 'making'] },
  glossary: { level: ['new'], interest: [] },
}

// Reasons are ids; the page turns them into wording in both languages.
function score(traits, profile) {
  if (!profile) return { points: 0, reason: null }
  let points = 0
  let reason = null
  for (const key of ['interest', 'level', 'field']) {
    if (traits[key]?.includes(profile[key])) {
      points += key === 'interest' ? 3 : key === 'level' ? 2 : 1
      if (!reason || key === 'interest') reason = `${key}:${profile[key]}`
    }
  }
  return { points, reason }
}

// watched: ids of lectures already finished (from progress/watch state), so
// they fall to the end rather than being recommended again.
export function recommend(profile, { watched = [], completed = [] } = {}) {
  const videos = courses.courses.map((course) => {
    const { points, reason } = score(VIDEO_TRAITS[course.id] || {}, profile)
    return { kind: 'video', id: course.id, route: `/watch/${course.id}`, item: course, points: points - (watched.includes(course.id) ? 10 : 0), reason, done: watched.includes(course.id) }
  })

  const sections = lessons.sections
    .filter((section) => section.active)
    .map((section, index) => {
      const { points, reason } = score(SECTION_TRAITS[section.id] || {}, profile)
      return {
        kind: 'lesson',
        id: section.id,
        route: `/lesson/${section.id}`,
        item: section,
        number: lessons.sections.findIndex((s) => s.id === section.id) + 1,
        points: points - index * 0.1 - (completed.includes(section.id) ? 10 : 0),
        reason,
        done: completed.includes(section.id),
      }
    })

  const places = Object.entries(PLACE_TRAITS).map(([id, traits]) => {
    const { points, reason } = score(traits, profile)
    return { kind: 'place', id, route: `/${id}`, points, reason }
  })

  const byPoints = (a, b) => b.points - a.points
  return {
    videos: videos.sort(byPoints),
    lessons: sections.sort(byPoints),
    places: places.sort(byPoints).filter((place) => place.points > 0),
  }
}
