import { useRef, useState } from 'react'
import { Lightbox, preload, type Crop } from 'react-motion-lightbox'
import 'react-motion-lightbox/styles.css'
import type { Photo } from './photos'

// The grid shows the middle square of each photo. Telling the lightbox which
// part that is lets it open out of exactly what you clicked.
function middleSquare({ width = 1, height = 1 }: Photo): Crop {
  return width > height
    ? [(1 - height / width) / 2, 0, height / width, 1]
    : [0, (1 - width / height) / 2, 1, width / height]
}

export function Gallery({ photos }: { photos: Photo[] }) {
  const thumbs = useRef<(HTMLImageElement | null)[]>([])
  const [open, setOpen] = useState(false)
  const [index, setIndex] = useState(0)

  return (
    <>
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {photos.map((photo, i) => (
          <li key={photo.src}>
            <button
              className="tile"
              aria-label={`Open: ${photo.alt}`}
              onClick={() => {
                setIndex(i)
                setOpen(true)
              }}
              // Start downloading the big one on hover, so it's ready on click.
              onPointerEnter={() => preload(photo)}
            >
              <img
                ref={(el) => {
                  thumbs.current[i] = el
                }}
                src={photo.thumb}
                alt=""
                loading="lazy"
              />
            </button>
          </li>
        ))}
      </ul>

      <Lightbox
        className="demo"
        items={photos}
        index={index}
        open={open}
        onClose={() => setOpen(false)}
        onIndexChange={setIndex}
        origin={(i) => thumbs.current[i]}
        originCrop={(i) => middleSquare(photos[i])}
        radius={14}
        caption={(photo) => photo.alt}
        title={(photo) => (
          <a className="link" href={photo.profile} target="_blank" rel="noreferrer">
            Photo by {photo.photographer}
          </a>
        )}
      />
    </>
  )
}
