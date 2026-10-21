import { useEffect, useState, type ReactNode } from 'react'
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

// One photo as the lightbox gets it, from the first album.
const { thumb: _thumb, photographer: _photographer, profile: _profile, ...firstItem } = ALBUMS[0].photos[0]
const itemSource = `const photo: LightboxItem = ${JSON.stringify(firstItem, null, 2).replace(/"([a-zA-Z]+)":/g, '$1:')}`

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
          <a className="link whitespace-nowrap" href="#setup">
            How it's set up
          </a>
        </div>
      </section>

      <div className="grid gap-20 lg:gap-32">
        {ALBUMS.map((album, i) => (
          <section
            key={album.id}
            id={album.id}
            aria-labelledby={`${album.id}-title`}
            className="grid items-center gap-x-16 gap-y-6 lg:grid-cols-2"
          >
            <div className={`grid max-w-md gap-3 ${i % 2 ? 'lg:order-2' : ''}`}>
              <p className="text-sm text-accent">
                Album {i + 1} · {album.photos.length} photos
              </p>
              <h2 id={`${album.id}-title`} className="text-3xl sm:text-4xl">
                {album.title}
              </h2>
              <p className="text-muted">{album.blurb}</p>
            </div>
            <div className={`w-full max-w-[min(40rem,70svh)] ${i % 2 ? 'lg:justify-self-start' : 'lg:justify-self-end'}`}>
              <Album title={album.title} photos={album.photos} />
            </div>
          </section>
        ))}
      </div>

      <section id="setup" className="mt-24 max-w-3xl scroll-mt-8">
        <h2 className="text-3xl sm:text-4xl">How this page uses it</h2>
        <p className="mt-4 text-muted">
          Everything below is the real code behind the albums above. Copy it, change the photos, and you have the same
          thing.
        </p>

        <ol className="mt-10 grid gap-12">
          <Step n={1} title="Install it, with Motion next to it">
            <Code name="Terminal">{INSTALL}</Code>
          </Step>
          <Step n={2} title="Describe your photos">
            <p>
              Give it a width and height if you know them. If you don't, it measures each photo when it loads. A{' '}
              <code>srcSet</code> lets a phone download a smaller file than a 4K screen. <code>focus</code> and{' '}
              <code>zoom</code> pick the part the album's square shows.
            </p>
            <Code name="One photo">{itemSource}</Code>
          </Step>
          <Step n={3} title="Put them in a Gallery">
            <p>
              This is the whole <code>Album</code> component on this page. <code>Gallery</code> is the small lightbox:
              one photo at a time, on the same track the big one moves on. It takes the lightbox's props and passes them
              on.
            </p>
            <Code name="Album.tsx">{albumSource.trim()}</Code>
          </Step>
          <Step n={4} title="Make it look like your site">
            <p>Everything it draws takes its colours from a few CSS variables. These are this page's.</p>
            <Code name="styles.css">{themeSource}</Code>
          </Step>
        </ol>

        <p className="mt-12 text-muted">
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
      <a href="/" className="font-display text-lg whitespace-nowrap no-underline">
        react-motion-lightbox
      </a>
      <nav className="flex items-center gap-5 text-sm" aria-label="Links">
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

/** Light, dark, or whatever the system says. Remembered on this device. */
function ThemeToggle() {
  const [theme, setTheme] = useState<'system' | 'light' | 'dark'>(() => {
    try {
      return (localStorage.getItem('theme') as 'light' | 'dark' | null) ?? 'system'
    } catch {
      return 'system'
    }
  })
  useEffect(() => {
    const root = document.documentElement
    if (theme === 'system') root.removeAttribute('data-theme')
    else root.dataset.theme = theme
    try {
      if (theme === 'system') localStorage.removeItem('theme')
      else localStorage.setItem('theme', theme)
    } catch {
      // Private mode: the choice just isn't remembered.
    }
  }, [theme])
  const next = theme === 'system' ? 'light' : theme === 'light' ? 'dark' : 'system'
  return (
    <button
      type="button"
      className="min-h-11 min-w-11 cursor-pointer rounded-full border border-rule bg-paper-2 px-4 text-sm whitespace-nowrap text-ink transition-colors hover:bg-paper-3"
      onClick={() => setTheme(next)}
      aria-label={`Theme: ${theme}. Switch to ${next}`}
    >
      {theme === 'system' ? 'Auto' : theme === 'light' ? 'Light' : 'Dark'}
    </button>
  )
}

function Step({ n, title, children }: { n: number; title: string; children: ReactNode }) {
  return (
    <li className="grid gap-4">
      <h3 className="flex items-baseline gap-3 text-xl sm:text-2xl">
        <span className="font-body text-base text-accent tabular-nums">{n}</span>
        {title}
      </h3>
      <div className="grid gap-4 text-muted [&_code]:text-ink">{children}</div>
    </li>
  )
}

function Code({ name, children }: { name: string; children: string }) {
  return (
    <figure className="m-0 grid min-w-0 gap-2">
      <figcaption className="flex items-center justify-between gap-4 pl-1 text-sm">
        <code>{name}</code>
        <CopyButton text={children} />
      </figcaption>
      <pre className="text-ink">
        <code>{children}</code>
      </pre>
    </figure>
  )
}

/** The install line as one thing to copy. */
function Copyable({ text }: { text: string }) {
  return (
    <div className="flex min-w-0 items-center gap-2 rounded-full border border-rule bg-paper-2 py-1.5 pr-1.5 pl-5">
      <code className="truncate text-ink">{text}</code>
      <CopyButton text={text} />
    </div>
  )
}

function CopyButton({ text, className = '' }: { text: string; className?: string }) {
  const [copied, setCopied] = useState(false)
  useEffect(() => {
    if (!copied) return
    const timer = setTimeout(() => setCopied(false), 1600)
    return () => clearTimeout(timer)
  }, [copied])
  return (
    <button
      type="button"
      className={`min-h-9 shrink-0 cursor-pointer rounded-full bg-accent px-4 text-sm font-medium text-accent-ink transition-opacity hover:opacity-90 active:opacity-80 ${className}`}
      onClick={() => {
        navigator.clipboard.writeText(text).then(
          () => setCopied(true),
          () => {},
        )
      }}
    >
      <span aria-live="polite">{copied ? 'Copied' : 'Copy'}</span>
    </button>
  )
}
