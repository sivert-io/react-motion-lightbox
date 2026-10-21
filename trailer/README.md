# The README trailer

A Remotion project that makes `docs/trailer.mp4` and `docs/trailer.webp`. Nothing in it is the real lightbox: the moves are drawn with the same curves, using the demo's photos and crops.

```sh
npm install
npm run dev                                            # Remotion Studio, to watch and edit it
npx remotion render Trailer ../docs/trailer.mp4 --crf=18
```

The WebP for the README is the MP4 at 960px and 20 fps:

```sh
mkdir -p /tmp/w && ffmpeg -i ../docs/trailer.mp4 -vf "fps=20,scale=960:-1:flags=lanczos" /tmp/w/%04d.png
img2webp -loop 0 -lossy -q 75 -m 4 -d 50 /tmp/w/*.png -o ../docs/trailer.webp
```

Remotion is free for individuals and companies of up to three people.
