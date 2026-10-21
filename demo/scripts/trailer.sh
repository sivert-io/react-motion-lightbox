#!/bin/sh
# Builds docs/trailer.webp and docs/trailer.mp4 from two recorded runs through
# the demo: desktop, then the phone in a card beside some text.
# Needs the demo on :5180 (npm run dev -- --port 5180), Chrome, ffmpeg,
# ImageMagick and img2webp. Run from demo/.
set -e
T=$(mktemp -d)
node scripts/record.mjs "$T/d" desktop
node scripts/record.mjs "$T/p" phone
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless=new --disable-gpu \
  --screenshot="$T/bg.png" --window-size=1280,720 --hide-scrollbars "file://$PWD/scripts/trailer.html"
magick -size 296x640 xc:black -fill white -draw "roundrectangle 0,0 295,639 28,28" "$T/mask.png"
cd "$T"
ffmpeg -v error -y -f concat -safe 0 -i d/frames.txt -vf "crop=1280:720:0:0,fps=30,format=yuv420p" -c:v libx264 -crf 16 d.mp4
ffmpeg -v error -y -f concat -safe 0 -i p/frames.txt -vf "crop=500:1082:0:0,fps=30,scale=296:640:flags=lanczos" -c:v libx264 -crf 14 -pix_fmt yuv420p pclip.mp4
P=$(ffprobe -v error -show_entries format=duration -of csv=p=0 pclip.mp4)
ffmpeg -v error -y -i pclip.mp4 -loop 1 -i mask.png -loop 1 -i bg.png -filter_complex \
  "[0:v]format=rgba[ph];[1:v]format=gray[m];[ph][m]alphamerge[phr];[2:v][phr]overlay=848:40:shortest=1,fps=30,format=yuv420p[v]" \
  -map "[v]" -t "$P" -c:v libx264 -crf 16 p.mp4
D=$(ffprobe -v error -show_entries format=duration -of csv=p=0 d.mp4)
ffmpeg -v error -y -i d.mp4 -i p.mp4 -filter_complex \
  "[0:v][1:v]xfade=transition=fade:duration=0.6:offset=$(echo "$D - 0.6" | bc),tpad=stop_mode=clone:stop_duration=0.8,format=yuv420p[v]" \
  -map "[v]" -c:v libx264 -crf 18 -movflags +faststart trailer.mp4
mkdir w && ffmpeg -v error -i trailer.mp4 -vf "fps=15,scale=960:-1:flags=lanczos" w/%04d.png
img2webp -loop 0 -lossy -q 72 -m 4 -d 67 w/*.png -o trailer.webp
cd - >/dev/null
cp "$T/trailer.mp4" "$T/trailer.webp" ../docs/
echo "docs/trailer.webp and docs/trailer.mp4 updated"
