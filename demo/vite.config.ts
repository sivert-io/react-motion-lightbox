import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// The demo uses the package's own source, so it always shows what's on main.
// The code on the page still imports from 'react-motion-lightbox', exactly as
// you would.
const src = (p: string) => new URL(`../src/${p}`, import.meta.url).pathname

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: [
      { find: /^react-motion-lightbox$/, replacement: src('index.ts') },
      { find: /^react-motion-lightbox\/styles\.css$/, replacement: src('styles.css') },
    ],
    dedupe: ['react', 'react-dom', 'motion'],
  },
})
