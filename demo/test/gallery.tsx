import { createRoot } from 'react-dom/client'
import { Gallery } from 'react-motion-lightbox'
import 'react-motion-lightbox/styles.css'
import { ALBUMS } from '../src/photos'

// A gallery of ?n= photos with a 50 px peek and a 10 px gap. ?wide shows them in full on either side.
const params = new URLSearchParams(location.search)
const items = ALBUMS.flatMap((a) => a.photos).slice(0, Number(params.get('n') ?? 5))
const wide = params.has('wide')

createRoot(document.getElementById('root')!).render(
  <Gallery items={items} loading="eager" peek={50} gap={10} clip={!wide} fade={!wide} />,
)
