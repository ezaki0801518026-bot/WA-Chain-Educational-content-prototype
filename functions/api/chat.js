// POST /api/chat — the washi consultation assistant.
//
// Runs only where Cloudflare Functions run. On a purely static host (GitHub
// Pages) this file is never deployed, and the front end falls back to the
// human route — see src/utils/api.js.
//
// The API key is read from the ANTHROPIC_API_KEY secret bound to the Pages
// project. It never reaches the browser: every request goes through here.
//
// The persona lives in data/chat-persona.js. Edit that file, not this one.

import Anthropic from '@anthropic-ai/sdk'
import lessons from '../../data/lessons.json'
import { PERSONA, CHAT_CONFIG } from '../../data/chat-persona.js'

const json = (body, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8' },
  })

// The whole published course is about 7,000 tokens, so the assistant can be
// given all of it rather than retrieving fragments. Everything it is allowed
// to say lives in this string — nothing else is a permitted source.
let corpus = null
function courseMaterial() {
  if (corpus) return corpus
  const parts = []
  lessons.sections.forEach((section, index) => {
    if (!section.active) return
    parts.push(`## Section ${index + 1}: ${section.title}`)
    if (section.description) parts.push(section.description)
    for (const point of section.summaryPoints || []) parts.push(`- ${point}`)
    for (const step of section.steps || []) {
      if (step.heading) parts.push(`### ${step.heading}`)
      for (const paragraph of step.paragraphs || []) parts.push(paragraph)
    }
    parts.push('')
  })
  corpus = parts.join('\n')
  return corpus
}

// The browser sends the whole conversation, so treat it as untrusted input:
// keep only well-formed turns, cap the length, and make sure the history
// still starts on a user turn (the API rejects anything else).
function sanitiseMessages(input) {
  if (!Array.isArray(input)) return []
  const out = []
  for (const message of input.slice(-CHAT_CONFIG.maxHistory)) {
    const role = message?.role
    if (role !== 'user' && role !== 'assistant') continue
    const content =
      typeof message.content === 'string'
        ? message.content.trim().slice(0, CHAT_CONFIG.maxInputChars)
        : ''
    if (!content) continue
    out.push({ role, content })
  }
  while (out.length && out[0].role !== 'user') out.shift()
  return out
}

// Spend limits and rate limits fail differently, and the difference matters:
// a rate limit is worth retrying, an exhausted budget is not. See
// Anthropic_Console_初期設定手順_2026-09.md for the full table.
function classify(error) {
  const status = error?.status
  const detail = `${JSON.stringify(error?.error ?? {})} ${error?.message ?? ''}`
  if (
    detail.includes('enforced_spend_limit_reached') ||
    detail.includes('reached your specified')
  ) {
    return 'budget'
  }
  if (status === 429 || status === 529) return 'busy'
  if (status === 401 || status === 403) return 'unconfigured'
  return 'error'
}

// Doubles as the capability probe the chat page uses on load. Two jobs:
//
//  - Without it a GET falls through to the static handler and returns the SPA
//    shell with a 200, which reads like a working endpoint when it isn't.
//  - `ready` says whether the API key is actually bound, which is the one
//    thing that cannot be diagnosed from outside when a POST comes back
//    "unconfigured" — a missing secret and a rejected key look identical.
export function onRequestGet({ request, env }) {
  const body = { code: 'method_not_allowed', ready: Boolean(env.ANTHROPIC_API_KEY) }
  // TEMPORARY (2026-09-04): the secret is set in the dashboard but the Function
  // cannot see it, and a typo in the name looks identical to a missing binding
  // from outside. ?diag=1 lists binding NAMES only — never values — so the two
  // can be told apart. Remove this branch once the key is wired.
  if (new URL(request.url).searchParams.get('diag') === '1') {
    body.bindings = Object.keys(env).sort()
  }
  return json(body, 405)
}

export async function onRequestPost({ request, env }) {
  if (!env.ANTHROPIC_API_KEY) return json({ code: 'unconfigured' }, 503)

  let body
  try {
    body = await request.json()
  } catch {
    return json({ code: 'bad_request' }, 400)
  }

  const messages = sanitiseMessages(body?.messages)
  if (messages.length === 0) return json({ code: 'bad_request' }, 400)

  const client = new Anthropic({
    apiKey: env.ANTHROPIC_API_KEY,
    // One retry, not the default two: a budget error never succeeds on retry,
    // and a visitor should not wait through a long backoff.
    maxRetries: 1,
  })

  try {
    const response = await client.messages.create({
      model: CHAT_CONFIG.model,
      max_tokens: CHAT_CONFIG.maxTokens,
      // Adaptive thinking is what makes "the material does not cover this"
      // reliable — the judgement it protects is exactly the one that matters.
      thinking: { type: 'adaptive' },
      output_config: { effort: CHAT_CONFIG.effort },
      // One cached block: the persona and the whole course never change
      // between requests, so every turn after the first reads them at a
      // fraction of the price and they stop counting toward the rate limit.
      system: [
        {
          type: 'text',
          text: `${PERSONA}\n\nCOURSE MATERIAL\n${courseMaterial()}`,
          cache_control: { type: 'ephemeral' },
        },
      ],
      messages,
    })

    const reply = response.content
      .filter((block) => block.type === 'text')
      .map((block) => block.text)
      .join('\n')
      .trim()

    if (!reply) return json({ code: 'error' }, 502)

    return json({
      reply,
      usage: {
        input: response.usage?.input_tokens ?? 0,
        cacheRead: response.usage?.cache_read_input_tokens ?? 0,
        cacheWrite: response.usage?.cache_creation_input_tokens ?? 0,
        output: response.usage?.output_tokens ?? 0,
      },
    })
  } catch (error) {
    const code = classify(error)
    // Logged for `wrangler pages deployment tail`; never returned to the browser.
    console.error('chat failed', code, error?.status, error?.message)
    return json({ code }, code === 'busy' || code === 'unconfigured' ? 503 : 502)
  }
}
