import { sourceFor } from '../../data/chat-corpus.js'

// Reads the assistant's reply as it arrives. /api/chat passes Anthropic's
// server-sent events straight through (the Worker cannot afford to parse them
// — see functions/api/chat.js), so the parsing happens here instead.
//
// onUpdate(answer) is called whenever there is new text, with the whole answer
// so far. Resolves to the final { answer, truncated, code }:
//   - truncated: the reply hit the length ceiling
//   - code: 'busy' | 'error' when the stream reported a failure part-way
export async function readAnswer(response, onUpdate) {
  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  const blocks = []
  let buffer = ''
  let stopReason = null
  let code = null
  let finished = false

  const handle = (event) => {
    switch (event.type) {
      case 'content_block_start':
        blocks[event.index] = { type: event.content_block?.type, text: '', citations: [] }
        break
      case 'content_block_delta': {
        const block = blocks[event.index]
        if (!block || block.type !== 'text') break
        if (event.delta?.type === 'text_delta') block.text += event.delta.text
        if (event.delta?.type === 'citations_delta') block.citations.push(event.delta.citation)
        return true
      }
      case 'message_delta':
        stopReason = event.delta?.stop_reason ?? stopReason
        break
      case 'message_stop':
        finished = true
        break
      case 'error':
        code = event.error?.type === 'overloaded_error' || event.error?.type === 'rate_limit_error' ? 'busy' : 'error'
        break
      default:
    }
    return false
  }

  for (;;) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true }).replace(/\r\n/g, '\n')

    let changed = false
    let boundary
    while ((boundary = buffer.indexOf('\n\n')) !== -1) {
      const chunk = buffer.slice(0, boundary)
      buffer = buffer.slice(boundary + 2)
      const data = chunk
        .split('\n')
        .filter((l) => l.startsWith('data:'))
        .map((l) => l.slice(5).trimStart())
        .join('\n')
      if (!data) continue
      try {
        if (handle(JSON.parse(data))) changed = true
      } catch {
        // A malformed event is skipped, never thrown at the visitor.
      }
    }
    if (changed) onUpdate(assemble(blocks))
  }

  // A stream that ends without message_stop was cut off on the way — say so
  // rather than presenting half an answer as a whole one.
  if (!finished && !code) code = 'error'
  return { answer: assemble(blocks), truncated: stopReason === 'max_tokens', code }
}

// Turns content blocks into what the bubble shows:
//   parts:   [{ text, refs: [1, 2] }]  — refs are footnote numbers for that text
//   sources: [{ n, sectionId, sectionNumber, sectionTitle, stepIndex, stepHeading, quote }]
// Sources are numbered in order of first use, one per course passage, so the
// same step cited twice keeps the same number.
export function assemble(blocks) {
  const sources = []
  const numberOf = new Map()
  const parts = []

  for (const block of blocks) {
    if (!block || block.type !== 'text') continue
    const refs = []
    for (const citation of block.citations) {
      if (citation?.type !== 'content_block_location') continue
      const last = Math.max(citation.start_block_index, (citation.end_block_index ?? citation.start_block_index + 1) - 1)
      for (let index = citation.start_block_index; index <= last; index += 1) {
        const source = sourceFor(citation.document_index, index)
        if (!source) continue
        const key = `${citation.document_index}:${index}`
        if (!numberOf.has(key)) {
          numberOf.set(key, sources.length + 1)
          sources.push({ n: sources.length + 1, ...source, quote: citation.cited_text || '' })
        }
        const n = numberOf.get(key)
        if (!refs.includes(n)) refs.push(n)
      }
    }
    parts.push({ text: block.text, refs })
  }

  return { parts, sources, text: parts.map((part) => part.text).join('') }
}
