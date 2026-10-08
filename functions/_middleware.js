// Password gate for the whole site — OFF until it is switched on.
//
// It does nothing unless the Pages project has a SITE_PASSWORDS variable, so
// this file can sit in main without changing anything. To switch it on, add
// two encrypted variables in Cloudflare (Workers & Pages → the project →
// Settings → Variables and Secrets), for Production (and Preview if wanted):
//
//   SITE_PASSWORDS    one password per month, Japan time, comma-separated:
//                     2026-11:first-password,2026-12:second-password,...
//   SITE_GATE_SECRET  any long random string (signs the "remember me" cookie)
//
// Optional:
//   SITE_GATE_PUBLIC  path prefixes left outside the gate, comma-separated.
//                     Default: the standalone About page and the files it needs.
//
// How it behaves once on:
// - Every request needs a valid pass. A page request without one gets the
//   sign-in screen; anything else (API, video, data) gets 401.
// - The right password for the current month (Japan time) issues a pass that
//   lasts until the end of that month, kept in an HttpOnly cookie. The
//   password itself is never stored. On the 1st of the next month the old
//   pass stops working and the new month's password is asked for once.
// - The sign-in screen is a normal password form, so browsers can save and
//   fill it.
// - robots.txt answers "Disallow: /" while the gate is on.
// - /__gate/logout clears the pass.

const COOKIE = 'wa_gate'
const DEFAULT_PUBLIC = ['/about', '/assets/', '/images/', '/favicon.svg', '/manifest.webmanifest']

// Year-month in Japan time, e.g. "2026-11"
function monthJst(date = new Date()) {
  const jst = new Date(date.getTime() + 9 * 60 * 60 * 1000)
  return `${jst.getUTCFullYear()}-${String(jst.getUTCMonth() + 1).padStart(2, '0')}`
}

// The first moment of the next month in Japan time, as a Date
function endOfMonthJst(date = new Date()) {
  const jst = new Date(date.getTime() + 9 * 60 * 60 * 1000)
  const nextUtc = Date.UTC(jst.getUTCFullYear(), jst.getUTCMonth() + 1, 1) - 9 * 60 * 60 * 1000
  return new Date(nextUtc)
}

function passwordsFrom(env) {
  const map = new Map()
  for (const part of String(env.SITE_PASSWORDS || '').split(',')) {
    const i = part.indexOf(':')
    if (i < 0) continue
    const month = part.slice(0, i).trim()
    const password = part.slice(i + 1).trim()
    if (/^\d{4}-\d{2}$/.test(month) && password) map.set(month, password)
  }
  return map
}

async function hmac(secret, text) {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(text))
  return [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, '0')).join('')
}

// Constant-time comparison of two strings
function same(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string' || a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i += 1) diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return diff === 0
}

function readCookie(request, name) {
  const header = request.headers.get('cookie') || ''
  for (const part of header.split(';')) {
    const [k, ...v] = part.trim().split('=')
    if (k === name) return v.join('=')
  }
  return null
}

async function hasPass(request, env) {
  const value = readCookie(request, COOKIE)
  if (!value) return false
  const [month, sig] = value.split('.')
  if (month !== monthJst()) return false
  return same(sig, await hmac(env.SITE_GATE_SECRET, `pass:${month}`))
}

function isPublic(pathname, env) {
  const list = env.SITE_GATE_PUBLIC ? String(env.SITE_GATE_PUBLIC).split(',').map((s) => s.trim()).filter(Boolean) : DEFAULT_PUBLIC
  return list.some((prefix) => pathname === prefix || pathname.startsWith(prefix.endsWith('/') ? prefix : `${prefix}/`) || (prefix === '/about' && pathname === '/about'))
}

const wantsPage = (request) => request.method === 'GET' && (request.headers.get('accept') || '').includes('text/html')

function signInPage({ error = false, back = '/' } = {}) {
  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="robots" content="noindex, nofollow">
<title>WA-Chain — Sign in</title>
<style>
:root{--bg:#f8f9f8;--surface:#fff;--text:#161c1e;--muted:#566265;--border:#a1acab;--accent:#2f6478;--accent-hover:#255262;--err:#b04a3b;--focus:#2f6478}
@media (prefers-color-scheme:dark){:root{--bg:#121617;--surface:#191f21;--text:#e8ecea;--muted:#a4aeae;--border:#5b6b6e;--accent:#3a7a90;--accent-hover:#4a8ba1;--err:#e08a7c;--focus:#8fbccb}}
*{box-sizing:border-box}
html,body{margin:0;background:var(--bg);color:var(--text);font-family:"Source Sans 3",system-ui,"Hiragino Sans","Yu Gothic UI",sans-serif;-webkit-tap-highlight-color:transparent}
main{min-height:100svh;display:flex;align-items:center;justify-content:center;padding:24px 16px}
.panel{width:min(26rem,100%);background:var(--surface);border-radius:12px;padding:32px 24px;box-shadow:0 0 0 1px rgb(0 0 0/.06),0 1px 2px rgb(0 0 0/.04),0 8px 24px rgb(0 0 0/.06)}
.top{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:24px}
.brand{font-family:"Source Serif 4",Georgia,serif;font-weight:600;font-size:1.25rem}
.lang{display:inline-flex;padding:2px;border-radius:999px;background:rgb(127 127 127/.12)}
.lang button{display:inline-flex;align-items:center;gap:6px;min-height:2.5rem;padding:0 10px;border:0;border-radius:999px;background:transparent;color:var(--muted);font:inherit;font-size:.8125rem;font-weight:500;cursor:pointer}
.lang button[aria-pressed=true]{background:var(--surface);color:var(--text);box-shadow:0 0 0 1px rgb(0 0 0/.08)}
.lang svg{width:20px;height:14px;border-radius:2px;outline:1px solid rgb(0 0 0/.12);outline-offset:-1px}
h1{font-family:"Source Serif 4",Georgia,serif;font-size:1.5rem;line-height:1.2;margin:0 0 8px}
p{margin:0 0 20px;color:var(--muted);line-height:1.6;font-size:.9375rem}
label{display:block;font-size:.875rem;font-weight:500;margin-bottom:6px}
input[type=password]{width:100%;min-height:2.75rem;padding:8px 12px;font:inherit;font-size:max(1rem,1em);color:var(--text);background:var(--surface);border:1px solid var(--border);border-radius:4px}
input[type=password]:focus-visible{outline:2px solid var(--focus);outline-offset:0;border-color:var(--accent)}
.err{color:var(--err);font-size:.875rem;margin:8px 0 0}
.submit{margin-top:20px;width:100%;min-height:2.75rem;border:0;border-radius:4px;background:var(--accent);color:#fff;font:inherit;font-weight:600;cursor:pointer;touch-action:manipulation}
.submit:active{transform:scale(.97)}
@media (hover:hover) and (pointer:fine){.submit:hover{background:var(--accent-hover)}}
.note{margin:16px 0 0;font-size:.8125rem}
[hidden]{display:none!important}
</style>
</head>
<body>
<main>
<form class="panel" method="post" action="/__gate" autocomplete="on">
  <div class="top">
    <span class="brand">WA-Chain</span>
    <span class="lang" role="group" aria-label="Language">
      <button type="button" data-lang="en" aria-pressed="true" aria-label="English"><svg viewBox="0 0 60 40" aria-hidden="true"><rect width="60" height="40" fill="#012169"/><path d="M0 0 60 40M60 0 0 40" stroke="#fff" stroke-width="8"/><path d="M0 0 60 40M60 0 0 40" stroke="#c8102e" stroke-width="3"/><path d="M30 0v40M0 20h60" stroke="#fff" stroke-width="12"/><path d="M30 0v40M0 20h60" stroke="#c8102e" stroke-width="7"/></svg>ENG</button>
      <button type="button" data-lang="ja" aria-pressed="false" aria-label="日本語"><svg viewBox="0 0 60 40" aria-hidden="true"><rect width="60" height="40" fill="#fff"/><circle cx="30" cy="20" r="12" fill="#bc002d"/></svg>JPN</button>
    </span>
  </div>
  <h1 data-en="Members only" data-ja="関係者限定のページです">Members only</h1>
  <p data-en="This site is shared with testers while it is being built. Enter this month’s password." data-ja="このサイトは制作中のため、関係者に限って公開しています。今月のパスワードを入力してください。">This site is shared with testers while it is being built. Enter this month’s password.</p>
  <input type="text" name="username" value="WA-Chain" autocomplete="username" hidden readonly>
  <label for="pw" data-en="Password" data-ja="パスワード">Password</label>
  <input id="pw" name="password" type="password" autocomplete="current-password" required autofocus>
  ${error ? '<p class="err" role="alert" data-en="That is not this month’s password." data-ja="今月のパスワードと一致しません。">That is not this month’s password.</p>' : ''}
  <input type="hidden" name="back" value="${back.replace(/[^\w\-./#?=&%]/g, '')}">
  <button class="submit" type="submit" data-en="Enter" data-ja="入る">Enter</button>
  <p class="note" data-en="You stay signed in on this device until the end of the month." data-ja="この端末では、月末まで入力しなくても見られます。">You stay signed in on this device until the end of the month.</p>
</form>
</main>
<script>
(function(){
  var KEY='washi-course-lang';
  function apply(lang){
    document.documentElement.lang=lang;
    document.querySelectorAll('[data-en]').forEach(function(el){el.textContent=el.getAttribute('data-'+lang)});
    document.querySelectorAll('.lang button').forEach(function(b){b.setAttribute('aria-pressed',String(b.getAttribute('data-lang')===lang))});
    try{localStorage.setItem(KEY,lang)}catch(e){}
  }
  var saved='en';try{saved=localStorage.getItem(KEY)==='ja'?'ja':'en'}catch(e){}
  apply(saved);
  document.querySelectorAll('.lang button').forEach(function(b){b.addEventListener('click',function(){apply(b.getAttribute('data-lang'))})});
})();
  // The page address after # never reaches the server: send it with the form, so the reader lands where they were going.
  document.querySelector('form').addEventListener('submit',function(){var b=document.querySelector('input[name=back]');if(b)b.value=location.pathname+location.search+location.hash});
</script>
</body>
</html>`
  return new Response(html, {
    status: error ? 401 : 200,
    headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store', 'x-robots-tag': 'noindex' },
  })
}

export async function onRequest(context) {
  const { request, env, next } = context
  // Off unless both variables are there.
  if (!env.SITE_PASSWORDS || !env.SITE_GATE_SECRET) return next()

  const url = new URL(request.url)

  if (url.pathname === '/robots.txt') {
    return new Response('User-agent: *\nDisallow: /\n', { headers: { 'content-type': 'text/plain; charset=utf-8' } })
  }

  if (url.pathname === '/__gate/logout') {
    return new Response(null, { status: 303, headers: { location: '/', 'set-cookie': `${COOKIE}=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Lax` } })
  }

  if (url.pathname === '/__gate' && request.method === 'POST') {
    const form = await request.formData().catch(() => null)
    const given = String(form?.get('password') || '')
    const back = String(form?.get('back') || '/')
    const month = monthJst()
    const expected = passwordsFrom(env).get(month)
    if (!expected || !same(given, expected)) {
      await new Promise((r) => setTimeout(r, 600)) // slow down guessing a little
      return signInPage({ error: true, back })
    }
    const value = `${month}.${await hmac(env.SITE_GATE_SECRET, `pass:${month}`)}`
    const expires = endOfMonthJst().toUTCString()
    const safeBack = back.startsWith('/') && !back.startsWith('//') ? back : '/'
    return new Response(null, {
      status: 303,
      headers: { location: safeBack, 'set-cookie': `${COOKIE}=${value}; Path=/; Expires=${expires}; HttpOnly; Secure; SameSite=Lax`, 'cache-control': 'no-store' },
    })
  }

  if (isPublic(url.pathname, env)) return next()
  if (await hasPass(request, env)) return next()

  if (wantsPage(request)) return signInPage({ back: url.pathname + url.search })
  return new Response(JSON.stringify({ code: 'locked' }), { status: 401, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' } })
}
