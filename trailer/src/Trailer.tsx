import type { CSSProperties, ReactNode } from "react";
import { AbsoluteFill, Easing, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { MONO, SANS, SERIF } from "./fonts";

// The demo site's colours (demo/src/styles.css, light).
const PAPER = "oklch(97.5% 0.012 40)";
const PAPER_2 = "oklch(95% 0.018 38)";
const PAPER_3 = "oklch(91.5% 0.025 35)";
const RULE = "oklch(88% 0.022 32)";
const INK = "oklch(26% 0.04 25)";
const MUTED = "oklch(45% 0.04 25)";
const ACCENT = "oklch(47% 0.12 25)";
const GOLD = "#e0b04a";

// The lightbox's own curves: its opening move, and the track's glide.
const OUT = Easing.bezier(0.16, 1, 0.3, 1);
const GLIDE = Easing.bezier(0.65, 0, 0.35, 1);
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
/**
 * The film is timed in story frames. Each real frame is 1/SLOW of one, so
 * raising SLOW slows everything evenly, springs included.
 */
export const SLOW = 1.2;
/**
 * Holds: at story frame `at`, everything stands still for `len` more story
 * frames. One keeps the title up; in the other the square moves round the
 * car (see `holdClock`).
 */
const HOLDS = [
  { at: 30, len: 30 },
  { at: 590, len: 48 },
];
export const STORY_FRAMES = 1270 + HOLDS.reduce((n, h) => n + h.len, 0);
const useRawFrame = () => useCurrentFrame() / SLOW;
const warp = (raw: number) => {
  let t = raw;
  for (const h of HOLDS) {
    if (t < h.at) return t;
    if (t < h.at + h.len) return h.at;
    t -= h.len;
  }
  return t;
};
/** Story frames into hold `i`, counting from the moment it starts. */
const holdClock = (raw: number, i: number) => raw - HOLDS.slice(0, i).reduce((n, h) => n + h.len, 0) - HOLDS[i].at;
const useFrame = () => warp(useRawFrame());
/** 0 before `from`, 1 after `from + dur` story frames, eased in between. */
const ease = (frame: number, from: number, dur: number, easing = OUT) =>
  interpolate(frame, [from, from + dur], [0, 1], { ...clamp, easing });
const lerp = (a: number, b: number, p: number) => a + (b - a) * p;

// ── Photos, from the demo, and their crops ──────────────────────────────────
type Photo = { id: string; w: number; h: number; focus?: [number, number]; zoom?: number };
type Rect = { x: number; y: number; w: number; h: number };
type Crop = [number, number, number, number];
const PIGEON: Photo = { id: "B4H-44aAzqc", w: 2081, h: 3123, focus: [0.37, 0.5], zoom: 2 };
const DEER: Photo = { id: "4sVimJidmpQ", w: 4671, h: 7006, focus: [0.5, 0.46], zoom: 1.6 };
const RED: Photo = { id: "cA6DjKN2vaw", w: 3034, h: 4040, focus: [0.42, 0.38], zoom: 1.5 };
const CHAIR: Photo = { id: "41lvjsoCJKA", w: 2267, h: 3400, focus: [0.35, 0.5], zoom: 1.2 };
const STREET: Photo = { id: "dmf546pckjQ", w: 4000, h: 6000, focus: [0.55, 0.3], zoom: 1.5 };
const CAR: Photo = { id: "28RaDBx9F3g", w: 5892, h: 3939, focus: [0.46, 0.6] };
const HALLSTATT: Photo = { id: "q2dUSl9S4Xg", w: 6691, h: 4281 };
const VERNAZZA: Photo = { id: "cYrMQA7a3Wc", w: 2400, h: 1600 };
const COWBOY: Photo = { id: "bT1brkJbOgQ", w: 5464, h: 8192, focus: [0.5, 0.25], zoom: 1.4 };
const BLAZER: Photo = { id: "FyVM48yP-S4", w: 4000, h: 6000, focus: [0.55, 0.25], zoom: 1.8 };
const BUILDING: Photo = { id: "nV1HMjvlOj4", w: 6862, h: 4538, focus: [0.67, 0.5], zoom: 1.4 };
const DARK: Photo = { id: "UegxIJUTX5E", w: 3862, h: 4827, focus: [0.45, 0.3], zoom: 1.2 };
const HIKER: Photo = { id: "uqG-p4lBxwk", w: 3393, h: 5090, focus: [0.5, 0.75], zoom: 1.3 };
const LAKE: Photo = { id: "NwmR1EDtiFg", w: 5228, h: 3485, focus: [0.5, 0.62], zoom: 1.2 };
const STORM: Photo = { id: "25hQHxmHg94", w: 5271, h: 6588, focus: [0.48, 0.5], zoom: 1.3 };
/**
 * The desktop gallery's track. The flick lands on 4, the peek on 6, and the
 * last move on the car at 9, which opens straight into the focus point.
 */
const ALBUM = [PIGEON, DEER, RED, CHAIR, STREET, COWBOY, BLAZER, BUILDING, DARK, CAR, HIKER, LAKE, STORM];
/** The phone's gallery. */
const PHONE_ALBUM = [PIGEON, DEER, RED, CHAIR, STREET];
/** The whole of Out and About, for the grid it folds out of. */
// The pigeon is in the middle: it's the front of the album, and the rest fold in behind it.
const GRID = ["dmf546pckjQ", "cA6DjKN2vaw", "2echtVPwylU", "wIZpOCdTb8I", "B4H-44aAzqc", "FyVM48yP-S4", "4sVimJidmpQ", "nV1HMjvlOj4", "41lvjsoCJKA"];
/** For the full-screen lightbox's thumbnail row. */
const FURTHER = ["28RaDBx9F3g", "q2dUSl9S4Xg", "cYrMQA7a3Wc", "xUUZcpQlqpM", "NwmR1EDtiFg", "uqG-p4lBxwk"];
const big = (p: Photo) => staticFile(`photos/${p.id}-2560.webp`);
const thumb = (id: string) => staticFile(`photos/${id}-thumb.webp`);
const WHOLE: Crop = [0, 0, 1, 1];

/** The part of a photo a box of `aspect` shows (cropOf in src/crop.ts). */
const cropOf = ({ w, h, focus = [0.5, 0.5], zoom = 1 }: Photo, aspect = 1): Crop => {
  const wide = w / h > aspect;
  const cw = (wide ? (aspect * h) / w : 1) / zoom;
  const ch = (wide ? 1 : w / (aspect * h)) / zoom;
  const c = (at: number, size: number) => Math.min(Math.max(at - size / 2, 0), 1 - size);
  return [c(focus[0], cw), c(focus[1], ch), cw, ch];
};
const fit = (p: Photo, maxW: number, maxH: number, cx: number, cy: number): Rect => {
  const s = Math.min(maxW / p.w, maxH / p.h);
  return { x: cx - (p.w * s) / 2, y: cy - (p.h * s) / 2, w: p.w * s, h: p.h * s };
};
const mix = (a: Rect, b: Rect, p: number): Rect => ({ x: lerp(a.x, b.x, p), y: lerp(a.y, b.y, p), w: lerp(a.w, b.w, p), h: lerp(a.h, b.h, p) });
const mixCrop = (a: Crop, b: Crop, p: number) => a.map((v, i) => lerp(v, b[i], p)) as Crop;
const shift = (r: Rect, dx: number): Rect => ({ ...r, x: r.x + dx });

/**
 * A photo in a box at `rect`, showing the part `crop` of it. Moving the box
 * and widening the crop together is the lightbox's opening move: the corners
 * stay round the whole way because nothing is scaled.
 */
const Shot = ({ photo, rect, crop, radius = 24, style }: { photo: Photo; rect: Rect; crop: Crop; radius?: number; style?: CSSProperties }) => {
  const imgW = rect.w / crop[2];
  const imgH = rect.h / crop[3];
  return (
    <div style={{ position: "absolute", left: rect.x, top: rect.y, width: rect.w, height: rect.h, borderRadius: radius, overflow: "hidden", background: PAPER_3, ...style }}>
      <Img src={big(photo)} style={{ position: "absolute", width: imgW, height: imgH, left: -crop[0] * imgW, top: -crop[1] * imgH, maxWidth: "none" }} />
    </div>
  );
};

/** A line that comes in whole and quickly, and leaves the same way. */
const Line = ({ text, at, until = Infinity, style }: { text: ReactNode; at: number; until?: number; style?: CSSProperties }) => {
  const frame = useFrame();
  const { fps } = useVideoConfig();
  const p = spring({ frame: frame - at, fps, config: { damping: 200 }, durationInFrames: 10 });
  const leave = Number.isFinite(until) ? ease(frame, until, 8, GLIDE) : 0;
  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        textAlign: "center",
        opacity: p * (1 - leave),
        translate: `0 ${(1 - p) * 30 - leave * 24}px`,
        filter: `blur(${(1 - p) * 6 + leave * 4}px)`,
        ...style,
      }}
    >
      {text}
    </div>
  );
};
const Caption = (props: { text: string; at: number; until?: number }) => <Line {...props} style={{ top: 64, font: `64px ${SERIF}`, color: INK }} />;

/** A fingertip, for drags and taps. */
const Finger = ({ x, y, down, o, size = 64 }: { x: number; y: number; down: number; o: number; size?: number }) => (
  <div
    style={{
      position: "absolute",
      left: x - size / 2,
      top: y - size / 2,
      width: size,
      height: size,
      borderRadius: 999,
      background: "oklch(30% 0.04 25 / 0.28)",
      border: "3px solid white",
      boxShadow: "0 4px 16px oklch(20% 0.04 25 / 0.3)",
      scale: String(1 - down * 0.18),
      opacity: o,
      zIndex: 10,
    }}
  />
);

/**
 * The small gallery: photos on a track, `pos` along it. Each photo is the
 * box less `peek` wide, cropped to that shape. `clip` 1 cuts them off at the
 * box. At 0 they run past it, fading with distance by `fade` (1) or staying
 * in full view (0), as `clip={false}` and `fade={false}` do.
 */
const Strip = ({ box, pos, album = ALBUM, peek = 0, gap = 32, clip = 1, fade = 1, radius = 24, hide }: { box: Rect; pos: number; album?: Photo[]; peek?: number; gap?: number; clip?: number; fade?: number; radius?: number; hide?: number }) => {
  const w = box.w - peek;
  const step = w + gap;
  const out = lerp(0, 1600, 1 - clip);
  return (
    <div style={{ position: "absolute", left: box.x, top: box.y, width: box.w, height: box.h, clipPath: `inset(-12px ${-out}px -12px ${-out}px)` }}>
      {album.map((photo, i) => {
        const d = i - pos;
        if (Math.abs(d) > 3.5) return null;
        const o = i === hide ? 0 : lerp(1, Math.max(0, 1 - Math.abs(d) * 0.55), (1 - clip) * fade);
        return <Shot key={photo.id} photo={photo} rect={{ x: d * step, y: 0, w, h: box.h }} crop={cropOf(photo, w / box.h)} radius={radius} style={{ opacity: o }} />;
      })}
    </div>
  );
};

/** A drag that lets go: the track follows `px` pixels of drag, then springs on to `to`. */
const flick = (frame: number, fps: number, from: number, to: number, start: number, dragFor: number, px: number, step: number, config = { damping: 13, stiffness: 120 }) => {
  const drag = interpolate(frame, [start, start + dragFor], [0, px], { ...clamp, easing: Easing.inOut(Easing.quad) });
  const letGo = spring({ frame: frame - start - dragFor, fps, config });
  const dir = Math.sign(to - from);
  const pos = frame < start + dragFor ? from + (dir * drag) / step : lerp(from + (dir * px) / step, to, letGo);
  return { pos, drag, down: frame >= start && frame < start + dragFor ? 1 : 0 };
};

// ── The film ─────────────────────────────────────────────────────────────────
// Story frames, 30 to a second before SLOW (and before the HOLDS). Title 0-40, the grid folds
// 40-118, drag 118-210, shapes 210-300, peek 300-362, overflow 362-462, the
// focus point 462-618, the full-screen lightbox 618-806, the phone 800-1052,
// the end 1048-1110.

const CENTRE: Rect = { x: 960 - 230, y: 590 - 230, w: 460, h: 460 };
const STEP = 460 + 32;

export const Trailer: React.FC = () => {
  const frame = useFrame();
  const { fps } = useVideoConfig();
  const sp = (from: number, config: { damping: number; mass?: number; stiffness?: number } = { damping: 200 }) =>
    spring({ frame: frame - from, fps, config });
  const shown = (from: number, to: number) => ease(frame, from, 5) * (1 - ease(frame, to, 6));

  // ── Title
  const logo = sp(2, { damping: 14, mass: 0.8 });
  const titleOut = ease(frame, 31, 8, GLIDE);

  // ── The grid folds into one square: the pigeon, cropped on the way the
  // gallery crops it, so the gallery takes over without a cut.
  const fold = ease(frame, 82, 26, GLIDE);
  const CELL = 230;
  const gridRect = (i: number): Rect => ({ x: 960 - 1.5 * CELL - 16 + (i % 3) * (CELL + 16), y: 590 - 1.5 * CELL - 16 + Math.floor(i / 3) * (CELL + 16), w: CELL, h: CELL });

  // ── Drag and flick
  const f1 = flick(frame, fps, 0, 1, 130, 18, 210, STEP);
  const f2 = flick(frame, fps, 1, 4, 172, 9, 200, STEP, { damping: 20, stiffness: 70 });
  let pos = frame < 172 ? f1.pos : f2.pos;
  let finger = { x: 0, y: 0, down: 0, o: 0 };
  if (frame >= 122 && frame < 162) finger = { x: 1150 - f1.drag - Math.max(0, frame - 148) * 7, y: 640, down: f1.down, o: shown(122, 150) };
  if (frame >= 166 && frame < 196) finger = { x: 1130 - f2.drag - Math.max(0, frame - 181) * 14, y: 650, down: f2.down, o: shown(166, 183) };

  // ── Shapes
  const s1 = ease(frame, 220, 14);
  const s2 = ease(frame, 242, 14);
  const s3 = ease(frame, 264, 14);
  const s4 = ease(frame, 288, 14);
  const shapeW = lerp(lerp(lerp(lerp(460, 600, s1), 360, s2), 720, s3), 600, s4);
  const shapeH = lerp(lerp(lerp(lerp(460, 450, s1), 480, s2), 405, s3), 450, s4);
  const aspect = s4 > 0.5 ? "4 / 3" : s3 > 0.5 ? "16 / 9" : s2 > 0.5 ? "3 / 4" : s1 > 0.5 ? "4 / 3" : "1";

  // ── Peek, twice along; then clip, fade and flow, a move in each.
  const peekIn = ease(frame, 304, 14);
  const g = (from: number) => ease(frame, from, 18, GLIDE);
  const unclip = ease(frame, 394, 10);
  const unfade = ease(frame, 424, 10);
  const reset = ease(frame, 452, 12);
  if (frame >= 210) pos = 4 + g(318) + g(340) + g(372) + g(402) + g(432);
  const box: Rect = frame < 210 ? CENTRE : mix({ x: 960 - shapeW / 2, y: 590 - shapeH / 2, w: shapeW, h: shapeH }, CENTRE, reset);

  // ── The focus point. The square we've been watching slides left and stays
  // a square; the whole photo comes in on its right with the square drawn on
  // it. The square zooms in, then visits the front, a wheel and the rear
  // wing in turn. Then the photo goes and the square slides back.
  const aside = ease(frame, 490, 24);
  const photoIn = ease(frame, 500, 22);
  const zoomIn = ease(frame, 528, 22, GLIDE);
  const moveTo = ease(frame, 560, 24, GLIDE);
  const collapse = ease(frame, 596, 22);
  const raw = useRawFrame();
  const toWheel = ease(holdClock(raw, 1), 4, 18, GLIDE);
  const toWing = ease(holdClock(raw, 1), 28, 18, GLIDE);
  const SPOTS: [number, number][] = [[0.46, 0.6], [0.6, 0.58], [0.43, 0.67], [0.25, 0.52]];
  const visit = (i: number) => lerp(lerp(lerp(SPOTS[0][i], SPOTS[1][i], moveTo), SPOTS[2][i], toWheel), SPOTS[3][i], toWing);
  const focus: [number, number] = [visit(0), visit(1)];
  const zoom = lerp(1, 2.6, zoomIn);
  const live = cropOf({ ...CAR, focus, zoom });
  const WIDE = fit(CAR, 760, 520, 1330, 590);
  const LEFT: Rect = { x: 330, y: 360, w: 460, h: 460 };
  const liveRect = mix(mix(CENTRE, LEFT, aside), CENTRE, collapse);
  const photoOn = photoIn * (1 - collapse);

  // ── The full-screen lightbox, out of that square, along two photos and
  // back into the last one's square.
  const tap = { x: 1010, y: 640, down: ease(frame, 626, 3) * (1 - ease(frame, 631, 4)), o: shown(620, 634) };
  const open = ease(frame, 630, 34);
  const chrome = ease(frame, 654, 14) * (1 - ease(frame, 760, 8, GLIDE));
  const lbAt = ease(frame, 690, 24, GLIDE) + ease(frame, 724, 24, GLIDE);
  const close = ease(frame, 766, 30);
  const squareOut = ease(frame, 798, 8, GLIDE);
  const STAGE = (p: Photo) => fit(p, 1600, 700, 960, 505);
  const LB = [CAR, HALLSTATT, VERNAZZA];
  // Each photo's distance along the track from the first, a gap apart.
  const lbX = (i: number) => LB.slice(0, i).reduce((x, p, k) => x + STAGE(p).w / 2 + 48 + STAGE(LB[k + 1]).w / 2, 0);
  const along = -lerp(lerp(lbX(0), lbX(1), Math.min(lbAt, 1)), lbX(2), Math.max(0, lbAt - 1));
  const rowW = 6 * 84 + 5 * 16;
  const at = Math.round(lbAt);
  const credit = ["Isak Pettersson", "Sheng L", "Anders Jildén"][at];
  const caption = ["A white sports car in front of a building", "Hallstatt reflected in the lake", "Vernazza, a village on the Italian coast"][at];

  // ── The phone. Swipes in the small gallery, flicked back two; a tap opens
  // the deer full screen; a swipe there; taps on two thumbnails jump along;
  // a swipe down closes it back into its square.
  const phone = sp(800, { damping: 20 });
  const phoneOut = ease(frame, 1200, 12, GLIDE);
  const P_STEP = 330 + 14;
  const p1 = flick(frame, fps, 0, 1, 836, 12, 150, P_STEP);
  const p2 = flick(frame, fps, 1, 2, 862, 12, 150, P_STEP);
  const p3 = flick(frame, fps, 2, 3, 888, 12, 150, P_STEP);
  const p4 = flick(frame, fps, 3, 1, 914, 10, 190, P_STEP, { damping: 18, stiffness: 90 });
  // How far open, how far closed, and where its track is.
  const pOpen = ease(frame, 950, 30);
  const pClose = ease(frame, 1144, 28);
  const lbPos = 1 + ease(frame, 1000, 22, GLIDE) + 2 * ease(frame, 1040, 26, GLIDE) - 4 * ease(frame, 1084, 30, GLIDE);
  const inBox = frame >= 950 && frame < 1172;
  const pChrome = ease(frame, 972, 12) * (1 - ease(frame, 1122, 6, GLIDE));
  // The swipe down: the photo follows the finger, and the page shows through.
  const down = interpolate(frame, [1124, 1142], [0, 220], { ...clamp, easing: Easing.inOut(Easing.quad) }) * (1 - pClose);
  const pDim = pOpen * (1 - pClose) * (1 - (down / 220) * 0.6);
  const pPos = frame < 950 ? (frame < 862 ? p1.pos : frame < 888 ? p2.pos : frame < 914 ? p3.pos : p4.pos) : lbPos;
  const PHONE_STAGE = (p: Photo) => fit(p, 400, 600, 220, 430);
  const slideRect: Rect = { x: 32, y: 200, w: 330, h: 380 };
  const pCaptions = ["A pigeon on wet pavement", "Fallow deer in a forest", "Someone with red hair eating an apple", "A leather lounge chair and side table", "People crossing the street with umbrellas"];
  const THUMBS_X = 220 - (5 * 52 + 4 * 10) / 2;
  const thumbX = (i: number) => THUMBS_X + i * 62 + 26;
  const tapAt = (at: number, x: number, y: number) => (frame >= at - 6 && frame < at + 12 ? { x, y, down: ease(frame, at, 3) * (1 - ease(frame, at + 5, 4)), o: shown(at - 6, at + 8) } : null);
  const dragAt = (d: { drag: number; down: number }, at: number, x: number, dir: number, y = 390) =>
    frame >= at - 6 && frame < at + 26 ? { x: x + dir * (d.drag + Math.max(0, frame - at - 12) * 6), y, down: d.down, o: shown(at - 6, at + 16) } : null;
  const pFinger =
    dragAt(p1, 836, 300, -1) ??
    dragAt(p2, 862, 300, -1) ??
    dragAt(p3, 888, 300, -1) ??
    dragAt(p4, 914, 120, 1) ??
    tapAt(944, 200, 400) ??
    (frame >= 994 && frame < 1030
      ? { x: 300 - interpolate(frame, [1000, 1016], [0, 160], { ...clamp, easing: Easing.inOut(Easing.quad) }) - Math.max(0, frame - 1016) * 6, y: 430, down: frame >= 1000 && frame < 1016 ? 1 : 0, o: shown(994, 1018) }
      : null) ??
    tapAt(1036, thumbX(4), 826) ??
    tapAt(1080, thumbX(0), 826) ??
    (frame >= 1118 && frame < 1150 ? { x: 220, y: 420 + down, down: frame >= 1124 && frame < 1142 ? 1 : 0, o: shown(1118, 1144) } : null) ?? { x: 0, y: 0, down: 0, o: 0 };

  // ── End
  const endLogo = sp(1212, { damping: 14, mass: 0.8 });
  const pill = sp(1224);

  return (
    <AbsoluteFill style={{ background: PAPER, fontFamily: SANS }}>
      {/* Title */}
      <Img
        src={staticFile("logo.svg")}
        style={{ position: "absolute", left: 880, top: 270, width: 160, height: 160, opacity: Math.min(1, logo * 1.4) * (1 - titleOut), scale: String(0.4 + logo * 0.6), rotate: `${(1 - logo) * -18}deg`, translate: `0 ${-titleOut * 40}px` }}
      />
      <Line text="react-motion-lightbox" at={6} until={31} style={{ top: 470, font: `112px/1.1 ${SERIF}`, color: INK }} />
      <Line text="A lightbox for React that opens out of the photo you click." at={10} until={32} style={{ top: 620, font: `40px ${SANS}`, color: MUTED }} />

      {/* The grid, folding into one square */}
      <Caption text="A whole album, in one square." at={44} until={118} />
      {frame >= 40 && frame < 118 &&
        GRID.map((id, i) => {
          const land = sp(42 + i * 2, { damping: 16, mass: 0.7 });
          const r = mix(gridRect(i), CENTRE, fold);
          const style: CSSProperties = { opacity: land * (id === PIGEON.id ? 1 : 1 - ease(frame, 98, 10)), scale: String(lerp(0.6, 1, land)), translate: `0 ${(1 - land) * 80}px`, zIndex: id === PIGEON.id ? 2 : 1 };
          return id === PIGEON.id ? (
            <Shot key={id} photo={PIGEON} rect={r} crop={mixCrop(cropOf({ ...PIGEON, focus: undefined, zoom: 1 }), cropOf(PIGEON), fold)} radius={lerp(16, 24, fold)} style={style} />
          ) : (
            <Img key={id} src={thumb(id)} style={{ position: "absolute", left: r.x, top: r.y, width: r.w, height: r.h, borderRadius: lerp(16, 24, fold), objectFit: "cover", ...style }} />
          );
        })}

      {/* The gallery */}
      <Caption text="Drag it. Flick it." at={120} until={206} />
      <Caption text="Any shape." at={214} until={298} />
      <Line text={`aspect={${aspect}}`} at={216} until={298} style={{ top: 880, font: `34px ${MONO}`, color: ACCENT }} />
      <Caption text="Peek at the next one." at={302} until={360} />
      <Caption text="Clip it, fade it, or let it flow." at={364} until={460} />
      <Line text={unfade > 0.5 ? "clip={false} fade={false}" : unclip > 0.5 ? "clip={false}" : "clip={true}"} at={366} until={458} style={{ top: 880, font: `34px ${MONO}`, color: ACCENT }} />
      {frame >= 118 && frame < 486 && (
        <>
          <Strip
            box={box}
            // On to the cliff photo along the same track, before it opens out.
            pos={pos}
            peek={110 * peekIn * (1 - reset)}
            clip={1 - unclip * (1 - reset)}
            fade={1 - unfade * (1 - reset)}
          />
          <div style={{ position: "absolute", left: 0, right: 0, top: 590 + 230 + 28, textAlign: "center", font: `28px ${SANS}`, color: MUTED, opacity: frame < 210 ? ease(frame, 120, 8) : 0 }}>
            {`${Math.round(pos) + 1} / ${ALBUM.length}`}
          </div>
        </>
      )}
      <Finger {...finger} />

      {/* The focus point */}
      <Caption text="Point it at what matters." at={470} until={612} />
      {frame >= 486 && frame < 632 && (
        <>
          {/* The whole photo, with where the square is drawn on it and the rest dimmed. */}
          <div style={{ position: "absolute", inset: 0, opacity: photoOn, translate: `${(1 - photoIn) * 80 + collapse * 60}px 0`, scale: String(lerp(0.94, 1, photoIn)) }}>
            <Shot photo={CAR} rect={WIDE} crop={WHOLE} radius={20} />
            <div style={{ position: "absolute", left: WIDE.x, top: WIDE.y, width: WIDE.w, height: WIDE.h, borderRadius: 20, overflow: "hidden" }}>
              <div style={{ position: "absolute", left: live[0] * WIDE.w, top: live[1] * WIDE.h, width: live[2] * WIDE.w, height: live[3] * WIDE.h, border: "4px solid white", borderRadius: 12, boxShadow: "0 0 0 3000px oklch(15% 0.02 25 / 0.5)" }} />
              <div style={{ position: "absolute", left: focus[0] * WIDE.w - 13, top: focus[1] * WIDE.h - 13, width: 26, height: 26, borderRadius: 99, background: ACCENT, border: "4px solid white" }} />
            </div>
          </div>
          {/* The square: the gallery itself, never replaced. */}
          <Shot photo={CAR} rect={liveRect} crop={live} />
          <div style={{ position: "absolute", left: WIDE.x, top: WIDE.y + WIDE.h + 30, font: `30px ${MONO}`, color: INK, whiteSpace: "pre", opacity: photoOn }}>
            {`focus: [${focus[0].toFixed(2)}, ${focus[1].toFixed(2)}]\nzoom: ${zoom.toFixed(1)}`}
          </div>
        </>
      )}

      {/* The full-screen lightbox */}
      <Caption text="Opens out of the photo." at={622} until={650} />
      <Caption text="And back into its square." at={762} until={800} />
      {frame >= 630 && frame < 808 && (
        <>
          <div style={{ position: "absolute", inset: 0, background: PAPER, opacity: 0.94 * open * (1 - close) }} />
          {LB.map((p, i) => {
            const d = Math.abs(i - lbAt);
            if (d > 1.2) return null;
            const centred = shift(STAGE(p), lbX(i) + along);
            const rect = i === 0 ? shift(mix(CENTRE, STAGE(p), open), along) : i === 2 ? mix(centred, CENTRE, close) : centred;
            const crop = i === 0 ? mixCrop(live, WHOLE, open) : i === 2 ? mixCrop(WHOLE, cropOf(VERNAZZA), close) : WHOLE;
            return <Shot key={p.id} photo={p} rect={rect} crop={crop} style={{ opacity: Math.max(0, 1 - d) * (i === 2 ? 1 - squareOut : 1) }} />;
          })}
          <div style={{ opacity: chrome }}>
            <div style={{ position: "absolute", left: 72, top: 52, font: `30px ${SANS}`, color: ACCENT, textDecoration: "underline", textUnderlineOffset: 6 }}>Photo by {credit}</div>
            <div style={{ position: "absolute", right: 72, top: 40, width: 64, height: 64, borderRadius: 99, border: `1.5px solid ${RULE}`, display: "grid", placeItems: "center", font: `30px ${SANS}`, color: MUTED }}>✕</div>
            {[72, 1920 - 72 - 64].map((x, i) => (
              <div key={x} style={{ position: "absolute", left: x, top: 505 - 32, width: 64, height: 64, borderRadius: 99, border: `1.5px solid ${RULE}`, display: "grid", placeItems: "center", font: `34px ${SANS}`, color: MUTED }}>
                {i ? "›" : "‹"}
              </div>
            ))}
            <div style={{ position: "absolute", left: 0, right: 0, top: 878, textAlign: "center", font: `28px ${SANS}`, color: MUTED }}>
              {caption}
              <span style={{ marginLeft: 28 }}>{`${at + 1} / 6`}</span>
            </div>
            <div style={{ position: "absolute", left: 960 - rowW / 2, top: 950, display: "flex", gap: 16 }}>
              {FURTHER.map((id, i) => {
                const lit = Math.max(0, 1 - Math.abs(i - lbAt));
                return <Img key={id} src={thumb(id)} style={{ width: 84, height: 84, borderRadius: 12, objectFit: "cover", opacity: 0.45 + 0.55 * lit, scale: String(1 + 0.1 * lit) }} />;
              })}
            </div>
            <div style={{ position: "absolute", left: 960 - rowW / 2 - 12 + lbAt * 100, top: 938, width: 108, height: 108, border: `3px solid ${GOLD}`, borderRadius: 20 }} />
          </div>
        </>
      )}
      <Finger {...tap} />

      {/* The phone */}
      <div
        style={{
          position: "absolute",
          left: 1180,
          top: 90,
          width: 440,
          height: 900,
          borderRadius: 64,
          background: PAPER,
          overflow: "hidden",
          boxShadow: "0 4px 10px oklch(30% 0.05 25 / 0.12), 0 50px 120px oklch(30% 0.05 25 / 0.25)",
          opacity: Math.min(1, phone * 1.5) * (1 - phoneOut),
          translate: `${(1 - phone) * 500}px ${-phoneOut * 40}px`,
          rotate: `${(1 - phone) * 12}deg`,
        }}
      >
        {/* The page behind the lightbox: it blurs and fades as the photo opens, and comes back as it closes. */}
        <div style={{ position: "absolute", inset: 0, filter: `blur(${10 * pDim}px)` }}>
        <div style={{ position: "absolute", left: 32, top: 70, font: `40px ${SERIF}`, color: INK }}>Out and about</div>
        <div style={{ position: "absolute", left: 32, top: 126, width: 380, font: `19px/1.4 ${SANS}`, color: MUTED }}>Streets, people, deer, and one very good chair.</div>
        {/* The gallery stays behind the lightbox and follows it. Only the
            open photo is hidden: the lightbox's copy is that one. */}
        <Strip box={{ x: 32, y: 200, w: 380, h: 380 }} album={PHONE_ALBUM} pos={pPos} peek={50} gap={14} radius={20} hide={inBox ? Math.round(lbPos) : undefined} />
        <div style={{ position: "absolute", left: 32, top: 600, font: `19px ${SANS}`, color: MUTED }}>{`${Math.round(pPos) + 1} / 9`}</div>
        <div style={{ position: "absolute", left: 32, top: 660, font: `40px ${SERIF}`, color: INK }}>Norway</div>
        <div style={{ position: "absolute", left: 32, top: 716, width: 380, font: `19px/1.4 ${SANS}`, color: MUTED }}>Fjords, fishing villages and a lot of standing on rocks.</div>
        </div>
        {inBox && (
          <>
            <div style={{ position: "absolute", inset: 0, background: PAPER, opacity: 0.9 * pDim }} />
            {PHONE_ALBUM.map((p, i) => {
              const d = i - lbPos;
              if (Math.abs(d) > 1.2) return null;
              const stage = shift(PHONE_STAGE(p), d * 440);
              const opened = i === 1 && pOpen < 1;
              const closing = i === Math.round(lbPos) && pClose > 0;
              const square = cropOf(p, 330 / 380);
              let rect = stage;
              let crop = WHOLE;
              if (opened) {
                rect = mix(slideRect, stage, pOpen);
                crop = mixCrop(square, WHOLE, pOpen);
              }
              if (closing || (i === Math.round(lbPos) && down > 0)) {
                const pulled = { ...stage, y: stage.y + down, w: stage.w * (1 - (down / 220) * 0.2), h: stage.h * (1 - (down / 220) * 0.2) };
                pulled.x = stage.x + (stage.w - pulled.w) / 2;
                rect = mix(pulled, slideRect, pClose);
                crop = mixCrop(WHOLE, square, pClose);
              }
              const others = i === Math.round(lbPos) ? 1 : pOpen > 0.9 ? 1 - pClose : 0;
              return <Shot key={p.id} photo={p} rect={rect} crop={crop} radius={18} style={{ opacity: Math.max(0, 1 - Math.abs(d)) * others }} />;
            })}
            <div style={{ opacity: pChrome }}>
              <div style={{ position: "absolute", right: 22, top: 40, width: 44, height: 44, borderRadius: 99, border: `1.5px solid ${RULE}`, display: "grid", placeItems: "center", font: `20px ${SANS}`, color: MUTED }}>✕</div>
              <div style={{ position: "absolute", left: 0, right: 0, top: 752, textAlign: "center", font: `17px ${SANS}`, color: MUTED }}>
                {pCaptions[Math.round(lbPos)]}
                <span style={{ marginLeft: 14 }}>{`${Math.round(lbPos) + 1} / 9`}</span>
              </div>
              <div style={{ position: "absolute", left: THUMBS_X, top: 800, display: "flex", gap: 10 }}>
                {PHONE_ALBUM.map((p, i) => {
                  const lit = Math.max(0, 1 - Math.abs(i - lbPos));
                  return <Img key={p.id} src={thumb(p.id)} style={{ width: 52, height: 52, borderRadius: 8, objectFit: "cover", opacity: 0.45 + 0.55 * lit }} />;
                })}
              </div>
              <div style={{ position: "absolute", left: THUMBS_X - 6 + lbPos * 62, top: 794, width: 64, height: 64, border: `2px solid ${GOLD}`, borderRadius: 12 }} />
            </div>
          </>
        )}
        <Finger {...pFinger} size={48} />
      </div>
      <Line text="Works on a phone." at={806} until={1200} style={{ top: 330, left: 200, right: "auto", textAlign: "left", font: `92px ${SERIF}`, color: INK }} />
      <Line text="Swipe it, then tap to open it." at={814} until={1026} style={{ top: 460, left: 200, right: "auto", textAlign: "left", font: `40px ${SANS}`, color: MUTED }} />
      <Line text="Tap a thumbnail to jump there." at={1032} until={1112} style={{ top: 460, left: 200, right: "auto", textAlign: "left", font: `40px ${SANS}`, color: MUTED }} />
      <Line text="Swipe down to close it." at={1116} until={1200} style={{ top: 460, left: 200, right: "auto", textAlign: "left", font: `40px ${SANS}`, color: MUTED }} />
      <Line text="And in React Native apps:" at={950} until={1200} style={{ top: 590, left: 200, right: "auto", textAlign: "left", font: `36px ${SANS}`, color: MUTED }} />
      <Line text="react-native-motion-lightbox" at={956} until={1200} style={{ top: 646, left: 200, right: "auto", textAlign: "left", font: `38px ${MONO}`, color: ACCENT }} />

      {/* End */}
      <Img
        src={staticFile("logo.svg")}
        style={{ position: "absolute", left: 900, top: 230, width: 120, height: 120, opacity: Math.min(1, endLogo * 1.4), scale: String(0.4 + endLogo * 0.6), rotate: `${(1 - endLogo) * -18}deg` }}
      />
      <Line text="react-motion-lightbox" at={1216} style={{ top: 400, font: `92px ${SERIF}`, color: INK }} />
      <div style={{ position: "absolute", left: "50%", top: 560, translate: `-50% ${(1 - pill) * 30}px`, opacity: pill, padding: "20px 40px", borderRadius: 999, border: `1.5px solid ${RULE}`, background: PAPER_2, font: `34px ${MONO}`, color: INK, whiteSpace: "nowrap" }}>
        npm install react-motion-lightbox
      </div>
      <Line text="lightbox.gullberg.no" at={1230} style={{ top: 690, font: `34px ${SANS}`, color: ACCENT }} />
    </AbsoluteFill>
  );
};
