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

The brand mark is **not** an extracted bitmap. The deck's logo is only 198px
wide, so `BrandMark.tsx` rebuilds it as vector from measured geometry
(r = 0.215, centres 0.307 apart) with all seven CMY region colours sampled from
the artwork — identical, but resolution independent and transparent on any
background.

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
