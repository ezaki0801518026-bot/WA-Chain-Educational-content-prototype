// /api/chat — the washi consultation assistant has been retired (2026-11).
//
// Nothing here reads an API key or calls the Anthropic API, so this site has
// no connection to Claude at all, whatever secrets the Cloudflare project
// still holds. The previous assistant is in the git history if it is ever
// needed again.
//
// The chat page probes this endpoint on load and offers the assistant only
// when GET answers 405 "method_not_allowed" (see src/pages/ChatPage.jsx).
// Answering 410 instead makes the page fall back to the human route — the
// question is emailed to the team — exactly as it does on a static host.

function json(body, status) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
  })
}

// Kept so the deployed commit can still be read from a browser; `ready` is
// always false and `retired` says why.
export function onRequestGet({ env }) {
  return json(
    {
      code: 'retired',
      ready: false,
      retired: true,
      commit: (env.CF_PAGES_COMMIT_SHA || '').slice(0, 7),
    },
    410
  )
}

export function onRequestPost() {
  return json({ code: 'retired', message: 'The assistant has been retired.' }, 410)
}
