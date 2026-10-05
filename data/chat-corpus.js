// What the assistant answers from, in the shape the Citations API needs — and
// the way back from a citation to something a reader can open.
//
// Imported by both sides, so the numbering cannot drift between them:
//   - functions/api/chat.js sends courseDocuments() to Claude.
//   - src/utils/chatStream.js turns a citation's (document, block) position
//     back into a labelled source with sourceFor().
//
// Documents, in this order:
//   1. The draft text lessons: one document per published section. Block 0 is
//      the section overview, block N is step N. Prototype drafts (AI-written, only
//      partly fact-checked), labelled so to the model and the reader. They are not
//      offered on the site any more (2026-10-05), so a citation names the passage
//      but links nowhere. They stay only until the new material replaces them.
//   2. WA-Chain research (data/wa-chain-facts.json): one document per topic,
//      one block per fact. Shown to the reader as "WA-Chain research".
// A citation names the document and block its text came from, and the API
// only returns positions that exist, so a source listed under an answer is
// always a real passage — the model cannot make one up.

import lessons from './lessons.json'
import research from './wa-chain-facts.json'

// Sections numbered as the course numbers them (their place in lessons.json),
// keeping only the ones that are published.
const published = lessons.sections
  .map((section, index) => ({ section, number: index + 1 }))
  .filter(({ section }) => section.active)

export const RESEARCH_TITLE_PREFIX = 'WA-Chain research: '

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
  const course = published.map(({ section, number }) => ({
    type: 'document',
    source: {
      type: 'content',
      content: blocksFor(section).map((text) => ({ type: 'text', text })),
    },
    title: `Section ${number}: ${section.title}`,
    context: 'Prototype draft teaching material: written with generative AI from a summary of Japanese reference literature, only partly fact-checked. Not available to readers on the site.',
    citations: { enabled: true },
  }))
  const facts = research.topics.map((topic) => ({
    type: 'document',
    source: {
      type: 'content',
      // The confidence travels with the fact, so the model can say how firm it is.
      content: topic.facts.map((fact) => ({
        type: 'text',
        text: `${fact.title}\n\n${fact.text}\n\nConfidence: ${fact.confidence}.`,
      })),
    },
    title: `${RESEARCH_TITLE_PREFIX}${topic.title}`,
    context: 'Verified by the WA-Chain team against the sources listed with each fact. Not part of the course lessons.',
    citations: { enabled: true },
  }))
  return [...course, ...facts]
}

// documentIndex and blockIndex as the API returns them in a
// content_block_location citation. null if the position is unknown (which
// would mean the two sides were built from different data).
export function sourceFor(documentIndex, blockIndex) {
  if (documentIndex < published.length) {
    const { section, number } = published[documentIndex]
    const stepIndex = blockIndex - 1
    const step = stepIndex >= 0 ? section.steps?.[stepIndex] : null
    if (blockIndex !== 0 && !step) return null
    return {
      kind: 'course',
      sectionId: section.id,
      sectionNumber: number,
      sectionTitle: section.title,
      stepIndex: step ? stepIndex : null,
      stepHeading: step ? step.heading : null,
    }
  }
  const topic = research.topics[documentIndex - published.length]
  const fact = topic?.facts[blockIndex]
  if (!fact) return null
  return {
    kind: 'research',
    topicTitle: topic.title,
    factTitle: fact.title,
    confidence: fact.confidence,
    references: fact.sources,
  }
}
