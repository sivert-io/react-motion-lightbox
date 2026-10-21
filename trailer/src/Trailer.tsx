import type { CSSProperties } from "react";
import { AbsoluteFill, Easing, Img, interpolate, Sequence, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { MONO, SANS, SERIF } from "./fonts";

// The demo site's colours (demo/src/styles.css, light).
const PAPER = "oklch(97.5% 0.012 40)";
const PAPER_3 = "oklch(91.5% 0.025 35)";
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

// ── The photos, and the square each one shows (cropOf in src/crop.ts) ───────
type Photo = { src: string; w: number; h: number; focus?: [number, number]; zoom?: number };
type Rect = { x: number; y: number; w: number; h: number };
type Crop = [number, number, number, number];
const CLIFF: Photo = { src: "photos/cKBsq-5U17A-2560.webp", w: 3358, h: 2239, focus: [0.28, 0.35], zoom: 2.5 };
const HARBOUR: Photo = { src: "photos/25Bu6uO9xLw-2560.webp", w: 6000, h: 4000 };
const TROLL: Photo = { src: "photos/ILYVeUgPkmI-2560.webp", w: 4928, h: 3264 };
const AURORA: Photo = { src: "photos/DmA484UHAzw-1280.webp", w: 4748, h: 2635 };
const THUMBS = ["cKBsq-5U17A", "25Bu6uO9xLw", "ILYVeUgPkmI", "ut7XZMquCoU", "QMtI1dZ6KJM"];
const WHOLE: Crop = [0, 0, 1, 1];

const cropOf = ({ w, h, focus = [0.5, 0.5], zoom = 1 }: Photo): Crop => {
  const wide = w / h > 1;
  const cw = (wide ? h / w : 1) / zoom;
  const ch = (wide ? 1 : w / h) / zoom;
  const c = (at: number, size: number) => Math.min(Math.max(at - size / 2, 0), 1 - size);
  return [c(focus[0], cw), c(focus[1], ch), cw, ch];
};
const fit = (p: Photo, maxW: number, maxH: number, cx: number, cy: number): Rect => {
  const s = Math.min(maxW / p.w, maxH / p.h);
  return { x: cx - (p.w * s) / 2, y: cy - (p.h * s) / 2, w: p.w * s, h: p.h * s };
};
const mix = (a: Rect, b: Rect, p: number): Rect => ({
  x: a.x + (b.x - a.x) * p,
  y: a.y + (b.y - a.y) * p,
  w: a.w + (b.w - a.w) * p,
  h: a.h + (b.h - a.h) * p,
});
const mixCrop = (a: Crop, b: Crop, p: number) => a.map((v, i) => v + (b[i] - v) * p) as Crop;

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
      <Img src={staticFile(photo.src)} style={{ position: "absolute", width: imgW, height: imgH, left: -crop[0] * imgW, top: -crop[1] * imgH, maxWidth: "none" }} />
    </div>
  );
};

/** A line whose words fly up into place one after another, and leave together. */
const Words = ({ text, start, end = Infinity, style }: { text: string; start: number; end?: number; style?: CSSProperties }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const leave = Number.isFinite(end) ? ease(frame, end, 12, GLIDE) : 0;
  return (
    <div style={{ position: "absolute", left: 0, right: 0, textAlign: "center", ...style }}>
      {text.split(" ").map((word, i) => {
        const p = spring({ frame: frame - start - i * 3, fps, config: { damping: 200 } });
        return (
          <span
            key={i}
            style={{
              display: "inline-block",
              marginRight: "0.25em",
              opacity: p * (1 - leave),
              translate: `0 ${(1 - p) * 60 - leave * 40}px`,
              filter: `blur(${(1 - p) * 10 + leave * 6}px)`,
            }}
          >
            {word}
          </span>
        );
      })}
    </div>
  );
};

// ── Scenes ───────────────────────────────────────────────────────────────────

const Title = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const pop = spring({ frame: frame - 4, fps, config: { damping: 14, mass: 0.8 } });
  const leave = ease(frame, 66, 14, GLIDE);
  return (
    <AbsoluteFill>
      <Img
        src={staticFile("logo.svg")}
        style={{
          position: "absolute",
          left: 960 - 80,
          top: 250,
          width: 160,
          height: 160,
          opacity: Math.min(1, pop * 1.4) * (1 - leave),
          scale: String(0.4 + pop * 0.6),
          rotate: `${(1 - pop) * -18}deg`,
          translate: `0 ${-leave * 60}px`,
        }}
      />
      <Words text="react-motion-lightbox" start={14} end={64} style={{ top: 460, font: `112px/1.1 ${SERIF}`, color: INK }} />
      <Words text="A lightbox for React that opens out of the photo you click." start={26} end={66} style={{ top: 610, font: `40px ${SANS}`, color: MUTED }} />
    </AbsoluteFill>
  );
};

/** The square, opening out, sliding to the next photo and back, and closing again. */
const Lightbox = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const SQUARE: Rect = { x: 960 - 190, y: 560 - 190, w: 380, h: 380 };
  const BIG1 = fit(CLIFF, 1360, 690, 960, 570);
  const BIG2 = fit(HARBOUR, 1360, 690, 960, 570);
  const STEP = 1500;

  const arrive = spring({ frame: frame - 2, fps, config: { damping: 18, mass: 0.9 } });
  const open = ease(frame, 34, 34);
  const slide = ease(frame, 104, 26, GLIDE);
  const back = ease(frame, 156, 24, GLIDE);
  const close = ease(frame, 180, 30);
  const leave = ease(frame, 214, 20, GLIDE);

  const along = (slide - back) * -STEP;
  const first = mix(SQUARE, BIG1, open - close);
  // In from below, turning straight as it lands; at the end it drops away.
  const landing = { translate: `${(1 - arrive) * 220}px ${(1 - arrive) * 420 + leave * 120}px`, rotate: `${(1 - arrive) * 10}deg`, opacity: (1 - leave) };
  const row = ease(frame, 60, 20) * (1 - ease(frame, 176, 12, GLIDE));
  const rowW = 5 * 84 + 4 * 16;
  const rowX = 960 - rowW / 2;
  const at = slide - back;

  return (
    <AbsoluteFill>
      <Words text="Opens out of the photo." start={16} end={92} style={{ top: 70, font: `68px ${SERIF}`, color: INK }} />
      <Words text="Swipe to the next one." start={98} end={150} style={{ top: 70, font: `68px ${SERIF}`, color: INK }} />
      <Words text="And closes back into its square." start={152} end={208} style={{ top: 70, font: `68px ${SERIF}`, color: INK }} />

      <div style={{ position: "absolute", inset: 0, ...landing }}>
        <Shot photo={CLIFF} rect={{ ...first, x: first.x + along }} crop={mixCrop(cropOf(CLIFF), WHOLE, open - close)} />
        {open - close > 0.6 && <Shot photo={HARBOUR} rect={{ ...BIG2, x: BIG2.x + STEP + along }} crop={WHOLE} />}
      </div>

      <div style={{ position: "absolute", left: rowX, top: 960, display: "flex", gap: 16, opacity: row, translate: `0 ${(1 - row) * 30}px` }}>
        {THUMBS.map((id, i) => (
          <Img
            key={id}
            src={staticFile(`photos/${id}-thumb.webp`)}
            style={{ width: 84, height: 84, borderRadius: 12, objectFit: "cover", opacity: 0.45 + 0.55 * Math.max(0, 1 - Math.abs(i - at)), scale: String(1 + 0.1 * Math.max(0, 1 - Math.abs(i - at))) }}
          />
        ))}
      </div>
      <div style={{ position: "absolute", left: rowX - 12 + at * 100, top: 948, width: 108, height: 108, border: `3px solid ${GOLD}`, borderRadius: 20, opacity: row }} />
    </AbsoluteFill>
  );
};

const Phone = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const arrive = spring({ frame: frame - 2, fps, config: { damping: 20, mass: 1 } });
  const leave = ease(frame, 112, 16, GLIDE);
  const swipe = ease(frame, 56, 22, GLIDE);
  const SIDE = 330;
  const GAP = 14;
  const square = (p: Photo, i: number): Rect => ({ x: i * (SIDE + GAP) - swipe * (SIDE + GAP), y: 0, w: SIDE, h: SIDE });

  return (
    <AbsoluteFill>
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
          opacity: Math.min(1, arrive * 1.5) * (1 - leave),
          translate: `${(1 - arrive) * 500}px ${-leave * 40}px`,
          rotate: `${(1 - arrive) * 12}deg`,
        }}
      >
        <div style={{ position: "absolute", left: 32, top: 70, font: `40px ${SERIF}`, color: INK }}>Norway</div>
        <div style={{ position: "absolute", left: 32, top: 126, width: 380, font: `19px/1.4 ${SANS}`, color: MUTED }}>
          Fjords, fishing villages and a lot of standing on rocks.
        </div>
        <div style={{ position: "absolute", left: 32, top: 200, width: 380, height: SIDE, overflow: "hidden" }}>
          <Shot photo={CLIFF} rect={square(CLIFF, 0)} crop={cropOf(CLIFF)} radius={20} />
          <Shot photo={HARBOUR} rect={square(HARBOUR, 1)} crop={cropOf(HARBOUR)} radius={20} />
          <Shot photo={TROLL} rect={square(TROLL, 2)} crop={cropOf(TROLL)} radius={20} />
        </div>
        <div style={{ position: "absolute", left: 32, top: 556, font: `19px ${SANS}`, color: MUTED }}>{swipe > 0.5 ? "2 / 9" : "1 / 9"}</div>
        <div style={{ position: "absolute", left: 32, top: 620, font: `40px ${SERIF}`, color: INK }}>Lights</div>
        <div style={{ position: "absolute", left: 32, top: 676, width: 380, font: `19px/1.4 ${SANS}`, color: MUTED }}>
          Northern lights, lighthouses and a city after dark.
        </div>
        <Shot photo={AURORA} rect={{ x: 32, y: 740, w: SIDE, h: SIDE }} crop={cropOf(AURORA)} radius={20} />
      </div>

      <Words text="Works on a phone." start={14} end={110} style={{ top: 330, left: 200, right: "auto", textAlign: "left", font: `92px ${SERIF}`, color: INK }} />
      <Words text="Swipe it, tap it. The same move." start={26} end={110} style={{ top: 460, left: 200, right: "auto", textAlign: "left", font: `40px ${SANS}`, color: MUTED }} />
      <Words text="And in React Native apps:" start={44} end={110} style={{ top: 590, left: 200, right: "auto", textAlign: "left", font: `36px ${SANS}`, color: MUTED }} />
      <Words text="react-native-motion-lightbox" start={56} end={110} style={{ top: 650, left: 200, right: "auto", textAlign: "left", font: `38px ${MONO}`, color: ACCENT }} />
    </AbsoluteFill>
  );
};

const End = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const pop = spring({ frame: frame - 2, fps, config: { damping: 14, mass: 0.8 } });
  const pill = spring({ frame: frame - 22, fps, config: { damping: 200 } });
  return (
    <AbsoluteFill>
      <Img
        src={staticFile("logo.svg")}
        style={{ position: "absolute", left: 960 - 60, top: 230, width: 120, height: 120, opacity: Math.min(1, pop * 1.4), scale: String(0.4 + pop * 0.6), rotate: `${(1 - pop) * -18}deg` }}
      />
      <Words text="react-motion-lightbox" start={8} style={{ top: 400, font: `92px ${SERIF}`, color: INK }} />
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: 560,
          translate: `-50% ${(1 - pill) * 40}px`,
          opacity: pill,
          padding: "20px 40px",
          borderRadius: 999,
          border: "1.5px solid oklch(88% 0.022 32)",
          background: "oklch(95% 0.018 38)",
          font: `34px ${MONO}`,
          color: INK,
          whiteSpace: "nowrap",
        }}
      >
        npm install react-motion-lightbox
      </div>
      <Words text="lightbox.gullberg.no" start={30} style={{ top: 690, font: `34px ${SANS}`, color: ACCENT }} />
    </AbsoluteFill>
  );
};

export const Trailer: React.FC = () => {
  const { fps } = useVideoConfig();
  return (
    <AbsoluteFill style={{ background: PAPER }}>
      <Sequence name="Title" from={0} durationInFrames={2.7 * fps}>
        <Title />
      </Sequence>
      <Sequence name="Lightbox" from={2.4 * fps} durationInFrames={8 * fps}>
        <Lightbox />
      </Sequence>
      <Sequence name="Phone" from={10.2 * fps} durationInFrames={4.4 * fps}>
        <Phone />
      </Sequence>
      <Sequence name="End" from={14.2 * fps} durationInFrames={1.8 * fps}>
        <End />
      </Sequence>
    </AbsoluteFill>
  );
};
