# react-motion-lightbox

A React lightbox that opens out of its thumbnail and closes back into it. Pictures sit on a track you can drag, flick and grab mid-glide. Zoom with a double click or tap, the wheel, two fingers, or `+` and `-`. Bring your own video player, toolbar and title. Built on [Motion](https://motion.dev).

- **Opens from the thumbnail** when you pass an `origin`, keeping the corner radius exact through the move. Without one, it fades and scales in.
- **A native modal `<dialog>`:** Esc, the focus trap and an inert page come built in, and focus returns where it was on close.
- **Keyboard:** Esc, ← →, `+` and `-`, and the arrow keys pan while zoomed.
- **Touch:** swipe between items and pinch to zoom.
- **Respects `prefers-reduced-motion`:** with it on, moves land at once.
- **Preloads** the next and previous items.
- **No icon library and no CSS framework.** One stylesheet, themed with CSS variables.

## Install

```sh
npm install react-motion-lightbox motion
```

Peer dependencies: `react` and `react-dom` 18 or newer, `motion` 12 or newer.

## Example

```tsx
import { useRef, useState } from 'react'
import { Lightbox, type LightboxItem } from 'react-motion-lightbox'
import 'react-motion-lightbox/styles.css'

const items: LightboxItem[] = [
  { kind: 'image', src: '/photos/one.jpg', alt: 'The harbour at dawn', width: 1600, height: 1067 },
  { kind: 'image', src: '/photos/two.jpg', alt: 'A boat leaving' },
  { kind: 'video', src: '/clips/three.mp4', poster: '/clips/three.jpg', width: 1920, height: 1080 },
]

export function Gallery() {
  const thumbs = useRef<(HTMLImageElement | null)[]>([])
  const [open, setOpen] = useState(false)
  const [index, setIndex] = useState(0)

  return (
    <>
      {items.map((item, i) => (
        <button key={i} onClick={() => { setIndex(i); setOpen(true) }}>
          <img ref={(el) => { thumbs.current[i] = el }} src={item.poster ?? item.src} alt={item.alt} />
        </button>
      ))}

      <Lightbox
        items={items}
        index={index}
        open={open}
        onClose={() => setOpen(false)}
        onIndexChange={setIndex}
        origin={(i) => thumbs.current[i]}
        caption={(item) => item.alt}
        toolbar={(item) => <a href={item.src} download>Download</a>}
      />
    </>
  )
}
```

## Props

| Prop | |
|---|---|
| `items` | `{ kind: 'image' \| 'video', src, srcSet?, sizes?, alt?, width?, height?, poster?, thumb? }[]`. Items without `width` and `height` are measured once they load. |
| `index`, `open` | Which item, and whether it's showing. Changing `index` while open moves there. |
| `onClose` | Asked to close (Esc, the close button). Set `open` to `false`, and the lightbox animates out. |
| `onIndexChange(index)` | The item on screen changed. |
| `onExited(index)` | The close animation finished and the dialog is gone. |
| `origin(index)` | The element (or `DOMRect`) an item opens out of and closes back into. Return nothing for a fade. |
| `originCrop(index)` | When the thumbnail shows a crop of the item: `[left, top, width, height]` as fractions. |
| `renderVideo(item, { active })` | Draw a video yourself. It fills the item's box. |
| `title(item, index)` | The top left of the screen. |
| `toolbar(item, index)` | The top right, before the close button. |
| `caption(item, index)` | Under the item, before the "3 / 12" count. |
| `thumbnails` | The thumbnail row, when there's more than one item. Default `true`. |
| `maxZoom` | Default `8`. |
| `radius` | Corner radius in px, kept exact through the opening move. Default `12`. |
| `labels` | `{ dialog, close, previous, next }`, for translations. |
| `icons` | `{ close, previous, next }`: any React node. Plain SVGs by default. |
| `className` | Added to the `<dialog>`. |

`preload(item)` starts downloading an item exactly as the lightbox will show it. Call it on hover so the picture is ready before the click.

`useTrack` and `useTrackPlace` are the track the lightbox moves on. Use them to build a gallery that moves the same way.

## Theming

Set these on `.rml`, or on a class you pass in `className`:

```css
.rml.my-lightbox {
  --rml-backdrop: rgb(0 0 0 / 0.92);
  --rml-color: #f4f4f5;
  --rml-muted: #a1a1aa;
  --rml-border: rgb(255 255 255 / 0.2);
  --rml-accent: #e4c590;
  --rml-focus: #fde68a;
  --rml-padding: 1rem clamp(1rem, 4vw, 3rem);
  --rml-gap: 0.75rem;
  --rml-button-size: 2.75rem;
  --rml-caption-size: 0.75rem;
  --rml-thumb-size: 3.5rem;
  --rml-thumb-radius: 0.375rem;
  --rml-ease: cubic-bezier(0.16, 1, 0.3, 1);
}
```

## License

MIT
