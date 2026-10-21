import { defineConfig } from '@playwright/test'

// Runs against the demo's dev server, in the Chrome that's already installed
// (GitHub's Ubuntu runners have it too), so there's no browser to download.
export default defineConfig({
  testDir: 'test',
  use: { baseURL: 'http://localhost:5181', channel: 'chrome' },
  webServer: {
    command: 'npx vite --port 5181 --strictPort',
    url: 'http://localhost:5181',
    reuseExistingServer: !process.env.CI,
  },
})
