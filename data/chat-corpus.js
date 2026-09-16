// The course material the assistant answers from, in the shape the Citations
// API needs — and the way back from a citation to a place in the course.
//
// Imported by both sides, so the numbering cannot drift between them:
//   - functions/api/chat.js sends courseDocuments() to Claude.
//   - src/pages/ChatPage.jsx turns a citation's (document, block) position
//     back into "Section 4 · Kōzo" with sourceFor().
//
// One document per published section; inside it, block 0 is the section
// overview and block N is step N. A citation names the document and block the
// quoted text came from, and the API only returns positions that exist, so a
// source shown under an answer is always a real passage — the model cannot
// write a section number that isn't there.

import lessons from './lessons.json'

// Sections numbered as the course numbers them (their place in lessons.json),
// keeping only the ones that are published.
const published = lessons.sections
  .map((section, index) => ({ section, number: index + 1 }))
  .filter(({ section }) => section.active)

function blocksFor(section) {
  const overview = [section.description, ...(section.summaryPoints || []).map((point) => `- ${point}`)]
    .filter(Boolean)
    .join('\n')
  const steps = (section.steps || []).map((step) =>
    [step.heading, ...(step.paragraphs || [])].filter(Boolean).join('\n\n')
  )
  return [overview || section.title, ...steps]
}

export function courseDocuments() {
  return published.map(({ section, number }) => ({
    type: 'document',
    source: {
      type: 'content',
      content: blocksFor(section).map((text) => ({ type: 'text', text })),
    },
    title: `Section ${number}: ${section.title}`,
    citations: { enabled: true },
  }))
}

// documentIndex and blockIndex as the API returns them in a
// content_block_location citation. null if the position is unknown (which
// would mean the two sides were built from different lessons.json).
export function sourceFor(documentIndex, blockIndex) {
  const entry = published[documentIndex]
  if (!entry) return null
  const { section, number } = entry
  const stepIndex = blockIndex - 1
  const step = stepIndex >= 0 ? section.steps?.[stepIndex] : null
  if (blockIndex !== 0 && !step) return null
  return {
    sectionId: section.id,
    sectionNumber: number,
    sectionTitle: section.title,
    stepIndex: step ? stepIndex : null,
    stepHeading: step ? step.heading : null,
  }
}
