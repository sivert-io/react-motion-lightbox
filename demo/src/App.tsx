import { useEffect, useState } from 'react'
import { DragLesson, FocusLesson, ShapeLesson } from './Lessons'
import { Code, Copyable, Step } from './ui'
import { Album } from './Album'
import { ALBUMS } from './photos'
import albumSource from './Album.tsx?raw'
import stylesSource from './styles.css?raw'

const INSTALL = 'npm install react-motion-lightbox motion'
const GITHUB = 'https://github.com/sivert-io/react-motion-lightbox'
const NPM = 'https://www.npmjs.com/package/react-motion-lightbox'

// The theme block from this page's own stylesheet, so the snippet can't drift.
const themeSource = stylesSource.slice(
  stylesSource.indexOf('.rml.demo {'),
  stylesSource.indexOf('}', stylesSource.indexOf('.rml.demo {')) + 1,
)

const PHOTOGRAPHERS = [...new Map(ALBUMS.flatMap((a) => a.photos).map((p) => [p.profile, p.photographer]))]

export function App() {
  return (
    <div className="mx-auto max-w-6xl px-4 pb-24 sm:px-8">
      <Header />

      <section className="max-w-2xl pt-12 pb-16 sm:pt-20">
        <h1 className="text-4xl sm:text-5xl">A lightbox that opens out of the photo you click.</h1>
        <p className="mt-5 text-lg text-muted">
          Each album below is a small version of it. Swipe through one, then click the photo to open it full size.
          Zoom with a double-click or the scroll wheel, and press Esc to go back into the square.
        </p>
        <div className="mt-8 flex flex-wrap items-center gap-3">
          <Copyable text={INSTALL} />
          <a className="chip inline-flex items-center no-underline" href="#learn">
            Learn it step by step ↓
          </a>
        </div>
      </section>

      <div className="grid gap-x-12 gap-y-20 md:grid-cols-2">
        {ALBUMS.map((album, i) => (
          <section key={album.id} id={album.id} aria-labelledby={`${album.id}-title`} className="grid content-start gap-5">
            <div className="grid gap-2">
              <p className="text-sm text-accent">
                Album {i + 1} · {album.photos.length} photos
              </p>
              <h2 id={`${album.id}-title`} className="text-3xl sm:text-4xl">
                {album.title}
              </h2>
              <p className="text-muted">{album.blurb}</p>
            </div>
            {/* Each on its own beat, so the four don't all turn at once. */}
            <Album title={album.title} photos={album.photos} first={i === 0} autoplay={6000 + i * 1300} />
          </section>
        ))}
      </div>

      <section id="learn" className="mt-32 scroll-mt-8">
        <h2 className="text-3xl sm:text-4xl">Learn it step by step</h2>
        <p className="mt-4 max-w-2xl text-muted">
          Try each step on the right, and copy its code on the left. The last step is the real code behind the albums
          above.
        </p>

        <ol className="mt-12 grid gap-20">
          <Step n={1} title="Install it, with Motion next to it">
            <Code name="Terminal">{INSTALL}</Code>
          </Step>
          <DragLesson n={2} />
          <FocusLesson n={3} />
          <ShapeLesson n={4} />
          <Step n={5} title="Make it look like your site">
            <p>
              Everything it draws takes its colours from a few CSS variables. <code>--rml-blur</code> blurs the page
              behind the open lightbox, and the blur rises and settles as it opens and closes. These are this page's.
            </p>
            <Code name="styles.css">{themeSource}</Code>
          </Step>
          <Step n={6} title="All together">
            <p>
              This is the whole <code>Album</code> component behind the albums above. <code>Gallery</code> takes the
              lightbox's props and passes them on, so the caption and the title go to both.
            </p>
            <Code name="Album.tsx">{albumSource.trim()}</Code>
          </Step>
        </ol>

        <p className="mt-16 max-w-3xl text-muted">
          The rest of the options, like video, a toolbar and your own icons, are in the{' '}
          <a className="link" href={`${GITHUB}#props`}>
            README
          </a>
          .
        </p>
      </section>

      <footer className="mt-24 grid gap-6 border-t border-rule pt-8 text-sm text-muted">
        <p>
          Photos from Unsplash, by{' '}
          {PHOTOGRAPHERS.map(([profile, name], i) => (
            <span key={profile}>
              <a className="link" href={profile} target="_blank" rel="noreferrer">
                {name}
              </a>
              {i < PHOTOGRAPHERS.length - 2 ? ', ' : i === PHOTOGRAPHERS.length - 2 ? ' and ' : '.'}
            </span>
          ))}
        </p>
        <p>
          The logo is Brown Mushroom from Microsoft's{' '}
          <a className="link" href="https://github.com/microsoft/fluentui-emoji" target="_blank" rel="noreferrer">
            Fluent Emoji
          </a>
          , MIT licensed.
        </p>
        <p>
          MIT licensed. Made by{' '}
          <a className="link" href="https://gullberg.no">
            Sivert Gullberg Hansen
          </a>
          .
        </p>
      </footer>
    </div>
  )
}

function Header() {
  return (
    <header className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 border-b border-rule py-5">
      <a href="/" className="flex items-center gap-3 font-display text-lg whitespace-nowrap no-underline">
        <span className="logo">
          <img src="/logo.svg" alt="" width={32} height={32} />
        </span>
        react-motion-lightbox
      </a>
      <nav className="flex items-center gap-5 text-sm" aria-label="Links">
        <a className="link whitespace-nowrap" href="#learn">
          Learn
        </a>
        <a className="link whitespace-nowrap" href={GITHUB}>
          GitHub
        </a>
        <a className="link whitespace-nowrap" href={NPM}>
          npm
        </a>
        <ThemeToggle />
      </nav>
    </header>
  )
}

const NAMES = { system: 'Auto', light: 'Light', dark: 'Dark' }

/** Light, dark, or whatever the system says. Remembered on this device. */
function ThemeToggle() {
  // Starts as Auto, like the HTML rendered at build time, and reads the saved
  // choice after hydration. The inline script in index.html has applied it already.
  const [theme, setTheme] = useState<'system' | 'light' | 'dark'>('system')
  useEffect(() => {
    try {
      const saved = localStorage.getItem('theme')
      if (saved === 'light' || saved === 'dark') setTheme(saved)
    } catch {
      // Private mode: nothing was saved.
    }
  }, [])
  const choose = (choice: typeof theme) => {
    setTheme(choice)
    const root = document.documentElement
    if (choice === 'system') root.removeAttribute('data-theme')
    else root.dataset.theme = choice
    try {
      if (choice === 'system') localStorage.removeItem('theme')
      else localStorage.setItem('theme', choice)
    } catch {
      // Private mode: the choice just isn't remembered.
    }
  }
  const next = theme === 'system' ? 'light' : theme === 'light' ? 'dark' : 'system'
  return (
    <button
      type="button"
      className="min-h-11 min-w-11 cursor-pointer rounded-full border border-rule bg-paper-2 px-4 text-sm whitespace-nowrap text-ink transition-colors hover:bg-paper-3"
      onClick={() => choose(next)}
      aria-label={`${NAMES[theme]} theme. Switch to ${NAMES[next]}`}
    >
      {NAMES[theme]}
    </button>
  )
}
