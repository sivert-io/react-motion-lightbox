import { createRoot } from 'react-dom/client'
import { Lightbox } from 'react-motion-lightbox'
import 'react-motion-lightbox/styles.css'

// A lightbox with a single item, open from the start. No thumbnail, so it fades in.
createRoot(document.getElementById('root')!).render(
  <Lightbox
    items={[{ kind: 'image', src: '/photos/DmA484UHAzw-1280.webp', alt: 'Northern lights', width: 4748, height: 2635 }]}
    index={0}
    open
    onClose={() => {}}
  />,
)
