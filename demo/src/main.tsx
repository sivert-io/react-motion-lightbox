import { StrictMode } from 'react'
import { createRoot, hydrateRoot } from 'react-dom/client'
import { App } from './App'
import './styles.css'

const root = document.getElementById('root')!
const app = (
  <StrictMode>
    <App />
  </StrictMode>
)
// The build renders the page to HTML (scripts/prerender.mjs); the dev server doesn't.
if (root.firstChild) hydrateRoot(root, app)
else createRoot(root).render(app)
