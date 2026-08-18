// POST /api/event — anonymous learning-event collector.
//
// Accepts a single event object or a small batch (array), written to the
// D1 database bound as `DB` (see docs/backend-setup.md). Stores no
// personal data: event type, hash-route path, section id, a short detail
// string, UI language, and a truncated user-agent.
//
// Until the D1 binding is configured this responds 503 and the client
// silently drops events — deploys never break on a missing database.

const clamp = (value, max) =>
  typeof value === 'string' && value.length > 0 ? value.slice(0, max) : null

export async function onRequestPost({ request, env }) {
  if (!env.DB) return new Response('event store not configured', { status: 503 })

  let payload
  try {
    payload = await request.json()
  } catch {
    return new Response('bad json', { status: 400 })
  }

  const events = Array.isArray(payload) ? payload : [payload]
  if (events.length === 0 || events.length > 20) {
    return new Response('bad batch size', { status: 400 })
  }

  const stmt = env.DB.prepare(
    'INSERT INTO events (ts, type, path, section, detail, lang, ua) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)',
  )
  const ua = clamp(request.headers.get('user-agent') || '', 120)
  const now = new Date().toISOString()

  const batch = []
  for (const event of events) {
    if (typeof event?.type !== 'string' || event.type.length === 0 || event.type.length > 40) continue
    batch.push(
      stmt.bind(
        now,
        event.type,
        clamp(event.path, 200),
        clamp(event.section, 80),
        clamp(event.detail, 200),
        clamp(event.lang, 8),
        ua,
      ),
    )
  }
  if (batch.length > 0) await env.DB.batch(batch)

  return new Response(null, { status: 204 })
}
