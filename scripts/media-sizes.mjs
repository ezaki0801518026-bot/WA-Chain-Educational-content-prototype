// Writes server/media-sizes.json: the byte size of every file under
// public/videos and public/video, keyed by the URL path it is served at.
//
// The range handler (server/range.js) needs each file's size to answer a
// Range request, and it cannot learn it at request time — Cloudflare's asset
// server streams media with `transfer-encoding: chunked` and no
// Content-Length. Sizes are fixed at build time, so they are recorded here.
//
// Runs as part of `npm run build`. The output is also committed, so the
// Functions bundle never depends on build ordering to find it.

import { readdirSync, statSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const DIRS = ['videos', 'video']
const sizes = {}

for (const dir of DIRS) {
  let entries = []
  try {
    entries = readdirSync(join('public', dir))
  } catch {
    continue
  }
  for (const name of entries.sort()) {
    const stat = statSync(join('public', dir, name))
    if (stat.isFile()) sizes[`/${dir}/${name}`] = stat.size
  }
}

writeFileSync('server/media-sizes.json', `${JSON.stringify(sizes, null, 2)}\n`)
console.log(`media-sizes: ${Object.keys(sizes).length} files`)
