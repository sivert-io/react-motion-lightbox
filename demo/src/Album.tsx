import { useLayoutEffect, useRef, useState } from 'react'
import { motion, useTransform, type MotionValue } from 'motion/react'
import { GAP, Lightbox, preload, useTrack, useTrackPlace, type Crop } from 'react-motion-lightbox'
import 'react-motion-lightbox/styles.css'
import type { Photo } from './photos'

// The square each photo shows in the album: around its focus point, zoomed in
// by its zoom. The lightbox gets the same numbers as `originCrop`, so it opens
// out of exactly the part you see and then shows the whole photo.
function square({ width = 1, height = 1, focus = [0.5, 0.5], zoom = 1 }: Photo): Crop {
  const side = Math.min(width, height) / zoom
  const [w, h] = [side / width, side / height]
  const clamp = (at: number, size: number) => Math.min(Math.max(at - size / 2, 0), 1 - size)
  return [clamp(focus[0], w), clamp(focus[1], h), w, h]
}

export function Album({ title, photos }: { title: string; photos: Photo[] }) {
  const stage = useRef<HTMLDivElement>(null)
  const [size, setSize] = useState(0)
  useLayoutEffect(() => {
    const el = stage.current!
    const observer = new ResizeObserver(() => setSize(el.clientWidth))
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  // The same track the lightbox moves on: drag it, flick it, grab it mid-move.
  // Every photo here is a square of the same size, so its neighbours are one
  // square and a gap away on both sides.
  const track = useTrack(photos.length, 0, () => [size + GAP, size + GAP])
  const { index, prev, next, x } = track
  const [open, setOpen] = useState(false)
  // A drag ends in a click. That one shouldn't open the lightbox.
  const dragged = useRef(false)

  return (
    <div className="grid gap-4">
      <motion.div
        ref={stage}
        className="stage"
        onPointerDown={() => (dragged.current = false)}
        onPanStart={track.panStart}
        onPan={(_, info) => {
          dragged.current = true
          track.pan(info.offset.x)
        }}
        onPanEnd={(_, info) => track.panEnd(info.velocity.x)}
      >
        {size > 0 &&
          [
            ...(prev !== next ? [{ i: prev, at: -(size + GAP) }] : []),
            { i: index, at: 0 },
            { i: next, at: size + GAP },
          ].map(({ i, at }) => (
            <Slide
              key={i}
              photo={photos[i]}
              index={i}
              x={x}
              at={at}
              onOpen={() => {
                if (dragged.current) return
                track.jump(i)
                setOpen(true)
              }}
            />
          ))}
      </motion.div>

      <div className="flex items-start justify-between gap-4 text-sm">
        <p className="min-w-0 text-muted">
          {photos[index].alt}.{' '}
          <a className="link whitespace-nowrap" href={photos[index].profile} target="_blank" rel="noreferrer">
            {photos[index].photographer}
          </a>
        </p>
        <div className="flex shrink-0 items-center gap-1">
          <button className="arrow" type="button" aria-label="Previous photo" onClick={() => track.go(-1)}>
            ‹
          </button>
          <span className="min-w-12 text-center tabular-nums" aria-live="polite">
            {index + 1} / {photos.length}
          </span>
          <button className="arrow" type="button" aria-label="Next photo" onClick={() => track.go(1)}>
            ›
          </button>
        </div>
      </div>

      <Lightbox
        className="demo"
        items={photos}
        index={index}
        open={open}
        onClose={() => setOpen(false)}
        // The album follows along underneath, so the lightbox closes back into
        // whichever photo you ended on.
        onIndexChange={track.jump}
        origin={(i) => stage.current?.querySelector(`[data-index="${i}"]`)}
        originCrop={(i) => square(photos[i])}
        radius={14}
        caption={(photo) => photo.alt}
        title={(photo) => (
          <a className="link" href={photo.profile} target="_blank" rel="noreferrer">
            Photo by {photo.photographer}
          </a>
        )}
        labels={{ dialog: title }}
      />
    </div>
  )
}

function Slide({
  photo,
  index,
  x,
  at,
  onOpen,
}: {
  photo: Photo
  index: number
  x: MotionValue<number>
  at: number
  onOpen: () => void
}) {
  // No fade: the square clips the photos sliding out. Without the clip, put
  // `opacity` from useTrackPlace on the slide so they fade out instead.
  const { place } = useTrackPlace(x, at)
  const left = useTransform(() => x.get() + place.get())
  const current = at === 0
  // The whole photo, moved and scaled so the square shows just its crop.
  const [cx, cy, cw, ch] = square(photo)

  return (
    <motion.button
      type="button"
      className="slide"
      data-index={index}
      style={{ x: left }}
      tabIndex={current ? 0 : -1}
      aria-hidden={!current}
      aria-label={`Open: ${photo.alt}`}
      onClick={onOpen}
      // Start downloading the big one on hover, so it's ready on click.
      onPointerEnter={() => preload(photo)}
      onFocus={() => preload(photo)}
    >
      <img
        src={photo.src}
        srcSet={photo.srcSet}
        sizes={`(min-width: 1024px) ${40 / cw}rem, ${100 / cw}vw`}
        style={{ width: `${100 / cw}%`, height: `${100 / ch}%`, left: `${(-cx / cw) * 100}%`, top: `${(-cy / ch) * 100}%` }}
        alt=""
        draggable={false}
      />
    </motion.button>
  )
}
