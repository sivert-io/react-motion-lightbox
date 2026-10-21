import type { Crop, LightboxItem } from './Lightbox.js'

/**
 * The part of an item a box of `aspect` (width over height) shows: the biggest
 * region of that shape, zoomed in `item.zoom` times and centred on
 * `item.focus`, kept inside the picture. Pass it to the lightbox as
 * `originCrop`, so it opens out of exactly that part.
 */
export function cropOf({ width = 1, height = 1, focus = [0.5, 0.5], zoom = 1 }: LightboxItem, aspect = 1): Crop {
  const wide = width / height > aspect
  const w = (wide ? (aspect * height) / width : 1) / zoom
  const h = (wide ? 1 : width / (aspect * height)) / zoom
  const clamp = (at: number, size: number) => Math.min(Math.max(at - size / 2, 0), 1 - size)
  return [clamp(focus[0], w), clamp(focus[1], h), w, h]
}
