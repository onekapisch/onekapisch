// Renders onekapisch bento tiles to docs/bento/*.png.
//
// Usage (needs Playwright, no package.json required):
//   npx --yes --package playwright node scripts/build-bento.mjs
//   npx --yes --package playwright node scripts/build-bento.mjs . tile-unf
//
// The README bento previously credited a `build_readme.mjs` that was never
// committed, so the tiles had no reproducible source. This is that source.
//
// Geometry and type scale are matched to the committed originals by
// measurement, not guesswork: large card 1472x652 inset (32,8) r48 with a
// 74px title cap-height; small card 716x528 inset (32,8) r44 with a 49px
// title cap-height; 57px padding on both. Backgrounds are a vertical base
// gradient plus radial glows, sampled from the content-free padding of the
// originals so a re-rendered tile keeps its colour.
//
// TILES below covers the tiles this script renders. The remaining tiles in
// docs/bento (sky, tok, mac, lh, tank, tmi) are earlier assets that
// predate this script; add them here when they next need to change.

import { chromium } from "playwright";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = process.argv[2] || resolve(HERE, "..");
const OUT = resolve(REPO, "docs/bento");

// Type scale derived by measuring cap heights in the committed originals
// (large title cap 74px, small title cap 49px) and back-solving font sizes,
// so re-rendered tiles sit beside untouched ones without a size mismatch.
const SIZES = {
  large: { w: 1536, h: 688, cw: 1472, ch: 652, x: 32, y: 8, r: 48, pad: 57, icon: 148, title: 102, tag: 51, sub: 38, badge: 55 },
  small: { w: 780, h: 564, cw: 716, ch: 528, x: 32, y: 8, r: 44, pad: 57, icon: 117, title: 70, tag: 44, sub: 32, badge: 32 },
};

const APPLE =
  '<svg viewBox="0 0 384 512" fill="currentColor"><path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z"/></svg>';
const GITHUB =
  '<svg viewBox="0 0 16 16" fill="currentColor"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27s1.36.09 2 .27c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8z"/></svg>';
const BROWSER =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2.5" y="3.5" width="19" height="17" rx="3"/><path d="M3 8.5h18"/><circle cx="6" cy="6" r=".7" fill="currentColor" stroke="none"/><circle cx="9" cy="6" r=".7" fill="currentColor" stroke="none"/></svg>';

const rgb = (a) => `rgb(${a[0]},${a[1]},${a[2]})`;

// Backgrounds sampled from the committed originals (insets 22/30/40 agreed).
const BG = {
  lum: { top: [205, 150, 46], bot: [102, 72, 23], glows: [{ x: 0, y: 0, c: [255, 226, 160], a: 0.55, s: 62 }] },
  ez: { top: [113, 68, 209], bot: [54, 30, 109], glows: [{ x: 0, y: 0, c: [190, 155, 255], a: 0.5, s: 62 }] },
  min: { top: [102, 100, 219], bot: [48, 48, 115], glows: [{ x: 0, y: 0, c: [180, 179, 255], a: 0.5, s: 62 }] },
  chime: {
    top: [40, 40, 48], bot: [8, 10, 16],
    glows: [
      { x: 100, y: 0, c: [150, 96, 62], a: 0.85, s: 72 },
      { x: 0, y: 46, c: [40, 80, 120], a: 0.6, s: 60 },
      { x: 0, y: 0, c: [120, 126, 140], a: 0.45, s: 44 },
    ],
  },
};

// Clip 4 Breakfast reuses the site hero's "Clipboard Spectrum" field rather
// than a flat gradient: four rotated light trails over near-black. Colours,
// the 35deg angle and the per-trail gradient stops are taken verbatim from
// the site's src/app/spectrum.css so the tile and the hero agree.
const SPECTRUM = {
  night: "#05070b",
  angle: 35,
  trail: { w: 1500, h: 104 },
  // Centres stepped along the band direction and perpendicular to it, in the
  // hero's staggered ratio. The card is wide and short where the hero is tall,
  // so the stack is placed to read left-to-right in the hero's top-to-bottom
  // order (blue, violet, coral, cyan) and biased right of the text block.
  trails: [
    { cx: 1044, cy: 318, css: "linear-gradient(90deg,transparent,rgba(36,100,255,.4) 16%,#2464ff 34%,#0739ce 76%,rgba(7,57,206,.22) 90%,transparent)" },
    { cx: 987, cy: 199, css: "linear-gradient(90deg,transparent,rgba(134,45,242,.38) 16%,#862df2 34%,#4910a9 76%,rgba(73,16,169,.22) 90%,transparent)" },
    { cx: 930, cy: 80, css: "linear-gradient(90deg,transparent,rgba(255,65,108,.4) 16%,#ff416c 34%,#cb1746 76%,rgba(203,23,70,.22) 90%,transparent)" },
    { cx: 873, cy: -39, css: "linear-gradient(90deg,transparent,rgba(25,211,208,.38) 16%,#19d3d0 34%,#058fbb 76%,rgba(5,143,187,.22) 90%,transparent)" },
  ],
};

// Unfold uses a blue-only field drawn from its reading interface. The official
// icon supplies the warm contrast and is intentionally the sole illustration.
const UNFOLD = {
  background:
    "radial-gradient(82% 72% at 8% 0%,rgba(142,184,255,.62),transparent 66%)," +
    "radial-gradient(72% 86% at 100% 16%,rgba(36,107,255,.54),transparent 72%)," +
    "linear-gradient(158deg,#557fe4 0%,#2855a7 48%,#07152f 100%)",
};

const TILES = [
  {
    file: "tile-c4b", size: "large", icon: "clip4breakfast.png", spectrum: SPECTRUM,
    title: "Clip 4 Breakfast",
    tagline: "The clipboard manager that never slows your Mac down.",
    sub: "Recall · Keepers · Paste Stack · Paste As",
    // Shipping as of v1.0 (direct download, notarized) — same "macOS" badge
    // the other direct-download Mac apps use. NEW is tinted to the tile's own
    // coral so it belongs to the spectrum instead of fighting it.
    badges: [{ text: "NEW", accent: "#ff416c" }, { text: "macOS", icon: APPLE }],
  },
  {
    file: "tile-lum", size: "small", icon: "lumel.png", bg: BG.lum,
    title: "LUMEL",
    tagline: "Brighter than macOS allows. Darker than its minimum.",
    badges: [{ text: "App Store", icon: APPLE }],
  },
  {
    file: "tile-ez", size: "small", icon: "easywrite.png", bg: BG.ez,
    title: "Easy Write",
    tagline: "Translate & rewrite text in any app.",
    badges: [{ text: "macOS", icon: APPLE }, { text: "Open source", icon: GITHUB }],
  },
  {
    file: "tile-min", size: "small", icon: "minimizer.png", bg: BG.min,
    title: "Minimizer",
    tagline: "Every macOS window, minimized at once.",
    badges: [{ text: "macOS", icon: APPLE }, { text: "Open source", icon: GITHUB }],
  },
  {
    file: "tile-chime", size: "small", icon: "chime4breakfast.png", bg: BG.chime,
    title: "Chime 4 Breakfast",
    tagline: "Get pinged when Codex & Claude finish.",
    badges: [{ text: "macOS", icon: APPLE }, { text: "Open source", icon: GITHUB }],
  },
  {
    file: "tile-unf", size: "small", icon: "unfoldai.png", unfold: UNFOLD,
    iconSize: 152,
    title: "Unfold AI",
    tagline: "Long AI answers, made navigable.",
    sub: "Summarize · map · save · private by design",
    badges: [{ text: "Chrome + Firefox", icon: BROWSER }],
  },
];

function html(t) {
  const S = SIZES[t.size];
  const iconSize = t.iconSize || S.icon;
  const b = t.bg;
  const sp = t.spectrum;
  const uf = t.unfold;
  const glows = sp || uf
    ? ""
    : b.glows
        .map((g) => `radial-gradient(${g.s}% ${g.s}% at ${g.x}% ${g.y}%, rgba(${g.c[0]},${g.c[1]},${g.c[2]},${g.a}), rgba(${g.c[0]},${g.c[1]},${g.c[2]},0) 70%)`)
        .join(",");
  const iconData = readFileSync(resolve(REPO, "docs/icons", t.icon)).toString("base64");

  // Hero spectrum field: rotated trails + a bottom-left scrim so the colour
  // reads across the open upper-right while the text stays fully legible.
  const field = sp
    ? `<div class="field">${sp.trails
        .map(
          (tr) =>
            `<i class="trail" style="left:${tr.cx - sp.trail.w / 2}px;top:${tr.cy - sp.trail.h / 2}px;width:${sp.trail.w}px;height:${sp.trail.h}px;background:${tr.css};transform:rotate(${sp.angle}deg)"></i>`
        )
        .join("")}<u class="scrim"></u></div>`
    : "";

  const badges = t.badges
    .map((bd) => {
      const ic = bd.icon ? `<span class="bi">${bd.icon}</span>` : "";
      const style = typeof bd.accent === "string" ? ` style="background:${bd.accent};border-color:rgba(0,0,0,.2);color:#fff"` : "";
      return `<span class="badge${bd.accent ? " accent" : ""}"${style}>${ic}${bd.text}</span>`;
    })
    .join("");

  return `<!doctype html><meta charset="utf-8"><style>
*{margin:0;padding:0;box-sizing:border-box}
html,body{width:${S.w}px;height:${S.h}px;background:transparent}
.wrap{position:relative;width:${S.w}px;height:${S.h}px}
.card{position:absolute;left:${S.x}px;top:${S.y}px;width:${S.cw}px;height:${S.ch}px;
  border-radius:${S.r}px;overflow:hidden;
  background:${sp ? sp.night : uf ? uf.background : `${glows},linear-gradient(180deg,${rgb(b.top)} 0%,${rgb(b.bot)} 100%)`};
  box-shadow:0 ${Math.round(S.r / 2)}px ${S.r}px rgba(0,0,0,.42), inset 0 0 0 1px rgba(255,255,255,.10);
  font-family:-apple-system,"SF Pro Display","Helvetica Neue",Helvetica,Arial,sans-serif;
  color:#fff;-webkit-font-smoothing:antialiased}
.field{position:absolute;inset:0;overflow:hidden}
.trail{position:absolute;display:block;border-radius:100px;filter:saturate(125%);opacity:.92;
  transform-origin:center}
.trail::before{content:"";position:absolute;inset:2px 0 auto;height:38%;border-radius:inherit;opacity:.72;
  background:linear-gradient(90deg,transparent 10%,rgba(255,255,255,.03) 23%,rgba(255,255,255,.2) 43%,rgba(255,255,255,.08) 62%,transparent 88%)}
.trail::after{content:"";position:absolute;inset:auto 0 4px;height:42%;border-radius:inherit;opacity:.68;
  background:linear-gradient(90deg,transparent 12%,rgba(0,0,0,.06) 24%,rgba(0,0,0,.2) 52%,rgba(0,0,0,.08) 76%,transparent 90%)}
.scrim{position:absolute;inset:0;display:block;
  background:linear-gradient(to top right,rgba(5,7,11,.98) 14%,rgba(5,7,11,.80) 38%,rgba(5,7,11,.30) 58%,rgba(5,7,11,0) 76%),
    radial-gradient(58% 78% at 78% 14%, rgba(47,105,255,.16), transparent 70%)}
.top{position:absolute;left:${S.pad}px;right:${S.pad}px;top:${S.pad}px;display:flex;
  align-items:flex-start;justify-content:space-between;gap:${S.pad / 2}px}
.icon{width:${iconSize}px;height:${iconSize}px;border-radius:${Math.round(iconSize * 0.225)}px;
  display:block;filter:drop-shadow(0 ${Math.round(iconSize * 0.06)}px ${Math.round(iconSize * 0.13)}px rgba(0,0,0,.42))}
.badges{display:flex;flex-wrap:wrap;gap:${Math.round(S.badge * 0.34)}px;justify-content:flex-end}
.badge{display:inline-flex;align-items:center;gap:${Math.round(S.badge * 0.30)}px;
  height:${Math.round(S.badge * 1.72)}px;padding:0 ${Math.round(S.badge * 0.72)}px;
  border-radius:999px;font-size:${S.badge}px;font-weight:700;letter-spacing:-.01em;
  background:rgba(12,14,20,.60);border:1px solid rgba(255,255,255,.16);
  color:#fff;white-space:nowrap;backdrop-filter:blur(6px)}
.badge.accent{background:linear-gradient(180deg,#ffb35c,#ff8a2b);border-color:rgba(0,0,0,.18);color:#1a1206}
.bi{display:inline-flex;width:${Math.round(S.badge * 0.95)}px;height:${Math.round(S.badge * 0.95)}px}
.bi svg{width:100%;height:100%;display:block}
.text{position:absolute;left:${S.pad}px;right:${S.pad}px;bottom:${S.pad}px}
h1{font-size:${S.title}px;font-weight:700;letter-spacing:-.028em;line-height:1.04;
  text-shadow:0 2px 10px rgba(0,0,0,.22)}
.tag{margin-top:${Math.round(S.title * 0.24)}px;font-size:${S.tag}px;font-weight:600;
  letter-spacing:-.014em;line-height:1.24;color:rgba(255,255,255,.97);
  text-shadow:0 1px 8px rgba(0,0,0,.20)}
.sub{margin-top:${Math.round(S.tag * 0.42)}px;font-size:${S.sub}px;font-weight:500;
  letter-spacing:-.006em;color:rgba(255,255,255,.62)}
</style><div class="wrap"><div class="card">${field}
<div class="top"><img class="icon" src="data:image/png;base64,${iconData}"><div class="badges">${badges}</div></div>
<div class="text"><h1>${t.title}</h1><div class="tag">${t.tagline}</div>${t.sub ? `<div class="sub">${t.sub}</div>` : ""}</div>
</div></div>`;
}

const requested = new Set(process.argv.slice(3));
const selected = requested.size ? TILES.filter((tile) => requested.has(tile.file)) : TILES;
if (requested.size && selected.length !== requested.size) {
  const known = TILES.map((tile) => tile.file).join(", ");
  throw new Error(`Unknown tile name. Available tiles: ${known}`);
}

const browser = await chromium.launch();
mkdirSync(OUT, { recursive: true });
for (const t of selected) {
  const S = SIZES[t.size];
  const page = await browser.newPage({ viewport: { width: S.w, height: S.h }, deviceScaleFactor: 1 });
  await page.setContent(html(t), { waitUntil: "load" });
  await page.evaluate(() => document.fonts.ready);
  const buf = await page.screenshot({ omitBackground: true });
  writeFileSync(resolve(OUT, `${t.file}.png`), buf);
  console.log(`rendered ${t.file}.png  ${S.w}x${S.h}`);
  await page.close();
}
await browser.close();
