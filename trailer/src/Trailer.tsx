import type { CSSProperties } from "react";
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
/** 0 before `from`, 1 after `from + dur` frames, eased in between. */
const ease = (frame: number, from: number, dur: number, easing = OUT) =>
  interpolate(frame, [from, from + dur], [0, 1], { ...clamp, easing });
const lerp = (a: number, b: number, p: number) => a + (b - a) * p;

// ── Photos (Out and About, from the demo) and their crops ───────────────────
type Photo = { id: string; w: number; h: number; focus?: [number, number]; zoom?: number };
type Rect = { x: number; y: number; w: number; h: number };
type Crop = [number, number, number, number];
const PIGEON: Photo = { id: "B4H-44aAzqc", w: 2081, h: 3123, focus: [0.37, 0.5], zoom: 2 };
const DEER: Photo = { id: "4sVimJidmpQ", w: 4671, h: 7006, focus: [0.5, 0.46], zoom: 1.6 };
const RED: Photo = { id: "cA6DjKN2vaw", w: 3034, h: 4040, focus: [0.42, 0.38], zoom: 1.5 };
const CHAIR: Photo = { id: "41lvjsoCJKA", w: 2267, h: 3400, focus: [0.35, 0.5], zoom: 1.2 };
const STREET: Photo = { id: "dmf546pckjQ", w: 4000, h: 6000, focus: [0.55, 0.3], zoom: 1.5 };
/** The album on the gallery's track, in order. */
const ALBUM = [PIGEON, DEER, RED, CHAIR, STREET];
/** The whole album, for the grid it folds out of: thumbnails are enough there. */
const GRID = ["dmf546pckjQ", "B4H-44aAzqc", "2echtVPwylU", "wIZpOCdTb8I", "cA6DjKN2vaw", "FyVM48yP-S4", "4sVimJidmpQ", "nV1HMjvlOj4", "41lvjsoCJKA"];
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
const Line = ({ text, at, until = Infinity, style }: { text: string; at: number; until?: number; style?: CSSProperties }) => {
  const frame = useCurrentFrame();
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

/** A fingertip, for the drag and the tap. */
const Finger = ({ x, y, down, o }: { x: number; y: number; down: number; o: number }) => (
  <div
    style={{
      position: "absolute",
      left: x - 32,
      top: y - 32,
      width: 64,
      height: 64,
      borderRadius: 999,
      background: "oklch(30% 0.04 25 / 0.28)",
      border: "3px solid white",
      boxShadow: "0 4px 16px oklch(20% 0.04 25 / 0.3)",
      scale: String(1 - down * 0.18),
      opacity: o,
    }}
  />
);

/**
 * The small gallery: photos on a track, `pos` along it (fractional while
 * moving). Each photo is the box less `peek` wide, cropped to that shape.
 * `clip` 1 cuts them off at the box; 0 lets them run past it and fade with
 * distance, as `clip={false}` does.
 */
const Strip = ({ box, pos, peek = 0, gap = 32, clip = 1, radius = 24 }: { box: Rect; pos: number; peek?: number; gap?: number; clip?: number; radius?: number }) => {
  const w = box.w - peek;
  const step = w + gap;
  const out = lerp(0, 1400, 1 - clip);
  return (
    <div style={{ position: "absolute", left: box.x, top: box.y, width: box.w, height: box.h, clipPath: `inset(-12px ${-out}px -12px ${-out}px)` }}>
      {ALBUM.map((photo, i) => {
        const d = i - pos;
        if (Math.abs(d) > 3) return null;
        const fade = lerp(1, Math.max(0, 1 - Math.abs(d) * 0.55), 1 - clip);
        return <Shot key={photo.id} photo={photo} rect={{ x: d * step, y: 0, w, h: box.h }} crop={cropOf(photo, w / box.h)} radius={radius} style={{ opacity: fade }} />;
      })}
    </div>
  );
};

// ── The film ─────────────────────────────────────────────────────────────────
// Frames at 30 fps. Title 0-40, grid 40-120, drag 120-210, shapes 210-300,
// peek and overflow 300-390, focus 390-490, open and close 490-590,
// phone 590-660, end 660-720.

const CENTRE: Rect = { x: 960 - 230, y: 590 - 230, w: 460, h: 460 };
const BIG = (p: Photo) => fit(p, 1300, 740, 960, 580);

export const Trailer: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const sp = (from: number, config: { damping: number; mass?: number; stiffness?: number } = { damping: 200 }) =>
    spring({ frame: frame - from, fps, config });

  // ── Title
  const logo = sp(2, { damping: 14, mass: 0.8 });
  const titleOut = ease(frame, 32, 8, GLIDE);

  // ── Grid: the album lands as a grid, then folds into one square.
  const fold = ease(frame, 84, 22, GLIDE);
  const CELL = 230;
  const gridRect = (i: number): Rect => ({ x: 960 - 1.5 * CELL - 16 + (i % 3) * (CELL + 16), y: 590 - 1.5 * CELL - 16 + Math.floor(i / 3) * (CELL + 16), w: CELL, h: CELL });

  // ── Drag and flick: the finger moves the track, lets go, and it carries on.
  const STEP = 460 + 32;
  const drag1 = interpolate(frame, [134, 152], [0, 210], { ...clamp, easing: Easing.inOut(Easing.quad) });
  const fling1 = sp(152, { damping: 13, stiffness: 120 });
  const drag2 = interpolate(frame, [176, 185], [0, 160], { ...clamp, easing: Easing.in(Easing.quad) });
  const fling2 = sp(185, { damping: 13, stiffness: 120 });
  let pos = 0;
  if (frame < 152) pos = drag1 / STEP;
  else if (frame < 176) pos = lerp(210 / STEP, 1, fling1);
  else if (frame < 185) pos = 1 + drag2 / STEP;
  else pos = lerp(1 + 160 / STEP, 2, fling2);
  const shown = (from: number, to: number) => ease(frame, from, 5) * (1 - ease(frame, to, 6));
  let finger = { x: 0, y: 0, down: 0, o: 0 };
  if (frame >= 126 && frame < 166) finger = { x: 1150 - drag1 - Math.max(0, frame - 152) * 7, y: 640, down: frame >= 132 && frame < 152 ? 1 : 0, o: shown(126, 154) };
  if (frame >= 170 && frame < 200) finger = { x: 1130 - drag2 - Math.max(0, frame - 185) * 10, y: 650, down: frame >= 174 && frame < 185 ? 1 : 0, o: shown(170, 187) };

  // ── Shapes: the box changes shape and the crops follow.
  const s1 = ease(frame, 220, 14);
  const s2 = ease(frame, 242, 14);
  const s3 = ease(frame, 264, 14);
  const s4 = ease(frame, 288, 14);
  const shapeW = lerp(lerp(lerp(lerp(460, 600, s1), 360, s2), 720, s3), 600, s4);
  const shapeH = lerp(lerp(lerp(lerp(460, 450, s1), 480, s2), 405, s3), 450, s4);
  const aspect = s4 > 0.5 ? "4 / 3" : s3 > 0.5 ? "16 / 9" : s2 > 0.5 ? "3 / 4" : s1 > 0.5 ? "4 / 3" : "1";

  // ── Peek, then overflow.
  const peek = lerp(0, 110, ease(frame, 306, 16));
  const slideA = ease(frame, 326, 20, GLIDE);
  const unclip = ease(frame, 348, 12);
  const slideB = ease(frame, 360, 20, GLIDE);
  const reset = ease(frame, 382, 10);
  if (frame >= 210) pos = 2 + slideA - slideB;

  // ── Focus point: the whole pigeon photo, a square on it moving to the
  // pigeon and tightening, and beside it what the gallery shows.
  const focusIn = ease(frame, 392, 12);
  const move = ease(frame, 410, 22, GLIDE);
  const tighten = ease(frame, 438, 20, GLIDE);
  const focusOut = ease(frame, 470, 16, GLIDE);
  const focus: [number, number] = [lerp(0.5, 0.37, move), 0.5];
  const zoom = lerp(1, 2, tighten);
  const live = cropOf({ ...PIGEON, focus, zoom });
  const whole = fit(PIGEON, 560, 760, 640, 590);
  const liveRect = mix({ x: 1130, y: 360, w: 460, h: 460 }, CENTRE, focusOut);

  // ── Open out of that square, on to the next, and close into it.
  const tap = { x: 1010, y: 640, down: ease(frame, 494, 3) * (1 - ease(frame, 499, 4)), o: ease(frame, 488, 5) * (1 - ease(frame, 502, 6)) };
  const open = ease(frame, 498, 30);
  const next = ease(frame, 536, 20, GLIDE);
  const close = ease(frame, 562, 26);
  const GAPLB = 140;
  const along = next * -(BIG(PIGEON).w / 2 + GAPLB + BIG(DEER).w / 2);
  const lbAt = next; // 0 on the pigeon, 1 on the deer
  const row = ease(frame, 512, 14) * (1 - ease(frame, 558, 8, GLIDE));
  const rowW = 5 * 84 + 4 * 16;
  const pigeonRect = mix(CENTRE, BIG(PIGEON), open);
  const deerHome = { ...BIG(DEER), x: BIG(DEER).x + BIG(PIGEON).w / 2 + GAPLB + BIG(DEER).w / 2 };
  const deerRect = mix(deerHome, CENTRE, close);
  const deerOpen = { ...deerRect, x: deerRect.x + along * (1 - close) };

  // ── Phone, then the end.
  const phone = sp(596, { damping: 20 });
  const phoneOut = ease(frame, 652, 10, GLIDE);
  const swipe = ease(frame, 624, 18, GLIDE);
  const endLogo = sp(664, { damping: 14, mass: 0.8 });
  const pill = sp(676);

  const inGrid = frame >= 40 && frame < 108;
  const inStrip = frame >= 104 && frame < 392;
  const inFocus = frame >= 390 && frame < 498;
  const inLightbox = frame >= 498 && frame < 600;

  return (
    <AbsoluteFill style={{ background: PAPER, fontFamily: SANS }}>
      {/* Title */}
      <Img
        src={staticFile("logo.svg")}
        style={{ position: "absolute", left: 880, top: 270, width: 160, height: 160, opacity: Math.min(1, logo * 1.4) * (1 - titleOut), scale: String(0.4 + logo * 0.6), rotate: `${(1 - logo) * -18}deg`, translate: `0 ${-titleOut * 40}px` }}
      />
      <Line text="react-motion-lightbox" at={6} until={32} style={{ top: 470, font: `112px/1.1 ${SERIF}`, color: INK }} />
      <Line text="A lightbox for React that opens out of the photo you click." at={10} until={33} style={{ top: 620, font: `40px ${SANS}`, color: MUTED }} />

      {/* Grid, folding into one square */}
      <Caption text="A whole album, in one square." at={44} until={118} />
      {inGrid &&
        GRID.map((id, i) => {
          const land = sp(42 + i * 2, { damping: 16, mass: 0.7 });
          const g = gridRect(i);
          // The pigeon (index 1) ends on top, as the square; the rest fold under it.
          const r = mix(g, CENTRE, fold);
          return (
            <Img
              key={id}
              src={thumb(id)}
              style={{
                position: "absolute",
                left: r.x,
                top: r.y,
                width: r.w,
                height: r.h,
                borderRadius: lerp(16, 24, fold),
                objectFit: "cover",
                zIndex: id === PIGEON.id ? 2 : 1,
                opacity: land * (id === PIGEON.id ? 1 : 1 - ease(frame, 96, 10)),
                scale: String(lerp(0.6, 1, land)),
                translate: `0 ${(1 - land) * 80}px`,
              }}
            />
          );
        })}

      {/* The gallery: drag, shapes, peek, overflow */}
      <Caption text="Drag it. Flick it." at={122} until={206} />
      <Caption text="Any shape." at={214} until={298} />
      <Line text={`aspect={${aspect}}`} at={216} until={298} style={{ top: 880, font: `34px ${MONO}`, color: ACCENT }} />
      <Caption text="Peek at the next one." at={302} until={340} />
      <Caption text="Clip it, or let it flow." at={344} until={386} />
      {inStrip && (
        <div style={{ opacity: 1 - ease(frame, 384, 8, GLIDE) }}>
          <Strip
            box={frame < 210 ? CENTRE : { x: 960 - shapeW / 2, y: 590 - shapeH / 2, w: shapeW, h: shapeH }}
            pos={frame < 108 ? 0 : pos}
            peek={frame >= 300 ? peek * (1 - reset) : 0}
            clip={1 - unclip * (1 - reset)}
          />
          <div style={{ position: "absolute", left: 0, right: 0, top: 590 + shapeH / 2 + 28, textAlign: "center", font: `28px ${SANS}`, color: MUTED, opacity: frame < 210 ? ease(frame, 112, 8) : 0 }}>
            {`${Math.round(pos) + 1} / 9`}
          </div>
        </div>
      )}
      <Finger {...finger} />

      {/* Focus point */}
      <Caption text="Point it at what matters." at={394} until={486} />
      {inFocus && (
        <>
          <div style={{ position: "absolute", inset: 0, opacity: focusIn * (1 - focusOut), translate: `${-focusOut * 120}px 0` }}>
            <Shot photo={PIGEON} rect={whole} crop={WHOLE} radius={20} />
            {/* The square on the photo, the rest dimmed, and the focus dot. */}
            <div style={{ position: "absolute", left: whole.x, top: whole.y, width: whole.w, height: whole.h, borderRadius: 20, overflow: "hidden" }}>
              <div
                style={{
                  position: "absolute",
                  left: live[0] * whole.w,
                  top: live[1] * whole.h,
                  width: live[2] * whole.w,
                  height: live[3] * whole.h,
                  border: "4px solid white",
                  borderRadius: 14,
                  boxShadow: "0 0 0 2000px oklch(15% 0.02 25 / 0.5)",
                }}
              />
              <div style={{ position: "absolute", left: focus[0] * whole.w - 14, top: focus[1] * whole.h - 14, width: 28, height: 28, borderRadius: 99, background: ACCENT, border: "4px solid white" }} />
            </div>
            <div style={{ position: "absolute", left: 1130, top: 850, font: `30px ${MONO}`, color: INK, whiteSpace: "pre" }}>
              {`focus: [${focus[0].toFixed(2)}, ${focus[1].toFixed(2)}]\nzoom: ${zoom.toFixed(1)}`}
            </div>
          </div>
          <Shot photo={PIGEON} rect={liveRect} crop={live} style={{ opacity: focusIn }} />
        </>
      )}

      {/* Open, next, close */}
      <Caption text="Opens out of the photo." at={492} until={560} />
      <Caption text="And closes back into its square." at={562} until={596} />
      {inLightbox && (
        <>
          {/* Each fades by its distance from the middle, as on the track. */}
          <Shot photo={PIGEON} rect={{ ...pigeonRect, x: pigeonRect.x + along }} crop={mixCrop(cropOf(PIGEON), WHOLE, open)} style={{ opacity: 1 - next }} />
          {open > 0.6 && <Shot photo={DEER} rect={deerOpen} crop={mixCrop(WHOLE, cropOf(DEER), close)} style={{ opacity: next * (1 - ease(frame, 590, 8, GLIDE)) }} />}
          <div style={{ position: "absolute", left: 960 - rowW / 2, top: 975, display: "flex", gap: 16, opacity: row, translate: `0 ${(1 - row) * 24}px` }}>
            {ALBUM.map((p, i) => {
              const lit = Math.max(0, 1 - Math.abs(i - lbAt));
              return <Img key={p.id} src={thumb(p.id)} style={{ width: 84, height: 84, borderRadius: 12, objectFit: "cover", opacity: 0.45 + 0.55 * lit, scale: String(1 + 0.1 * lit) }} />;
            })}
          </div>
          <div style={{ position: "absolute", left: 960 - rowW / 2 - 12 + lbAt * 100, top: 963, width: 108, height: 108, border: `3px solid ${GOLD}`, borderRadius: 20, opacity: row }} />
        </>
      )}
      <Finger {...tap} />

      {/* Phone */}
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
        <div style={{ position: "absolute", left: 32, top: 70, font: `40px ${SERIF}`, color: INK }}>Out and about</div>
        <div style={{ position: "absolute", left: 32, top: 126, width: 380, font: `19px/1.4 ${SANS}`, color: MUTED }}>Streets, people, deer, and one very good chair.</div>
        <Strip box={{ x: 32, y: 200, w: 380, h: 380 }} pos={swipe} peek={50} gap={14} radius={20} />
        <div style={{ position: "absolute", left: 32, top: 600, font: `19px ${SANS}`, color: MUTED }}>{swipe > 0.5 ? "2 / 9" : "1 / 9"}</div>
        <div style={{ position: "absolute", left: 32, top: 660, font: `40px ${SERIF}`, color: INK }}>Norway</div>
        <div style={{ position: "absolute", left: 32, top: 716, width: 380, font: `19px/1.4 ${SANS}`, color: MUTED }}>Fjords, fishing villages and a lot of standing on rocks.</div>
      </div>
      <Line text="Works on a phone." at={600} until={652} style={{ top: 360, left: 200, right: "auto", textAlign: "left", font: `92px ${SERIF}`, color: INK }} />
      <Line text="And in React Native apps:" at={606} until={652} style={{ top: 520, left: 200, right: "auto", textAlign: "left", font: `38px ${SANS}`, color: MUTED }} />
      <Line text="react-native-motion-lightbox" at={610} until={652} style={{ top: 580, left: 200, right: "auto", textAlign: "left", font: `40px ${MONO}`, color: ACCENT }} />

      {/* End */}
      <Img
        src={staticFile("logo.svg")}
        style={{ position: "absolute", left: 900, top: 230, width: 120, height: 120, opacity: Math.min(1, endLogo * 1.4), scale: String(0.4 + endLogo * 0.6), rotate: `${(1 - endLogo) * -18}deg` }}
      />
      <Line text="react-motion-lightbox" at={668} style={{ top: 400, font: `92px ${SERIF}`, color: INK }} />
      <div style={{ position: "absolute", left: "50%", top: 560, translate: `-50% ${(1 - pill) * 30}px`, opacity: pill, padding: "20px 40px", borderRadius: 999, border: `1.5px solid ${RULE}`, background: PAPER_2, font: `34px ${MONO}`, color: INK, whiteSpace: "nowrap" }}>
        npm install react-motion-lightbox
      </div>
      <Line text="lightbox.gullberg.no" at={682} style={{ top: 690, font: `34px ${SANS}`, color: ACCENT }} />
    </AbsoluteFill>
  );
};
