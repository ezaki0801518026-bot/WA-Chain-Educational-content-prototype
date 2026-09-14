// Byte-range serving for media files on Cloudflare Pages.
//
// Pages' static asset server answers a Range request with 200 and the whole
// file (measured: `Range: bytes=5000000-5001023` on a 14.8 MB lecture came
// back 200 with Content-Length 14795001, and no Accept-Ranges header). A
// browser given that cannot seek past what it has already downloaded, so
// the resume button, the ±10 s controls and dragging the scrubber all fail
// — and iOS Safari may refuse to play the file at all. GitHub Pages serves
// the same file with a proper 206, which is why it went unnoticed.
//
// This sits in front of the video paths only (functions/videos, /video) and
// turns a Range request into a 206 cut from the asset. It lives outside
// functions/ so it is not itself mapped to a route.
//
// The asset server streams media chunked with no Content-Length, so a file's
// size cannot be learned at request time; scripts/media-sizes.mjs records it
// at build time. A path missing from that table is a 404 here — otherwise
// the asset server's single-page-app fallback would answer a mistyped video
// URL with index.html and a 200.

import SIZES from './media-sizes.json'

const RANGE = /^bytes=(\d*)-(\d*)$/

function parseRange(header, size) {
  const match = RANGE.exec((header || '').trim())
  if (!match) return null // absent, malformed, or multi-range: serve whole
  const [, rawStart, rawEnd] = match
  if (rawStart === '' && rawEnd === '') return null
  let start
  let end
  if (rawStart === '') {
    // Suffix range: the last N bytes.
    const length = Number(rawEnd)
    start = Math.max(size - length, 0)
    end = size - 1
  } else {
    start = Number(rawStart)
    end = rawEnd === '' ? size - 1 : Math.min(Number(rawEnd), size - 1)
  }
  if (start > end || start >= size) return { unsatisfiable: true }
  return { start, end }
}

// Streams bytes [start, end] out of `body` without holding the file in
// memory. The asset stream cannot jump, so bytes before `start` are read and
// dropped; that is cheap inside Cloudflare's network, and far cheaper than
// buffering a 20 MB lecture per seek.
function slice(body, start, end) {
  const reader = body.getReader()
  let offset = 0
  return new ReadableStream({
    async pull(controller) {
      for (;;) {
        const { done, value } = await reader.read()
        if (done) {
          controller.close()
          return
        }
        const chunkStart = offset
        const chunkEnd = offset + value.byteLength // exclusive
        offset = chunkEnd
        if (chunkEnd <= start) continue
        const from = Math.max(start - chunkStart, 0)
        const to = Math.min(end + 1 - chunkStart, value.byteLength)
        controller.enqueue(value.subarray(from, to))
        if (chunkEnd > end) {
          reader.cancel()
          controller.close()
        }
        return
      }
    },
    cancel(reason) {
      reader.cancel(reason)
    },
  })
}

export async function serveWithRanges({ request, env }) {
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    return new Response(null, { status: 405, headers: { allow: 'GET, HEAD' } })
  }

  const url = new URL(request.url)
  let path
  try {
    path = decodeURIComponent(url.pathname)
  } catch {
    return new Response('Not found', { status: 404 })
  }
  const size = SIZES[path]
  if (!size) return new Response('Not found', { status: 404 })

  // Ask the asset server for the whole file; a Range header there is ignored
  // anyway, and leaving it off keeps the response predictable.
  const asset = await env.ASSETS.fetch(new Request(url, { method: 'GET' }))
  if (!asset.ok) return asset

  const headers = new Headers(asset.headers)
  headers.delete('transfer-encoding')
  headers.set('accept-ranges', 'bytes')

  // A compressed body would not line up with byte offsets; serve it whole.
  if (asset.headers.get('content-encoding')) {
    return new Response(request.method === 'HEAD' ? null : asset.body, { status: 200, headers })
  }

  const range = parseRange(request.headers.get('range'), size)

  if (!range) {
    headers.set('content-length', String(size))
    return new Response(request.method === 'HEAD' ? null : asset.body, { status: 200, headers })
  }

  if (range.unsatisfiable) {
    asset.body?.cancel()
    return new Response(null, { status: 416, headers: { 'content-range': `bytes */${size}` } })
  }

  const { start, end } = range
  headers.set('content-range', `bytes ${start}-${end}/${size}`)
  headers.set('content-length', String(end - start + 1))

  if (request.method === 'HEAD') {
    asset.body?.cancel()
    return new Response(null, { status: 206, headers })
  }
  return new Response(slice(asset.body, start, end), { status: 206, headers })
}
