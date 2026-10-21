import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import {
  animate,
  motionValue,
  useMotionValue,
  type AnimationPlaybackControls,
  type MotionValue,
} from 'motion/react'

// Eased at both ends: sets off gently and settles gently. A released drag
// uses a spring instead (see
// `settle`), so it carries on at the speed the finger let go at.
const EASE_GLIDE = [0.65, 0, 0.35, 1] as const
/** Space between a picture and its neighbour on the track. */
export const GAP = 48

// With reduced motion, moves land at once instead of gliding (WCAG 2.3.3).
// A drag still follows the finger: that motion is the reader's own.
export const reducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

/**
 * A row of pictures that moves as one: the current one in the middle, the one
 * before and the one after just beside it, invisible until they near the
 * middle. Shared by the lightbox and any gallery that should move the same way.
 *
 * `x` is where the track is: 0 at rest on the current picture, `-nextOffset`
 * with the next one in the middle, `prevOffset` with the one before.
 * `offsets(i)` says how far picture `i`'s neighbours sit from it, which depends
 * on the pictures' sizes, so the caller works it out.
 *
 * Drag it and it follows the pointer; let go and it coasts to the nearest
 * picture, like a scroll-snapped strip. It can be grabbed mid-glide. A move
 * asked for while another is gliding waits and runs when that one lands.
 */
export function useTrack(n: number, start: number, offsets: (index: number) => [number, number]) {
  const [index, setIndex] = useState(start)
  const x = useMotionValue(0)
  const glide = useRef<AnimationPlaybackControls | null>(null)
  // A move asked for while another is still gliding waits here, and runs as
  // soon as that one lands. Stopping the first half way left the track out of
  // step with the picture it was meant to land on.
  const moving = useRef(false)
  // Where the gliding move will land, so a second press counts on from there.
  const heading = useRef<number | null>(null)
  const queued = useRef<number | null>(null)
  const many = n > 1
  const next = (index + 1) % n
  const prev = (index - 1 + n) % n
  const [nextOffset, prevOffset] = offsets(index)

  // Stops a run's frame-by-frame listener along with its animation.
  const unlisten = useRef<(() => void) | null>(null)
  const halt = () => {
    glide.current?.stop()
    glide.current = null
    unlisten.current?.()
    unlisten.current = null
  }

  // Making a neighbour the current picture moves the whole track's frame of
  // reference by one step, so `x` has to shift by that step at the same moment
  // the places do. Set here, applied in the layout effect of the render that
  // has the new places: shifted any sooner, one frame was painted with the
  // new `x` and the old places, and the previous picture flashed in the
  // middle.
  const shift = useRef(0)
  const base = useRef(0)
  // Set once a drag has moved on a picture, until that has rendered, so one
  // stale render cannot move on twice.
  const rebased = useRef(false)
  // Reads the latest render's track, not the one it was created in: a strip
  // run calls it from a listener set up several pictures ago.
  const latest = useRef({ index, next, prev, nextOffset, prevOffset })
  useLayoutEffect(() => {
    latest.current = { index, next, prev, nextOffset, prevOffset }
  })
  const moveOn = (dir: 1 | -1) => {
    const t = latest.current
    shift.current += dir === 1 ? t.nextOffset : -t.prevOffset
    setIndex(dir === 1 ? t.next : t.prev)
  }
  useLayoutEffect(() => {
    if (shift.current) {
      x.set(x.get() + shift.current)
      base.current += shift.current
      shift.current = 0
    }
    rebased.current = false
  }, [index, x])

  // Glides the track until the neighbour on `dir`'s side is in the middle,
  // then makes it the current picture and puts the track back at rest.
  // Reads the latest track too: a slideshow's timer calls this from the render
  // that set it, which can be from before the pictures were measured. It then
  // glided one gap instead of one picture, and stopped there.
  const settle = (dir: 1 | -1, velocity?: number) => {
    const { next, prev, nextOffset, prevOffset } = latest.current
    halt()
    moving.current = true
    heading.current = dir === 1 ? next : prev
    const move = animate(
      x,
      dir === 1 ? -nextOffset : prevOffset,
      velocity === undefined
        ? { duration: 0.56, ease: EASE_GLIDE }
        : { type: 'spring', velocity, stiffness: 260, damping: 34 },
    )
    glide.current = move
    void move.then(() => {
      // Not if it was stopped short by a drag or a close.
      if (glide.current !== move) return
      glide.current = null
      moving.current = false
      heading.current = null
      moveOn(dir)
    })
  }
  // A picture several away: one continuous move through every picture in
  // between, like pulling an image strip, eased in at the start and out at the
  // end and never stopping on the way. One value runs from 0 to the number of
  // steps; each frame, its fraction places the track, and each whole step
  // passed makes the next picture the current one.
  const strip = (dir: 1 | -1, steps: number, to: number) => {
    halt()
    moving.current = true
    heading.current = to
    const progress = motionValue(0)
    let passed = 0
    unlisten.current = progress.on('change', (p) => {
      if (Math.floor(p) > passed && passed < steps - 1 && !rebased.current) {
        passed += 1
        rebased.current = true
        moveOn(dir)
      }
      // Until the render that makes the next picture current has landed, keep
      // measuring from the old one, whose places are still the ones on screen.
      const from = rebased.current ? passed - 1 : passed
      const step = dir === 1 ? latest.current.nextOffset : latest.current.prevOffset
      x.set(-dir * (p - from) * step)
    })
    const move = animate(progress, steps, { duration: Math.min(1.4, 0.56 + 0.1 * (steps - 1)), ease: EASE_GLIDE })
    glide.current = move
    void move.then(() => {
      if (glide.current !== move) return
      unlisten.current?.()
      unlisten.current = null
      glide.current = null
      moving.current = false
      heading.current = null
      moveOn(dir)
    })
  }
  // A move to any picture, the shorter way round. A neighbour is one step;
  // one further away runs through every picture in between.
  const show = (to: number) => {
    const { index } = latest.current
    if (!many) return
    if (reducedMotion()) return jump(to)
    if (moving.current) {
      queued.current = to
      return
    }
    if (to === index) return
    const ahead = (to - index + n) % n
    const behind = (index - to + n) % n
    const dir: 1 | -1 = ahead <= behind ? 1 : -1
    const steps = Math.min(ahead, behind)
    if (steps === 1) settle(dir)
    else strip(dir, steps, to)
  }
  const go = (step: 1 | -1) => show(((queued.current ?? heading.current ?? latest.current.index) + step + n) % n)
  // After each landing, a move that was waiting.
  useEffect(() => {
    if (moving.current || queued.current === null) return
    const to = queued.current
    queued.current = null
    show(to)
    // Runs when a move has landed; `show` is this render's, with its offsets.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index])

  // Straight to a picture, no move: the gallery landing where the lightbox
  // closed, or a pinch taking the track over.
  const jump = (to: number) => {
    halt()
    moving.current = false
    heading.current = null
    queued.current = null
    x.jump(0)
    setIndex(to)
  }

  // Dragging: the track follows the pointer; on release it goes on or back.
  // Grabbed mid-glide, it stops where it is and the drag carries on from
  // there. Dragged a whole picture's width, the next one becomes the current
  // one under the finger, so a long swipe runs through several.
  const panStart = () => {
    if (!many) return
    halt()
    moving.current = false
    heading.current = null
    queued.current = null
    base.current = x.get()
  }
  const pan = (offsetX: number) => {
    if (!many) return
    const at = base.current + offsetX
    // `x` itself shifts when the render with the new places lands.
    if (!rebased.current && at <= -nextOffset) {
      rebased.current = true
      moveOn(1)
    } else if (!rebased.current && at >= prevOffset) {
      rebased.current = true
      moveOn(-1)
    }
    x.set(at)
  }
  // Inertia and snapping, like a scroll-snapped strip: where the track would
  // coast to at the speed it was let go at, then whichever picture's place is
  // nearest that. The spring carries the release speed into the landing.
  const panEnd = (velocityX: number) => {
    if (!many) return
    if (reducedMotion()) {
      // Past a third of the way, it lands on the neighbour.
      if (x.get() < -nextOffset / 3) jump(next)
      else if (x.get() > prevOffset / 3) jump(prev)
      else x.jump(0)
      return
    }
    const coast = x.get() + velocityX * 0.25
    const stops = [
      { dir: 1 as const, at: -nextOffset },
      { dir: 0 as const, at: 0 },
      { dir: -1 as const, at: prevOffset },
    ]
    const nearest = stops.reduce((a, b) => (Math.abs(b.at - coast) < Math.abs(a.at - coast) ? b : a))
    if (nearest.dir === 1) settle(1, velocityX)
    else if (nearest.dir === -1) settle(-1, velocityX)
    else glide.current = animate(x, 0, { type: 'spring', velocity: velocityX, stiffness: 400, damping: 40 })
  }

  return { index, x, many, next, prev, nextOffset, prevOffset, halt, show, go, jump, panStart, pan, panEnd }
}

/**
 * One picture's place on the track, `at` pixels along it: where it is on
 * screen (`left`, the track's position plus its place) and how visible it is
 * there: fully in the middle, gone by the time it is a whole step away. The
 * current one fades as it leaves (`reach` is how far a step is on each side),
 * a neighbour as far as it starts from.
 *
 * Both are set straight from `x`'s change events, before the paint that
 * follows a render. Derived with `useTransform`, a picture that joined the
 * track during a move kept the position it was mounted at: the track moved
 * on, and the new neighbour sat on top of the current picture.
 */
export function useTrackPlace(x: MotionValue<number>, at: number, reach?: [number, number]) {
  const place = useMotionValue(at)
  const left = useMotionValue(x.get() + at)
  const opacity = useMotionValue(1)
  const steps = useRef(reach)
  const [update] = useState(() => () => {
    const pos = x.get() + place.get()
    const r = steps.current
    const step = r ? (pos < 0 ? r[0] : r[1]) : Math.abs(place.get())
    left.set(pos)
    opacity.set(step ? Math.max(0, 1 - Math.abs(pos) / step) : 1)
  })
  useLayoutEffect(() => {
    place.set(at)
    steps.current = reach
    update()
  })
  useLayoutEffect(() => x.on('change', update), [x, update])
  return { place, left, opacity }
}
