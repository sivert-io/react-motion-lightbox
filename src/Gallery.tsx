import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { LazyMotion, domMax, type MotionValue } from 'motion/react'
import * as m from 'motion/react-m'
import { cropOf } from './crop.js'
import {
  DEFAULT_ICONS,
  DEFAULT_LABELS,
  IconButton,
  Lightbox,
  preload,
  useNaturalSizes,
  type Crop,
  type LightboxItem,
  type LightboxProps,
} from './Lightbox.js'
import { GAP, reducedMotion, useTrack, useTrackPlace } from './track.js'

export interface GalleryProps<T extends LightboxItem = LightboxItem>
  extends Omit<LightboxProps<T>, 'index' | 'open' | 'onClose' | 'onExited' | 'origin' | 'originCrop'> {
  /** The box's width over its height. Default 1, a square. */
  aspect?: number
  /**
   * Cut pictures off at the box's edges as they slide. Default true. Turn it
   * off and they slide out past the edges instead, fading as they go.
   */
  clip?: boolean
  /**
   * When the pictures load. Default `'lazy'`: once the gallery is within half a
   * screen of being seen, so one further down the page costs nothing until
   * then. The browser's own lazy loading reaches much further ahead. Use
   * `'eager'` for a gallery at the top.
   */
  loading?: 'lazy' | 'eager'
  /**
   * Move on by itself every this many milliseconds, like a slideshow. It holds
   * while the pointer or focus is on the gallery or the lightbox is open,
   * there's a button to pause it, and it stays still with reduced motion.
   */
  autoplay?: number
  /**
   * `'cover'`, the default, fills the box with the part of each picture its
   * `focus` and `zoom` pick. `'contain'` shows the whole picture inside the box.
   */
  fit?: 'cover' | 'contain'
  /** How many pixels of the next picture show at the right edge, so it reads as something to swipe. Default 0. */
  peek?: number
  /** The space between pictures on the track, in pixels. Default 48. */
  gap?: number
  /** Called with the picture's index on a click, instead of opening the lightbox: for an app with a viewer of its own. */
  onPress?: (index: number) => void
  /**
   * The lightbox opened, started closing, or finished closing and is gone:
   * for moving things on the page out of its way.
   */
  onLightboxChange?: (state: 'open' | 'closing' | 'closed') => void
}

/**
 * A small lightbox for the page: one picture at a time in a box, cropped to
 * its `focus` and `zoom`, on the same track as the lightbox. Drag it, flick
 * it or use the arrows; click the picture and the lightbox opens out of it
 * with the whole picture. Takes the lightbox's props and passes them on.
 * `className` goes on both.
 */
export function Gallery<T extends LightboxItem>({
  aspect = 1,
  clip = true,
  loading = 'lazy',
  autoplay,
  fit = 'cover',
  peek = 0,
  gap = GAP,
  onPress,
  onLightboxChange,
  ...props
}: GalleryProps<T>) {
  const { items, caption, className, onIndexChange, renderVideo, radius = 12 } = props
  const labels = { ...DEFAULT_LABELS, ...props.labels }
  const icons = { ...DEFAULT_ICONS, ...props.icons }
  const n = items.length
  const natural = useNaturalSizes(items)
  const crop = (i: number) => cropOf({ ...items[i], ...natural(items[i]) }, aspect)
  // Where the picture sits in its slide: a crop that fills it, or all of it, fitted.
  const contained = (i: number, slide: DOMRect) => {
    const { width: w, height: h } = natural(items[i])
    const scale = Math.min(slide.width / w, slide.height / h)
    const [cw, ch] = [w * scale, h * scale]
    return new DOMRect(slide.left + (slide.width - cw) / 2, slide.top + (slide.height - ch) / 2, cw, ch)
  }

  const box = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(0)
  useLayoutEffect(() => {
    const el = box.current!
    const observer = new ResizeObserver(() => setWidth(el.clientWidth))
    observer.observe(el)
    return () => observer.disconnect()
  }, [])
  const [near, setNear] = useState(loading === 'eager')
  useEffect(() => {
    if (near) return
    const observer = new IntersectionObserver(([entry]) => entry.isIntersecting && setNear(true), { rootMargin: '50% 0px' })
    observer.observe(box.current!)
    return () => observer.disconnect()
  }, [near])

  // Every picture is the same size, the box less the peek, so a neighbour is
  // one picture and a gap away.
  const slideWidth = width - peek
  const step = slideWidth + gap
  const track = useTrack(n, 0, () => [step, step])
  const { index, prev, next, many, x, go } = track
  const shown = useRef(index)
  useEffect(() => {
    if (index === shown.current) return
    shown.current = index
    onIndexChange?.(index)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index])

  // While the lightbox is open the gallery behind it moves with it, step for
  // step, the way a drag moves it: `follow` is how far along the lightbox's
  // track is, counted from where it opened, without wrapping. When the
  // lightbox lands, the gallery is put on its picture anyway, in case a jump
  // (a thumbnail far away, or reduced motion) went faster than it followed.
  const follow = useRef<{ from: number; at: number } | null>(null)
  const onPosition = (p: number) => {
    const f = follow.current
    if (!f) return
    let step = p - f.at
    if (step > n / 2) step -= n
    else if (step < -n / 2) step += n
    f.at = p
    f.from += step
    track.pan(-f.from * (width - peek + gap))
  }

  // Closing counts as open for the slideshow, which waits until the picture is back.
  const [lightbox, setLightbox] = useState<'open' | 'closing' | 'closed'>('closed')
  const open = lightbox !== 'closed'
  useEffect(() => {
    onLightboxChange?.(lightbox)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lightbox])
  // A drag ends in a click. That one shouldn't open the lightbox.
  const dragged = useRef(false)

  // The slideshow. Held while someone is on the gallery, so it never moves out
  // from under them, and paused for good with the button (WCAG 2.2.2).
  const [held, setHeld] = useState(false)
  const [paused, setPaused] = useState(false)
  const playing = Boolean(autoplay) && many && !paused
  useEffect(() => {
    if (!playing || held || open || reducedMotion()) return
    const timer = setTimeout(() => go(1), autoplay)
    return () => clearTimeout(timer)
    // Restarts on every move, so an arrow click gets a full turn too.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing, held, open, index])

  return (
    <div
      className={['rml-gallery', className].filter(Boolean).join(' ')}
      data-lightbox={open ? lightbox : undefined}
      // Nothing in here drags out: not to another tab, not to the desktop.
      onDragStart={(event) => event.preventDefault()}
      onPointerEnter={() => setHeld(true)}
      onPointerLeave={() => setHeld(false)}
      onFocus={() => setHeld(true)}
      onBlur={(event) => !event.currentTarget.contains(event.relatedTarget) && setHeld(false)}
      onKeyDown={(event) => {
        // The lightbox's keys bubble up here through React's tree as well.
        if (open || !many || (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight')) return
        go(event.key === 'ArrowRight' ? 1 : -1)
        event.preventDefault()
      }}
    >
      <LazyMotion features={domMax}>
        <m.div
          ref={box}
          className="rml-gallery-box"
          data-clip={clip || undefined}
          style={width ? { height: slideWidth / aspect } : { aspectRatio: aspect }}
          onPointerDown={() => (dragged.current = false)}
          onPanStart={track.panStart}
          onPan={(_, info) => {
            dragged.current = true
            track.pan(info.offset.x)
          }}
          onPanEnd={(_, info) => track.panEnd(info.velocity.x)}
        >
          {width > 0 &&
            [
              // Keyed by item, so the one moving into the middle stays the same element.
              ...(many && prev !== next ? [{ i: prev, at: -step }] : []),
              { i: index, at: 0 },
              ...(many ? [{ i: next, at: step }] : []),
              // With a peek, the one after next shows at the edge as the next
              // one slides in, so it has to be there before the move ends.
              ...(peek > 0 && n > 3 ? [{ i: (next + 1) % n, at: 2 * step }] : []),
            ].map(({ i, at }) => (
              <Slide
                key={i}
                item={items[i]}
                index={i}
                label={items[i].alt || `${i + 1} / ${n}`}
                crop={fit === 'cover' ? crop(i) : undefined}
                width={slideWidth}
                x={x}
                at={at}
                step={step}
                radius={radius}
                fade={!clip}
                show={near}
                video={renderVideo && items[i].kind === 'video' ? renderVideo(items[i], { active: at === 0 }) : undefined}
                onOpen={() => {
                  if (dragged.current) return
                  track.jump(i)
                  if (onPress) return onPress(i)
                  track.panStart()
                  follow.current = { from: 0, at: i }
                  setLightbox('open')
                }}
              />
            ))}
        </m.div>
      </LazyMotion>

      {(caption || many) && (
        <div className="rml-gallery-foot">
          <p className="rml-gallery-caption">{caption?.(items[index], index)}</p>
          {many && (
            <div className="rml-gallery-nav">
              <IconButton label={labels.previous} onClick={() => go(-1)}>
                {icons.previous}
              </IconButton>
              {/* Quiet while it turns by itself, or it would talk every few seconds. */}
              <span className="rml-count" aria-live={playing && !held ? 'off' : 'polite'}>{`${index + 1} / ${n}`}</span>
              <IconButton label={labels.next} onClick={() => go(1)}>
                {icons.next}
              </IconButton>
              {autoplay ? (
                <IconButton label={paused ? labels.play : labels.pause} onClick={() => setPaused((p) => !p)}>
                  {paused ? icons.play : icons.pause}
                </IconButton>
              ) : null}
            </div>
          )}
        </div>
      )}

      <Lightbox
        {...props}
        index={index}
        open={lightbox === 'open'}
        onClose={() => setLightbox('closing')}
        onExited={() => {
          follow.current = null
          setLightbox('closed')
        }}
        // The gallery follows along underneath, so the lightbox closes back
        // into whichever picture it ended on.
        onPosition={onPosition}
        onIndexChange={(i) => {
          if (i === track.index) return
          track.jump(i)
          if (follow.current) {
            track.panStart()
            follow.current = { from: 0, at: i }
          }
        }}
        origin={(i) => {
          const slide = box.current?.querySelector(`[data-index="${i}"]`)
          return slide && fit === 'contain' ? contained(i, slide.getBoundingClientRect()) : slide
        }}
        originCrop={fit === 'cover' ? crop : undefined}
      />
    </div>
  )
}

/** One picture in the box: the whole of it, moved and scaled so the box shows just its crop, or fitted inside. */
function Slide({
  item,
  index,
  label,
  crop,
  width,
  x,
  at,
  step,
  radius,
  fade,
  show,
  video,
  onOpen,
}: {
  item: LightboxItem
  index: number
  label: string
  /** Without one, the whole picture is fitted inside. */
  crop?: Crop
  width: number
  x: MotionValue<number>
  at: number
  step: number
  radius: number
  fade: boolean
  /** Whether to load the picture yet. */
  show: boolean
  /** A video drawn by the app's own player, in place of its poster. */
  video?: ReactNode
  onOpen: () => void
}) {
  const place = useTrackPlace(x, at, [step, step])
  const current = at === 0
  return (
    <m.button
      type="button"
      className="rml-gallery-slide"
      data-index={index}
      style={{ x: place.left, opacity: fade ? place.opacity : 1, width, borderRadius: radius }}
      tabIndex={current ? 0 : -1}
      aria-hidden={!current || undefined}
      aria-label={label}
      onClick={onOpen}
      // Start on the full-size picture as soon as a click looks likely.
      onPointerEnter={() => void preload(item)}
      onFocus={() => void preload(item)}
    >
      {show && video ? (
        <span className="rml-gallery-video">{video}</span>
      ) : show ? (
        <img
          src={item.kind === 'image' ? item.src : item.poster}
          srcSet={item.kind === 'image' ? item.srcSet : undefined}
          sizes={`${Math.ceil(width / (crop?.[2] ?? 1))}px`}
          style={
            crop
              ? {
                  width: `${100 / crop[2]}%`,
                  height: `${100 / crop[3]}%`,
                  left: `${(-crop[0] / crop[2]) * 100}%`,
                  top: `${(-crop[1] / crop[3]) * 100}%`,
                }
              : { inset: 0, width: '100%', height: '100%', objectFit: 'contain' }
          }
          alt=""
          decoding="async"
          draggable={false}
        />
      ) : null}
    </m.button>
  )
}
