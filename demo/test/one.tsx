import { createRoot } from 'react-dom/client'
import { Lightbox, type LightboxItem } from 'react-motion-lightbox'
import 'react-motion-lightbox/styles.css'

// A lightbox open from the start on its last item, with no thumbnail to grow
// out of, so it fades in. One item by default; ?n=2 for two; ?small for one
// that says it is only 400 wide; ?unsized for one that doesn't say; ?video for
// a video, ?video=controls for one drawn by renderVideo with native controls.
const query = new URLSearchParams(location.search)
const n = Number(query.get('n') ?? 1)
const photos: LightboxItem[] = [
  { kind: 'image', src: '/photos/DmA484UHAzw-1280.webp', alt: 'Northern lights', width: 4748, height: 2635 },
  { kind: 'image', src: '/photos/25Bu6uO9xLw-1280.webp', alt: 'Nusfjord', width: 6000, height: 4000 },
  { kind: 'image', src: '/photos/6BRuv2Wqwhc-1280.webp', alt: 'A lighthouse', width: 4000, height: 6000 },
]
const video: LightboxItem = { kind: 'video', src: '/trailer.av1.mp4', poster: '/trailer.webp', alt: 'Trailer', width: 2560, height: 1440 }
const items = query.has('video')
  ? [video]
  : query.has('small')
  ? [{ ...photos[0], width: 400, height: 222 }]
  : query.has('unsized')
    ? [{ ...photos[0], width: undefined, height: undefined }]
    : photos.slice(0, n)

createRoot(document.getElementById('root')!).render(
  <Lightbox
    items={items}
    index={items.length - 1}
    open
    onClose={() => {}}
    renderVideo={query.get('video') === 'controls' ? (item) => <video src={item.src} muted loop autoPlay playsInline controls /> : undefined}
  />,
)
