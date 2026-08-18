// GET /api/stats?token=... — aggregate view of the collected events.
//
// Protected by the STATS_TOKEN environment variable (set it in the
// Cloudflare Pages dashboard; requests without the matching token get
// 403). Returns JSON aggregates only — raw rows never leave the server.

export async function onRequestGet({ request, env }) {
  if (!env.DB) return new Response('event store not configured', { status: 503 })
  if (!env.STATS_TOKEN) return new Response('stats not configured', { status: 503 })

  const token = new URL(request.url).searchParams.get('token')
  if (token !== env.STATS_TOKEN) return new Response('forbidden', { status: 403 })

  const [byType, byPage, completions, formats, recent] = await Promise.all([
    env.DB.prepare('SELECT type, COUNT(*) AS n FROM events GROUP BY type ORDER BY n DESC').all(),
    env.DB.prepare(
      "SELECT path, COUNT(*) AS n FROM events WHERE type = 'page_view' GROUP BY path ORDER BY n DESC LIMIT 30",
    ).all(),
    env.DB.prepare(
      "SELECT section, COUNT(*) AS n FROM events WHERE type = 'section_complete' GROUP BY section ORDER BY n DESC",
    ).all(),
    env.DB.prepare(
      "SELECT detail, COUNT(*) AS n FROM events WHERE type = 'format_choice' GROUP BY detail",
    ).all(),
    env.DB.prepare(
      "SELECT COUNT(*) AS n FROM events WHERE ts >= datetime('now', '-7 days')",
    ).first(),
  ])

  return Response.json({
    generatedAt: new Date().toISOString(),
    last7Days: recent?.n ?? 0,
    eventsByType: byType.results,
    pageViews: byPage.results,
    sectionCompletions: completions.results,
    formatChoices: formats.results,
  })
}
