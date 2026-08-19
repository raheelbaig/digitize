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

- **The enlargement is capped** at 1.5x the asset, hard-limited to 1200px. A
  strict 1:1 cap measured badly — the smallest deck crops are under 300px, so
  the viewer opened them at grid size and gave the visitor nothing. The ceiling
  is what real material earns: a 1400px photograph lands at 1200px as a genuine
  *downscale*, while a 328px deck crop is still held to 492px. One rule, and it
  scales itself as better photography arrives.
- **The image is `unoptimized`.** Next's optimiser was choosing a variant
  *narrower* than the file we already have, which defeats the whole feature.
  The plates are 20–40 KB, so serving the original costs nothing.

Locking the page needed three things, not one: Lenis drives scrolling from
window events, the scrolling element is `<html>` rather than `<body>`, and a
stopped Lenis still lets the native wheel through. `lenisRef.ts` exposes the
instance so overlays can stop it.

## Google reviews

`Reviews.tsx` renders the Google rating and latest reviews above the final CTA.

**The site never calls the Places API.** Not at runtime, not per visitor, not on
build. `npm run reviews:refresh` calls Google exactly once and writes
`src/data/generated/reviews.ts`; the page only reads that file. Reviewer avatars
are downloaded during the refresh too, so every image the site serves is local
and no request leaves the page at view time.

That is deliberate: reviews on a marketing page change every few months, so
paying per revalidation window bought nothing, and a snapshot removes any
chance of a surprise bill or of a Google outage affecting the page. The
homepage also stays fully static.

```bash
cp .env.example .env.local     # fill in both values
npm run reviews:refresh        # one API call, writes the snapshot
```

| Variable | |
|---|---|
| `GOOGLE_PLACES_API_KEY` | Places API **(New)**, billing enabled, key restricted to that API |
| `GOOGLE_PLACE_ID` | The `ChIJ…` Place ID, from Google's Place ID Finder |

The key is only ever read by the refresh script, so it is not needed in the
hosting environment — deploys use the committed snapshot.

`refresh-reviews.mjs` names the specific fix for each failure it can hit:
`API_KEY_SERVICE_BLOCKED` means the key's API restrictions omit Places API
(New); `SERVICE_DISABLED` means the API is not enabled on the project;
`API_KEY_HTTP_REFERRER_BLOCKED` means the key has a referrer restriction, which
cannot work for a server-side call.

Google's display terms are honoured: review text is shown **verbatim**, each
carries its author's name and photo linking to their profile, the relative
publish time is kept, the Google mark appears on every card, and the aggregate
links back to the listing. Their policy expects cached content to be refreshed
rather than kept indefinitely, so re-run the command occasionally — monthly is
ample, and twelve calls a year sits far inside the free allowance.

With no snapshot the section renders nothing and the site builds and deploys
normally. `REVIEWS_MOCK=1` in `.env.local` renders clearly-labelled "SAMPLE
TEXT" placeholders for previewing the layout; it is fenced to non-production so
it cannot appear on a live site.

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

### The plate

Cut-outs sit on `--gradient-plate`, a soft light-grey sweep, rather than flat
white. A cut-out on white has nothing to sit on and reads as a floating
screenshot; a gradient gives it a surface and reads as a studio backdrop. The
`.plate-ground` utility carries it, and every surface that shows a cut-out —
grid, nav thumbnails, index cards, the viewer — uses it, so the treatment is
changed in one place.

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

### Supplying real photography

**This is the fix for everything below.** Drop images into
`.assets/photography/<category>/` and that folder replaces the deck crops for
the whole family:

```
.assets/photography/patches/*.jpeg     ->  patches-01 .. patches-27
npm run assets:build
```

Those files skip every repair step — no de-bordering, no upscaling, no
artefact smoothing — because they need none. They are oriented, resized to
1400px and encoded, nothing more. Ids stay `<category>-NN` in natural filename
order, so every existing reference keeps working.

Two things the pipeline handles that are easy to miss:

- **Frame fit is detected, not configured.** `detectFit()` samples the border of
  each finished image: a studio cut-out is surrounded by paper and gets
  `contain` on a white card, a photograph has its own background and gets
  `cover` edge to edge. The manifest carries `fit`, and every surface — grid,
  nav thumbnails, index cards, viewer — reads it. Mixing cut-outs and
  photographs across categories therefore just works.
- **`contain` is earned, not guessed.** An image is only presented as a
  cut-out once its backdrop has actually been removed; everything else covers
  its frame. That ordering is what makes a leftover white box on the grey
  plate *impossible* rather than merely unlikely — the border test only
  decides whether the attempt is worth making, and the attempt decides the
  outcome. 106 of 157 images qualify; the rest are photographs and cover.
- **Studio paper is knocked out of cut-outs.** A product photographed on white
  arrives as a white rectangle, and a white rectangle sitting on the page's
  grey plate looks like a bug. `knockoutPaper()` floods inward from the border
  and only spreads through paper, so whites *enclosed* by the product — a white
  cap panel, the body of a label — survive; knocking out every white pixel
  would punch holes through half the catalogue. It refuses the result if
  nothing was removed or if more than 93% was, which is the signature of a pale
  product the fill leaked into. 94 of 157 images qualify; the rest are
  photographs and are left to cover their frame.
- **Next's image cache is cleared on every build.** Optimised images are keyed
  by request URL, and replacing a file leaves its URL unchanged, so the site
  would otherwise keep serving the previous artwork from
  `.next/cache/images` while the new file sat on disk — which looks exactly
  like the build having silently failed.

If a photograph was taken upside down it carries no EXIF to correct, so put a
`rotate.json` beside the images mapping filename to degrees. Do this sparingly:
a tray of loose patches genuinely sits at mixed angles, so "the text is upside
down" is not evidence that the photograph is.

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
