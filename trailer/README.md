# The trailer

A Remotion project that makes the trailer in the README and on the demo site. Nothing in it is the real lightbox: the moves are drawn with the same curves, using the demo's photos and crops.

```sh
npm install
npm run dev                                            # Remotion Studio, to watch and edit it
npx remotion render Trailer /tmp/trailer.mp4 --scale=1.3333333333333333 --crf=14   # 1440p, 120 fps
```

The demo site gets AV1, with H.264 for browsers that can't play it:

```sh
ffmpeg -i /tmp/trailer.mp4 -c:v libsvtav1 -preset 4 -crf 40 -g 600 -pix_fmt yuv420p -movflags +faststart -an ../demo/public/trailer.av1.mp4
ffmpeg -i /tmp/trailer.mp4 -c:v libx264 -preset veryslow -tune animation -b:v 1380k -pass 1 -an -f mp4 /dev/null
ffmpeg -i /tmp/trailer.mp4 -c:v libx264 -preset veryslow -tune animation -b:v 1380k -pass 2 -pix_fmt yuv420p -movflags +faststart -an ../demo/public/trailer.mp4
```

The H.264 one stays under GitHub's 10 MB limit. For the README, drop it into an issue or comment box on GitHub, don't post it, and put the `user-attachments` link it gives you on a line of its own. GitHub only plays videos uploaded that way.

Remotion is free for individuals and companies of up to three people.
