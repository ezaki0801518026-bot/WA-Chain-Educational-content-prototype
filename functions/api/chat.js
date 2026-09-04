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
export function onRequestGet({ env }) {
  return json(
    {
      code: 'method_not_allowed',
      // Whether the key is bound, and which commit is serving. Both are
      // checkable from a browser, which is how the wiring above was diagnosed.
      ready: Boolean(apiKey(env)),
      commit: (env.CF_PAGES_COMMIT_SHA || '').slice(0, 7),
    },
    405
  )
}

// ANTHROPIC_API_KEY is the name to use. But Cloudflare's dashboard just asks
// for a "name", with nothing on that screen to say it has to match what the
// code reads — so a secret called something sensible like "ClaudeAIChat" binds
// correctly, looks right in the dashboard, and reaches nothing. Falling back to
// the value's shape means a well-meant name cannot silently disable the
// assistant. Only an Anthropic key starts with sk-ant-.
function apiKey(env) {
  if (env.ANTHROPIC_API_KEY) return env.ANTHROPIC_API_KEY
  for (const value of Object.values(env)) {
    if (typeof value === 'string' && value.startsWith('sk-ant-')) return value
  }
  return null
}

export async function onRequestPost({ request, env }) {
  const key = apiKey(env)
  if (!key) return json({ code: 'unconfigured' }, 503)

  let body
  try {
    body = await request.json()
  } catch {
    return json({ code: 'bad_request' }, 400)
  }

  const messages = sanitiseMessages(body?.messages)
  if (messages.length === 0) return json({ code: 'bad_request' }, 400)

  const client = new Anthropic({
    apiKey: key,
    // One retry, not the default two: a budget error never succeeds on retry,
    // and a visitor should not wait through a long backoff.
    maxRetries: 1,
  })

  // Newline-delimited JSON rather than one reply: the answer starts appearing
  // in about a second instead of after the whole thing is written. Each line is
  // either {t: "..."} for a piece of text or {code: "..."} for a failure.
  //
  // Upstream failures cannot use a status code here — by the time Anthropic
  // rejects the request this Response has already been handed to the runtime
  // with a 200 — so they travel as a line in the stream and the browser reads
  // the code, not the status. The guards above still answer with real statuses.
  const stream = client.messages.stream({
    model: CHAT_CONFIG.model,
    max_tokens: CHAT_CONFIG.maxTokens,
    // Adaptive thinking is what makes "the material does not cover this"
    // reliable — the judgement it protects is exactly the one that matters.
    thinking: { type: 'adaptive' },
    output_config: { effort: CHAT_CONFIG.effort },
    // One cached block: the persona and the whole course never change between
    // requests, so every turn after the first reads them at a fraction of the
    // price and they stop counting toward the rate limit.
    system: [
      {
        type: 'text',
        text: `${PERSONA}\n\nCOURSE MATERIAL\n${courseMaterial()}`,
        cache_control: { type: 'ephemeral' },
      },
    ],
    messages,
  })

  const encoder = new TextEncoder()
  const line = (value) => encoder.encode(`${JSON.stringify(value)}\n`)

  const ndjson = new ReadableStream({
    async start(controller) {
      let wrote = false
      try {
        for await (const event of stream) {
          if (event.type === 'content_block_delta' && event.delta?.type === 'text_delta') {
            wrote = true
            controller.enqueue(line({ t: event.delta.text }))
          }
        }
        const final = await stream.finalMessage()
        controller.enqueue(
          line({
            done: true,
            // The ceiling should not be reached, but if it is the reader is
            // told rather than left with a sentence that stops mid-word.
            truncated: final.stop_reason === 'max_tokens',
            usage: {
              input: final.usage?.input_tokens ?? 0,
              cacheRead: final.usage?.cache_read_input_tokens ?? 0,
              cacheWrite: final.usage?.cache_creation_input_tokens ?? 0,
              output: final.usage?.output_tokens ?? 0,
            },
          })
        )
        if (!wrote) controller.enqueue(line({ code: 'error' }))
      } catch (error) {
        const code = classify(error)
        // Logged for `wrangler pages deployment tail`; the browser only sees the code.
        console.error('chat failed', code, error?.status, error?.message)
        controller.enqueue(line({ code }))
      } finally {
        controller.close()
      }
    },
    cancel() {
      // The visitor navigated away or hit stop. Abandon the generation rather
      // than paying for tokens nobody will read.
      stream.abort()
    },
  })

  return new Response(ndjson, {
    headers: {
      'content-type': 'application/x-ndjson; charset=utf-8',
      'cache-control': 'no-store',
    },
  })
}
