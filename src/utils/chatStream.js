import { sourceFor } from '../../data/chat-corpus.js'

// Reads the assistant's reply as it arrives. /api/chat passes Anthropic's
// server-sent events straight through (the Worker cannot afford to parse them
// — see functions/api/chat.js), so the parsing happens here instead.
//
// onUpdate(answer) is called whenever something visible changes, with the
// whole answer so far (see assemble). Resolves to { answer, truncated, code }:
//   - truncated: the reply hit a ceiling (length, or too many search rounds)
//   - code: 'busy' | 'error' when the stream failed part-way
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
      case 'content_block_start': {
        const start = event.content_block || {}
        blocks[event.index] = {
          type: start.type,
          text: '',
          citations: [],
          query: '',
          results: Array.isArray(start.content) ? start.content : [],
        }
        return start.type === 'server_tool_use' || start.type === 'web_search_tool_result'
      }
      case 'content_block_delta': {
        const block = blocks[event.index]
        if (!block) break
        if (event.delta?.type === 'text_delta' && block.type === 'text') block.text += event.delta.text
        else if (event.delta?.type === 'citations_delta' && block.type === 'text') block.citations.push(event.delta.citation)
        else if (event.delta?.type === 'input_json_delta' && block.type === 'server_tool_use') block.query += event.delta.partial_json || ''
        else break
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
  const truncated = stopReason === 'max_tokens' || stopReason === 'pause_turn'
  return { answer: assemble(blocks, { final: true }), truncated, code }
}

const VISUAL = /<visual>([\s\S]*?)<\/visual>/g

function searchQuery(raw) {
  try {
    return JSON.parse(raw).query || ''
  } catch {
    const match = raw.match(/"query"\s*:\s*"([^"]*)/)
    return match ? match[1] : ''
  }
}

function parseVisual(raw) {
  const body = raw.trim().replace(/^```(?:json)?\s*/, '').replace(/```$/, '').trim()
  try {
    const spec = JSON.parse(body)
    return spec && typeof spec === 'object' && typeof spec.type === 'string' ? spec : null
  } catch {
    return null
  }
}

// Nothing renders Markdown here, and the persona says so, but a stray **bold**
// or "# " heading still slips through now and then (both seen on production).
const clean = (text) => text.replace(/\*\*/g, '').replace(/(^|\n)#{1,6} /g, '$1')

// Turns content blocks into what the bubble shows:
//   segments: [{ type: 'text', parts: [{ text, refs }] }
//              | { type: 'visual', spec, refs } | { type: 'pending-visual' }]
//   sources:  numbered by first use — { n, kind: 'course'|'research'|'web', … }
//   searched: pages a search returned, for when none of them was cited
//   searching: the query while a web search is under way ('' otherwise)
//   text:     the plain reply, replayed to the model as history
export function assemble(blocks, { final = false } = {}) {
  const sources = []
  const numberOf = new Map()
  const addSource = (key, source) => {
    if (!numberOf.has(key)) {
      numberOf.set(key, sources.length + 1)
      sources.push({ n: sources.length + 1, ...source })
    }
    return numberOf.get(key)
  }

  const parts = []
  const searched = []
  let searching = ''

  for (const block of blocks) {
    if (!block) continue
    if (block.type === 'server_tool_use') {
      searching = searchQuery(block.query) || ' '
      continue
    }
    if (block.type === 'web_search_tool_result') {
      for (const result of block.results) {
        if (result?.type === 'web_search_result' && result.url && !searched.some((s) => s.url === result.url)) {
          searched.push({ url: result.url, title: result.title || result.url })
        }
      }
      continue
    }
    if (block.type !== 'text') continue
    if (block.text.trim()) searching = ''

    const refs = []
    for (const citation of block.citations) {
      if (citation?.type === 'content_block_location') {
        const last = Math.max(citation.start_block_index, (citation.end_block_index ?? citation.start_block_index + 1) - 1)
        for (let index = citation.start_block_index; index <= last; index += 1) {
          const source = sourceFor(citation.document_index, index)
          if (!source) continue
          const n = addSource(`${citation.document_index}:${index}`, { ...source, quote: citation.cited_text || '' })
          if (!refs.includes(n)) refs.push(n)
        }
      } else if (citation?.type === 'web_search_result_location' && citation.url) {
        const n = addSource(`web:${citation.url}`, {
          kind: 'web',
          url: citation.url,
          title: citation.title || citation.url,
          quote: citation.cited_text || '',
        })
        if (!refs.includes(n)) refs.push(n)
      }
    }
    parts.push({ text: block.text, refs: refs.sort((a, b) => a - b) })
  }

  const text = parts.map((part) => part.text).join('')
  return {
    segments: segment(parts, text, final),
    sources,
    searched: sources.some((s) => s.kind === 'web') ? [] : searched.slice(0, 5),
    searching,
    text: clean(text),
  }
}

// Splits the reply into prose and <visual>…</visual> blocks. Citations can
// split the reply at any point, so the markers are found in the joined text
// and each block's text is cut at those positions.
function segment(parts, whole, final) {
  const ranges = []
  for (const match of whole.matchAll(VISUAL)) {
    ranges.push({ start: match.index, end: match.index + match[0].length, spec: parseVisual(match[1]) })
  }
  const lastEnd = ranges.length ? ranges[ranges.length - 1].end : 0
  const open = whole.indexOf('<visual>', lastEnd)
  if (open !== -1) ranges.push({ start: open, end: whole.length, pending: true })
  // A half-typed "<visu" at the very end is not shown either.
  let cut = whole.length
  if (!final && open === -1) {
    for (let i = 7; i >= 1; i -= 1) {
      if (whole.endsWith('<visual>'.slice(0, i))) {
        cut = whole.length - i
        break
      }
    }
  }

  const segments = []
  let current = null
  const rangeAt = (position) => ranges.findIndex((r) => position >= r.start && position < r.end)
  let offset = 0

  for (const part of parts) {
    const bounds = new Set([0, part.text.length])
    for (const r of ranges) {
      if (r.start > offset && r.start < offset + part.text.length) bounds.add(r.start - offset)
      if (r.end > offset && r.end < offset + part.text.length) bounds.add(r.end - offset)
    }
    const points = [...bounds].sort((a, b) => a - b)
    for (let i = 0; i < points.length - 1; i += 1) {
      const from = offset + points[i]
      const to = offset + points[i + 1]
      const isLast = i === points.length - 2
      const k = rangeAt(from)
      if (k === -1) {
        const piece = whole.slice(from, Math.min(to, cut))
        if (!piece) continue
        if (!current || current.type !== 'text') {
          current = { type: 'text', parts: [] }
          segments.push(current)
        }
        current.parts.push({ text: clean(piece), refs: isLast ? part.refs : [] })
      } else {
        const range = ranges[k]
        if (!range.segment) {
          range.segment = range.pending
            ? { type: final ? 'dropped' : 'pending-visual' }
            : range.spec
              ? { type: 'visual', spec: range.spec, refs: [] }
              : { type: 'dropped' }
          segments.push(range.segment)
          current = range.segment
        }
        if (isLast && range.segment.refs) {
          for (const n of part.refs) if (!range.segment.refs.includes(n)) range.segment.refs.push(n)
        }
      }
    }
    offset += part.text.length
  }

  const kept = segments.filter((s) => s.type !== 'dropped')
  // Prose next to a chart should not leave a blank line hanging against it.
  kept.forEach((s, i) => {
    if (s.type !== 'text' || !s.parts.length) return
    if (i > 0 && kept[i - 1].type !== 'text') s.parts[0].text = s.parts[0].text.replace(/^\s+/, '')
    if (i < kept.length - 1 && kept[i + 1].type !== 'text') {
      const lastPart = s.parts[s.parts.length - 1]
      lastPart.text = lastPart.text.replace(/\s+$/, '')
    }
  })
  return kept.filter((s) => s.type !== 'text' || s.parts.some((p) => p.text || p.refs.length))
}
