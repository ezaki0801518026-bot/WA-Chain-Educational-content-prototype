// One address for the site: https://wa-chain.org
//
// The Cloudflare Pages project also answers at its own *.pages.dev address,
// which LinkedIn and some mail filters block (the shared pages.dev domain is
// widely abused). Requests to that production address are sent, with a
// permanent redirect, to the same path on wa-chain.org. Branch previews
// (<branch>.wa-chain-educational-content-prototype.pages.dev) are left alone,
// so they still work for checking work before it goes to main.
//
// Merge this only after wa-chain.org shows "Active" under the project's
// Custom domains; before that, the redirect would point at nothing.

const CANONICAL = 'https://wa-chain.org'
const OLD_HOST = 'wa-chain-educational-content-prototype.pages.dev'

export async function onRequest({ request, next }) {
  const url = new URL(request.url)
  if (url.hostname === OLD_HOST) {
    // 308 keeps a POST a POST (an open chat tab on the old address); pages get 301.
    const status = request.method === 'GET' || request.method === 'HEAD' ? 301 : 308
    return Response.redirect(`${CANONICAL}${url.pathname}${url.search}`, status)
  }
  return next()
}
