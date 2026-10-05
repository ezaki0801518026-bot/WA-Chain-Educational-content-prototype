// What the assistant answers from, in the shape the Citations API needs — and
// the way back from a citation to something a reader can see.
//
// Imported by both sides, so the numbering cannot drift between them:
//   - functions/api/chat.js sends courseDocuments() to Claude.
//   - src/utils/chatStream.js turns a citation's (document, block) position
//     back into a labelled source with sourceFor().
//
// Documents: WA-Chain research (data/wa-chain-facts.json), one document per
// topic, one block per fact, shown to the reader as "WA-Chain research".
//
// The draft text lessons were taken out on 2026-10-05: the answers will rest on
// the material being made now, which is added here when it is ready. Until then
// the assistant has WA-Chain research and the web, nothing else.
//
// A citation names the document and block its text came from, and the API
// only returns positions that exist, so a source listed under an answer is
// always a real passage — the model cannot make one up.

import research from './wa-chain-facts.json'

export const RESEARCH_TITLE_PREFIX = 'WA-Chain research: '

export function courseDocuments() {
  return research.topics.map((topic) => ({
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
    context: 'Verified by the WA-Chain team against the sources listed with each fact.',
    citations: { enabled: true },
  }))
}

// documentIndex and blockIndex as the API returns them in a
// content_block_location citation. null if the position is unknown (which
// would mean the two sides were built from different data).
export function sourceFor(documentIndex, blockIndex) {
  const topic = research.topics[documentIndex]
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
