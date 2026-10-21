import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ButtonHTMLAttributes,
  type CSSProperties,
  type MouseEvent,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from 'react'
import { createPortal } from 'react-dom'
import {
  LazyMotion,
  animate,
  domMax,
  useMotionValue,
  useTransform,
  type MotionValue,
  type PanInfo,
} from 'motion/react'
import * as m from 'motion/react-m'
import { GAP, useTrack, useTrackPlace } from './track.js'

// ── Types ───────────────────────────────────────────────────────────────────

export interface LightboxItem {
  kind: 'image' | 'video'
  /** The full-size image, or the video file. */
  src: string
  srcSet?: string
  sizes?: string
  alt?: string
  /** Intrinsic size. Without it the item is measured once it loads. */
  width?: number
  height?: number
  /** A video's still. */
  poster?: string
  /** A small image for the thumbnail row. Defaults to `src` (or `poster`). */
  thumb?: string
  /** What a cropped view of it centres on, as fractions of it: x, y. Default the middle. See `cropOf`. */
  focus?: [number, number]
  /** How far a cropped view zooms in on `focus`. 1, the default, is the biggest crop that fits. */
  zoom?: number
}

/** A region of the picture, as fractions of it: left, top, width, height. */
export type Crop = [number, number, number, number]

export interface LightboxLabels {
  dialog: string
  close: string
  previous: string
  next: string
}

export interface LightboxIcons {
  close: ReactNode
  previous: ReactNode
  next: ReactNode
}

export interface LightboxProps<T extends LightboxItem = LightboxItem> {
  items: T[]
  /** The item to show. Changing it while open moves there. */
  index: number
  open: boolean
  /** Asked to close (Esc, the close button). Set `open` to false to close. */
  onClose: () => void
  /** The item on screen changed (swipe, arrows, keys, thumbnails). */
  onIndexChange?: (index: number) => void
  /** The closing animation has finished and the dialog is gone. */
  onExited?: (index: number) => void
  /**
   * The thumbnail an item opens out of and closes back into. Without one (or
   * when it returns nothing) the lightbox fades and scales in and out instead.
   */
  origin?: (index: number) => Element | DOMRect | null | undefined
  /** The part of the item the thumbnail shows, when it is a crop of it. */
  originCrop?: (index: number) => Crop | undefined
  /** Draw a video yourself. The element fills the item's box. */
  renderVideo?: (item: T, state: { active: boolean }) => ReactNode
  /** Top left: a sender, a time, a name. */
  title?: (item: T, index: number) => ReactNode
  /** Top right, before the close button: download, copy and the like. */
  toolbar?: (item: T, index: number) => ReactNode
  /** Under the picture, before the "3 / 12" count. */
  caption?: (item: T, index: number) => ReactNode
  /** The thumbnail row, when there is more than one item. Default true. */
  thumbnails?: boolean
  /** Default 8. */
  maxZoom?: number
  /** Corner radius of the pictures, in px, kept exact through the morph. Default 12. */
  radius?: number
  labels?: Partial<LightboxLabels>
  icons?: Partial<LightboxIcons>
  className?: string
}

// ── Defaults ────────────────────────────────────────────────────────────────

const svg = (d: string) => (
  <svg width="20" height="20" viewBox="0 0 256 256" fill="none" stroke="currentColor" strokeWidth="12" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d={d} />
  </svg>
)
export const DEFAULT_ICONS: LightboxIcons = {
  close: svg('M200 56 56 200M56 56l144 144'),
  previous: svg('M160 208 80 128l80-80'),
  next: svg('m96 48 80 80-80 80'),
}
export const DEFAULT_LABELS: LightboxLabels = { dialog: 'Image viewer', close: 'Close', previous: 'Previous', next: 'Next' }

/** A round button with an icon, labelled for screen readers and with a tooltip for the mouse. */
export function IconButton({ label, className, ...rest }: { label: string } & ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button type="button" className={['rml-button', className].filter(Boolean).join(' ')} aria-label={label} title={label} {...rest} />
}

const EASE_OUT = [0.16, 1, 0.3, 1] as const
const WHOLE: Crop = [0, 0, 1, 1]

const reducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
const nextFrame = () => new Promise((done) => requestAnimationFrame(done))

/**
 * Starts downloading an item the way the lightbox will show it: same `srcSet`
 * and `sizes`, so the browser picks the same file. Call it on hover to have the
 * picture ready before a click.
 */
export function preload(item: LightboxItem): Promise<unknown> {
  if (typeof window === 'undefined' || item.kind !== 'image') return Promise.resolve()
  const img = new Image()
  if (item.sizes) img.sizes = item.sizes
  if (item.srcSet) img.srcset = item.srcSet
  img.src = item.src
  return img.decode().catch(() => {})
}

// ── The morph between thumbnail and lightbox ────────────────────────────────

/** A `clip-path` showing only `crop` of the frame, with corners of `radius`. */
const inset = ([left, top, width, height]: Crop, radius: number) =>
  `inset(${top * 100}% ${(1 - left - width) * 100}% ${(1 - top - height) * 100}% ${left * 100}% round ${radius}px)`

const rectOf = (origin: Element | DOMRect | null | undefined) =>
  origin instanceof Element ? origin.getBoundingClientRect() : (origin ?? undefined)

/**
 * Where the frame has to be, and what of it has to show, for its picture to sit
 * exactly on the thumbnail: scaled down, moved over, and clipped to the region
 * the thumbnail shows. Measured with the frame at rest; origin top left.
 */
function overThumb(frame: HTMLElement, thumb: DOMRect, crop: Crop) {
  const box = frame.getBoundingClientRect()
  const scale = thumb.width / (crop[2] * box.width)
  return {
    x: thumb.left - box.left - crop[0] * box.width * scale,
    y: thumb.top - box.top - crop[1] * box.height * scale,
    scale,
  }
}

/**
 * The move between the thumbnail and the middle, frame by frame: `p` 0 is on
 * the thumbnail, 1 at rest. Driven by hand so the corner can be set against the
 * scale on every frame, keeping it exactly `radius` on screen the whole way.
 */
function morph(el: HTMLElement, at: ReturnType<typeof overThumb>, crop: Crop, radius: number, from: 0 | 1, to: 0 | 1, duration: number) {
  // The view clips pictures at its top and bottom; the way to and from the
  // thumbnail can run past both.
  el.parentElement?.style.setProperty('overflow', 'visible')
  const apply = (p: number) => {
    const scale = at.scale + (1 - at.scale) * p
    const shown = crop.map((v, i) => v + (WHOLE[i] - v) * p) as Crop
    el.style.transform = `translate(${at.x * (1 - p)}px, ${at.y * (1 - p)}px) scale(${scale})`
    el.style.clipPath = inset(shown, radius / scale)
    el.style.setProperty('--rml-r', `${radius / scale}px`)
  }
  el.style.transformOrigin = '0 0'
  apply(from)
  return animate(from, to, { duration, ease: EASE_OUT, onUpdate: apply })
}

/** Back to rest, unclipped, so pictures can slide past its edges. */
const rest = (el: HTMLElement) => {
  for (const prop of ['transform', 'transform-origin', 'clip-path', '--rml-r']) el.style.removeProperty(prop)
  el.parentElement?.style.removeProperty('overflow')
}

/**
 * The backdrop's colour and blur, from none (0) to full (1), over the same
 * time and curve as the picture's move: they rise as it opens out of the
 * thumbnail and settle as it goes back, in one motion with it.
 */
function backdrop(dialog: HTMLElement | null, from: 0 | 1, to: 0 | 1, duration: number) {
  const apply = (p: number) => dialog?.style.setProperty('--rml-p', String(p))
  apply(from)
  return animate(from, to, { duration, ease: EASE_OUT, onUpdate: apply })
}

/** Without a thumbnail to grow out of: a short fade and scale, in seconds. */
const FADE = 0.22
const fade = (el: HTMLElement, into: boolean) =>
  el.animate(
    [
      { opacity: 0, transform: 'scale(0.96)' },
      { opacity: 1, transform: 'none' },
    ],
    { duration: FADE * 1000, easing: 'cubic-bezier(0.16, 1, 0.3, 1)', direction: into ? 'normal' : 'reverse', fill: 'forwards' },
  ).finished

// ── Sizes of items that don't say ───────────────────────────────────────────

export function useNaturalSizes(items: LightboxItem[]) {
  const [sizes, setSizes] = useState<Record<string, { width: number; height: number }>>({})
  useEffect(() => {
    let live = true
    for (const it of items) {
      if ((it.width && it.height) || sizes[it.src]) continue
      const done = (width: number, height: number) => {
        if (live && width && height) setSizes((s) => ({ ...s, [it.src]: { width, height } }))
      }
      if (it.kind === 'image') {
        const img = new Image()
        img.onload = () => done(img.naturalWidth, img.naturalHeight)
        img.src = it.src
      } else {
        const v = document.createElement('video')
        v.preload = 'metadata'
        v.onloadedmetadata = () => done(v.videoWidth, v.videoHeight)
        v.src = it.src
      }
    }
    return () => {
      live = false
    }
    // Measures each item once; `sizes` is read only to skip known ones.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items])
  return (it: LightboxItem) => (it.width && it.height ? { width: it.width, height: it.height } : (sizes[it.src] ?? { width: 16, height: 9 }))
}

// ── The component ───────────────────────────────────────────────────────────

/**
 * A full-screen viewer for images and videos. Opens out of its thumbnail when
 * it has one, moves between items on a draggable track, zooms (double click or
 * tap, wheel, pinch, + and -), and closes back into the thumbnail of whatever
 * is on screen. A native modal `<dialog>`, portalled to `<body>`: Esc, the
 * focus trap and an inert page come with it.
 */
export function Lightbox<T extends LightboxItem>(props: LightboxProps<T>) {
  const { open, index } = props
  // A session is one opening: the view is remounted for each, so it starts
  // from `index` and the track from rest.
  const [session, setSession] = useState<{ id: number; start: number } | null>(null)
  const [closing, setClosing] = useState(false)
  const returnTo = useRef<Element | null>(null)

  useLayoutEffect(() => {
    if (open && !session) {
      returnTo.current = document.activeElement
      setSession({ id: Date.now(), start: index })
      setClosing(false)
    } else if (!open && session) {
      setClosing(true)
    } else if (open && closing) {
      // Reopened mid-close: carry on as open.
      setClosing(false)
    }
    // Only open/close transitions matter here; `index` is read at opening.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  if (!session || typeof document === 'undefined') return null
  return createPortal(
    <LazyMotion features={domMax}>
      <View
        key={session.id}
        {...props}
        start={session.start}
        closing={closing}
        onDone={(last) => {
          setSession(null)
          setClosing(false)
          const el = returnTo.current
          if (el instanceof HTMLElement && el.isConnected) el.focus({ preventScroll: true })
          props.onExited?.(last)
        }}
      />
    </LazyMotion>,
    document.body,
  )
}

function View<T extends LightboxItem>({
  items,
  index: wanted,
  start,
  closing,
  onDone,
  onClose,
  onIndexChange,
  origin,
  originCrop,
  renderVideo,
  title,
  toolbar,
  caption,
  thumbnails = true,
  maxZoom = 8,
  radius = 12,
  labels: labelsIn,
  icons: iconsIn,
  className,
}: LightboxProps<T> & { start: number; closing: boolean; onDone: (index: number) => void }) {
  const labels = { ...DEFAULT_LABELS, ...labelsIn }
  const icons = { ...DEFAULT_ICONS, ...iconsIn }
  const dialog = useRef<HTMLDialogElement>(null)
  const view = useRef<HTMLDivElement>(null)
  const frame = useRef<HTMLDivElement>(null)
  const [box, setBox] = useState({ width: 0, height: 0 })
  // The thumbnail being pointed at or focused: its caption stands in for the
  // current one, dimmed, as a preview of what a click would show.
  const [peek, setPeek] = useState<number | null>(null)
  const n = items.length
  const natural = useNaturalSizes(items)

  // Each item as large as fits the stage, in whole pixels: a fractional edge,
  // centred with `translate: -50%`, lands between pixels and leaves a seam.
  const sizeOf = (it: LightboxItem) => {
    const { width, height } = natural(it)
    const w = Math.round(Math.min(box.width, box.height * (width / height)))
    return { width: w, height: Math.round(w / (width / height)) }
  }
  const track = useTrack(n, start, (i) => {
    const w = sizeOf(items[i]).width / 2 + GAP
    return [w + sizeOf(items[(i + 1) % n]).width / 2, w + sizeOf(items[(i - 1 + n) % n]).width / 2]
  })
  const { index, x, many, next, prev, nextOffset, prevOffset, halt, show, go } = track
  const item = items[index]
  const here = sizeOf(item)
  const stripAt = useStripPosition(x, index, n, [nextOffset, prevOffset])

  // Tell the owner where we are, and follow it when it moves us.
  const reported = useRef(start)
  useEffect(() => {
    if (index === reported.current) return
    reported.current = index
    onIndexChange?.(index)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index])
  useEffect(() => {
    if (wanted === reported.current || wanted < 0 || wanted >= n) return
    reported.current = wanted
    show(wanted)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wanted])

  // Before the first paint: show the dialog and measure the stage, so the
  // picture has its size before the opening move measures it.
  useLayoutEffect(() => {
    dialog.current?.showModal()
    const el = view.current
    if (!el) return
    const measure = () => setBox({ width: el.clientWidth, height: el.clientHeight })
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  // The opening move, once the picture has its size. Still before the first
  // paint, so it is never seen at rest in the middle before it jumps over the
  // thumbnail to start.
  const opened = useRef(false)
  useLayoutEffect(() => {
    if (opened.current || !box.width) return
    opened.current = true
    const el = frame.current
    if (!el || reducedMotion()) return
    const from = rectOf(origin?.(start))
    if (!from) {
      void fade(el, true)
      void backdrop(dialog.current, 0, 1, FADE)
      return
    }
    const crop = originCrop?.(start) ?? WHOLE
    void morph(el, overThumb(el, from, crop), crop, radius, 0, 1, 0.5).then(() => rest(el))
    void backdrop(dialog.current, 0, 1, 0.5)
  }, [box.width, origin, originCrop, start, radius])

  // The next and previous items, ready before they are needed.
  useEffect(() => {
    if (!many) return
    void preload(items[next])
    void preload(items[prev])
  }, [items, many, next, prev])

  // Keeps the current thumbnail in view when the row is wider than the screen.
  // The row's own scroll, not `scrollIntoView`, which scrolls ancestors too.
  useEffect(() => {
    const row = dialog.current?.querySelector<HTMLElement>('.rml-thumbs')
    const thumb = row?.querySelector<HTMLElement>('[aria-current="true"]')
    if (!row || !thumb || row.scrollWidth <= row.clientWidth) return
    row.scrollTo({ left: thumb.offsetLeft - (row.clientWidth - thumb.offsetWidth) / 2, behavior: 'smooth' })
  }, [index])

  // ── Zoom ────────────────────────────────────────────────────────────────────
  // Double click or tap toggles 2.5x around the point; the wheel and two
  // fingers zoom between 1x and `maxZoom` around the pointer; + and - from the
  // keyboard. Zoomed in, one finger (or the arrow keys) moves the picture
  // instead of the track. Its edges never come inside the stage's, and moving
  // to another item puts it back to 1x.
  const zs = useMotionValue(1)
  const zx = useMotionValue(0)
  const zy = useMotionValue(0)
  const zoomed = () => zs.get() > 1.01
  const clampPan = (s: number, px: number, py: number) => {
    const mx = Math.max(0, (here.width * s - box.width) / 2)
    const my = Math.max(0, (here.height * s - box.height) / 2)
    return [Math.max(-mx, Math.min(mx, px)), Math.max(-my, Math.min(my, py))] as const
  }
  const zoomTo = (s: number, px: number, py: number, spring = true) => {
    const [cx, cy] = clampPan(s, px, py)
    if (!spring) {
      zs.set(s)
      zx.set(cx)
      zy.set(cy)
      return
    }
    const options = { type: 'spring', stiffness: 380, damping: 36 } as const
    void animate(zs, s, options)
    void animate(zx, cx, options)
    void animate(zy, cy, options)
  }
  const centre = () => {
    const r = view.current?.getBoundingClientRect()
    return r ? { x: r.left + r.width / 2, y: r.top + r.height / 2 } : { x: 0, y: 0 }
  }
  // Zoom to `s` keeping the picture point under (clientX, clientY) in place.
  const zoomAround = (s: number, clientX: number, clientY: number, spring = true) => {
    const c = centre()
    const s0 = zs.get()
    const qx = (clientX - c.x - zx.get()) / s0
    const qy = (clientY - c.y - zy.get()) / s0
    zoomTo(s, clientX - c.x - qx * s, clientY - c.y - qy * s, spring)
  }
  const toggleZoom = (clientX: number, clientY: number) =>
    zoomed() ? zoomTo(1, 0, 0) : zoomAround(Math.min(2.5, maxZoom), clientX, clientY)
  useLayoutEffect(() => {
    zs.jump(1)
    zx.jump(0)
    zy.jump(0)
  }, [index, zs, zx, zy])

  const onWheel = (event: WheelEvent) => {
    if (event.deltaY === 0) return
    const s = Math.max(1, Math.min(maxZoom, zs.get() * Math.exp(-event.deltaY * 0.0025)))
    if (s === 1) zoomTo(1, 0, 0, false)
    else zoomAround(s, event.clientX, event.clientY, false)
  }
  // Not React's onWheel: React listens passively, so it can't stop the page
  // scrolling under the lightbox, or a trackpad pinch (a wheel with ctrlKey)
  // zooming the whole page instead of the picture.
  const wheel = useRef(onWheel)
  wheel.current = onWheel
  useEffect(() => {
    const el = view.current
    if (!el) return
    const listener = (event: WheelEvent) => {
      event.preventDefault()
      wheel.current(event)
    }
    el.addEventListener('wheel', listener, { passive: false })
    return () => el.removeEventListener('wheel', listener)
  }, [])


  // Two fingers: tracked here directly, Motion's pan only follows one.
  const touches = useRef(new Map<number, { x: number; y: number }>())
  const pinch = useRef<{ dist: number; s: number; qx: number; qy: number } | null>(null)
  const pinchMetrics = () => {
    const [a, b] = [...touches.current.values()]
    return { dist: Math.hypot(a.x - b.x, a.y - b.y), mx: (a.x + b.x) / 2, my: (a.y + b.y) / 2 }
  }
  const onPointerDown = (event: ReactPointerEvent) => {
    panned.current = false
    touches.current.set(event.pointerId, { x: event.clientX, y: event.clientY })
    if (touches.current.size === 2) {
      track.jump(index)
      const { dist, mx, my } = pinchMetrics()
      const c = centre()
      const s = zs.get()
      pinch.current = { dist, s, qx: (mx - c.x - zx.get()) / s, qy: (my - c.y - zy.get()) / s }
    }
  }
  const onPointerMove = (event: ReactPointerEvent) => {
    if (!touches.current.has(event.pointerId)) return
    touches.current.set(event.pointerId, { x: event.clientX, y: event.clientY })
    const p = pinch.current
    if (!p || touches.current.size < 2) return
    panned.current = true
    const { dist, mx, my } = pinchMetrics()
    const c = centre()
    const s = Math.max(1, Math.min(maxZoom, (p.s * dist) / p.dist))
    const [cx, cy] = clampPan(s, mx - c.x - p.qx * s, my - c.y - p.qy * s)
    zs.set(s)
    zx.set(cx)
    zy.set(cy)
  }
  const onPointerUp = (event: ReactPointerEvent) => {
    touches.current.delete(event.pointerId)
    if (touches.current.size < 2 && pinch.current) {
      pinch.current = null
      if (zs.get() < 1.08) zoomTo(1, 0, 0)
    }
  }

  // Dragging: the track follows the pointer and goes on or back on release
  // (track.ts); zoomed in, the drag moves the picture. `panned` stops the click
  // that ends a drag counting as a click.
  const panned = useRef(false)
  const zoomPan = useRef({ x: 0, y: 0 })
  const onPanStart = () => {
    if (pinch.current) return
    if (zoomed()) {
      zoomPan.current = { x: zx.get(), y: zy.get() }
      return
    }
    track.panStart()
  }
  const onPan = (_: unknown, info: PanInfo) => {
    panned.current = true
    if (pinch.current || touches.current.size > 1) return
    if (zoomed()) {
      const [cx, cy] = clampPan(zs.get(), zoomPan.current.x + info.offset.x, zoomPan.current.y + info.offset.y)
      zx.set(cx)
      zy.set(cy)
      return
    }
    track.pan(info.offset.x)
  }
  const onPanEnd = (_: unknown, { velocity }: PanInfo) => {
    if (pinch.current || zoomed()) return
    track.panEnd(velocity.x)
  }
  // A click, not the end of a drag. On the picture: the left half goes back,
  // the right half on. Beside it, in the empty space: closes. Two in quick
  // succession zoom instead, so a single one waits 260ms to be sure it is
  // single. Zoomed in, a single one does nothing.
  const lastTap = useRef<{ t: number; x: number; y: number } | null>(null)
  const tapTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  useEffect(() => () => clearTimeout(tapTimer.current), [])
  const onClick = (event: MouseEvent<HTMLDivElement>) => {
    if (panned.current) {
      panned.current = false
      return
    }
    const now = performance.now()
    const last = lastTap.current
    if (last && now - last.t < 300 && Math.hypot(event.clientX - last.x, event.clientY - last.y) < 40) {
      clearTimeout(tapTimer.current)
      lastTap.current = null
      toggleZoom(event.clientX, event.clientY)
      return
    }
    lastTap.current = { t: now, x: event.clientX, y: event.clientY }
    if (zoomed()) return
    const pic = frame.current?.getBoundingClientRect()
    if (pic && (event.clientX < pic.left || event.clientX > pic.right || event.clientY < pic.top || event.clientY > pic.bottom)) {
      onClose()
      return
    }
    if (!many) return
    const rect = event.currentTarget.getBoundingClientRect()
    const step = event.clientX < rect.left + rect.width / 2 ? -1 : 1
    clearTimeout(tapTimer.current)
    tapTimer.current = setTimeout(() => {
      lastTap.current = null
      go(step)
    }, 260)
  }

  // ── Closing ─────────────────────────────────────────────────────────────────
  // The owner set `open` false: back into the thumbnail of what is on screen,
  // or a fade without one, then gone.
  const [leaving, setLeaving] = useState(false)
  useEffect(() => {
    if (!closing) return
    let cancelled = false
    void (async () => {
      halt()
      x.jump(0)
      zs.jump(1)
      zx.jump(0)
      zy.jump(0)
      setLeaving(true)
      // Two frames: one for the owner to render the thumbnail, one to lay it out.
      await nextFrame()
      await nextFrame()
      const el = frame.current
      if (el && !reducedMotion()) {
        rest(el)
        const to = rectOf(origin?.(index))
        if (to) {
          const crop = originCrop?.(index) ?? WHOLE
          await Promise.all([morph(el, overThumb(el, to, crop), crop, radius, 1, 0, 0.45), backdrop(dialog.current, 1, 0, 0.45)])
        } else {
          await Promise.all([fade(el, false), backdrop(dialog.current, 1, 0, FADE)])
        }
      }
      if (cancelled) return
      dialog.current?.close()
      onDone(index)
    })()
    return () => {
      cancelled = true
    }
    // One close per session; the rest is read as it stands when it starts.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [closing])

  const pan: Record<string, [number, number]> = {
    ArrowLeft: [80, 0],
    ArrowRight: [-80, 0],
    ArrowUp: [0, 80],
    ArrowDown: [0, -80],
  }

  return (
    <dialog
      ref={dialog}
      className={['rml', className].filter(Boolean).join(' ')}
      aria-label={labels.dialog}
      aria-modal="true"
      data-leaving={leaving || undefined}
      // The empty space around the stage and the bars closes it too. Not at the
      // end of a drag, whose click lands on whatever it was let go over.
      onPointerDown={() => (panned.current = false)}
      onClick={(event) => {
        if (!panned.current && (event.target as Element).matches('.rml, .rml-stage, .rml-chrome, .rml-title, .rml-toolbar')) onClose()
      }}
      onCancel={(event) => {
        event.preventDefault()
        onClose()
      }}
      onKeyDown={(event) => {
        if (event.key === '+' || event.key === '=') {
          if (!zoomed()) toggleZoom(centre().x, centre().y)
        } else if (event.key === '-') {
          zoomTo(1, 0, 0)
        } else if (zoomed() && pan[event.key]) {
          const [dx, dy] = pan[event.key]
          zoomTo(zs.get(), zx.get() + dx, zy.get() + dy)
        } else if (many && event.key === 'ArrowRight') go(1)
        else if (many && event.key === 'ArrowLeft') go(-1)
        else return
        event.preventDefault()
      }}
    >
      <div className="rml-chrome rml-top">
        <div className="rml-title">{title?.(item, index)}</div>
        <div className="rml-toolbar">
          {toolbar?.(item, index)}
          <IconButton className="rml-close" label={labels.close} onClick={onClose}>
            {icons.close}
          </IconButton>
        </div>
      </div>

      <div className="rml-stage">
        {many && (
          <IconButton className="rml-nav" label={labels.previous} onClick={() => go(-1)}>
            {icons.previous}
          </IconButton>
        )}

        <m.div
          ref={view}
          className="rml-view"
          data-many={many || undefined}
          onPanStart={onPanStart}
          onPan={onPan}
          onPanEnd={onPanEnd}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          onClick={onClick}
        >
          {box.width > 0 && (
            <div ref={frame} className="rml-frame" style={here}>
              {/* Keyed by item, not by place, so the one moving into the middle
                  stays the same element and never reloads. */}
              {many && prev !== next && (
                <Picture key={prev} item={items[prev]} size={sizeOf(items[prev])} at={-prevOffset} x={x} radius={radius} renderVideo={renderVideo} />
              )}
              <Picture
                key={index}
                item={item}
                size={here}
                at={0}
                x={x}
                reach={[nextOffset, prevOffset]}
                zoom={{ s: zs, x: zx, y: zy }}
                radius={radius}
                renderVideo={renderVideo}
                current
              />
              {many && <Picture key={next} item={items[next]} size={sizeOf(items[next])} at={nextOffset} x={x} radius={radius} renderVideo={renderVideo} />}
            </div>
          )}
        </m.div>

        {many && (
          <IconButton className="rml-nav" label={labels.next} onClick={() => go(1)}>
            {icons.next}
          </IconButton>
        )}
      </div>

      <div className="rml-chrome rml-foot">
        {(caption || many) && (
          // Not announced while previewing: the thumbnail's own label says the
          // same, and a live region would read out every one passed over.
          <p className="rml-caption" data-peek={peek !== null && peek !== index ? '' : undefined} aria-live={peek === null ? 'polite' : 'off'}>
            {caption && <span className="rml-caption-main">{caption(items[peek ?? index], peek ?? index)}</span>}
            {many && <span className="rml-count">{`${(peek ?? index) + 1} / ${n}`}</span>}
          </p>
        )}
        {many && thumbnails && (
          <div className="rml-thumbs" onPointerLeave={() => setPeek(null)} onBlur={() => setPeek(null)}>
            <ThumbFrame pos={stripAt} n={n} />
            {items.map((thumb, i) => (
              <Thumb
                key={i}
                item={thumb}
                i={i}
                n={n}
                pos={stripAt}
                current={i === index}
                onShow={() => show(i)}
                onPeek={() => setPeek(i)}
              />
            ))}
          </div>
        )}
      </div>
    </dialog>
  )
}

/** One item on the track, centred on the frame. */
function Picture<T extends LightboxItem>({
  item,
  size,
  at,
  x,
  reach,
  zoom,
  radius,
  renderVideo,
  current = false,
}: {
  item: T
  size: { width: number; height: number }
  at: number
  x: MotionValue<number>
  reach?: [number, number]
  zoom?: { s: MotionValue<number>; x: MotionValue<number>; y: MotionValue<number> }
  radius: number
  renderVideo?: (item: T, state: { active: boolean }) => ReactNode
  current?: boolean
}) {
  const { left, opacity } = useTrackPlace(x, at, reach)
  // Only the current picture zooms. The others take `left` as it is: a value
  // derived on mount would miss a move made in the same commit.
  const shift = useTransform(() => left.get() + (zoom ? zoom.x.get() : 0))
  const lift = useTransform(() => (zoom ? zoom.y.get() : 0))
  const scale = useTransform(() => (zoom ? zoom.s.get() : 1))
  // `--rml-r` is the frame's, scaled during the move into and out of the thumbnail.
  const style = { ...size, x: zoom ? shift : left, y: lift, scale, opacity, borderRadius: `var(--rml-r, ${radius}px)` }

  if (item.kind === 'image') {
    return (
      <m.img
        className="rml-media"
        style={style}
        src={item.src}
        srcSet={item.srcSet}
        sizes={item.sizes}
        alt={current ? (item.alt ?? '') : ''}
        aria-hidden={!current || undefined}
        draggable={false}
      />
    )
  }
  return (
    <m.div className="rml-media rml-video" style={style} aria-hidden={!current || undefined}>
      {renderVideo ? (
        renderVideo(item, { active: current })
      ) : (
        <video
          poster={item.poster}
          src={item.src}
          aria-label={current ? item.alt : undefined}
          muted
          loop
          autoPlay={current}
          playsInline
        />
      )}
    </m.div>
  )
}

/**
 * Where the track is, in thumbnail steps, wrapped into 0..n: a whole number at
 * rest on an item, in between while it moves. Drives the square and how lit up
 * each thumbnail is.
 */
function useStripPosition(x: MotionValue<number>, index: number, n: number, reach: [number, number]) {
  const at = useMotionValue(index)
  const steps = useRef(reach)
  useLayoutEffect(() => {
    at.set(index)
    steps.current = reach
  })
  return useTransform(() => {
    const v = x.get()
    const [ahead, behind] = steps.current
    const progress = v < 0 ? -v / ahead : -v / behind
    return (((at.get() + progress) % n) + n) % n
  })
}

/**
 * One thumbnail, lit by how close the square is: full size and brightness
 * under it, back to small and dim a step away. `--rml-lit` (0 to 1) feeds the CSS.
 */
function Thumb({
  item,
  i,
  n,
  pos,
  current,
  onShow,
  onPeek,
}: {
  item: LightboxItem
  i: number
  n: number
  pos: MotionValue<number>
  current: boolean
  onShow: () => void
  onPeek: () => void
}) {
  const lit = useTransform(() => {
    const d = Math.abs(pos.get() - i)
    return Math.max(0, 1 - Math.min(d, n - d))
  })
  return (
    <m.button
      className="rml-thumb"
      type="button"
      style={{ '--rml-lit': lit } as unknown as CSSProperties}
      aria-label={item.alt || `${i + 1} / ${n}`}
      aria-current={current || undefined}
      onClick={onShow}
      onPointerEnter={onPeek}
      onFocus={onPeek}
    >
      <img src={item.thumb ?? (item.kind === 'image' ? item.src : item.poster)} alt="" draggable={false} />
    </m.button>
  )
}

/**
 * The square over the thumbnails, following the track exactly, wrapping from
 * the last to the first as one square (a copy comes in from the other end).
 */
function ThumbFrame({ pos, n }: { pos: MotionValue<number>; n: number }) {
  const layer = useRef<HTMLSpanElement>(null)
  const [width, setWidth] = useState(0)
  const grid = useMotionValue({ first: 0, step: 0 })
  useLayoutEffect(() => {
    const row = layer.current?.parentElement
    const thumbs = row?.querySelectorAll<HTMLElement>('.rml-thumb')
    if (!row || !thumbs || thumbs.length < 2) return
    grid.set({ first: thumbs[0].offsetLeft, step: thumbs[1].offsetLeft - thumbs[0].offsetLeft })
    setWidth(row.scrollWidth)
  }, [grid, n])
  const left = useTransform(() => grid.get().first + pos.get() * grid.get().step)
  const copy = useTransform(() => left.get() - n * grid.get().step)
  return (
    <span ref={layer} className="rml-thumb-layer" style={{ width: width || undefined }} aria-hidden="true">
      <m.span className="rml-thumb-frame" style={{ x: left }} />
      <m.span className="rml-thumb-frame" style={{ x: copy }} />
    </span>
  )
}
