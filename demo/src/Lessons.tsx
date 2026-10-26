import { useEffect, useState, type KeyboardEvent, type PointerEvent } from 'react'
import { Gallery, cropOf } from 'react-motion-lightbox'
import { ALBUMS, type Photo } from './photos'
import { Code, Step, Switch } from './ui'

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
        moving. Click the photo and the big lightbox opens out of it, where you can zoom with a click or the scroll
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
  const sample = photo('cKBsq-5U17A')
  // The photo being framed: ours, or one of yours.
  const [base, setBase] = useState<Photo & { file: string }>({ ...sample, file: 'cliff.jpg' })
  const [focus, setFocus] = useState<[number, number]>(sample.focus ?? [0.5, 0.5])
  const [zoom, setZoom] = useState(sample.zoom ?? 1)
  const item: Photo = { ...base, focus, zoom }
  const [left, top, width, height] = cropOf(item)
  const clamp = (v: number) => round(Math.min(1, Math.max(0, v)))

  // Yours never leaves your device: it's shown from a blob URL, not uploaded.
  const use = (file?: File) => {
    if (!file?.type.startsWith('image/')) return
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      setBase({
        kind: 'image',
        src: url,
        thumb: url,
        alt: 'Your photo',
        width: img.naturalWidth,
        height: img.naturalHeight,
        photographer: 'you',
        profile: '',
        file: file.name,
      })
      setFocus([0.5, 0.5])
      setZoom(1)
    }
    img.src = url
  }
  useEffect(() => () => void (base.src.startsWith('blob:') && URL.revokeObjectURL(base.src)), [base.src])

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
          <Hint>Click the photo where you want the square, and slide the zoom. Or try one of your own.</Hint>
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
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => {
              event.preventDefault()
              use(event.dataTransfer.files[0])
            }}
          >
            <img src={base.src} alt="" width={base.width} height={base.height} loading="lazy" draggable={false} />
            <span
              className="picker-crop"
              style={{ left: `${left * 100}%`, top: `${top * 100}%`, width: `${width * 100}%`, height: `${height * 100}%` }}
            />
            <span className="picker-dot" style={{ left: `${focus[0] * 100}%`, top: `${focus[1] * 100}%` }} />
          </div>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
            <label className="flex min-w-48 flex-1 items-center gap-3 text-sm">
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
            <label className="chip inline-flex items-center">
              Use your own photo
              <input type="file" accept="image/*" className="sr-only" onChange={(event) => use(event.target.files?.[0])} />
            </label>
          </div>
          <div className="grid max-w-sm gap-2">
            <p className="m-0 text-sm text-muted">How it looks in an album. Click it, or swipe on:</p>
            <Gallery className="demo" items={[item, ...ALBUMS[0].photos.slice(1, 4)]} radius={14} caption={(p) => p.alt} />
          </div>
        </div>
      }
    >
      <p>
        The square shows part of each photo. <code>focus</code> is the point it centres on, as fractions across and down,
        and <code>zoom</code> is how far it zooms in on that point. Leave them out and you get the middle.
      </p>
      <Code name="One photo">{`{
  kind: 'image',
  src: '/photos/${base.file}',
  width: ${base.width},
  height: ${base.height},
  focus: [${focus[0]}, ${focus[1]}],
  zoom: ${zoom},
}`}</Code>
      <p>
        Click the photo in the album. The lightbox opens out of exactly the part in the square, then shows the whole
        photo. The crop never runs off the photo. Near an edge, it stops at the edge.
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
  const [whole, setWhole] = useState(false)
  const [peek, setPeek] = useState(false)
  const [fade, setFade] = useState(true)
  const props = [
    shape.aspect !== 1 && `aspect={${shape.code}}`,
    whole && `fit="contain"`,
    peek && 'peek={56} gap={12}',
    !clip && 'clip={false}',
    !clip && !fade && 'fade={false}',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <Step
      n={n}
      title="Pick a shape"
      demo={
        <div className="grid gap-4">
          <Hint>
            {clip
              ? 'Pick a shape. Then turn overflow hidden off and drag the photo.'
              : 'Now drag the photo: the next one slides in over the edge, fading as it comes.'}
          </Hint>
          <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Shape">
            {SHAPES.map((s) => (
              <button key={s.name} type="button" className="chip" aria-pressed={s === shape} onClick={() => setShape(s)}>
                {s.name}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-x-6">
            <Switch checked={whole} onChange={setWhole}>
              Whole photo
            </Switch>
            <Switch checked={peek} onChange={setPeek}>
              Peek at the next
            </Switch>
            <Switch checked={clip} onChange={setClip}>
              Overflow hidden
            </Switch>
            {!clip && (
              <Switch checked={fade} onChange={setFade}>
                Fade at the edges
              </Switch>
            )}
          </div>
          <div style={{ maxWidth: `min(100%, 60svh * ${shape.aspect})` }}>
            <Gallery
              className="demo"
              items={photos}
              radius={14}
              aspect={shape.aspect}
              clip={clip}
              fade={fade}
              fit={whole ? 'contain' : 'cover'}
              peek={peek ? 56 : 0}
              gap={peek ? 12 : undefined}
            />
          </div>
        </div>
      }
    >
      <p>
        <code>aspect</code> is the box's width over its height. The focus and zoom still work, for whatever shape it is.
      </p>
      <p>
        <code>fit="contain"</code> shows the whole photo instead of a crop. <code>peek</code> lets the next one show at
        the right edge, so it reads as something to swipe.
      </p>
      <p>
        By default the box cuts photos off at its edges as they slide. Turn <code>clip</code> off and they slide out past
        them, fading as they go. Turn <code>fade</code> off too and they stay in full view, like a carousel.
      </p>
      <Code name="Gallery.tsx">{`<Gallery items={photos}${props ? ' ' + props : ''} />`}</Code>
    </Step>
  )
}
