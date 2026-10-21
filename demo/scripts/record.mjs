// Records a run through the demo for the trailer (scripts/trailer.sh). Not part of the site.
//   node scripts/record.mjs <out-dir> desktop|phone
import { chromium, devices } from '@playwright/test'
import fs from 'node:fs'

const [out, mode] = process.argv.slice(2)
const phone = mode === 'phone'
const browser = await chromium.launch({ channel: 'chrome' })
// Headless Chrome won't make a window narrower than 500, so the phone is a
// 500-wide one with an iPhone's shape. Still the phone layout.
const size = phone ? { width: 500, height: 1082 } : { width: 1280, height: 720 }
const context = await browser.newContext({
  ...(phone ? devices['iPhone 13'] : {}),
  viewport: size,
  deviceScaleFactor: 1,
})
const page = await context.newPage()
const cdp = await context.newCDPSession(page)
// The window has to be bigger than the page, or the frames come out short.
const { windowId } = await cdp.send('Browser.getWindowForTarget')
await cdp.send('Browser.setWindowBounds', { windowId, bounds: { width: size.width, height: size.height + 120 } })
fs.mkdirSync(out, { recursive: true })
const frames = []
cdp.on('Page.screencastFrame', ({ data, metadata, sessionId }) => {
  const file = `${out}/${String(frames.length).padStart(5, '0')}.jpg`
  fs.writeFileSync(file, Buffer.from(data, 'base64'))
  frames.push({ file, t: metadata.timestamp })
  void cdp.send('Page.screencastFrameAck', { sessionId }).catch(() => {})
})
await page.addInitScript((phone) => {
  try {
    localStorage.setItem('theme', 'light')
  } catch {}
  // A cursor, or a fingertip, you can see: headless Chrome draws neither.
  addEventListener('DOMContentLoaded', () => {
    const dot = document.createElement('div')
    const s = phone ? 34 : 22
    dot.style.cssText = `position:fixed;z-index:2147483647;left:0;top:0;width:${s}px;height:${s}px;margin:${-s / 2}px 0 0 ${-s / 2}px;border-radius:50%;background:rgba(40,20,18,.3);border:2px solid rgba(255,255,255,.9);box-shadow:0 1px 4px rgba(0,0,0,.3);pointer-events:none;transition:transform .12s, opacity .2s;opacity:${phone ? 0 : 1}`
    document.documentElement.appendChild(dot)
    const at = (e) => (dot.style.translate = `${e.clientX}px ${e.clientY}px`)
    addEventListener('pointermove', at, true)
    addEventListener('pointerdown', (e) => {
      at(e)
      dot.style.transform = 'scale(.75)'
      if (phone) dot.style.opacity = 1
    }, true)
    addEventListener('pointerup', () => {
      dot.style.transform = ''
      if (phone) dot.style.opacity = 0
    }, true)
    addEventListener('pointercancel', () => {
      if (phone) dot.style.opacity = 0
    }, true)
  })
}, phone)

const started = Date.now()
await page.goto('http://localhost:5180/')
const wait = (ms) => page.waitForTimeout(ms)
await page.locator('#norway').evaluate((el, phone) => {
  el.scrollIntoView({ block: phone ? 'start' : 'center', behavior: 'instant' })
  if (phone) scrollBy(0, -16)
}, phone)
await wait(1200)
await cdp.send('Page.startScreencast', { format: 'jpeg', quality: 92, everyNthFrame: 1 })
await wait(300)
const action = (Date.now() - started) / 1000
const box = await page.locator('#norway .rml-gallery-box').boundingBox()
const cx = box.x + box.width / 2
const cy = box.y + box.height / 2

if (!phone) {
  await page.mouse.move(cx + 200, cy + 120)
  await page.mouse.move(cx + 120, cy, { steps: 20 })
  await wait(400)
  await page.mouse.down()
  await page.mouse.move(cx - 160, cy + 6, { steps: 30 })
  await page.mouse.up()
  await wait(1100)
  await page.mouse.move(cx, cy, { steps: 12 })
  await wait(300)
  await page.mouse.down()
  await page.mouse.up()
  await wait(1500)
  const next = await page.locator('dialog.rml').getByRole('button', { name: 'Next' }).boundingBox()
  await page.mouse.move(next.x + next.width / 2, next.y + next.height / 2, { steps: 25 })
  await wait(300)
  await page.mouse.down()
  await page.mouse.up()
  await wait(1500)
  await page.keyboard.press('Escape')
  await wait(1600)
} else {
  // Touch through CDP, so the page gets real touch (and pointer) events.
  const touch = (type, x, y) =>
    cdp.send('Input.dispatchTouchEvent', { type, touchPoints: type === 'touchEnd' ? [] : [{ x, y }] })
  const swipe = async (x1, y1, x2, y2, ms = 320, steps = 16) => {
    await touch('touchStart', x1, y1)
    for (let i = 1; i <= steps; i++) {
      await touch('touchMove', x1 + ((x2 - x1) * i) / steps, y1 + ((y2 - y1) * i) / steps)
      await wait(ms / steps)
    }
    await touch('touchEnd')
  }
  const tap = async (x, y) => {
    await touch('touchStart', x, y)
    await wait(90)
    await touch('touchEnd')
  }
  await swipe(cx + 110, cy, cx - 130, cy + 4)
  await wait(1100)
  await tap(cx, cy)
  await wait(1500)
  await swipe(410, 540, 90, 545, 300)
  await wait(1300)
  const close = await page.locator('dialog.rml .rml-close').boundingBox()
  await tap(close.x + close.width / 2, close.y + close.height / 2)
  await wait(1700)
}
await cdp.send('Page.stopScreencast')
// For ffmpeg's concat demuxer: each frame shown until the next one came.
const list = frames.map((f, i) => `file '${f.file}'\nduration ${((frames[i + 1]?.t ?? f.t + 0.04) - f.t).toFixed(4)}`)
fs.writeFileSync(`${out}/frames.txt`, list.join('\n') + `\nfile '${frames.at(-1).file}'\n`)
console.log(JSON.stringify({ mode, frames: frames.length, seconds: frames.at(-1).t - frames[0].t }))
await context.close()
await browser.close()
