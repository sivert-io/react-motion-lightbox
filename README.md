# react-motion-lightbox

A lightbox for React. It opens out of the thumbnail you clicked and closes back into it.

I built it for my own site, [gullberg.no](https://gullberg.no), and pulled it out into a package so [Gryt](https://gryt.chat) can use it too.

![The lightbox open on a gallery of eight screenshots, with the thumbnail row underneath](docs/open.webp)

![Halfway through a move to the next picture: the current one slides out to the left while the next comes in from the right](docs/slide.webp)

## What it does

- Opens out of the thumbnail when you tell it which one. Without one, it fades in.
- You can drag the pictures, flick them, and grab one while it's still moving.
- Zoom with a double click or tap, the scroll wheel, two fingers, or `+` and `-`. It goes up to 8x.
- Esc and the arrow keys work, and so does swiping. While zoomed in, the arrow keys move around the picture.
- It's a native `<dialog>`, so focus stays inside while it's open. When it closes, focus goes back to where it was.
- It loads the next and previous picture before you get there.
- With reduced motion turned on, nothing slides. It switches straight away.
- There's no icon library and no CSS framework. You get one stylesheet you can theme with CSS variables.

You can draw videos with your own player, and put your own buttons and text at the top.

## Install

```sh
npm install react-motion-lightbox motion
```

You need `react` and `react-dom` 18 or newer, and `motion` 12 or newer.

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
| `items` | `{ kind: 'image' \| 'video', src, srcSet?, sizes?, alt?, width?, height?, poster?, thumb? }[]`. If you leave out `width` and `height`, it measures the item once it loads. |
| `index`, `open` | Which item to show, and whether the lightbox is open. Change `index` while it's open and it moves there. |
| `onClose` | Someone pressed Esc or the close button. Set `open` to `false` and it animates out. |
| `onIndexChange(index)` | The item on screen changed. |
| `onExited(index)` | The close animation is done and the dialog is gone. |
| `origin(index)` | The element (or a `DOMRect`) an item opens out of and closes back into. Return nothing and it fades instead. |
| `originCrop(index)` | If the thumbnail only shows part of the picture: `[left, top, width, height]` as fractions of it. |
| `renderVideo(item, { active })` | Draw a video yourself. It fills the item's box. |
| `title(item, index)` | Top left. |
| `toolbar(item, index)` | Top right, before the close button. |
| `caption(item, index)` | Under the picture, before the "3 / 12" count. |
| `thumbnails` | The row of thumbnails when there's more than one item. Default `true`. |
| `maxZoom` | Default `8`. |
| `radius` | Corner radius in px. It stays the same all the way through the opening move. Default `12`. |
| `labels` | `{ dialog, close, previous, next }`, if you need other words or another language. |
| `icons` | `{ close, previous, next }`, any React node. The defaults are plain SVGs. |
| `className` | Goes on the `<dialog>`. |

`preload(item)` downloads an item the same way the lightbox will show it. Call it on hover and the picture is there before the click.

`useTrack` and `useTrackPlace` are the track the lightbox moves on. Use them if you want a gallery that moves the same way.

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

## What I haven't tested

I've run it on React 19 with Motion 12 and 14. React 18 should work, but I haven't tried it. Pinch zoom is written for touch screens, but I've only tested it on a laptop so far.

## License

MIT
