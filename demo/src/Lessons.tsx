import { useState, type KeyboardEvent, type PointerEvent } from 'react'
import { Gallery, cropOf } from 'react-motion-lightbox'
import { ALBUMS, type Photo } from './photos'
import { Code, Step } from './ui'

const ALL = ALBUMS.flatMap((album) => album.photos)
const photo = (id: string) => ALL.find((p) => p.src.includes(id))!
const round = (v: number) => Math.round(v * 100) / 100

/** A line telling you what to try, that changes once you've done it. */
function Hint({ children }: { children: string }) {
  return (
    <p className="hint" aria-live="polite">
      {children}
    </p>
  )
}

export function DragLesson({ n }: { n: number }) {
  const photos = ALBUMS[3].photos.slice(0, 5)
  const [moved, setMoved] = useState(false)
  return (
    <Step
      n={n}
      title="Drag it, then click it"
      demo={
        <div className="grid gap-4">
          <Hint>
            {moved
              ? 'Now click the photo. It opens out of the square, and Esc sends it back in.'
              : 'Grab the photo with your cursor and drag it sideways. On a phone, swipe.'}
          </Hint>
          <Gallery className="demo" items={photos} radius={14} caption={(p) => p.alt} onIndexChange={() => setMoved(true)} />
        </div>
      }
    >
      <p>
        Give <code>Gallery</code> your photos and it shows one at a time. Drag it, flick it, or grab it while it's still
        moving. Click the photo and the big lightbox opens out of it, where you can zoom with a double-click or the scroll
        wheel.
      </p>
      <Code name="Gallery.tsx">{`import { Gallery } from 'react-motion-lightbox'
import 'react-motion-lightbox/styles.css'

const photos = [
  {
    kind: 'image',
    src: '/photos/street.jpg',
    width: 4000,
    height: 6000,
    alt: 'People crossing the street with umbrellas',
  },
  {
    kind: 'image',
    src: '/photos/pigeon.jpg',
    width: 2081,
    height: 3123,
    alt: 'A pigeon on wet pavement',
  },
]

export function Photos() {
  return <Gallery items={photos} caption={(photo) => photo.alt} />
}`}</Code>
      <p>
        Give each photo its <code>width</code> and <code>height</code> if you have them. If you don't, it measures them
        when they load.
      </p>
    </Step>
  )
}

export function FocusLesson({ n }: { n: number }) {
  const start = photo('cKBsq-5U17A')
  const [focus, setFocus] = useState<[number, number]>(start.focus ?? [0.5, 0.5])
  const [zoom, setZoom] = useState(start.zoom ?? 1)
  const item: Photo = { ...start, focus, zoom }
  const [left, top, width, height] = cropOf(item)
  const clamp = (v: number) => round(Math.min(1, Math.max(0, v)))

  const pick = (event: PointerEvent<HTMLDivElement>) => {
    const box = event.currentTarget.getBoundingClientRect()
    setFocus([clamp((event.clientX - box.left) / box.width), clamp((event.clientY - box.top) / box.height)])
  }
  const nudge = (event: KeyboardEvent) => {
    const moves: Record<string, [number, number]> = {
      ArrowLeft: [-0.02, 0],
      ArrowRight: [0.02, 0],
      ArrowUp: [0, -0.02],
      ArrowDown: [0, 0.02],
    }
    const move = moves[event.key]
    if (!move) return
    event.preventDefault()
    setFocus(([x, y]) => [clamp(x + move[0]), clamp(y + move[1])])
  }

  return (
    <Step
      n={n}
      title="Point it at what matters"
      demo={
        <div className="grid gap-4">
          <Hint>Click the photo where you want the square, and slide the zoom.</Hint>
          <div className="grid grid-cols-[minmax(0,2fr)_minmax(0,1fr)] items-start gap-4">
            <div
              className="picker"
              tabIndex={0}
              role="group"
              aria-label={`Focus point at ${Math.round(focus[0] * 100)}% across and ${Math.round(focus[1] * 100)}% down. Arrow keys move it.`}
              onPointerDown={(event) => {
                event.currentTarget.setPointerCapture(event.pointerId)
                pick(event)
              }}
              onPointerMove={(event) => event.buttons && pick(event)}
              onKeyDown={nudge}
            >
              <img src={start.src} alt="" width={start.width} height={start.height} loading="lazy" draggable={false} />
              <span
                className="picker-crop"
                style={{ left: `${left * 100}%`, top: `${top * 100}%`, width: `${width * 100}%`, height: `${height * 100}%` }}
              />
              <span className="picker-dot" style={{ left: `${focus[0] * 100}%`, top: `${focus[1] * 100}%` }} />
            </div>
            <Gallery className="demo" items={[item]} radius={10} />
          </div>
          <label className="flex items-center gap-3 text-sm">
            Zoom
            <input
              type="range"
              min={1}
              max={4}
              step={0.1}
              value={zoom}
              onChange={(event) => setZoom(Number(event.target.value))}
              className="min-w-0 flex-1 accent-accent"
            />
            <span className="w-10 text-right tabular-nums">{zoom.toFixed(1)}×</span>
          </label>
        </div>
      }
    >
      <p>
        The square shows part of each photo. <code>focus</code> is the point it centres on, as fractions across and down,
        and <code>zoom</code> is how far it zooms in on that point. Leave them out and you get the middle.
      </p>
      <Code name="One photo">{`{
  kind: 'image',
  src: '/photos/cliff.jpg',
  width: ${start.width},
  height: ${start.height},
  focus: [${focus[0]}, ${focus[1]}],
  zoom: ${zoom},
}`}</Code>
      <p>
        Click the small square. The lightbox opens out of exactly that part, then shows the whole photo. The crop
        never runs off the edge: near one, it stops there.
      </p>
    </Step>
  )
}

const SHAPES = [
  { name: 'Square', aspect: 1, code: '1' },
  { name: '4:3', aspect: 4 / 3, code: '4 / 3' },
  { name: '3:4', aspect: 3 / 4, code: '3 / 4' },
  { name: '16:9', aspect: 16 / 9, code: '16 / 9' },
]

export function ShapeLesson({ n }: { n: number }) {
  const photos = ALBUMS[1].photos
  const [shape, setShape] = useState(SHAPES[1])
  const [clip, setClip] = useState(true)
  const props = [shape.aspect !== 1 && `aspect={${shape.code}}`, !clip && 'clip={false}'].filter(Boolean).join(' ')

  return (
    <Step
      n={n}
      title="Pick a shape"
      demo={
        <div className="grid gap-4">
          <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Shape">
            {SHAPES.map((s) => (
              <button key={s.name} type="button" className="chip" aria-pressed={s === shape} onClick={() => setShape(s)}>
                {s.name}
              </button>
            ))}
            <label className="ml-auto flex items-center gap-2 text-sm">
              <input type="checkbox" checked={clip} onChange={(event) => setClip(event.target.checked)} className="accent-accent" />
              Cut off at the edges
            </label>
          </div>
          <div style={{ maxWidth: `min(100%, 60svh * ${shape.aspect})` }}>
            <Gallery className="demo" items={photos} radius={14} aspect={shape.aspect} clip={clip} />
          </div>
        </div>
      }
    >
      <p>
        <code>aspect</code> is the box's width over its height. The focus and zoom still work, for whatever shape it is.
      </p>
      <p>
        By default the box cuts photos off at its edges as they slide. Turn <code>clip</code> off and they slide out past
        them, fading as they go.
      </p>
      <Code name="Gallery.tsx">{`<Gallery items={photos}${props ? ' ' + props : ''} />`}</Code>
    </Step>
  )
}
