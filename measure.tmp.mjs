import puppeteer from 'puppeteer-core'

const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe'
const target = process.argv[2] || 'https://wa-chain-educational-content-prototype.pages.dev'
const shot = process.argv[3] || null

const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--hide-scrollbars'] })
const page = await browser.newPage()
await page.setViewport({ width: 1440, height: 900 })
await page.goto(`${target}/#/chat`, { waitUntil: 'networkidle2' })
await new Promise((r) => setTimeout(r, 2500))

const m = await page.evaluate(() => {
  const label = document.querySelector('[class*="sampleLabel"]')
  const exchanges = [...document.querySelectorAll('[class*="exchange"]')]
  if (!label || !exchanges.length) return { error: 'samples not rendered' }
  const top = label.getBoundingClientRect().top
  const bottom = exchanges.at(-1).getBoundingClientRect().bottom
  const bubble = document.querySelector('[class*="bubble"]')
  const cs = getComputedStyle(bubble)
  return {
    sampleBlockHeight: Math.round(bottom - top),
    bubbleFontSize: cs.fontSize,
    bubbleLineHeight: cs.lineHeight,
    bubblePadding: cs.padding,
    bubbleMaxWidth: cs.maxWidth,
    threadGap: getComputedStyle(document.querySelector('[class*="thread"]')).gap,
    formTop: Math.round(document.querySelector('form').getBoundingClientRect().top),
    parts: {
      label: Math.round(label.getBoundingClientRect().height),
      bubbles: [...document.querySelectorAll('[class*="sampleBubble"]')].map((b) => ({
        h: Math.round(b.getBoundingClientRect().height),
        w: Math.round(b.getBoundingClientRect().width),
        lines: Math.round((b.getBoundingClientRect().height - 14.4) / 20.15),
      })),
    },
  }
})
console.log(JSON.stringify(m, null, 1))

if (shot) {
  const h = await page.evaluate(() => document.body.scrollHeight)
  await page.setViewport({ width: 1440, height: Math.min(h + 40, 2000) })
  await new Promise((r) => setTimeout(r, 600))
  await page.screenshot({ path: shot })
}
await browser.close()
