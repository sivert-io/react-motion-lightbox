// Renders the page to HTML at build time, so the text paints before any
// JavaScript has loaded. The client then hydrates it (src/main.tsx).
import { readFileSync, rmSync, writeFileSync } from 'node:fs'

const { render } = await import('../dist-ssr/entry-server.js')
const page = 'dist/index.html'
const html = readFileSync(page, 'utf8')
const root = '<div id="root"></div>'
if (!html.includes(root)) throw new Error(`${page} has no empty ${root}`)
writeFileSync(page, html.replace(root, `<div id="root">${render()}</div>`))
rmSync('dist-ssr', { recursive: true })
