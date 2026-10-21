import { defineConfig, type Plugin } from 'vite'
import type { OutputAsset } from 'rollup'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// The demo uses the package's own source, so it always shows what's on main.
// The code on the page still imports from 'react-motion-lightbox', exactly as
// you would.
const src = (p: string) => new URL(`../src/${p}`, import.meta.url).pathname

/**
 * Inlines the built stylesheet into index.html and drops its <link>. It's
 * ~6 kB gzipped, and as a file of its own it was the one request still holding
 * back the first paint. Taken from gullberg.no's config.
 */
function inlineCss(): Plugin {
  return {
    name: 'inline-css',
    apply: 'build',
    enforce: 'post',
    generateBundle(_options, bundle) {
      const assets = Object.values(bundle).filter((chunk): chunk is OutputAsset => chunk.type === 'asset')
      const html = assets.find((asset) => asset.fileName.endsWith('.html'))
      if (!html) return
      let source = String(html.source)
      for (const sheet of assets.filter((asset) => asset.fileName.endsWith('.css'))) {
        const link = new RegExp(`<link[^>]+href="[^"]*${sheet.fileName}"[^>]*>`)
        if (!link.test(source)) continue
        source = source.replace(link, `<style>${String(sheet.source).trim()}</style>`)
        delete bundle[sheet.fileName]
      }
      html.source = source
    },
  }
}

export default defineConfig({
  plugins: [react(), tailwindcss(), inlineCss()],
  resolve: {
    alias: [
      { find: /^react-motion-lightbox$/, replacement: src('index.ts') },
      { find: /^react-motion-lightbox\/styles\.css$/, replacement: src('styles.css') },
    ],
    dedupe: ['react', 'react-dom', 'motion'],
  },
})
