import { Gallery } from 'react-motion-lightbox'
import 'react-motion-lightbox/styles.css'
import type { Photo } from './photos'

// Each photo's focus and zoom (photos.ts) decide the square it shows here.
// Click it and the lightbox opens out of that square into the whole photo.
export function Album({ title, photos }: { title: string; photos: Photo[] }) {
  return (
    <Gallery
      className="demo"
      items={photos}
      radius={14}
      caption={(photo) => photo.alt}
      title={(photo) => (
        <a className="link" href={photo.profile} target="_blank" rel="noreferrer">
          Photo by {photo.photographer}
        </a>
      )}
      labels={{ dialog: title }}
    />
  )
}
