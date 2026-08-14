# Digitize Are Us

A single-page cinematic showroom for **Digitize Are Us**, a custom manufacturer of
patches, lanyards, keychains, PVC and metal products, headwear and labels.

There is no store, cart or quote form. Every path on the page ends at one action:
**call the team on +1 716 404-9260.**

## Stack

| | |
|---|---|
| Framework | Next.js 16 (App Router, Turbopack) |
| Language | TypeScript, `strict` |
| Styling | Tailwind CSS v4, tokens in `src/app/globals.css` |
| Scroll motion | GSAP + ScrollTrigger |
| Smooth scroll | Lenis |
| UI transitions | Motion (Framer Motion) |
| Icons | lucide-react |

**Ownership of motion is deliberate and non-overlapping.** GSAP owns everything
driven by scroll position — reveals, parallax, the horizontal process track.
Motion owns component state only — the mobile menu and the floating call button.
Lenis owns the scroll position itself and is driven from GSAP's ticker so the two
share one clock. Nothing is animated by two libraries.

## Commands

```bash
npm run dev         # dev server
npm run check       # typecheck + lint (0 warnings) + production build
npm run build       # production build
```

QA harnesses (need the app running; they drive the locally installed Chrome
through `puppeteer-core`, so no browser is downloaded):

```bash
npm run qa:shoot    # screenshots at real scroll positions, per breakpoint
npm run qa:perf     # LCP / CLS / long tasks + encoded transfer weight
npm run qa:a11y     # heading outline, alt text, tab order, landmarks
```

`scripts/shoot.mjs` also takes `--w=390|768|1280|1440|1920`, `--frames=N`,
`--reduced` (emulates `prefers-reduced-motion`) and `--full`.

## Routes

| Route | |
|---|---|
| `/` | The full scroll story, including the complete archive of all eight families |
| `/custom-merch` | Index — one card per family |
| `/custom-merch/[slug]` | A family's own page: name, constructions, description, its full run of work |

All eight category pages are prerendered via `generateStaticParams`, with
`dynamicParams = false` so an unknown slug 404s rather than rendering empty.
Each carries its own metadata, canonical URL, Open Graph image and
`ProductCollection` structured data. `sitemap.xml` and `robots.txt` are
generated from the same data.

**The nav's Custom Merch item** links to the index and reveals the eight
families on hover. It is a disclosure, not an ARIA menu — the contents are
links rather than commands, so a `menu` role would misreport what Enter does.
It opens on pointer intent and on keyboard focus, and closes on Escape, on blur
out of the group, or on selection. Touch devices get the families listed inline
in the mobile sheet instead, since hover does not exist there.

Anchors like `#craft` only resolve on the homepage, so `navHref()` prefixes them
with `/` when the visitor is on a category page — otherwise the link would
silently do nothing.

### The plate viewer

Clicking any plate opens it full screen (`Lightbox.tsx`), with arrow-key and
button paging through that family, a counter, Escape to close, a focus trap and
focus returned to the plate you came from.

It opens on **click, never hover** — a viewer that appears because the pointer
drifted across a thumbnail is hostile, and hover does not exist on touch.
Hovering keeps its own quieter feedback: the plate lifts and the product eases
up ~4%.

Two decisions worth knowing:

- **The enlargement is capped** at 1.5x the asset, hard-limited to 760px. A
  strict 1:1 cap measured badly — the smallest plates are under 300px, so the
  viewer opened them at grid size and gave the visitor nothing. Stretching a
  ~300px photograph across a 1440px screen would put the material's weakest
  quality on the biggest possible canvas. Measured result: 452px from a 328px
  file against a 322px grid plate.
- **The image is `unoptimized`.** Next's optimiser was choosing a variant
  *narrower* than the file we already have, which defeats the whole feature.
  The plates are 20–40 KB, so serving the original costs nothing.

Locking the page needed three things, not one: Lenis drives scrolling from
window events, the scrolling element is `<html>` rather than `<body>`, and a
stopped Lenis still lets the native wheel through. `lenisRef.ts` exposes the
instance so overlays can stop it.

## Content is data, not markup

Everything the site claims lives in two files and nowhere else:

- `src/data/site.ts` — company facts, contact details, advantages, process steps
- `src/data/products.ts` — the eight product families and their constructions

**Every value in those files is transcribed from the client's `DRU PATCHES.pdf`
portfolio.** Nothing is invented: no client names, certifications, order volumes,
years in business, factory locations or testimonials. The only numbers on the
page are the contact number, the lead times the deck states, and two figures
derived from the catalogue itself (8 families, 58 constructions).

## The image pipeline

The portfolio is a 20-page slide deck exported as 1920×1080 JPEGs — the product
photography is baked into composite slides, overlaid with translucent CMY circles
and a grey "DIGITIZE ARE US" watermark. There are no standalone product files.

`scripts/` reconstructs a usable asset library from it:

```bash
# put the 20 page images in .assets/slides first
npm run assets      # segment -> score -> build
```

1. **`segment-slides.mjs`** — isolates product pixels by keeping only saturated
   or dark pixels (the pastel overlay and grey watermark are both desaturated
   *and* light, so they drop out), dilates, finds connected components, and
   crops each one. 435 candidate crops from 20 slides.
2. **`score-tiles.mjs`** — rejects crops that are stray caption text, sit under
   the overlay circles, or carry the watermark. The watermark test keys on grey
   *over white*, which spares products shot on a grey studio backdrop.
3. **`build-assets.mjs`** — curates the survivors into `public/images/**.webp`
   and generates the typed manifest `src/data/generated/images.ts`. It also
   drops any crop wider than 600px, because at this deck's density that always
   means several tiles fused across a gutter, dragging caption text with them.

## Brand

The identity is **DRU International** — a globe-D, a green R and a blue U, with
the wordmark and "INTERNATIONAL" built into the lockup. Source artwork lives at
`.assets/brand/dru-logo.png`.

```bash
npm run assets:brand      # lockup + monogram + generated/brand.ts
npm run assets:favicons   # favicon.ico, icon.png, apple-icon.png
```

`build-brand.mjs` trims the artwork to its ink, emits two forms, samples the
colours and writes `src/data/generated/brand.ts` so the components can never
drift from the files on disk.

- **`BrandLockup`** — the full mark. Used at the loader and in the footer,
  where "INTERNATIONAL" is large enough to read.
- **`BrandMark`** — the DRU monogram alone. Below roughly 64px the
  "INTERNATIONAL" line turns to mush, so tight spots (navbar, icons) get this.

Both are quantised palette PNGs: the artwork is flat colour, so a palette cuts
the lockup from 127 KB to 27 KB with no visible loss — and these load during
the intro, where weight is felt directly.

### Colours, and the white plate

Two colours carry the whole identity, sampled from the artwork rather than
eyeballed:

| Token | Value | |
|---|---|---|
| `--color-brand-blue` | `#006db7` | globe and U |
| `--color-brand-green` | `#00c977` | R and wordmark |

`--color-brand-blue-lit` / `-deep` and the green equivalents are tonal
variants for the two surfaces. The catalogue alternates blue and green per
family instead of inventing a spectrum the brand does not own.

The logo is drawn for a white ground, and the brand blue sits at only ~3.8:1
against the page's near-black. Rather than recolour the artwork, dark surfaces
place it on a white plate (`<BrandMark plate />`) — the same reason every
favicon size sits on white.

### Favicons

Generated from the monogram, all on the brand's white ground:

- `favicon.ico` — 16/32/48 in one container, so the browser picks the crispest
- `icon.png` — 512px general-purpose raster
- `apple-icon.png` — 180px for iOS home screens

### The resolution ceiling

`npm run audit:pdf` enumerates every image object in the PDF. The result:

```
/Subtype /Image occurrences: 20
all image XObjects: 20 x  1920x1080  8bpc  /DCTDecode
image XObjects inside object streams: 0
largest image in the file: 1920x1080 (2.07 MP)
```

**Twenty images, one per page, every one 1920×1080.** The deck was exported with
each slide flattened to a single raster, so the original product photographs are
not in the file at any size — a product occupying a ninth of a slide leaves
roughly 300px of real detail, and no extraction technique can recover more than
was captured.

What the pipeline does about it, short of new photography:

- publishes at **2× with a Lanczos resample and mild unsharp masking**. Next's
  optimiser never upscales past the source, so a 300px file shown at 300 CSS px
  on a 2× screen was being stretched by the browser's cheap bilinear filter;
  handing sharp that job instead is visibly cleaner on retina
- a light `median(1)` first, so JPEG blocking in the source is not magnified
- WebP quality 94, and **no crop tighter than the artwork requires**
- `innerBox()` finds and removes the deck's card stroke by detecting the drawn
  line, rather than trimming a flat percentage that ate into products

Delivered weight is unchanged (365 KB of imagery) because `sizes` still governs
which variant ships; the larger sources only make a sharp 2× variant possible.

**Real high-resolution product photography remains the single highest-impact
upgrade to this site**, and needs no code changes — drop files with the same ids
into `public/images/**` or re-run the manifest step.

### The constraint this created

**No product image in the source exceeds 322px wide** (the five production-floor
photos reach 480px). That single fact shaped the design:

- the catalogue is a **light "archive" surface** with products on white cards at
  close to native size, rather than dark full-bleed hero imagery
- image frames match their source's orientation, so nothing is cropped portrait
  from a landscape original and upscaled ~2.3×
- the "Look closer" section is a sharp triptych at native scale instead of a
  macro zoom the source cannot support

Replacing `public/images` with real high-resolution photography is the single
highest-impact upgrade available, and no code changes would be required — only
re-running the manifest step or dropping in files with the same ids.

## Accessibility and motion

- `prefers-reduced-motion: reduce` skips the loader entirely, never constructs
  Lenis, and resolves every timeline to its final state. The horizontal process
  track becomes a vertical stack. All content remains present and readable.
- The custom cursor mounts only for fine pointers with motion enabled.
- Split headings render one `sr-only` copy for assistive tech and an
  `aria-hidden` animated copy, so screen readers get a clean sentence.
- Verified: one `h1`, no heading-level jumps, alt text on all 113 images,
  no unnamed controls, logical tab order, skip link first.

## Measured (production build, 1440×900)

| | |
|---|---|
| CLS | 0.010 |
| Transfer | 710 KB encoded (253 KB script, 348 KB image) |
| Long tasks | 1–2 (~85–150 ms) |

The process section is held by CSS `position: sticky` rather than GSAP's `pin`.
Pinning swapped the stage to `position: fixed` behind a generated spacer and
measured **1.97 of cumulative layout shift**; sticky cannot shift layout, and
GSAP is left scrubbing the track transform. That one change took CLS from 1.97
to 0.010.

LCP sits around 2.2–2.4s locally because the brand loader gates first paint by
design. Shortening or removing `IntroProvider` is the lever if LCP matters more
than the intro.

## Before this goes live

- **Product photography rights.** Much of the deck's imagery shows work carrying
  third-party trademarks (motorsport, airline, apparel and sports-club marks).
  The site presents these as manufacturing samples and never claims a client
  relationship, but the client should confirm they hold permission to display
  them publicly, or swap in owned work.
- **Two lead times in the source conflict.** The deck states "every standard
  order ready to ship within 8–10 days" *and* "5–7 business days for standard
  delivery". Both appear, each attributed to what the deck attributes it to
  (production vs delivery). Confirm the real figures and correct `ADVANTAGES` in
  `src/data/site.ts`.
- Set the real canonical origin in `SITE.url` if it differs from
  `https://www.digitizeareus.com`.
- Add a dedicated Open Graph image; it currently reuses a product photo, which
  is only 320px wide.
- **A reversed logo would remove the white plates.** If the brand kit has a
  knockout (single-colour or light-blue) version for dark backgrounds, dropping
  it in and removing `plate` from the navbar, footer and loader would let the
  mark sit directly on the ink.
- The lockup is raster. Vector source (SVG/AI/EPS) would sharpen it at every
  size and shrink it further; `build-brand.mjs` would need only its input
  changed.
