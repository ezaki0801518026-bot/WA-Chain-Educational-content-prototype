// Writes responsive WebP variants next to every photo under public/images
// and records them in src/imageManifest.json, which utils/asset.js reads to
// build srcset attributes.
//
//   public/images/hero/foo.jpg  ->  public/images/hero/foo.w480.webp
//                                   public/images/hero/foo.w960.webp
//                                   public/images/hero/foo.w1600.webp
//
// Widths: 480 / 960 / 1600, only those narrower than the original, plus the
// original width itself when it is not already one of them (a 957px photo
// gets 480 and 957). EXIF orientation is applied before resizing, so a
// portrait phone photo stays portrait.
//
// The outputs and the manifest are committed: `npm run build` does not run
// this, so the Cloudflare build never depends on sharp. Run it after adding
// or replacing a photo:
//
//   npm run images            # only photos with no up-to-date variants
//   npm run images -- --force # everything

import { readdirSync, statSync, writeFileSync, existsSync } from 'node:fs'
import { join, extname, basename, relative, sep } from 'node:path'
import sharp from 'sharp'

const ROOT = 'public/images'
const WIDTHS = [480, 960, 1600]
const QUALITY = 78
const force = process.argv.includes('--force')

function walk(dir, out = []) {
  for (const name of readdirSync(dir).sort()) {
    const p = join(dir, name)
    if (statSync(p).isDirectory()) walk(p, out)
    else if (/\.(jpe?g|png)$/i.test(name)) out.push(p)
  }
  return out
}

const manifest = {}
let made = 0
let kept = 0

for (const file of walk(ROOT)) {
  const image = sharp(file).rotate()
  const meta = await image.metadata()
  // Orientation 5–8 swaps the axes once .rotate() has applied it.
  const swap = (meta.orientation || 1) >= 5
  const width = swap ? meta.height : meta.width
  const height = swap ? meta.width : meta.height

  const widths = WIDTHS.filter((w) => w < width)
  if (width <= 1600 && !widths.includes(width)) widths.push(width)
  widths.sort((a, b) => a - b)

  const stem = file.slice(0, -extname(file).length)
  const urlStem = '/' + relative('public', stem).split(sep).join('/')
  const srcTime = statSync(file).mtimeMs

  for (const w of widths) {
    const out = `${stem}.w${w}.webp`
    if (!force && existsSync(out) && statSync(out).mtimeMs >= srcTime) {
      kept++
      continue
    }
    await image
      .clone()
      .resize({ width: w, withoutEnlargement: true })
      .webp({ quality: QUALITY, effort: 4 })
      .toFile(out)
    made++
  }

  manifest[`${urlStem}${extname(file)}`] = { w: width, h: height, widths }
}

writeFileSync('src/imageManifest.json', `${JSON.stringify(manifest, null, 2)}\n`)
console.log(`images: ${Object.keys(manifest).length} photos, ${made} variants written, ${kept} kept`)
