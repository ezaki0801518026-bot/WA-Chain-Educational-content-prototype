#!/usr/bin/env node
// Regression check for the production build: walks every active section's
// full lesson -> quiz -> summary flow, confirms zero page-level vertical
// scroll at a few common desktop/laptop viewport sizes, and fails on any
// browser console error. Run `npm run build` first, then `npm run verify`.
//
// Requires a system Chrome/Chromium install. Override the executable path
// with the CHROME_PATH env var if auto-detection doesn't find it.

import { spawn } from 'node:child_process'
import { readFileSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import puppeteer from 'puppeteer-core'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
const PORT = 4173
const BASE = `http://localhost:${PORT}`

const VIEWPORTS = [
  { width: 1280, height: 720 },
  { width: 1366, height: 768 },
  { width: 1920, height: 1080 },
]

function findChrome() {
  if (process.env.CHROME_PATH && existsSync(process.env.CHROME_PATH)) return process.env.CHROME_PATH
  const candidates =
    process.platform === 'win32'
      ? [
          'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
          'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
          'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
        ]
      : process.platform === 'darwin'
        ? ['/Applications/Google Chrome.app/Contents/MacOS/Google Chrome']
        : ['/usr/bin/google-chrome', '/usr/bin/chromium-browser', '/usr/bin/chromium']
  const found = candidates.find((p) => existsSync(p))
  if (!found) {
    throw new Error(
      'No Chrome/Chromium/Edge install found. Set CHROME_PATH to your browser executable and retry.'
    )
  }
  return found
}

function waitForServer(url, timeoutMs = 20000) {
  const start = Date.now()
  return new Promise((resolve, reject) => {
    const tick = async () => {
      try {
        const res = await fetch(url)
        if (res.ok) return resolve()
      } catch {
        // not up yet
      }
      if (Date.now() - start > timeoutMs) return reject(new Error(`Server at ${url} did not become ready`))
      setTimeout(tick, 300)
    }
    tick()
  })
}

async function runSectionFlow(page, sectionId, issues) {
  await page.goto(`${BASE}/#/lesson/${sectionId}`, { waitUntil: 'networkidle0', timeout: 20000 })
  await page.waitForSelector('h2', { timeout: 10000 })

  let steps = 0
  while (true) {
    steps += 1
    await new Promise((r) => setTimeout(r, 200))
    const overflow = await page.evaluate(() => document.documentElement.scrollHeight > window.innerHeight)
    if (overflow) issues.push(`${sectionId} lesson step ${steps}: page-level vertical scroll detected`)
    const buttons = await page.$$('nav button')
    const last = buttons[buttons.length - 1]
    const label = await page.evaluate((el) => el.textContent, last)
    await last.click()
    await new Promise((r) => setTimeout(r, 300))
    if (label.includes('Finish')) break
    if (steps > 20) {
      issues.push(`${sectionId}: exceeded 20 lesson steps without reaching Finish — possible loop bug`)
      break
    }
  }

  await page.waitForSelector('h1', { timeout: 10000 })
  let q = 0
  while (true) {
    const optionButtons = await page.$$('ul button')
    if (optionButtons.length === 0) break
    await optionButtons[0].click()
    await new Promise((r) => setTimeout(r, 150))
    q += 1
    const buttons = await page.$$('button')
    let next = null
    for (const b of buttons) {
      const text = await page.evaluate((el) => el.textContent, b)
      if (text === 'Next question' || text === 'See results') {
        next = b
        break
      }
    }
    if (!next) {
      issues.push(`${sectionId} quiz question ${q}: could not find Next/See results button`)
      break
    }
    await next.click()
    await new Promise((r) => setTimeout(r, 250))
    if (q > 10) break
    const isReview = await page.evaluate(() => document.body.textContent.includes('Quiz results'))
    if (isReview) break
  }

  const buttons = await page.$$('button')
  let summaryBtn = null
  for (const b of buttons) {
    const text = await page.evaluate((el) => el.textContent, b)
    if (text === 'Continue to summary') {
      summaryBtn = b
      break
    }
  }
  if (!summaryBtn) {
    issues.push(`${sectionId}: "Continue to summary" button not found on review screen`)
    return
  }
  await summaryBtn.click()
  await new Promise((r) => setTimeout(r, 250))
  await page.waitForSelector('h1', { timeout: 10000 })
  const summaryTitle = await page.evaluate(() => document.querySelector('h1')?.textContent)
  if (!summaryTitle) issues.push(`${sectionId}: summary page did not render a title`)
}

async function main() {
  const lessons = JSON.parse(readFileSync(path.join(ROOT, 'data', 'lessons.json'), 'utf8'))
  const activeSections = lessons.sections.filter((s) => s.active)

  console.log(`Starting preview server on port ${PORT}...`)
  // Spawn vite's JS entry directly with the current Node binary (no shell,
  // no .cmd wrapper) so the returned PID is the real process and can
  // actually be killed afterward — a shell-wrapped spawn leaves the real
  // server process orphaned on Windows.
  const viteBin = path.join(ROOT, 'node_modules', 'vite', 'bin', 'vite.js')
  const preview = spawn(process.execPath, [viteBin, 'preview', '--port', String(PORT), '--strictPort'], {
    cwd: ROOT,
    stdio: 'ignore',
  })

  const issues = []
  try {
    await waitForServer(BASE)

    const chromePath = findChrome()
    const browser = await puppeteer.launch({
      executablePath: chromePath,
      headless: 'new',
      args: ['--no-sandbox', '--disable-gpu'],
    })
    const page = await browser.newPage()
    page.on('pageerror', (err) => issues.push(`console error: ${err}`))
    page.on('console', (msg) => {
      if (msg.type() === 'error') issues.push(`console error: ${msg.text()}`)
    })

    // Home page sanity check
    await page.setViewport({ width: 1366, height: 900 })
    await page.goto(`${BASE}/#/`, { waitUntil: 'networkidle0', timeout: 20000 })
    const h2Count = await page.evaluate(() => document.querySelectorAll('h2').length)
    if (h2Count !== lessons.sections.length) {
      issues.push(`home page shows ${h2Count} section cards, expected ${lessons.sections.length}`)
    }

    for (const viewport of VIEWPORTS) {
      await page.setViewport(viewport)
      for (const section of activeSections) {
        console.log(`  checking ${section.id} at ${viewport.width}x${viewport.height}...`)
        await runSectionFlow(page, section.id, issues)
      }
    }

    await browser.close()
  } finally {
    preview.kill()
  }

  if (issues.length > 0) {
    console.error(`\nFAILED — ${issues.length} issue(s):`)
    for (const issue of issues) console.error(`  - ${issue}`)
    process.exit(1)
  }

  console.log(
    `\nOK — ${activeSections.length} active section(s) verified across ${VIEWPORTS.length} viewport size(s), zero console errors, zero page-level scroll.`
  )
}

main().catch((err) => {
  console.error('Verification script crashed:', err)
  process.exit(1)
})
