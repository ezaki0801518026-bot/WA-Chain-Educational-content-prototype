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

import { PERSONA, CHAT_CONFIG } from '../../data/chat-persona.js'
import { courseDocuments, courseMap } from '../../data/chat-corpus.js'

const API = 'https://api.anthropic.com/v1/messages'

const json = (body, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8' },
  })

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

// The course and WA-Chain's research travel as documents with citations
// switched on, attached to the first user turn (documents cannot go in the
// system prompt). Every answer
// then carries machine-checked pointers to the passages it used, and the page
// shows those instead of trusting the model to write "(Section 4)" correctly.
//
// The documents always sit at the front of the first turn and are marked for
// caching, so persona + course are one stable, cached prefix for every
// request, whatever the conversation after them.
function withCourse(messages) {
  const documents = courseDocuments()
  documents[documents.length - 1].cache_control = { type: 'ephemeral' }
  const [first, ...rest] = messages
  return [{ role: 'user', content: [...documents, { type: 'text', text: first.content }] }, ...rest]
}

// Spend limits and rate limits fail differently, and the difference matters:
// a rate limit is worth retrying, an exhausted budget is not. See
// Anthropic_Console_初期設定手順_2026-09.md for the full table.
function classify(status, detail) {
  if (detail.includes('enforced_spend_limit_reached') || detail.includes('reached your specified')) {
    return 'budget'
  }
  if (status === 429 || status === 529 || detail.includes('overloaded_error') || detail.includes('rate_limit_error')) {
    return 'busy'
  }
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

  const request_ = (withSearch) =>
    JSON.stringify({
      model: CHAT_CONFIG.model,
      max_tokens: CHAT_CONFIG.maxTokens,
      stream: true,
      // Adaptive thinking is what makes "the material does not cover this"
      // reliable — the judgement it protects is exactly the one that matters.
      // The thinking itself is not shown, and not sent to the browser.
      thinking: { type: 'adaptive', display: 'omitted' },
      output_config: { effort: CHAT_CONFIG.effort },
      // Anthropic runs the search itself; results come back inside the same
      // stream, with citations that carry the page address.
      ...(withSearch && CHAT_CONFIG.webSearches > 0
        ? { tools: [{ type: 'web_search_20250305', name: 'web_search', max_uses: CHAT_CONFIG.webSearches }] }
        : {}),
      system: `${PERSONA}\n\nCOURSE MAP\n${courseMap()}`,
      messages: withCourse(messages),
    })

  const call = (withSearch = true) =>
    fetch(API, {
      method: 'POST',
      headers: {
        'x-api-key': key,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: request_(withSearch),
    })

  let upstream
  // Reported in a response header, so whether answers can search is checkable
  // from outside: "on", "off" (disabled in config), or "unavailable" (the
  // organisation has web search switched off in the Claude Console).
  let search = CHAT_CONFIG.webSearches > 0 ? 'on' : 'off'
  try {
    upstream = await call()
    // Web search has to be switched on for the organisation in the Claude
    // Console. If it is off, answer without it rather than not at all.
    if (upstream.status === 400) {
      const detail = await upstream.text()
      if (/web.?search/i.test(detail)) {
        console.error('chat: web search unavailable, answering without it', detail.slice(0, 300))
        search = 'unavailable'
        upstream = await call(false)
      } else {
        upstream = new Response(detail, { status: 400 })
      }
    }
    // One retry, not more: a budget error never succeeds on retry, and a
    // visitor should not wait through a long backoff.
    if (upstream.status === 429 || upstream.status >= 500) {
      const detail = await upstream.text()
      if (classify(upstream.status, detail) === 'budget') return json({ code: 'budget' }, 402)
      await new Promise((resolve) => setTimeout(resolve, 1000))
      upstream = await call()
    }
  } catch (error) {
    console.error('chat failed', 'network', error?.message)
    return json({ code: 'error' }, 502)
  }

  if (!upstream.ok) {
    const detail = await upstream.text()
    const code = classify(upstream.status, detail)
    // Logged for `wrangler pages deployment tail`; the browser only sees the code.
    console.error('chat failed', code, upstream.status, detail.slice(0, 300))
    return json({ code }, 502)
  }

  // Anthropic's event stream is handed to the browser untouched, and the page
  // reads it (src/utils/chatStream.js). Nothing is parsed here, on purpose:
  // Workers on the free plan get 10 ms of CPU per request, and reading every
  // event in JavaScript — which the SDK's stream helper did — used that up a
  // few seconds into a longer answer. The Worker was stopped mid-reply, and the
  // visitor saw an answer that simply ended mid-sentence. Passing the body
  // through costs no CPU however long the answer runs. It also means a visitor
  // who leaves mid-answer cancels the body, which closes the upstream
  // connection and stops the generation.
  return new Response(upstream.body, {
    headers: {
      'content-type': 'text/event-stream; charset=utf-8',
      'cache-control': 'no-store',
      'x-wa-web-search': search,
    },
  })
}
